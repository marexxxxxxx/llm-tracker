import type { MetricsSample } from '../types'
import { getMetric } from '../metrics'

interface ProviderCardProps {
  sample: MetricsSample
}

function formatNumber(value: unknown): string {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value ?? '-')
}

function formatTokensPerSecond(value: unknown): string {
  if (typeof value === 'number') {
    return value.toFixed(1)
  }
  return '-'
}

function formatFraction(value: number | undefined): string {
  if (typeof value !== 'number') return '-'
  return `${(value * 100).toFixed(1)}%`
}

export function ProviderCard({ sample }: ProviderCardProps) {
  const data = sample.data
  const type = sample.type
  const typeColors: Record<string, string> = {
    sglang: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    ollama: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    llamacpp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  }

  const throughput = getMetric(data, type, 'gen_throughput', 'predicted_tokens_seconds')
  const activeRequests = getMetric(data, type, 'num_running_reqs', 'requests_processing')
  const queue = getMetric(data, type, 'num_queue_reqs', 'requests_deferred')
  const tokenUsage = getMetric(data, type, 'token_usage', 'kv_cache_usage_ratio')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {sample.name ?? `Provider ${sample.provider_id}`}
        </h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[sample.type ?? 'sglang']}`}>
          {sample.type?.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Tokens/s</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatTokensPerSecond(throughput)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Active Requests</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatNumber(activeRequests)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Queue</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatNumber(queue)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">KV Cache</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatFraction(tokenUsage)}
          </p>
        </div>
      </div>

      {typeof data.model_name === 'string' && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 truncate">
          Model: {data.model_name}
        </p>
      )}
    </div>
  )
}
