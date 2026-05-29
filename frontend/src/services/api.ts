import axios from 'axios'
import type { HardwareProfile } from '../types/hardware'

const API_BASE = import.meta.env.VITE_API_URL || ''
const api = axios.create({ baseURL: API_BASE, timeout: 30000 })

export const hardwareApi = {
  getProfile: async (): Promise<HardwareProfile> => {
    const response = await api.get('/api/v1/hardware')
    return response.data
  },
  getQuickStatus: async () => {
    const response = await api.get('/api/v1/hardware/quick')
    return response.data
  }
}

export default api
