import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { loadIndex } from '../utils/dataLoader'
import MapCanvas from '../components/MapCanvas'
import PathLayer from '../components/PathLayer'
import EventMarkers from '../components/EventMarkers'
import HeatmapLayer from '../components/HeatmapLayer'
import FilterPanel from '../components/FilterPanel'
import PlayerList from '../components/PlayerList'
import Timeline from '../components/Timeline'
import MatchDrawer from '../components/MatchDrawer'
import type { IndexData, MapId } from '../types'

const MAPS: MapId[] = ['AmbroseValley', 'GrandRift', 'Lockdown']

export default function MapView() {
  const { mapId } = useParams<{ mapId: string }>()
  const navigate  = useNavigate()
  const [index, setIndex] = useState<IndexData | null>(null)

  const { activeMap, setActiveMap } = useStore()

  // Sync URL param → store
  useEffect(() => {
    if (mapId && MAPS.includes(mapId as MapId) && mapId !== activeMap) {
      setActiveMap(mapId as MapId)
    }
  }, [mapId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadIndex().then(setIndex).catch(console.error)
  }, [])

  function switchMap(id: MapId) {
    setActiveMap(id)
    navigate(`/map/${id}`)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base">
      {/* Top bar — map tabs */}
      <div className="flex items-center gap-0 border-b border-border bg-surface flex-shrink-0">
        {MAPS.map((id) => (
          <button
            key={id}
            onClick={() => switchMap(id)}
            className={`px-5 py-3 font-display font-bold text-sm border-r border-border transition-colors ${
              activeMap === id
                ? 'text-cyan border-b-2 border-b-cyan bg-elevated'
                : 'text-[#6B7A99] hover:text-[#E8EDF5] border-b-2 border-b-transparent'
            }`}
          >
            {id}
          </button>
        ))}
        <div className="ml-auto px-4 text-[#6B7A99] text-xs font-mono">
          {index
            ? `${index.maps.find((m) => m.id === activeMap)?.matches ?? 0} matches`
            : '…'}
        </div>
      </div>

      {/* Main workspace — 3 columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — filters */}
        <FilterPanel index={index} />

        {/* Center — map canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MapCanvas>
            <HeatmapLayer />
            <PathLayer />
            <EventMarkers />
          </MapCanvas>
        </div>

        {/* Right — match info */}
        <PlayerList />
      </div>

      {/* Bottom — timeline */}
      <Timeline />

      <MatchDrawer />
    </div>
  )
}
