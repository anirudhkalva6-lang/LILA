import type { IndexData, MatchData, HeatmapData, MapId, HeatmapType } from '../types'

// In-memory cache so we never fetch the same file twice
const cache = new Map<string, Promise<unknown>>()

function fetchJSON<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
      return r.json()
    }))
  }
  return cache.get(url) as Promise<T>
}

export const loadIndex = () =>
  fetchJSON<IndexData>('/data/index.json')

export const loadMatch = (matchId: string) =>
  fetchJSON<MatchData>(`/data/matches/${matchId}.json`)

export const loadHeatmap = (mapId: MapId, type: HeatmapType) =>
  fetchJSON<HeatmapData>(`/data/heatmaps/${mapId}_${type}.json`)
