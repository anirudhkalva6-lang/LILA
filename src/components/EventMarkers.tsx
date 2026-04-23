import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useLeafletMap } from './MapCanvas'
import { useStore } from '../store'
import type { MatchEvent } from '../types'

const COMBAT_TYPES = new Set(['Kill', 'Killed', 'BotKill', 'BotKilled'])
const LOOT_TYPES   = new Set(['Loot'])
const STORM_TYPES  = new Set(['KilledByStorm'])

function eventIcon(type: string): string {
  if (COMBAT_TYPES.has(type)) return '☠'
  if (LOOT_TYPES.has(type))   return '◆'
  if (STORM_TYPES.has(type))  return '⚡'
  return '•'
}

function eventColor(type: string): string {
  if (type === 'Kill' || type === 'Killed')       return '#FF3B3B'
  if (type === 'BotKill' || type === 'BotKilled') return '#FF6B35'
  if (type === 'KilledByStorm')                   return '#0088FF'
  if (type === 'Loot')                            return '#FFD600'
  return '#ffffff'
}

function makeIcon(type: string): L.DivIcon {
  const symbol = eventIcon(type)
  const color  = eventColor(type)
  return L.divIcon({
    className: '',
    html: `<div style="
      font-size:13px;
      color:${color};
      text-shadow:0 0 4px ${color};
      line-height:1;
      cursor:pointer;
    ">${symbol}</div>`,
    iconSize:   [16, 16],
    iconAnchor: [8, 8],
  })
}

export default function EventMarkers() {
  const map = useLeafletMap()
  const markersRef = useRef<L.Marker[]>([])

  const loadedMatch   = useStore((s) => s.loadedMatch)
  const playerFilter  = useStore((s) => s.playerFilter)
  const showCombat    = useStore((s) => s.showCombat)
  const showLoot      = useStore((s) => s.showLoot)
  const showStorm     = useStore((s) => s.showStorm)
  const currentTimeMs = useStore((s) => s.currentTimeMs)
  const viewMode      = useStore((s) => s.viewMode)

  useEffect(() => {
    if (!map) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    if (!loadedMatch) return

    const players = loadedMatch.players.filter((p) => {
      if (playerFilter === 'human') return !p.is_bot
      if (playerFilter === 'bot')   return p.is_bot
      return true
    })

    players.forEach((player) => {
      const visibleEvents: MatchEvent[] = currentTimeMs > 0
        ? player.events.filter((e) => e.t <= currentTimeMs)
        : player.events

      visibleEvents.forEach((evt) => {
        const isCombat = COMBAT_TYPES.has(evt.type)
        const isLoot   = LOOT_TYPES.has(evt.type)
        const isStorm  = STORM_TYPES.has(evt.type)

        if (isCombat && !showCombat) return
        if (isLoot   && !showLoot)   return
        if (isStorm  && !showStorm)  return

        const marker = L.marker([evt.py, evt.px], { icon: makeIcon(evt.type) })
        marker.bindTooltip(
          `<div style="font-family:monospace;font-size:11px;background:#161B26;border:1px solid #252D40;padding:4px 8px;color:#E8EDF5">
            <b style="color:${eventColor(evt.type)}">${evt.type}</b><br/>
            ${player.is_bot ? 'Bot' : 'Human'} · ${player.id.slice(0, 8)}…<br/>
            T+${Math.round(evt.t / 1000)}s
          </div>`,
          { className: 'lila-tooltip', permanent: false, direction: 'top', offset: [0, -8] }
        )
        marker.addTo(map)
        markersRef.current.push(marker)
      })
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [map, loadedMatch, playerFilter, showCombat, showLoot, showStorm, currentTimeMs, viewMode])

  return null
}
