import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useLeafletMap } from './MapCanvas'
import { useStore } from '../store'
import type { Player } from '../types'

export default function PathLayer() {
  const map = useLeafletMap()
  const linesRef = useRef<L.Polyline[]>([])

  const loadedMatch     = useStore((s) => s.loadedMatch)
  const playerFilter    = useStore((s) => s.playerFilter)
  const currentTimeMs   = useStore((s) => s.currentTimeMs)
  const selectedPlayer  = useStore((s) => s.selectedPlayerId)
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer)
  const viewMode        = useStore((s) => s.viewMode)

  useEffect(() => {
    if (!map) return

    // Remove old lines
    linesRef.current.forEach((l) => l.remove())
    linesRef.current = []

    const showPaths = viewMode === 'paths' || viewMode === 'both'
    if (!loadedMatch || !showPaths) return

    const players = loadedMatch.players.filter((p) => {
      if (playerFilter === 'human') return !p.is_bot
      if (playerFilter === 'bot')   return p.is_bot
      return true
    })

    players.forEach((player: Player) => {
      // During playback, only show path up to currentTimeMs
      const visiblePath = currentTimeMs > 0
        ? player.path.filter((pt) => pt.t <= currentTimeMs)
        : player.path

      if (visiblePath.length < 2) return

      const latlngs: L.LatLngExpression[] = visiblePath.map((pt) => [pt.py, pt.px])

      const isSelected  = selectedPlayer === player.id
      const hasSelected = selectedPlayer !== null
      const opacity     = hasSelected && !isSelected ? 0.15 : 0.85
      const weight      = isSelected ? 3 : 1.5

      const line = L.polyline(latlngs, {
        color:      player.color,
        weight,
        opacity,
        dashArray:  player.is_bot ? '6 4' : undefined,
        lineCap:    'round',
        lineJoin:   'round',
      })

      line.on('click', () => {
        setSelectedPlayer(selectedPlayer === player.id ? null : player.id)
      })

      line.addTo(map)
      linesRef.current.push(line)
    })

    return () => {
      linesRef.current.forEach((l) => l.remove())
      linesRef.current = []
    }
  }, [map, loadedMatch, playerFilter, currentTimeMs, selectedPlayer, viewMode, setSelectedPlayer])

  return null
}
