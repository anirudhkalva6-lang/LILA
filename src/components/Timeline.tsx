import { useEffect, useRef } from 'react'
import { useStore } from '../store'

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Timeline() {
  const {
    loadedMatch, isPlaying, currentTimeMs, matchDurationMs, playbackSpeed,
    setIsPlaying, setCurrentTimeMs, setPlaybackSpeed, resetPlayback,
  } = useStore()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Playback ticker
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        useStore.setState((s) => {
          const next = s.currentTimeMs + 100 * s.playbackSpeed
          if (next >= s.matchDurationMs) {
            clearInterval(intervalRef.current!)
            return { currentTimeMs: s.matchDurationMs, isPlaying: false }
          }
          return { currentTimeMs: next }
        })
      }, 100)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying])

  if (!loadedMatch) {
    return (
      <div className="h-14 bg-surface border-t border-border flex items-center justify-center font-mono text-xs text-[#6B7A99]">
        Select a match to enable playback
      </div>
    )
  }

  const pct = matchDurationMs > 0 ? (currentTimeMs / matchDurationMs) * 100 : 0

  // Event marks on the scrubber track
  const eventMarks = loadedMatch.players
    .flatMap((p) => p.events)
    .filter((_, i) => i % 3 === 0)  // reduce density
    .map((e) => ({
      pct: matchDurationMs > 0 ? (e.t / matchDurationMs) * 100 : 0,
      type: e.type,
    }))

  function markColor(type: string) {
    if (['Kill','Killed','BotKill','BotKilled'].includes(type)) return '#FF6B35'
    if (type === 'Loot') return '#FFD600'
    if (type === 'KilledByStorm') return '#0088FF'
    return '#6B7A99'
  }

  return (
    <div className="h-14 bg-surface border-t border-border flex items-center gap-3 px-4 font-mono text-xs select-none">
      {/* Rewind */}
      <button
        onClick={resetPlayback}
        className="text-[#6B7A99] hover:text-cyan transition-colors text-base w-5 flex items-center justify-center"
        title="Rewind"
      >◄◄</button>

      {/* Play / Pause */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-7 h-7 flex items-center justify-center bg-elevated border border-border text-cyan hover:bg-hover transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Speed */}
      <div className="flex gap-0.5">
        {([1, 2, 5] as const).map((s) => (
          <button
            key={s}
            onClick={() => setPlaybackSpeed(s)}
            className={`px-1.5 py-0.5 border text-[10px] transition-colors ${
              playbackSpeed === s
                ? 'bg-cyan text-base border-cyan'
                : 'bg-elevated border-border text-[#6B7A99] hover:border-cyan'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Scrubber track */}
      <div className="flex-1 relative h-6 flex items-center group">
        {/* Event marks */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {eventMarks.map((mark, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-2 rounded-sm opacity-70"
              style={{ left: `${mark.pct}%`, backgroundColor: markColor(mark.type) }}
            />
          ))}
        </div>

        {/* Track background */}
        <div className="w-full h-1 bg-elevated rounded-full relative">
          <div
            className="absolute left-0 top-0 h-full bg-cyan rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Range input (invisible, on top) */}
        <input
          type="range"
          min={0}
          max={matchDurationMs}
          value={currentTimeMs}
          onChange={(e) => {
            setIsPlaying(false)
            setCurrentTimeMs(Number(e.target.value))
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Time display */}
      <div className="text-[#E8EDF5] tabular-nums w-20 text-right">
        {formatTime(currentTimeMs)} / {formatTime(matchDurationMs)}
      </div>
    </div>
  )
}
