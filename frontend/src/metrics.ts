import type { ProviderType } from './types'

const PREFIXES: Record<ProviderType, string> = {
  sglang: 'sglang:',
  ollama: 'ollama:',
  llamacpp: 'llamacpp:',
}

/**
 * Look up a metric value from a provider metrics sample, trying the
 * namespaced key (e.g. "sglang:gen_throughput") first, then falling back
 * to the bare key (e.g. "gen_throughput").
 */
export function getMetric(
  data: Record<string, unknown>,
  type: ProviderType | undefined,
  bareKey: string,
  ...fallbackKeys: string[]
): number | undefined {
  const candidates: string[] = []
  if (type) {
    candidates.push(`${PREFIXES[type]}${bareKey}`)
  }
  candidates.push(bareKey, ...fallbackKeys)
  for (const key of candidates) {
    const value = data[key]
    if (typeof value === 'number') return value
  }
  return undefined
}
