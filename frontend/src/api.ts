import type { SiteData } from './types'

export async function getSite(signal: AbortSignal): Promise<SiteData> {
  const response = await fetch('/api/site.json', { signal })
  if (!response.ok) throw new Error(`Unable to load site (${response.status})`)
  return response.json()
}
