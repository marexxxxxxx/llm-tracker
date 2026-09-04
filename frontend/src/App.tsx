import { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { ProviderManager } from './components/ProviderManager'
import { HistoricalCharts } from './components/HistoricalCharts'
import { ThemeToggle } from './components/ThemeToggle'
import { providerApi } from './api'
import type { Provider } from './types'

type Tab = 'dashboard' | 'providers'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : true
  })
  const [providers, setProviders] = useState<Provider[]>([])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const data = await providerApi.list()
        setProviders(data)
      } catch {
        setProviders([])
      }
    }
    loadProviders()
    const interval = setInterval(loadProviders, 10000)
    return () => clearInterval(interval)
  }, [tab])

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            LLM Inference Monitor
          </h1>
          <div className="flex items-center gap-4">
            <nav className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              <button
                onClick={() => setTab('dashboard')}
                className={`px-4 py-1.5 text-sm rounded ${
                  tab === 'dashboard'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setTab('providers')}
                className={`px-4 py-1.5 text-sm rounded ${
                  tab === 'providers'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Providers
              </button>
            </nav>
            <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'dashboard' ? (
          <div className="space-y-8">
            <Dashboard />
            <HistoricalCharts providers={providers} />
          </div>
        ) : (
          <ProviderManager />
        )}
      </main>
    </div>
  )
}
