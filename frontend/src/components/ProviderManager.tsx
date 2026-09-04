import { useState, useEffect } from 'react'
import { providerApi } from '../api'
import type { Provider, ProviderCreate, ProviderType } from '../types'

const DEFAULT_FORM: ProviderCreate = {
  name: '',
  type: 'sglang',
  host: 'localhost',
  port: 30000,
  enabled: true,
}

export function ProviderManager() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [form, setForm] = useState<ProviderCreate>(DEFAULT_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<number, string>>({})

  const loadProviders = async () => {
    try {
      const data = await providerApi.list()
      setProviders(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProviders()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId !== null) {
        await providerApi.update(editingId, form)
      } else {
        await providerApi.create(form)
      }
      setForm(DEFAULT_FORM)
      setEditingId(null)
      await loadProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save provider')
    }
  }

  const handleEdit = (provider: Provider) => {
    setEditingId(provider.id)
    setForm({
      name: provider.name,
      type: provider.type,
      host: provider.host,
      port: provider.port,
      enabled: provider.enabled,
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this provider?')) return
    try {
      await providerApi.delete(id)
      await loadProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider')
    }
  }

  const handleToggle = async (provider: Provider) => {
    try {
      await providerApi.update(provider.id, { enabled: !provider.enabled })
      await loadProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle provider')
    }
  }

  const handleTest = async (id: number) => {
    setTestResults((prev) => ({ ...prev, [id]: 'Testing...' }))
    try {
      const result = await providerApi.checkHealth(id)
      setTestResults((prev) => ({ ...prev, [id]: result.status }))
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : 'Health check failed',
      }))
    }
  }

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">Loading providers...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {editingId !== null ? 'Edit Provider' : 'Add Provider'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ProviderType })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="sglang">SGLang</option>
              <option value="ollama">Ollama</option>
              <option value="llamacpp">llama.cpp</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Host
            </label>
            <input
              type="text"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Port
            </label>
            <input
              type="number"
              value={form.port}
              min={1}
              max={65535}
              onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 0 })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            className="h-4 w-4"
          />
          <label className="text-sm text-gray-700 dark:text-gray-300">Enabled</label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            {editingId !== null ? 'Update' : 'Add'}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(DEFAULT_FORM)
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Enabled
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {providers.map((provider) => (
              <tr key={provider.id}>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {provider.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 uppercase">
                  {provider.type}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {provider.host}:{provider.port}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {testResults[provider.id] ?? '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleToggle(provider)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      provider.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {provider.enabled ? 'On' : 'Off'}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <button
                    onClick={() => handleTest(provider.id)}
                    className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleEdit(provider)}
                    className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(provider.id)}
                    className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
