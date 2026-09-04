import { useMetrics } from '../hooks/useMetrics'
import { ProviderCard } from './ProviderCard'

export function Dashboard() {
  const { metrics, loading, error } = useMetrics()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading metrics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    )
  }

  if (metrics.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-600 dark:text-yellow-400">
          No providers configured. Add a provider in the Providers tab.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Providers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Active Requests</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.reduce((sum, m) => {
              const running = (m.data.num_running_reqs ?? m.data.requests_processing) as number
              return sum + (typeof running === 'number' ? running : 0)
            }, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Tokens/s</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(
              metrics.reduce((sum, m) => {
                const throughput = (m.data.gen_throughput ?? m.data.predicted_tokens_seconds) as number
                return sum + (typeof throughput === 'number' ? throughput : 0)
              }, 0) / metrics.length
            ).toFixed(1)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((sample) => (
          <ProviderCard key={sample.provider_id} sample={sample} />
        ))}
      </div>
    </div>
  )
}
