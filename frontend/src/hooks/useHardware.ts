import { useState, useEffect, useCallback } from 'react'
import type { HardwareProfile } from '../types/hardware'
import { hardwareApi } from '../services/api'

export const useHardware = () => {
  const [data, setData] = useState<HardwareProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHardware = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const profile = await hardwareApi.getProfile()
      setData(profile)
    } catch (err) {
      setError('Failed to fetch hardware information')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHardware()
    const interval = setInterval(fetchHardware, 10000)
    return () => clearInterval(interval)
  }, [fetchHardware])

  return { data, loading, error, refresh: fetchHardware }
}
