export type ProviderType = 'sglang' | 'ollama' | 'llamacpp'

export interface Provider {
  id: number
  name: string
  type: ProviderType
  host: string
  port: number
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ProviderCreate {
  name: string
  type: ProviderType
  host: string
  port: number
  enabled?: boolean
}

export interface ProviderUpdate {
  name?: string
  type?: ProviderType
  host?: string
  port?: number
  enabled?: boolean
}

export interface MetricsSample {
  id: number
  provider_id: number
  timestamp: string
  data: Record<string, unknown>
  name?: string
  type?: ProviderType
}

export interface MetricsHistory {
  id: number
  provider_id: number
  timestamp: string
  data: Record<string, unknown>
}

export interface MetricsSummary {
  sample_count: number
  first_sample: string | null
  last_sample: string | null
}

export interface HealthCheck {
  status: string
  provider_id: number
  provider_name: string
  details?: Record<string, unknown>
}
