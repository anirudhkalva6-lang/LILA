"""
LILA Player Journey Tool — Data Pipeline
Run once to convert all parquet files into JSON for the frontend.

Usage:
    cd pipeline
    pip install -r requirements.txt
    python run.py
"""

import os
import re
import json
import shutil
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as pq
import pandas as pd
from tqdm import tqdm

# ─── Paths ──────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent.parent          # LILA/
DATA_DIR = BASE_DIR / "player_data"
OUTPUT_DIR = BASE_DIR / "public" / "data"
MAPS_SRC = BASE_DIR / "player_data" / "minimaps"
MAPS_DST = BASE_DIR / "public" / "maps"

# ─── Constants ───────────────────────────────────────────────────────────────

FOLDER_TO_DATE = {
    "February_10": "2026-02-10",
    "February_11": "2026-02-11",
    "February_12": "2026-02-12",
    "February_13": "2026-02-13",
    "February_14": "2026-02-14",
}

MAP_CONFIG = {
    "AmbroseValley": {"scale": 900,  "origin_x": -370, "origin_z": -473},
    "GrandRift":     {"scale": 581,  "origin_x": -290, "origin_z": -290},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500},
}

HUMAN_COLORS = [
    "#00FF88", "#00E5FF", "#FFE600", "#FF00FF", "#FF8C00",
    "#7FFF00", "#00BFFF", "#FF69B4", "#ADFF2F", "#FF6347",
]
BOT_COLOR = "#FF6B35"

PATH_EVENTS    = {"Position", "BotPosition"}
COMBAT_EVENTS  = {"Kill", "Killed", "BotKill", "BotKilled"}
DEATH_EVENTS   = {"Killed", "BotKilled", "KilledByStorm"}
LOOT_EVENTS    = {"Loot"}

HEATMAP_BUCKET = 20   # group pixel coords into 20px buckets for density

# ─── Helpers ─────────────────────────────────────────────────────────────────

def is_bot(user_id: str) -> bool:
    return bool(re.match(r"^\d+$", str(user_id)))


def world_to_pixel(x: float, z: float, map_id: str):
    """Convert world (x, z) coordinates to minimap pixel (px, py)."""
    cfg = MAP_CONFIG[map_id]
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    px = round(float(u * 1024), 1)
    py = round(float((1 - v) * 1024), 1)   # Y axis flipped: image origin is top-left
    return px, py


