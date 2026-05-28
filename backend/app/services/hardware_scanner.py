import psutil
import platform
import cpuinfo
from typing import List, Optional
from app.models.hardware import (
    CPUInfo, RAMInfo, GPUInfo, 
    StorageInfo, HardwareProfile
)

class HardwareScanner:
    
    def scan(self) -> HardwareProfile:
        cpu = self._get_cpu()
        ram = self._get_ram()
        gpus = self._get_gpus()
        storage = self._get_storage()
        os_name, os_version = self._get_os()
        
        has_gpu = len(gpus) > 0
        total_vram = sum(g.vram_total_gb for g in gpus)
        is_cuda = self._check_cuda()
        readiness_score = self._calculate_readiness(ram, gpus)
        readiness_status = self._get_readiness_status(readiness_score)
        
        return HardwareProfile(
            cpu=cpu,
            ram=ram,
            gpus=gpus,
            storage=storage,
            os_name=os_name,
            os_version=os_version,
            has_gpu=has_gpu,
            is_cuda_available=is_cuda,
            total_vram_gb=round(total_vram, 1),
            readiness_score=readiness_score,
            readiness_status=readiness_status
        )
    
    def _get_cpu(self) -> CPUInfo:
        try:
            info = cpuinfo.get_cpu_info()
            cpu_name = info.get('brand_raw', 'Unknown CPU')
            arch = info.get('arch', 'Unknown')
        except:
            cpu_name = platform.processor() or 'Unknown CPU'
            arch = platform.machine()
        
        freq = psutil.cpu_freq()
        freq_mhz = round(freq.max if freq else 0, 1)
        
        return CPUInfo(
            name=cpu_name,
            cores_physical=psutil.cpu_count(logical=False) or 1,
            cores_logical=psutil.cpu_count(logical=True) or 1,
            frequency_mhz=freq_mhz,
            usage_percent=round(psutil.cpu_percent(interval=0.5), 1),
            architecture=arch
        )
    
    def _get_ram(self) -> RAMInfo:
        mem = psutil.virtual_memory()
        return RAMInfo(
            total_gb=round(mem.total / 1e9, 1),
            available_gb=round(mem.available / 1e9, 1),
            used_gb=round(mem.used / 1e9, 1),
            usage_percent=round(mem.percent, 1)
        )
    
    def _get_gpus(self) -> List[GPUInfo]:
        gpus = []
        try:
            import pynvml
            pynvml.nvmlInit()
            count = pynvml.nvmlDeviceGetCount()
            for i in range(count):
                handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                name = pynvml.nvmlDeviceGetName(handle)
                if isinstance(name, bytes):
                    name = name.decode('utf-8')
                mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                try:
                    temp = pynvml.nvmlDeviceGetTemperature(
                        handle, pynvml.NVML_TEMPERATURE_GPU
                    )
                except:
                    temp = None
                try:
                    cuda_ver = pynvml.nvmlSystemGetCudaDriverVersion()
                    cuda_str = f"{cuda_ver // 1000}.{(cuda_ver % 1000) // 10}"
                except:
                    cuda_str = None
                gpus.append(GPUInfo(
                    index=i,
                    name=name,
                    vram_total_gb=round(mem_info.total / 1e9, 1),
                    vram_free_gb=round(mem_info.free / 1e9, 1),
                    vram_used_gb=round(mem_info.used / 1e9, 1),
                    usage_percent=round(util.gpu, 1),
                    temperature_c=temp,
                    cuda_version=cuda_str
                ))
            pynvml.nvmlShutdown()
        except:
            try:
                import GPUtil
                for gpu in GPUtil.getGPUs():
                    gpus.append(GPUInfo(
                        index=gpu.id,
                        name=gpu.name,
                        vram_total_gb=round(gpu.memoryTotal / 1024, 1),
                        vram_free_gb=round(gpu.memoryFree / 1024, 1),
                        vram_used_gb=round(gpu.memoryUsed / 1024, 1),
                        usage_percent=round(gpu.load * 100, 1),
                        temperature_c=gpu.temperature
                    ))
            except:
                pass
        return gpus
    
    def _get_storage(self) -> StorageInfo:
        disk = psutil.disk_usage('/')
        return StorageInfo(
            total_gb=round(disk.total / 1e9, 1),
            free_gb=round(disk.free / 1e9, 1),
            used_gb=round(disk.used / 1e9, 1),
            usage_percent=round(disk.percent, 1)
        )
    
    def _get_os(self):
        system = platform.system()
        version = platform.version()
        release = platform.release()
        return system, f"{release} ({version})"
    
    def _check_cuda(self) -> bool:
        try:
            import pynvml
            pynvml.nvmlInit()
            pynvml.nvmlShutdown()
            return True
        except:
            return False
    
    def _calculate_readiness(
        self, ram: RAMInfo, gpus: List[GPUInfo]
    ) -> float:
        score = 0.0
        if ram.total_gb >= 64: score += 40
        elif ram.total_gb >= 32: score += 35
        elif ram.total_gb >= 16: score += 25
        elif ram.total_gb >= 8: score += 15
        else: score += 5
        if gpus:
            total_vram = sum(g.vram_total_gb for g in gpus)
            if total_vram >= 80: score += 50
            elif total_vram >= 40: score += 45
            elif total_vram >= 24: score += 40
            elif total_vram >= 16: score += 35
            elif total_vram >= 8: score += 25
            elif total_vram >= 4: score += 15
            else: score += 5
        cpu_cores = psutil.cpu_count(logical=False) or 1
        if cpu_cores >= 32: score += 10
        elif cpu_cores >= 16: score += 8
        elif cpu_cores >= 8: score += 6
        elif cpu_cores >= 4: score += 4
        else: score += 2
        return round(min(score, 100), 1)
    
    def _get_readiness_status(self, score: float) -> str:
        if score >= 80: return "EXCELLENT"
        elif score >= 60: return "GOOD"
        elif score >= 40: return "MODERATE"
        else: return "LIMITED"

hardware_scanner = HardwareScanner()
