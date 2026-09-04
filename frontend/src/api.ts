import axios from 'axios'
import type {
  Provider,
  ProviderCreate,
  ProviderUpdate,
  MetricsSample,
  MetricsHistory,
  MetricsSummary,
  HealthCheck,
} from './types'

const api = axios.create({
  baseURL: '/api',
})

export const providerApi = {
  list: async (): Promise<Provider[]> => {
    const response = await api.get('/providers')
    return response.data
  },

  get: async (id: number): Promise<Provider> => {
    const response = await api.get(`/providers/${id}`)
    return response.data
  },

  create: async (data: ProviderCreate): Promise<Provider> => {
    const response = await api.post('/providers', data)
    return response.data
  },

  update: async (id: number, data: ProviderUpdate): Promise<Provider> => {
    const response = await api.put(`/providers/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/providers/${id}`)
  },

  checkHealth: async (id: number): Promise<HealthCheck> => {
    const response = await api.get(`/health/${id}`)
    return response.data
  },
}

export const metricsApi = {
  getLatest: async (): Promise<MetricsSample[]> => {
    const response = await api.get('/metrics/latest')
    return response.data
  },

  getHistory: async (
    providerId: number,
    hours?: number,
    limit?: number
  ): Promise<MetricsHistory[]> => {
    const params = new URLSearchParams()
    if (hours) params.append('hours', hours.toString())
    if (limit) params.append('limit', limit.toString())
    const response = await api.get(`/metrics/history/${providerId}?${params}`)
    return response.data
  },

  getSummary: async (providerId: number): Promise<MetricsSummary> => {
    const response = await api.get(`/metrics/summary/${providerId}`)
    return response.data
  },
}

export const systemApi = {
  collect: async (): Promise<{ message: string }> => {
    const response = await api.post('/collect')
    return response.data
  },

  cleanup: async (days?: number): Promise<{ message: string }> => {
    const params = days ? `?days=${days}` : ''
    const response = await api.post(`/cleanup${params}`)
    return response.data
  },
}
