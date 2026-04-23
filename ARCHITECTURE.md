# Architecture — LILA Player Journey Tool

## What Was Built and Why

**Static JSON + React SPA** — No server, no database. The Python pipeline runs once locally, converts all 1,243 parquet files to JSON, and commits the output to the repo. Vercel serves everything as static files from its CDN. This means zero cold starts, no backend costs, and instant global availability.

**Leaflet.js (not react-leaflet)** — Used vanilla Leaflet inside `useEffect`/`useRef` for full control over layer lifecycle. `L.CRS.Simple` maps the 1024×1024 minimap PNG as a flat image without geo projection. Each layer component (PathLayer, EventMarkers, HeatmapLayer) adds and removes its own Leaflet layers when the Zustand store changes.

**Zustand** — All application state lives in one store (`src/store.ts`). Every component reads from and writes to the same store. No prop drilling, no Context chaos.

## Data Flow

```
1,243 parquet files (player_data/)
         │
         ▼
  pipeline/run.py
    - reads pyarrow → pandas
    - decodes event bytes → string
    - strips .nakama-0 from match_id
    - converts world (x,z) → pixel (px,py)
    - normalizes timestamps → match-relative ms
    - groups by match_id
    - assigns player colors
         │
         ▼
  public/data/
    index.json       (796 match summaries)
    matches/*.json   (one per match, ~5-20KB)
    heatmaps/*.json  (9 files: 3 maps × 3 types)
         │
         ▼
  React app (src/)
    Dashboard → fetches index.json → 3 map cards + match table
    MapView   → fetches match JSON on selection → Leaflet renders layers
    Heatmap   → fetched lazily when heatmap mode activated
```

## Coordinate Mapping

The minimap images are 1024×1024 pixels. Game world uses a 3D coordinate system (x, y, z) where y = elevation. Only x and z are used for 2D mapping.

```
Map           Scale   Origin X   Origin Z
AmbroseValley  900     -370       -473
GrandRift      581     -290       -290
Lockdown      1000     -500       -500

u = (world_x - origin_x) / scale
v = (world_z - origin_z) / scale

pixel_x = u × 1024
pixel_y = (1 - v) × 1024     ← Y axis flipped: image top-left is (0,0)
```

**Verified:** actual data produces pixel ranges 51–764 (x) and 75–918 (y) for AmbroseValley — all within 1024×1024 bounds.

**Timestamp quirk:** The `ts` column is labeled `timestamp[ms]` in the parquet schema, but the stored integer values are **Unix timestamps in seconds** (not milliseconds). Pandas interprets them as ms and displays 1970-01-21 dates. The pipeline reads raw int64 values and treats them as seconds: `t_ms = (ts_int - match_start_seconds) × 1000`. This gives correct match-relative timing (avg 6.8 min matches).

## Assumptions Made

| Assumption | Evidence | Impact |
|---|---|---|
| ts values are seconds, not ms | Timestamps cluster around Jan 21 1970 (1.77B ms = 20.5 days); reinterpreted as seconds gives Feb 2026 dates and realistic 6–14 min match durations | High — playback would be broken without this |
| Human kills labeled as "Kill", bots as "BotKill" | README schema; confirmed in data (only 3 Kill events vs 2,415 BotKill events) | Combat heatmap uses both types |
| Date comes from folder name, not parquet data | No date column in schema; folder names are February_10…14 | Date filter relies on folder tracking |
| Position events are match snapshots, not full sessions | Per-file ts range is ~400 seconds; matches reconstruct to 6–14 min when combined | No per-file decimation needed |

## Tradeoffs

| Decision | Alternative | Why chosen |
|---|---|---|
| Pre-process to static JSON | Live Python API (FastAPI/Flask) | No server to maintain; all 796 match files = ~8MB total — trivially small for CDN |
| Vanilla Leaflet + useEffect | react-leaflet | Full control over layer add/remove lifecycle; no version compatibility issues |
| Three heatmap types: combat/deaths/loot | Include traffic (Position events) | Traffic heatmap showed noise across entire map; loot (12,885 events) is far more actionable |
| One Zustand store | Multiple contexts | Single source of truth; every component in sync without prop drilling |
| 20px heatmap buckets | Raw point heatmap | Bucketing creates meaningful density clusters; raw points at same location don't weight correctly in leaflet.heat |

## Three Insights from the Data

See INSIGHTS.md.
