import api from './api'
import type { DeploymentsResponse, DeploymentInfo } from '../types/deployment'

export const deploymentApi = {
  getAll: async (): Promise<DeploymentsResponse> => {
    const response = await api.get('/api/v1/deployments')
    return response.data
  },

  getOne: async (id: string): Promise<DeploymentInfo> => {
    const response = await api.get(`/api/v1/deployments/${id}`)
    return response.data
  },

  deploy: async (params: {
    model_id: string
    model_name: string
    ollama_id: string
  }) => {
    const response = await api.post('/api/v1/deployments', params)
    return response.data
  },

  stop: async (id: string) => {
    const response = await api.post(`/api/v1/deployments/${id}/stop`)
    return response.data
  },

  remove: async (id: string) => {
    const response = await api.delete(`/api/v1/deployments/${id}`)
    return response.data
  },

  getOllamaStatus: async () => {
    const response = await api.get('/api/v1/deployments/status/ollama')
    return response.data
  }
}
