import type { MapId } from '../types'

const MAP_CONFIG: Record<MapId, { scale: number; originX: number; originZ: number }> = {
  AmbroseValley: { scale: 900,  originX: -370, originZ: -473 },
  GrandRift:     { scale: 581,  originX: -290, originZ: -290 },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500 },
}

/** Convert world (x, z) → minimap pixel (px, py). Mirrors pipeline/run.py exactly. */
export function worldToPixel(x: number, z: number, mapId: MapId) {
  const cfg = MAP_CONFIG[mapId]
  const u = (x - cfg.originX) / cfg.scale
  const v = (z - cfg.originZ) / cfg.scale
  return {
    px: parseFloat((u * 1024).toFixed(1)),
    py: parseFloat(((1 - v) * 1024).toFixed(1)),  // Y flipped: image top-left is origin
  }
}

export { MAP_CONFIG }
