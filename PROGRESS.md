# Progress — PC MINER: CASES & HARDWARE

## Stage 1 — Core & UI (done)
- [x] Project architecture and documentation (GDD, PROGRESS, CHANGELOG, README)
- [x] Starter conditions (money, starter PC, installed components)
- [x] Item catalog (`js/data/items.js`)
- [x] Case catalog (`js/data/cases.js`)
- [x] Cases UI with multi-open (×1/×3/×5/×10)
- [x] Inventory UI with sell functionality
- [x] Workshop UI for installing components
- [x] Basic compatibility checks
- [x] Navigation between screens

## Stage 2 — Content (done)
- [x] Mid-tier hardware (CPU, motherboard, DDR4 RAM, NVMe drive)
- [x] Rarity styling for gray/blue/purple/yellow/red items
- [x] Multi-PC management: Farm screen, `activePCId`, build-new-PC action
- [x] Animated roulette case opening with pre-determined results and double-charge protection

## Stage 3 — Mining, offline, exchange & progression (done)
- [x] BYTE mining currency (`rate = totalPower × 0.1`)
- [x] Unified 6-hour storage with dynamic capacity
- [x] Offline progress on load, capped at capacity
- [x] Exchange screen with configurable rate and history log
- [x] Experience, levels and achievements
- [x] Garage HUD: balance, hourly income, power, storage bar, time to full, rate
- [x] Workshop and Farm recalculate mining stats after every change
- [x] Removed legacy `collectCoins` and duplicate exchange logic

## Stage 4 — Compliance & hardening (done)
- [x] Fixed asset and script paths in `index.html` (stylesheets, data catalogs, `js/main.js`)
- [x] Fixed navigation container mismatch (`#content`) and added the Menu screen
- [x] Rebuilt case-opening logic against the real case schema (`contents[].itemId/weight`)
- [x] Case rewards granted before the animation; single charge per opening
- [x] Correct power calculation (no artificial minimum, PSUs provide 0 power)
- [x] Storage clamped on downgrade; zero-rate/zero-capacity edge cases handled
- [x] Exchange input validation (integer, positive, affordable) and history cap
- [x] Multi-level experience handling and achievement unlocking on collect
- [x] Save/load schema validation with safe fallback for corrupted saves
- [x] Removed empty placeholder files (`js/q`, `js/data/q`, `js/systems/q`, `css/2`, `assets/*/1`)
- [x] Removed all inline event handlers and inline styles (delegated `data-action` clicks)
- [x] Added dark-mode support and `prefers-reduced-motion` handling
- [x] Added `tests/validate.js` (43 headless checks) and `npm test`
- [x] Documentation aligned with the implementation
