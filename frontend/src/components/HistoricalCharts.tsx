import { useState, useEffect } from 'react'
import { metricsApi } from '../api'
import { getMetric } from '../metrics'
import { MetricsChart } from './MetricsChart'
import { SpeedContextChart } from './SpeedContextChart'
import type { MetricsHistory, Provider } from '../types'

interface HistoricalChartsProps {
  providers: Provider[]
}

const TIME_RANGES = [
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '1h', minutes: 60 },
  { label: '6h', minutes: 360 },
  { label: '24h', minutes: 1440 },
  { label: '3d', minutes: 4320 },
]

export function HistoricalCharts({ providers }: HistoricalChartsProps) {
  const [providerId, setProviderId] = useState<number | null>(null)
  const [range, setRange] = useState(5)
  const [history, setHistory] = useState<MetricsHistory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (providers.length > 0 && providerId === null) {
      setProviderId(providers[0].id)
    }
  }, [providers, providerId])

  useEffect(() => {
    if (providerId === null) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data = await metricsApi.getHistory(providerId, range, 500)
        if (!cancelled) setHistory(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 10000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [providerId, range])

  const selected = providers.find((p) => p.id === providerId)
  const type = selected?.type

  const endMs = Date.now()
  const startMs = endMs - range * 60 * 1000
  const timeDomain: [number, number] = [startMs, endMs]

  const series = (getValue: (d: Record<string, unknown>) => number) =>
    history.map((sample) => ({
      time: new Date(sample.timestamp).getTime(),
      value: getValue(sample.data),
    }))

  const getNum = (data: Record<string, unknown>, ...keys: string[]): number => {
    return getMetric(data, type, keys[0], ...keys.slice(1)) ?? 0
  }

  const speedContextData = history
    .map((sample) => {
      const used = getNum(sample.data, 'token_usage', 'kv_cache_usage_ratio')
      const speed = getNum(sample.data, 'gen_throughput', 'predicted_tokens_seconds')
      if (used <= 0 || speed <= 0) return null
      return { x: Math.min(used, 1), y: speed }
    })
    .filter((p): p is { x: number; y: number } => p !== null)

  if (providers.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={providerId ?? ''}
          onChange={(e) => setProviderId(parseInt(e.target.value))}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.minutes}
              onClick={() => setRange(r.minutes)}
              className={`px-3 py-1 text-sm rounded ${
                range === r.minutes
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && history.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Loading history...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MetricsChart
            title="Tokens/s"
            data={series((d) => getNum(d, 'gen_throughput', 'predicted_tokens_seconds'))}
            color="#3b82f6"
            unit="tokens per second"
            timeDomain={timeDomain}
          />
          <MetricsChart
            title="Active Requests"
            data={series((d) => getNum(d, 'num_running_reqs', 'requests_processing'))}
            color="#10b981"
            unit="requests"
            timeDomain={timeDomain}
          />
          <MetricsChart
            title="KV Cache Usage"
            data={series((d) => getNum(d, 'token_usage', 'kv_cache_usage_ratio'))}
            color="#f59e0b"
            unit="ratio (0-1)"
            timeDomain={timeDomain}
          />
          <MetricsChart
            title="Queue Size"
            data={series((d) => getNum(d, 'num_queue_reqs', 'requests_deferred'))}
            color="#ef4444"
            unit="requests"
            timeDomain={timeDomain}
          />
          <div className="lg:col-span-2">
            <SpeedContextChart
              title="Token Speed vs Context"
              data={speedContextData}
              color="#8b5cf6"
            />
          </div>
        </div>
      )}
    </div>
  )
}
