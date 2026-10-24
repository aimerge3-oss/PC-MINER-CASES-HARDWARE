# PC MINER: CASES & HARDWARE

A high-quality browser-based PC building and mining simulator.

## Stage 3 – Mining, Offline, Exchange & Progression

### New Mechanics
- **BYTE** – primary mining currency; earned by computers.
- **COIN** – secondary currency, obtainable by exchanging BYTE.
- Mining rate calculated from installed components (power) with factor 0.1 BYTE/sec per power point.
- Unified storage limits to **6 hours** of current total income.
- Offline progress: on load, calculates elapsed time, caps at storage capacity.
- Exchange screen with history and configurable exchangeRate.
- **Exchange Rate** – default `1000` BYTE = 1 COIN (configurable via `state.exchangeRate`).
- Experience (exp) and player level, with simple level‑up alerts.
- Basic achievements (first mine, first 1 000 BYTE).
- Added navigation entry **Exchange**.
- UI updates for garage to show BYTE balance, hourly income, storage bar, time to fill, and exchange rate.
- Added `state.exchangeLog` for exchange history.
- Updated state handling, saving, and loading.
- Added `updateMiningStats()` to recompute total rate and storage capacity after any component change.
- Added `collectBytes()` button (replaces previous collectCoins).
- Added `addExp()` helper.
- Added simple experience gain on exchanges.
- Updated navigation, main loop, and workshop to recalc stats after installs.

## How to Run
Simply open `index.html` in any modern web browser.

## Tech Stack
- HTML5 / CSS3 / Vanilla JS
- No external dependencies or frameworks.
