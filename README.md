# LILA Player Journey Visualization Tool

A browser-based tool for Level Designers to explore player behavior across LILA BLACK maps.

## Live Demo
> https://harmonious-belekoy-c80c4c.netlify.app/

## Tech Stack
| Layer | Tool |
|---|---|
| Data pipeline | Python + pyarrow + pandas + tqdm |
| Frontend | React 18 + Vite + TypeScript |
| Map rendering | Leaflet.js (vanilla, CRS.Simple) |
| Heatmaps | leaflet.heat plugin |
| State | Zustand |
| Styling | Tailwind CSS + Space Mono + Barlow Condensed |
| Hosting | Vercel (static, no server) |

## Project Structure
```
LILA/
├── pipeline/          Python pipeline — run once to generate JSON
├── player_data/       Raw parquet files (1,243 files) + minimaps
├── public/
│   ├── maps/          Minimap images (copied by pipeline)
│   └── data/          Generated JSON (committed to git)
│       ├── index.json
│       ├── matches/   ~796 match files
│       └── heatmaps/  9 aggregate files
└── src/               React app
```

## Setup

### 1. Run the data pipeline (one time)
```bash
cd pipeline
pip install -r requirements.txt
python run.py
```
This reads all 1,243 parquet files and writes:
- `public/data/index.json` — all match summaries
- `public/data/matches/{id}.json` — per-match player data
- `public/data/heatmaps/{map}_{type}.json` — aggregate heatmaps
- `public/maps/` — minimap images

### 2. Start the dev server
```bash
npm install
npm run dev
# → http://localhost:5173
```

### 3. Build for production
```bash
npm run build
# → dist/  (static files)
```

## Deploy to Vercel
1. Push repo to GitHub (include `public/data/`)
2. Import project on vercel.com
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy — done.

No environment variables required. No server required.

## Key Notes
- The `ts` column in parquet stores Unix timestamps in **seconds** (not ms). The pipeline reinterprets correctly.
- Coordinate mapping uses `x` and `z` columns only — `y` is elevation and ignored.
- Human players: UUID user_id. Bots: numeric user_id.
- **Heatmap types:** The tool provides Combat, Deaths, and Loot heatmaps. A general "Traffic" (position density) heatmap was evaluated but deliberately replaced with Loot — position events are so uniformly distributed across solo journeys (93% of matches) that a traffic heatmap added visual noise without actionable signal. Loot zones proved far more useful for identifying player routing and safe-area concentration. See ARCHITECTURE.md → Tradeoffs for the full rationale.
