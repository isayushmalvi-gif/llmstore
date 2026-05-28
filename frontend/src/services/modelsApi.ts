import api from './api'
import type { ModelsResponse, Model } from '../types/models'

export const modelsApi = {
  getModels: async (params?: {
    category?: string
    search?: string
    compatible_only?: boolean
  }): Promise<ModelsResponse> => {
    const response = await api.get('/api/v1/models', { params })
    return response.data
  },

  getCategories: async (): Promise<{ categories: string[] }> => {
    const response = await api.get('/api/v1/models/categories')
    return response.data
  },

  getRecommended: async (): Promise<{ recommended: Model[] }> => {
    const response = await api.get('/api/v1/models/recommended')
    return response.data
  },

  getModel: async (id: string): Promise<Model> => {
    const response = await api.get(`/api/v1/models/${id}`)
    return response.data
  }
}
