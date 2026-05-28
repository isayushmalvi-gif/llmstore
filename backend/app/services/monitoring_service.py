import psutil
import time
import threading
from collections import deque
from datetime import datetime
from typing import List, Dict

class MonitoringService:
    def __init__(self):
        self.max_history = 60  # 60 data points
        self.cpu_history = deque(maxlen=self.max_history)
        self.ram_history = deque(maxlen=self.max_history)
        self.request_history = deque(maxlen=self.max_history)
        self.request_count = 0
        self.total_requests = 0
        self.total_errors = 0
        self.start_time = datetime.utcnow()
        self._lock = threading.Lock()
        self._start_collecting()

    def _start_collecting(self):
        def collect():
            while True:
                try:
                    ts = datetime.utcnow().strftime("%H:%M:%S")
                    cpu = psutil.cpu_percent(interval=1)
                    ram = psutil.virtual_memory()

                    with self._lock:
                        self.cpu_history.append({
                            "time": ts,
                            "value": round(cpu, 1)
                        })
                        self.ram_history.append({
                            "time": ts,
                            "value": round(ram.percent, 1)
                        })
                        self.request_history.append({
                            "time": ts,
                            "value": self.request_count
                        })
                        self.request_count = 0
                except Exception:
                    pass
                time.sleep(5)

        thread = threading.Thread(target=collect, daemon=True)
        thread.start()

    def record_request(self, success: bool = True):
        with self._lock:
            self.request_count += 1
            self.total_requests += 1
            if not success:
                self.total_errors += 1

    def get_current_stats(self) -> dict:
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        cpu_freq = psutil.cpu_freq()
        uptime = (datetime.utcnow() - self.start_time).total_seconds()

        # Try GPU stats
        gpu_stats = []
        try:
            import pynvml
            pynvml.nvmlInit()
            count = pynvml.nvmlDeviceGetCount()
            for i in range(count):
                handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                name = pynvml.nvmlDeviceGetName(handle)
                if isinstance(name, bytes):
                    name = name.decode()
                mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
                util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                try:
                    temp = pynvml.nvmlDeviceGetTemperature(
                        handle, pynvml.NVML_TEMPERATURE_GPU
                    )
                except:
                    temp = None
                gpu_stats.append({
                    "index": i,
                    "name": name,
                    "usage_percent": util.gpu,
                    "vram_used_gb": round(mem.used / 1e9, 1),
                    "vram_total_gb": round(mem.total / 1e9, 1),
                    "vram_percent": round(mem.used / mem.total * 100, 1),
                    "temperature_c": temp
                })
            pynvml.nvmlShutdown()
        except:
            pass

        with self._lock:
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "uptime_seconds": round(uptime),
                "cpu": {
                    "usage_percent": round(psutil.cpu_percent(), 1),
                    "cores": psutil.cpu_count(logical=False),
                    "threads": psutil.cpu_count(logical=True),
                    "freq_ghz": round(cpu_freq.current / 1000, 2) if cpu_freq else 0,
                    "history": list(self.cpu_history)
                },
                "ram": {
                    "total_gb": round(ram.total / 1e9, 1),
                    "used_gb": round(ram.used / 1e9, 1),
                    "available_gb": round(ram.available / 1e9, 1),
                    "usage_percent": round(ram.percent, 1),
                    "history": list(self.ram_history)
                },
                "disk": {
                    "total_gb": round(disk.total / 1e9, 1),
                    "used_gb": round(disk.used / 1e9, 1),
                    "free_gb": round(disk.free / 1e9, 1),
                    "usage_percent": round(disk.percent, 1)
                },
                "gpu": gpu_stats,
                "requests": {
                    "total": self.total_requests,
                    "errors": self.total_errors,
                    "error_rate": round(
                        self.total_errors / max(self.total_requests, 1) * 100, 1
                    ),
                    "history": list(self.request_history)
                }
            }

monitoring_service = MonitoringService()
