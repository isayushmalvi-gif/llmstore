export type DeploymentStatus =
  | "PENDING"
  | "DOWNLOADING"
  | "STARTING"
  | "RUNNING"
  | "STOPPING"
  | "STOPPED"
  | "FAILED"

export interface DeploymentInfo {
  id: string
  model_id: string
  model_name: string
  ollama_id: string
  status: DeploymentStatus
  port: number
  created_at: string
  updated_at: string
  logs: string[]
  error?: string
}

export interface DeploymentsResponse {
  deployments: DeploymentInfo[]
  ollama_running: boolean
  running_models: OllamaModel[]
  total: number
}

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}
