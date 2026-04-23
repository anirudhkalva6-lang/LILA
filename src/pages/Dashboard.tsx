import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { loadIndex } from '../utils/dataLoader'
import MatchDrawer from '../components/MatchDrawer'
import type { IndexData, MapId } from '../types'

const MAP_DESCRIPTIONS: Record<MapId, string> = {
  AmbroseValley: 'Primary map · Open terrain · Storm-heavy',
  GrandRift:     'Secondary map · Vertical terrain',
  Lockdown:      'Close-quarters · High intensity',
}

export default function Dashboard() {
  const [index, setIndex] = useState<IndexData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { setActiveMap, openDrawer } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadIndex()
      .then(setIndex)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const visibleMatches = useMemo(() => {
    if (!index) return []
    const q = searchQuery.trim().toLowerCase()
    const filtered = q
      ? index.matches.filter((m) => m.id.toLowerCase().includes(q) || m.map.toLowerCase().includes(q))
      : [...index.matches].reverse().slice(0, 30)
    return filtered
  }, [index, searchQuery])

  function goToMap(mapId: MapId) {
    setActiveMap(mapId)
    navigate(`/map/${mapId}`)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base font-mono text-[#6B7A99]">
        <div className="text-center">
          <div className="text-2xl text-cyan mb-2">LILA</div>
          <div className="text-sm">Loading player data…</div>
        </div>
      </div>
    )
  }

  if (!index) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base font-mono text-[#6B7A99]">
        <div className="text-center">
          <div className="text-2xl text-kill mb-2">Error</div>
          <div className="text-sm">Could not load index.json.<br/>Run the pipeline first.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-base font-mono">
      {/* Hero strip */}
      <div className="border-b border-border px-8 py-6">
        <div className="text-[#6B7A99] text-[10px] uppercase tracking-widest mb-1">Data range</div>
        <div className="text-[#E8EDF5] text-sm">{index.date_range}</div>
        <div className="text-[#6B7A99] text-xs mt-1">{index.total_matches} matches · 3 maps · 5 days</div>
      </div>

      {/* Map cards */}
      <div className="px-8 py-6">
        <div className="text-[10px] text-[#6B7A99] uppercase tracking-widest mb-4">Select a map</div>
        <div className="grid grid-cols-3 gap-4">
          {index.maps.map((map) => (
            <button
              key={map.id}
              onClick={() => goToMap(map.id as MapId)}
              className="group relative border border-border bg-elevated hover:border-cyan transition-all duration-200 text-left overflow-hidden"
            >
              {/* Minimap thumbnail */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={map.image}
                  alt={map.id}
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-elevated via-transparent to-transparent" />
                {/* Match count badge */}
                <div className="absolute top-2 right-2 bg-base/80 border border-border px-2 py-0.5 text-[10px] text-cyan">
                  {map.matches} matches
                </div>
              </div>

              {/* Card footer */}
              <div className="p-3">
                <div className="font-display font-bold text-lg text-[#E8EDF5] group-hover:text-cyan transition-colors">
                  {map.id}
                </div>
                <div className="text-[#6B7A99] text-[10px] mt-0.5">
                  {MAP_DESCRIPTIONS[map.id as MapId]}
                </div>
                <div className="mt-2 text-cyan text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                  Open in Map View →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent matches table */}
      <div className="px-8 pb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] text-[#6B7A99] uppercase tracking-widest">
            {searchQuery ? 'Search Results' : 'Recent Matches'}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by match ID or map…"
            className="bg-elevated border border-border text-[#E8EDF5] px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan w-64 placeholder:text-[#6B7A99]"
          />
        </div>
        <div className="border border-border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-6 bg-elevated px-4 py-2 text-[10px] text-[#6B7A99] uppercase tracking-widest border-b border-border">
            <div className="col-span-2">Match ID</div>
            <div>Map</div>
            <div>Date</div>
            <div>Players</div>
            <div>Duration</div>
          </div>

          {visibleMatches.map((m) => (
            <button
              key={m.id}
              onClick={() => openDrawer(m.id)}
              className="w-full grid grid-cols-6 px-4 py-2.5 text-left border-b border-border hover:bg-elevated transition-colors text-xs group"
            >
              <div className="col-span-2 text-[#E8EDF5] font-mono">
                {m.id.slice(0, 16)}…
                <span className="ml-2 text-cyan opacity-0 group-hover:opacity-100 text-[10px]">details →</span>
              </div>
              <div className="text-[#6B7A99]">{m.map}</div>
              <div className="text-[#6B7A99]">
                {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div>
                <span className="text-human">{m.humans}H</span>
                <span className="text-[#6B7A99]"> + </span>
                <span className="text-orange">{m.bots}B</span>
                {m.multi_player && (
                  <span className="ml-1 text-cyan text-[10px]">●</span>
                )}
              </div>
              <div className="text-[#6B7A99]">{Math.round(m.duration_ms / 60000)}m</div>
            </button>
          ))}
        </div>

        <div className="mt-2 text-[10px] text-[#6B7A99]">
          {searchQuery
            ? `${visibleMatches.length} result${visibleMatches.length !== 1 ? 's' : ''} · clear search to see recent matches`
            : `Showing 30 of ${index.total_matches} matches · search to find any match · ● = multi-player`}
        </div>
      </div>

      <MatchDrawer />
    </div>
  )
}
