import { useState, useEffect, useCallback } from 'react'
import type { Model, ModelsResponse } from '../types/models'
import { modelsApi } from '../services/modelsApi'

export const useModels = (params?: {
  category?: string
  search?: string
  compatible_only?: boolean
}) => {
  const [data, setData] = useState<ModelsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await modelsApi.getModels(params)
      setData(result)
    } catch (err) {
      setError('Failed to fetch models')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [params?.category, params?.search, params?.compatible_only])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  return { data, loading, error, refresh: fetchModels }
}

export const useRecommended = () => {
  const [data, setData] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    modelsApi.getRecommended()
      .then(r => setData(r.recommended))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
