export interface CPUInfo {
  name: string
  cores_physical: number
  cores_logical: number
  frequency_mhz: number
  usage_percent: number
  architecture: string
}

export interface RAMInfo {
  total_gb: number
  available_gb: number
  used_gb: number
  usage_percent: number
}

export interface GPUInfo {
  index: number
  name: string
  vram_total_gb: number
  vram_free_gb: number
  vram_used_gb: number
  usage_percent: number
  temperature_c: number | null
  cuda_version: string | null
}

export interface StorageInfo {
  total_gb: number
  free_gb: number
  used_gb: number
  usage_percent: number
}

export interface HardwareProfile {
  cpu: CPUInfo
  ram: RAMInfo
  gpus: GPUInfo[]
  storage: StorageInfo
  os_name: string
  os_version: string
  has_gpu: boolean
  is_cuda_available: boolean
  total_vram_gb: number
  readiness_score: number
  readiness_status: string
}
