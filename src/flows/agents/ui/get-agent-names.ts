import { agents } from '@/api/agents'

export async function getAgentNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {}
  const results = await Promise.all(ids.map((id) => agents.get(id)))
  const map: Record<string, string> = {}
  results.forEach((a, i) => {
    if (a && ids[i]) map[ids[i]] = a.name
  })
  return map
}
