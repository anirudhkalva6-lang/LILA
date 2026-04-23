import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.heat'
import { useLeafletMap } from './MapCanvas'
import { useStore } from '../store'
import { loadHeatmap } from '../utils/dataLoader'

export default function HeatmapLayer() {
  const map        = useLeafletMap()
  const heatRef    = useRef<L.HeatLayer | null>(null)

  const activeMap     = useStore((s) => s.activeMap)
  const heatmapType   = useStore((s) => s.heatmapType)
  const viewMode      = useStore((s) => s.viewMode)

  const showHeatmap = viewMode === 'heatmap' || viewMode === 'both'

  useEffect(() => {
    if (!map) return

    if (heatRef.current) {
      heatRef.current.remove()
      heatRef.current = null
    }

    if (!showHeatmap) return

    loadHeatmap(activeMap, heatmapType).then((data) => {
      if (!map) return

      // Leaflet CRS.Simple: [lat, lng] = [py, px]
      const points: [number, number, number][] = data.points.map(
        ([px, py, w]) => [py, px, w]
      )

      const heat = L.heatLayer(points, {
        radius:     30,
        blur:       20,
        maxZoom:    4,
        max:        20,
        gradient:   { 0.0: '#0088FF', 0.4: '#00E5FF', 0.6: '#FFE600', 0.8: '#FF6B35', 1.0: '#FF3B3B' },
        minOpacity: 0.35,
      })

      heat.addTo(map)
      heatRef.current = heat
    }).catch(() => {
      // No data for this map/type — silently skip
    })

    return () => {
      if (heatRef.current) {
        heatRef.current.remove()
        heatRef.current = null
      }
    }
  }, [map, activeMap, heatmapType, showHeatmap])

  return null
}