def bucket_coord(px: float) -> int:
    return int(px // HEATMAP_BUCKET) * HEATMAP_BUCKET


# ─── Step 0: Copy minimaps to public/maps ────────────────────────────────────

print("Copying minimaps...")
MAPS_DST.mkdir(parents=True, exist_ok=True)
for f in MAPS_SRC.iterdir():
    if f.suffix.lower() in (".png", ".jpg", ".jpeg"):
        shutil.copy2(f, MAPS_DST / f.name)
        print(f"  Copied {f.name}")

# ─── Step 1: Collect all parquet files ───────────────────────────────────────

all_files = []   # list of (filepath, date_str)
for folder_name, date in FOLDER_TO_DATE.items():
    folder_path = DATA_DIR / folder_name
    if not folder_path.exists():
        continue
    for fname in os.listdir(folder_path):
        if fname.startswith("."):
            continue
        all_files.append((folder_path / fname, date))

print(f"\nFound {len(all_files)} parquet files across 5 days")

# ─── Step 2: Read every file, group by match_id ──────────────────────────────

# match_records[clean_match_id] = {
#   "date": str, "map_id": str, "players": [{"user_id", "is_bot", "df"}]
# }
match_records: dict = defaultdict(lambda: {"date": None, "map_id": None, "players": []})
errors = []

for filepath, date in tqdm(all_files, desc="Reading parquet files"):
    try:
        df = pq.read_table(str(filepath)).to_pandas()

        # Decode event column from bytes → string
        df["event"] = df["event"].apply(
            lambda x: x.decode("utf-8") if isinstance(x, bytes) else str(x)
        )

        uid     = str(df["user_id"].iloc[0])
        raw_mid = str(df["match_id"].iloc[0])
        map_id  = str(df["map_id"].iloc[0])

        # Strip .nakama-0 suffix from match_id
        clean_mid = raw_mid.replace(".nakama-0", "")

        # Convert world (x, z) → pixel (px, py); ignore y (elevation)
        df["px"] = df.apply(lambda r: world_to_pixel(r["x"], r["z"], map_id)[0], axis=1)
        df["py"] = df.apply(lambda r: world_to_pixel(r["x"], r["z"], map_id)[1], axis=1)

        match_records[clean_mid]["date"]   = date
        match_records[clean_mid]["map_id"] = map_id
        match_records[clean_mid]["players"].append({
            "user_id": uid,
            "is_bot":  is_bot(uid),
            "df":      df,
        })

    except Exception as exc:
        errors.append((str(filepath), str(exc)))

print(f"Parsed {len(match_records)} unique matches | {len(errors)} errors")

# ─── Step 3: Build match JSON files ──────────────────────────────────────────

(OUTPUT_DIR / "matches").mkdir(parents=True, exist_ok=True)

# Heatmap accumulators: map_id → type → {(bx, by): count}
heatmap_acc: dict = defaultdict(lambda: {
    "combat": defaultdict(int),
    "deaths": defaultdict(int),
    "loot":   defaultdict(int),
})

index_matches = []

for match_id, record in tqdm(match_records.items(), desc="Building match JSONs"):
    players_raw = record["players"]
    map_id      = record["map_id"]
    date        = record["date"]

    # ── Find match-relative timestamps ──────────────────────────────────────
    # ts column is stored as timestamp[ms] but values are UNIX SECONDS.
    # Reinterpret as int64 (seconds), subtract match start, convert to ms.
    all_ts_seconds = []
    for p in players_raw:
        all_ts_seconds.extend(p["df"]["ts"].astype("int64").tolist())
    match_start_s = min(all_ts_seconds)
    match_end_s   = max(all_ts_seconds)
    duration_ms   = (match_end_s - match_start_s) * 1000

    humans = [p for p in players_raw if not p["is_bot"]]
    bots   = [p for p in players_raw if p["is_bot"]]

    players_out   = []
    combat_total  = 0
    loot_total    = 0
    storm_total   = 0

    all_players_ordered = (
        [(p, HUMAN_COLORS[i % len(HUMAN_COLORS)]) for i, p in enumerate(humans)]
        + [(p, BOT_COLOR) for p in bots]
    )

    for player_info, color in all_players_ordered:
        df = player_info["df"].copy()
        ts_s = df["ts"].astype("int64")
        df["t_ms"] = (ts_s - match_start_s) * 1000

        path_df  = df[df["event"].isin(PATH_EVENTS)].sort_values("t_ms")
        event_df = df[~df["event"].isin(PATH_EVENTS)].sort_values("t_ms")

        path = [
            {"t": int(r["t_ms"]), "px": r["px"], "py": r["py"]}
            for _, r in path_df.iterrows()
        ]
        events = [
            {"t": int(r["t_ms"]), "type": r["event"], "px": r["px"], "py": r["py"]}
            for _, r in event_df.iterrows()
        ]

        combat_total += int(event_df["event"].isin(COMBAT_EVENTS).sum())
        loot_total   += int(event_df["event"].isin(LOOT_EVENTS).sum())
        storm_total  += int((event_df["event"] == "KilledByStorm").sum())

        # Accumulate heatmap buckets
        for _, r in event_df.iterrows():
            bx = bucket_coord(r["px"])
            by = bucket_coord(r["py"])
            if r["event"] in COMBAT_EVENTS:
                heatmap_acc[map_id]["combat"][(bx, by)] += 1
            if r["event"] in DEATH_EVENTS:
                heatmap_acc[map_id]["deaths"][(bx, by)] += 1
            if r["event"] in LOOT_EVENTS:
                heatmap_acc[map_id]["loot"][(bx, by)] += 1

        players_out.append({
            "id":     player_info["user_id"],
            "is_bot": player_info["is_bot"],
            "color":  color,
            "path":   path,
            "events": events,
        })

    match_json = {
        "id":          match_id,
        "map":         map_id,
        "date":        date,
        "duration_ms": int(duration_ms),
        "stats": {
            "humans":         len(humans),
            "bots":           len(bots),
            "combat_events":  combat_total,
            "loot_events":    loot_total,
            "storm_deaths":   storm_total,
        },
        "players": players_out,
    }

    out_path = OUTPUT_DIR / "matches" / f"{match_id}.json"
    with open(out_path, "w") as fh:
        json.dump(match_json, fh, separators=(",", ":"))

    index_matches.append({
        "id":            match_id,
        "map":           map_id,
        "date":          date,
        "humans":        len(humans),
        "bots":          len(bots),
        "duration_ms":   int(duration_ms),
        "combat_events": combat_total,
        "loot_events":   loot_total,
        "storm_deaths":  storm_total,
        "multi_player":  len(players_raw) > 1,
    })

print(f"Written {len(index_matches)} match JSON files")

# ─── Step 4: Build heatmap JSONs (9 files: 3 maps × 3 types) ─────────────────

(OUTPUT_DIR / "heatmaps").mkdir(parents=True, exist_ok=True)

for map_id in ["AmbroseValley", "GrandRift", "Lockdown"]:
    for htype in ["combat", "deaths", "loot"]:
        bucket_data = heatmap_acc[map_id][htype]
        # Center each bucket point and include weight
        points = [
            [bx + HEATMAP_BUCKET // 2, by + HEATMAP_BUCKET // 2, w]
            for (bx, by), w in bucket_data.items()
        ]
        heatmap = {
            "map":          map_id,
            "type":         htype,
            "total_events": sum(w for _, _, w in points),
            "points":       points,
        }
        fname = f"{map_id}_{htype}.json"
        with open(OUTPUT_DIR / "heatmaps" / fname, "w") as fh:
            json.dump(heatmap, fh, separators=(",", ":"))
        print(f"  {fname}: {len(points)} density buckets, {heatmap['total_events']} events")

# ─── Step 5: Write index.json ─────────────────────────────────────────────────

index_matches.sort(key=lambda m: (m["date"], m["id"]))

map_counts: dict = defaultdict(int)
for m in index_matches:
    map_counts[m["map"]] += 1

index = {
    "date_range":    "Feb 10–14, 2026",
    "total_matches": len(index_matches),
    "maps": [
        {"id": "AmbroseValley", "matches": map_counts["AmbroseValley"], "image": "/maps/AmbroseValley_Minimap.png"},
        {"id": "GrandRift",     "matches": map_counts["GrandRift"],     "image": "/maps/GrandRift_Minimap.png"},
        {"id": "Lockdown",      "matches": map_counts["Lockdown"],      "image": "/maps/Lockdown_Minimap.jpg"},
    ],
    "matches": index_matches,
}

with open(OUTPUT_DIR / "index.json", "w") as fh:
    json.dump(index, fh, separators=(",", ":"))

print(f"\nindex.json written — {len(index_matches)} matches")

if errors:
    err_path = Path(__file__).parent / "errors.log"
    with open(err_path, "w") as fh:
        for path, err in errors:
            fh.write(f"{path}: {err}\n")
    print(f"{len(errors)} errors logged to pipeline/errors.log")

print("\nPipeline complete.")
