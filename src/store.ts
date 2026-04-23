import { create } from 'zustand'
import type { MapId, HeatmapType, ViewMode, PlayerFilter, MatchData } from './types'

interface AppState {
  // ── Selection ──────────────────────────────────────────────────────────────
  activeMap: MapId
  selectedMatchId: string | null
  loadedMatch: MatchData | null

  // ── Filters ────────────────────────────────────────────────────────────────
  selectedDate: string | null          // null = all dates
  playerFilter: PlayerFilter
  showCombat: boolean
  showLoot: boolean
  showStorm: boolean
  multiPlayerOnly: boolean

  // ── View ───────────────────────────────────────────────────────────────────
  viewMode: ViewMode
  heatmapType: HeatmapType

  // ── Playback ───────────────────────────────────────────────────────────────
  isPlaying: boolean
  currentTimeMs: number
  playbackSpeed: 1 | 2 | 5
  matchDurationMs: number

  // ── Player selection ───────────────────────────────────────────────────────
  selectedPlayerId: string | null

  // ── Drawer ─────────────────────────────────────────────────────────────────
  drawerOpen: boolean
  drawerMatchId: string | null

  // ── Actions ────────────────────────────────────────────────────────────────
  setActiveMap: (map: MapId) => void
  setSelectedMatch: (id: string | null, data: MatchData | null) => void
  setSelectedDate: (date: string | null) => void
  setPlayerFilter: (f: PlayerFilter) => void
  toggleCombat: () => void
  toggleLoot: () => void
  toggleStorm: () => void
  toggleMultiPlayerOnly: () => void
  setViewMode: (m: ViewMode) => void
  setHeatmapType: (t: HeatmapType) => void
  setIsPlaying: (v: boolean) => void
  setCurrentTimeMs: (t: number) => void
  setPlaybackSpeed: (s: 1 | 2 | 5) => void
  setSelectedPlayer: (id: string | null) => void
  openDrawer: (matchId: string) => void
  closeDrawer: () => void
  resetPlayback: () => void
}

export const useStore = create<AppState>((set) => ({
  activeMap:      'AmbroseValley',
  selectedMatchId: null,
  loadedMatch:    null,

  selectedDate:     null,
  playerFilter:     'all',
  showCombat:       true,
  showLoot:         true,
  showStorm:        true,
  multiPlayerOnly:  false,

  viewMode:    'paths',
  heatmapType: 'loot',

  isPlaying:       false,
  currentTimeMs:   0,
  playbackSpeed:   1,
  matchDurationMs: 0,

  selectedPlayerId: null,

  drawerOpen:    false,
  drawerMatchId: null,

  setActiveMap: (map) =>
    set({
      activeMap:      map,
      selectedMatchId: null,
      loadedMatch:    null,
      selectedPlayerId: null,
      isPlaying:      false,
      currentTimeMs:  0,
      matchDurationMs: 0,
    }),

  setSelectedMatch: (id, data) =>
    set({
      selectedMatchId: id,
      loadedMatch:     data,
      selectedPlayerId: null,
      isPlaying:       false,
      currentTimeMs:   0,
      matchDurationMs: data?.duration_ms ?? 0,
    }),

  setSelectedDate:       (date)  => set({ selectedDate: date, selectedMatchId: null, loadedMatch: null }),
  setPlayerFilter:       (f)     => set({ playerFilter: f }),
  toggleCombat:          ()      => set((s) => ({ showCombat: !s.showCombat })),
  toggleLoot:            ()      => set((s) => ({ showLoot: !s.showLoot })),
  toggleStorm:           ()      => set((s) => ({ showStorm: !s.showStorm })),
  toggleMultiPlayerOnly: ()      => set((s) => ({ multiPlayerOnly: !s.multiPlayerOnly })),
  setViewMode:           (m)     => set({ viewMode: m }),
  setHeatmapType:        (t)     => set({ heatmapType: t }),
  setIsPlaying:          (v)     => set({ isPlaying: v }),
  setCurrentTimeMs:      (t)     => set({ currentTimeMs: t }),
  setPlaybackSpeed:      (s)     => set({ playbackSpeed: s }),
  setSelectedPlayer:     (id)    => set({ selectedPlayerId: id }),
  openDrawer:  (matchId) => set({ drawerOpen: true, drawerMatchId: matchId }),
  closeDrawer: ()        => set({ drawerOpen: false, drawerMatchId: null }),
  resetPlayback: ()      => set({ isPlaying: false, currentTimeMs: 0 }),
}))
