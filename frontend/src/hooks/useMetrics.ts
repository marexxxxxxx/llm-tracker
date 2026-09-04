import { useState, useEffect, useCallback } from 'react'
import { metricsApi } from '../api'
import type { MetricsSample } from '../types'

interface UseMetricsResult {
  metrics: MetricsSample[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMetrics(intervalMs: number = 3000): UseMetricsResult {
  const [metrics, setMetrics] = useState<MetricsSample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await metricsApi.getLatest()
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, intervalMs)
    return () => clearInterval(interval)
  }, [fetchMetrics, intervalMs])

  return { metrics, loading, error, refetch: fetchMetrics }
}
