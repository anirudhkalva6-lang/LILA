import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { loadMatch } from '../utils/dataLoader'
import type { MatchData } from '../types'

export default function MatchDrawer() {
  const { drawerOpen, drawerMatchId, closeDrawer, setActiveMap, setSelectedMatch } = useStore()
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!drawerOpen || !drawerMatchId) { setMatchData(null); return }
    setLoading(true)
    loadMatch(drawerMatchId)
      .then(setMatchData)
      .catch(() => setMatchData(null))
      .finally(() => setLoading(false))
  }, [drawerOpen, drawerMatchId])

  if (!drawerOpen) return null

  async function openInMapView() {
    if (!matchData) return
    setActiveMap(matchData.map)
    const data = await loadMatch(matchData.id)
    setSelectedMatch(matchData.id, data)
    navigate(`/map/${matchData.map}`)
    closeDrawer()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-border z-50 flex flex-col font-mono text-xs shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-[#E8EDF5] font-display font-bold text-sm">Match Details</span>
          <button
            onClick={closeDrawer}
            className="text-[#6B7A99] hover:text-[#E8EDF5] text-lg leading-none"
          >×</button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center text-[#6B7A99]">
            Loading…
          </div>
        )}

        {matchData && !loading && (
          <div className="flex-1 overflow-y-auto">
            {/* Match meta */}
            <div className="p-4 border-b border-border space-y-1">
              <div className="text-[#6B7A99] text-[10px] uppercase tracking-widest">Match ID</div>
              <div className="text-[#E8EDF5] break-all">{matchData.id}</div>
              <div className="text-[#6B7A99] mt-2">{matchData.map}</div>
              <div className="text-[#6B7A99]">{matchData.date}</div>
              <div className="text-[#6B7A99]">{Math.round(matchData.duration_ms / 60000)} min duration</div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-px border-b border-border">
              {[
                { label: 'Humans',  value: matchData.stats.humans,        color: '#00FF88' },
                { label: 'Bots',    value: matchData.stats.bots,          color: '#FF6B35' },
                { label: 'Combat',  value: matchData.stats.combat_events, color: '#FF6B35' },
                { label: 'Loot',    value: matchData.stats.loot_events,   color: '#FFD600' },
                { label: 'Storm',   value: matchData.stats.storm_deaths,  color: '#0088FF' },
                { label: 'Players', value: matchData.players.length,      color: '#00E5FF' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 bg-elevated">
                  <div className="text-[10px] text-[#6B7A99] uppercase tracking-widest">{label}</div>
                  <div className="text-xl font-bold mt-0.5" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Player list */}
            <div className="p-3 border-b border-border">
              <div className="text-[10px] text-[#6B7A99] uppercase tracking-widest mb-2">
                Players ({matchData.players.length})
              </div>
              <div className="space-y-1">
                {matchData.players.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <span className={`text-[10px] px-1 border ${p.is_bot ? 'text-orange border-orange' : 'text-human border-human'}`}>
                      {p.is_bot ? 'BOT' : 'HUM'}
                    </span>
                    <span className="text-[#E8EDF5] truncate flex-1">{p.id.slice(0, 14)}…</span>
                    <span className="text-[#6B7A99]">{p.events.length} events</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={openInMapView}
            disabled={!matchData}
            className="w-full py-2 bg-cyan text-base font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Open in Map View →
          </button>
          <button
            onClick={closeDrawer}
            className="w-full py-2 bg-elevated border border-border text-[#6B7A99] hover:text-[#E8EDF5] transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  )
}
