import { useStore } from '../store'
import { loadMatch } from '../utils/dataLoader'
import type { IndexData } from '../types'

interface Props {
  index: IndexData | null
}

export default function FilterPanel({ index }: Props) {
  const {
    activeMap, selectedDate, selectedMatchId, playerFilter, showCombat, showLoot, showStorm,
    viewMode, heatmapType, multiPlayerOnly,
    setSelectedDate, setPlayerFilter,
    toggleCombat, toggleLoot, toggleStorm, toggleMultiPlayerOnly,
    setViewMode, setHeatmapType,
    setSelectedMatch,
  } = useStore()

  // Matches filtered by active map + date + multiPlayerOnly
  const filteredMatches = (index?.matches ?? []).filter((m) => {
    if (m.map !== activeMap) return false
    if (selectedDate && m.date !== selectedDate) return false
    if (multiPlayerOnly && !m.multi_player) return false
    return true
  })

  // Unique dates for active map
  const availableDates = [...new Set(
    (index?.matches ?? []).filter((m) => m.map === activeMap).map((m) => m.date)
  )].sort()

  function formatDate(d: string) {
    const dt = new Date(d)
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  async function handleMatchSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (!id) { setSelectedMatch(null, null); return }
    try {
      const data = await loadMatch(id)
      setSelectedMatch(id, data)
    } catch {
      setSelectedMatch(null, null)
    }
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col overflow-y-auto font-mono text-xs">
      {/* ── Date ──────────────────────────────────────────────────── */}
      <section className="p-3 border-b border-border">
        <label className="block text-[#6B7A99] uppercase tracking-widest text-[10px] mb-2">Date</label>
        <select
          value={selectedDate ?? ''}
          onChange={(e) => setSelectedDate(e.target.value || null)}
          className="w-full bg-elevated border border-border text-[#E8EDF5] px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan"
        >
          <option value="">All dates</option>
          {availableDates.map((d) => (
            <option key={d} value={d}>{formatDate(d)}</option>
          ))}
        </select>
      </section>

      {/* ── Match ─────────────────────────────────────────────────── */}
      <section className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[#6B7A99] uppercase tracking-widest text-[10px]">Match</label>
          <span className="text-[#6B7A99]">{filteredMatches.length} available</span>
        </div>
        <select
          onChange={handleMatchSelect}
          value={selectedMatchId ?? ''}
          className="w-full bg-elevated border border-border text-[#E8EDF5] px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan"
        >
          <option value="">Select a match…</option>
          {filteredMatches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id.slice(0, 8)}… · {m.humans}H+{m.bots}B · {Math.round(m.duration_ms / 60000)}min
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={multiPlayerOnly}
            onChange={toggleMultiPlayerOnly}
            className="accent-cyan"
          />
          <span className="text-[#6B7A99]">Multi-player only</span>
        </label>
      </section>

      {/* ── Players ───────────────────────────────────────────────── */}
      <section className="p-3 border-b border-border">
        <label className="block text-[#6B7A99] uppercase tracking-widest text-[10px] mb-2">Players</label>
        <div className="flex gap-1">
          {(['all', 'human', 'bot'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setPlayerFilter(f)}
              className={`flex-1 py-1 border text-xs uppercase tracking-wide transition-colors ${
                playerFilter === f
                  ? 'bg-cyan text-base border-cyan'
                  : 'bg-elevated border-border text-[#6B7A99] hover:border-cyan hover:text-cyan'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* ── Events ────────────────────────────────────────────────── */}
      <section className="p-3 border-b border-border">
        <label className="block text-[#6B7A99] uppercase tracking-widest text-[10px] mb-2">Events</label>
        {[
          { label: 'Combat ☠', value: showCombat, toggle: toggleCombat, color: '#FF6B35' },
          { label: 'Loot ◆',  value: showLoot,   toggle: toggleLoot,   color: '#FFD600' },
          { label: 'Storm ⚡', value: showStorm,  toggle: toggleStorm,  color: '#0088FF' },
        ].map(({ label, value, toggle, color }) => (
          <label key={label} className="flex items-center gap-2 mb-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={toggle}
              className="accent-cyan"
            />
            <span style={{ color: value ? color : '#6B7A99' }} className="transition-colors">{label}</span>
          </label>
        ))}
      </section>

      {/* ── View Mode ─────────────────────────────────────────────── */}
      <section className="p-3 border-b border-border">
        <label className="block text-[#6B7A99] uppercase tracking-widest text-[10px] mb-2">View Mode</label>
        {(['paths', 'heatmap', 'both'] as const).map((m) => (
          <label key={m} className="flex items-center gap-2 mb-1.5 cursor-pointer">
            <input
              type="radio"
              name="viewMode"
              checked={viewMode === m}
              onChange={() => setViewMode(m)}
              className="accent-cyan"
            />
            <span className={viewMode === m ? 'text-cyan' : 'text-[#6B7A99]'}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </span>
          </label>
        ))}
      </section>

      {/* ── Heatmap Type ──────────────────────────────────────────── */}
      {(viewMode === 'heatmap' || viewMode === 'both') && (
        <section className="p-3 border-b border-border">
          <label className="block text-[#6B7A99] uppercase tracking-widest text-[10px] mb-2">Heatmap</label>
          {([
            { id: 'loot',   label: 'Loot zones ◆' },
            { id: 'combat', label: 'Combat zones ☠' },
            { id: 'deaths', label: 'Death zones 💀' },
          ] as const).map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 mb-1.5 cursor-pointer">
              <input
                type="radio"
                name="heatmapType"
                checked={heatmapType === id}
                onChange={() => setHeatmapType(id)}
                className="accent-cyan"
              />
              <span className={heatmapType === id ? 'text-cyan' : 'text-[#6B7A99]'}>{label}</span>
            </label>
          ))}
        </section>
      )}

      {/* ── Legend ────────────────────────────────────────────────── */}
      <section className="p-3 mt-auto">
        <label className="block text-[#6B7A99] uppercase tracking-widest text-[10px] mb-2">Legend</label>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-[#00FF88]" />
            <span className="text-[#6B7A99]">Human player</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-[#FF6B35]" />
            <span className="text-[#6B7A99]">Bot</span>
          </div>
        </div>
      </section>
    </aside>
  )
}
