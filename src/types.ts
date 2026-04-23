// ─── Data Types ──────────────────────────────────────────────────────────────

export type MapId = 'AmbroseValley' | 'GrandRift' | 'Lockdown'

export type EventType =
  | 'Kill' | 'Killed'
  | 'BotKill' | 'BotKilled'
  | 'KilledByStorm'
  | 'Loot'

export type HeatmapType = 'combat' | 'deaths' | 'loot'
export type ViewMode = 'paths' | 'heatmap' | 'both'
export type PlayerFilter = 'all' | 'human' | 'bot'

// ─── Index JSON ───────────────────────────────────────────────────────────────

export interface MapMeta {
  id: MapId
  matches: number
  image: string
}

export interface MatchSummary {
  id: string
  map: MapId
  date: string
  humans: number
  bots: number
  duration_ms: number
  combat_events: number
  loot_events: number
  storm_deaths: number
  multi_player: boolean
}

export interface IndexData {
  date_range: string
  total_matches: number
  maps: MapMeta[]
  matches: MatchSummary[]
}

// ─── Match JSON ───────────────────────────────────────────────────────────────

export interface PathPoint {
  t: number   // ms from match start
  px: number  // pixel x on 1024×1024 minimap
  py: number  // pixel y on 1024×1024 minimap
}

export interface MatchEvent {
  t: number
  type: EventType
  px: number
  py: number
}

export interface Player {
  id: string
  is_bot: boolean
  color: string
  path: PathPoint[]
  events: MatchEvent[]
}

export interface MatchData {
  id: string
  map: MapId
  date: string
  duration_ms: number
  stats: {
    humans: number
    bots: number
    combat_events: number
    loot_events: number
    storm_deaths: number
  }
  players: Player[]
}

// ─── Heatmap JSON ─────────────────────────────────────────────────────────────

export interface HeatmapData {
  map: MapId
  type: HeatmapType
  total_events: number
  points: [number, number, number][]   // [px, py, weight]
}
