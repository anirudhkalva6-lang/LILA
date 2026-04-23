import { useEffect, useRef, useState, createContext, useContext } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useStore } from '../store'

// Map instance shared with child layer components via context
export const MapCtx = createContext<L.Map | null>(null)
export const useLeafletMap = () => useContext(MapCtx)

const MAP_IMAGES: Record<string, string> = {
  AmbroseValley: '/maps/AmbroseValley_Minimap.png',
  GrandRift:     '/maps/GrandRift_Minimap.png',
  Lockdown:      '/maps/Lockdown_Minimap.jpg',
}

const BOUNDS: L.LatLngBoundsExpression = [[0, 0], [1024, 1024]]

interface Props { children?: React.ReactNode }

export default function MapCanvas({ children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const overlayRef   = useRef<L.ImageOverlay | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const activeMap = useStore((s) => s.activeMap)

  // ── Initialize Leaflet map once ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      crs:          L.CRS.Simple,
      minZoom:      -2,
      maxZoom:      4,
      zoomSnap:     0.5,
      zoomDelta:    0.5,
      attributionControl: false,
    })

    const overlay = L.imageOverlay(MAP_IMAGES[activeMap] ?? MAP_IMAGES.AmbroseValley, BOUNDS)
    overlay.addTo(map)
    map.fitBounds(BOUNDS)

    mapRef.current    = map
    overlayRef.current = overlay
    setMapReady(true)

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap minimap image when active map changes ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !overlayRef.current) return
    const imgUrl = MAP_IMAGES[activeMap] ?? MAP_IMAGES.AmbroseValley
    overlayRef.current.setUrl(imgUrl)
    mapRef.current.fitBounds(BOUNDS)
  }, [activeMap])

  return (
    <MapCtx.Provider value={mapRef.current}>
      <div className="relative w-full h-full bg-base">
        {/* Leaflet mounts here */}
        <div ref={containerRef} className="absolute inset-0" />

        {/* Zoom controls */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
          <button
            onClick={() => mapRef.current?.zoomIn(0.5)}
            className="w-8 h-8 bg-elevated border border-border text-cyan font-mono text-lg flex items-center justify-center hover:bg-hover"
          >+</button>
          <button
            onClick={() => mapRef.current?.zoomOut(0.5)}
            className="w-8 h-8 bg-elevated border border-border text-cyan font-mono text-lg flex items-center justify-center hover:bg-hover"
          >−</button>
          <button
            onClick={() => mapRef.current?.fitBounds(BOUNDS)}
            className="w-8 h-8 bg-elevated border border-border text-[#6B7A99] font-mono text-xs flex items-center justify-center hover:bg-hover"
            title="Reset zoom"
          >⊙</button>
        </div>

        {/* Child layers only render after map is ready */}
        {mapReady && (
          <MapCtx.Provider value={mapRef.current}>
            {children}
          </MapCtx.Provider>
        )}
      </div>
    </MapCtx.Provider>
  )
}
