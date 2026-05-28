export interface Compatibility {
  status: "COMPATIBLE" | "POSSIBLE" | "INCOMPATIBLE"
  color: "green" | "yellow" | "red"
  score: number
  issues: string[]
}

export interface Model {
  id: string
  name: string
  provider: string
  category: string
  description: string
  size_gb: number
  min_ram_gb: number
  min_vram_gb: number
  recommended_vram_gb: number
  parameters: string
  quantization: string[]
  ollama_id: string
  tags: string[]
  license: string
  commercial_use: boolean
  benchmark_score: number
  context_length: number
  language: string[]
  use_cases: string[]
  featured: boolean
  compatibility: Compatibility
}

export interface ModelsResponse {
  total: number
  hardware: {
    ram_gb: number
    vram_gb: number
    storage_gb: number
    has_gpu: boolean
  }
  models: Model[]
}
