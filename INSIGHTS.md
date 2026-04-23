# Insights — LILA Player Journey Tool

Three level design insights discovered through the visualization tool.

---

## Insight 1: GrandRift Is Severely Underplayed

**What caught my eye:** The Dashboard shows AmbroseValley with 566 matches (71%), Lockdown with 171 (21%), and GrandRift with only 59 matches (7%). GrandRift generates almost no data relative to its map footprint.

**The evidence:**
- 59 GrandRift matches vs 566 AmbroseValley matches over the same 5-day window
- GrandRift has the widest pixel coordinate spread (113–963 px) suggesting it is the largest map, yet it sees the least play
- Event density on the GrandRift heatmap is extremely sparse — combat events scattered, no clear hotspot clusters

**Actionable insight:** GrandRift likely has a matchmaking or rotation problem. If it's in the same rotation pool as AmbroseValley, players may be requeuing to avoid it. The level design team should investigate:
- Is the map too large, making encounters too rare?
- Does the storm path on GrandRift feel unfair or punishing?

**Metrics affected:** Match completion rate, player retention per match, queue abandon rate

**Actionable items:**
1. Shrink the effective play zone — reduce storm starting radius to increase encounter density
2. Add 2–3 loot concentration zones to incentivize players to push toward each other
3. Audit the map rotation weight — if GrandRift is forced equally, the data suggests players perceive it negatively

**Why a level designer should care:** A map that sees 7× less play than its sister map in the same rotation is effectively dead content. This is the highest-priority redesign candidate in the dataset.

---

## Insight 2: Loot Is the Dominant Activity — More Common Than Combat

**What caught my eye:** The event breakdown shows Loot at 14.5% of all events — higher than all combat events combined (Kill + Killed + BotKill + BotKilled = 4.3%). The loot heatmap on AmbroseValley is dramatically denser than the combat heatmap.

**The evidence:**
- 12,885 Loot events vs 3,121 total combat events across 5 days
- Only 3 human-vs-human Kill events in the entire dataset
- Loot events cluster heavily in specific map corridors visible in the heatmap

**Actionable insight:** Players are in "loot loop" behavior — repeatedly collecting items without engaging in PvP. This could indicate:
- Combat is too punishing (bots are better shots than humans, discouraging engagement)
- Loot spawns are too rich in safe areas, removing risk-reward pressure
- The extraction mechanic is incentivizing passive play over aggressive play

**Metrics affected:** Average combat encounters per match, PvP kill rate, session length

**Actionable items:**
1. Audit the top 5 loot cluster zones from the heatmap — if they're in low-traffic safe areas, redistribute them toward contested zones
2. Reduce loot density in map periphery; concentrate it near center/storm border to force movement
3. Track loot-to-extraction ratio — are players extracting rich without fighting?

**Why a level designer should care:** If players are prioritizing loot over combat in an extraction shooter, the map layout is enabling passive behavior. The loot heatmap literally shows where players feel safe — those are the areas the level designer needs to make contested.

---

## Insight 3: 93% of Match Files Are Solo Journeys — The Multiplayer Experience Is Not Being Captured

**What caught my eye:** Match size analysis shows 743 out of 796 matches (93%) have only a single player file. The remaining 52 matches with 4+ players show dramatically different path patterns — crossing paths, combat clustering, coordinated loot runs.

**The evidence:**
- 796 unique matches but only 1,243 files = average 1.56 files per match
- 18 matches have 10+ player files — these show complex multi-player emergent behavior
- In solo-file matches, paths are linear and purposeful; in multi-player matches, paths show hesitation, backtracking, and clustering around combat zones

**Actionable insight:** The data collection system is capturing individual player telemetry, not full match telemetry. Most matches have far more players in the actual game session than are represented in this dataset. The 52 multi-player matches are likely the ones where multiple players opted into telemetry — or the data pipeline captures a partial sample.

**Metrics affected:** Data coverage completeness, design decision confidence, sample size validity

**Actionable items:**
1. Fix the telemetry pipeline to capture ALL players in each match, not just opted-in players — the level design team is making decisions on <10% of the actual player population
2. Focus immediate design analysis on the 18 large matches (10+ files) — these are the only ones showing realistic multi-player behavior
3. Cross-reference the multi-player match heatmaps specifically — they will show qualitatively different hotspots than the solo journey aggregate

**Why a level designer should care:** Every heatmap and path analysis based on this dataset represents solo behavior, not group behavior. Extraction shooters are fundamentally social games. Designing around solo telemetry risks optimizing for the wrong player experience.
