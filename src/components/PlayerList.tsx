import { useStore } from '../store'

export default function PlayerList() {
  const loadedMatch     = useStore((s) => s.loadedMatch)
  const selectedPlayer  = useStore((s) => s.selectedPlayerId)
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer)
  const playerFilter    = useStore((s) => s.playerFilter)
  const currentTimeMs   = useStore((s) => s.currentTimeMs)

  if (!loadedMatch) {
    return (
      <aside className="w-64 flex-shrink-0 bg-surface border-l border-border p-4 font-mono text-xs">
        <p className="text-[#6B7A99] text-center mt-8">Select a match<br/>to see players</p>
      </aside>
    )
  }

  const players = loadedMatch.players.filter((p) => {
    if (playerFilter === 'human') return !p.is_bot
    if (playerFilter === 'bot')   return p.is_bot
    return true
  })

  // Check if player is dead at currentTimeMs
  function isDead(playerId: string) {
    if (currentTimeMs === 0) return false
    const p = loadedMatch!.players.find((pp) => pp.id === playerId)
    if (!p) return false
    return p.events.some(
      (e) => (e.type === 'Killed' || e.type === 'BotKilled' || e.type === 'KilledByStorm')
        && e.t <= currentTimeMs
    )
  }

  const { stats } = loadedMatch

  return (
    <aside className="w-64 flex-shrink-0 bg-surface border-l border-border flex flex-col font-mono text-xs overflow-hidden">
      {/* Match header */}
      <div className="p-3 border-b border-border">
        <div className="text-[#E8EDF5] font-display font-bold text-sm truncate" title={loadedMatch.id}>
          {loadedMatch.id.slice(0, 12)}…
        </div>
        <div className="text-[#6B7A99] mt-0.5">{loadedMatch.map} · {loadedMatch.date}</div>
        <div className="text-[#6B7A99] mt-0.5">
          {Math.round(loadedMatch.duration_ms / 60000)} min
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-px border-b border-border">
        {[
          { label: 'Humans', value: stats.humans,         color: '#00FF88' },
          { label: 'Bots',   value: stats.bots,           color: '#FF6B35' },
          { label: 'Combat', value: stats.combat_events,  color: '#FF6B35' },
          { label: 'Loot',   value: stats.loot_events,    color: '#FFD600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-2 bg-elevated">
            <div className="text-[10px] text-[#6B7A99] uppercase tracking-widest">{label}</div>
            <div className="text-lg font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 text-[10px] text-[#6B7A99] uppercase tracking-widest border-b border-border">
          Players ({players.length})
        </div>
        {players.map((p) => {
          const dead      = isDead(p.id)
          const isSelected = selectedPlayer === p.id
          const killCount = p.events.filter((e) => e.type === 'Kill' || e.type === 'BotKill').length
          const lootCount = p.events.filter((e) => e.type === 'Loot').length

          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlayer(isSelected ? null : p.id)}
              className={`w-full text-left px-3 py-2 border-b border-border transition-colors flex items-center gap-2 ${
                isSelected ? 'bg-hover' : 'hover:bg-elevated'
              } ${dead ? 'opacity-40' : ''}`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] px-1 border ${
                    p.is_bot
                      ? 'text-orange border-orange'
                      : 'text-human border-human'
                  }`}>
                    {p.is_bot ? 'BOT' : 'HUM'}
                  </span>
                  <span className="text-[#E8EDF5] truncate">{p.id.slice(0, 8)}…</span>
                </div>
                <div className="text-[#6B7A99] text-[10px] mt-0.5">
                  ☠ {killCount} · ◆ {lootCount}
                  {dead && ' · DEAD'}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-border">
        <div className="text-[10px] text-[#6B7A99] uppercase tracking-widest mb-2">Legend</div>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center gap-2">
            <span style={{ color: '#FF6B35' }}>☠</span>
            <span className="text-[#6B7A99]">Combat · </span>
            <span style={{ color: '#FFD600' }}>◆</span>
            <span className="text-[#6B7A99]">Loot · </span>
            <span style={{ color: '#0088FF' }}>⚡</span>
            <span className="text-[#6B7A99]">Storm</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
