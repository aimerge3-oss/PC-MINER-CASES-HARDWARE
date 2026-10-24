# Changelog — PC MINER: CASES & HARDWARE

## [Unreleased] — Economy, art & UX polish

### Added
- Expanded hardware catalog to 28 items across gray → red with unique SVG artwork per tier.
- New mid / high / enthusiast / legendary parts (Mid GPU, High CPU, Legendary GPU/CPU, etc.).
- Money (₽) balance is now visible on Garage, Cases, Inventory and Farm screens.
- Hardware icons redrawn as proper component illustrations (CPU, GPU, motherboard, RAM, SSD, PSU, case + tier variants).

### Fixed
- Critical UX bug: ₽ balance was never shown anywhere in the UI.
- Remaining inline `onclick` handlers in Inventory / Workshop / Farm replaced with delegated `data-action` clicks.
- Case EV rebalanced so reselling drops cannot profit over the case price.
- Basic case pool and tests updated for the expanded catalog.

### Changed
- Standard Black Case catalog price set to 2 500 ₽ (was free).
- Case contents weighted for clearer progression from Basic → Premium.

## [Unreleased] — Compliance & hardening pass

### Fixed
- **Broken boot**: `index.html` now loads `css/*.css`, `js/data/items.js`, `js/data/cases.js` and `js/main.js` from the correct paths (previously referenced non-existent root files, so `ITEMS`, `CASES` and `getItemById` were undefined).
- **Blank screens**: the navigation renderer targets the real `#content` container instead of a non-existent `#content`/`#app-container` mismatch.
- **Case opening**: reworked against the actual catalog schema (`contents[].itemId/weight`); the old code used non-existent `itemPool`/`totalWeight`/`type` fields and awarded nothing.
- **Double-charge / lost rewards**: rewards are now rolled and granted before the animation, duplicate clicks are blocked, and a reload mid-spin no longer loses paid items.
- **Mining power**: removed the artificial `power || 1` floor (empty PCs produced income) and set PSUs to 0 power as documented.
- **Storage**: capacity is recalculated and stored BYTE clamped after hardware downgrades; division-by-zero and `NaN` paths for zero-rate players are handled.
- **Offline progress**: safely no-ops with zero rate or full storage, and never produces `NaN` timestamps.
- **Exchange**: validates integer/positive/affordable amounts, rejects sub-rate amounts, caps history, and refreshes the screen after trading.
- **Progression**: multiple level-ups per action are handled without losing EXP; achievements now unlock on collection; added *Первая монета*.
- **Persistence**: save/load validates the schema, repairs partial saves, clamps invalid values and falls back to a fresh game on corrupted JSON.
- **Workshop**: fixed the compatibility check for motherboard swaps (it compared against the installed board instead of the candidate), and added DDR3/DDR4 memory checks.
- **Farm**: new PCs cost 25 000 ₽ and start with zero power; the previous infinite free-PC income exploit is gone.
- **Layout**: storage meter CSS was defined but never loaded; all four stylesheets are now linked and the stylesheet paths are correct.

### Changed
- Replaced all inline `onclick`/`style` attributes with delegated `data-action` handlers and CSS classes.
- Added a **Menu** screen (level/EXP, achievements, exchange rate, save, reset) to match the GDD.
- Added dark-mode theme tokens and `prefers-reduced-motion` support.
- Item sales now return 50% of catalog price (documented `SELL_RATE`).
- Added accessible markup: labelled inputs, `aria-current` navigation state, `role="progressbar"` storage meter.
- Autosave every 10 seconds plus save on `pagehide`/`beforeunload` and tab hide.

### Added
- `tests/validate.js` — 44 dependency-free logic/static checks (assets, relative deploy paths, catalogs, economy, storage, offline, exchange, progression, compatibility, cases, persistence).
- `tests/browser.test.js` — 20 jsdom browser tests that serve the real site over HTTP and click through it: boot, navigation, mining loop, collect, exchange, case reveal, selling, workshop, farm, menu, reload with offline progress, reset, markup and an axe-core accessibility audit.
- `package.json` with `npm test`, `npm run test:browser` and `npm run test:all` (devDependencies: jsdom, axe-core).

### Changed
- Replaced non-standard `innerText` assignments with `textContent` so rendering works in all DOM implementations.
- Verified that `index.html` only uses relative asset paths, so the game works at the domain root or any subpath on Cloudflare Pages.

### Removed
- Empty placeholder files: `js/q`, `js/data/q`, `js/systems/q`, `css/2`, `assets/icons/1`, `assets/images/1`.
- Legacy `collectCoins` helper and unused CSS keyframes.

## [2026-10-24] — Stage 3
### Added
- BYTE mining currency with per-second income based on component power.
- Unified 6-hour storage limit with dynamic maxStorage.
- Offline progress calculation on load.
- Exchange screen: BYTE → COIN, configurable rate, history log.
- Experience system, player level and basic achievements.
- Garage UI: BYTE balance, hourly income, storage bar, timer, exchange rate.
- Exchange navigation entry and `state.exchangeLog`.
- Farm screen for multi-PC management, `activePCId`, add-PC action.
- Roulette animation for case openings.

### Fixed
- Added `exchangeRate` to state (default 1000) and validated exchange amounts.
- Removed unused `collectCoins`.
