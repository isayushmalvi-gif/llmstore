from pydantic import BaseModel
from typing import List, Optional

class CPUInfo(BaseModel):
    name: str
    cores_physical: int
    cores_logical: int
    frequency_mhz: float
    usage_percent: float
    architecture: str

class RAMInfo(BaseModel):
    total_gb: float
    available_gb: float
    used_gb: float
    usage_percent: float

class GPUInfo(BaseModel):
    index: int
    name: str
    vram_total_gb: float
    vram_free_gb: float
    vram_used_gb: float
    usage_percent: float
    temperature_c: Optional[float] = None
    cuda_version: Optional[str] = None

class StorageInfo(BaseModel):
    total_gb: float
    free_gb: float
    used_gb: float
    usage_percent: float

class HardwareProfile(BaseModel):
    cpu: CPUInfo
    ram: RAMInfo
    gpus: List[GPUInfo]
    storage: StorageInfo
    os_name: str
    os_version: str
    has_gpu: bool
    is_cuda_available: bool
    total_vram_gb: float
    readiness_score: float
    readiness_status: str
