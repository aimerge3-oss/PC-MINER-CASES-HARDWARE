# Changelog - PC MINER: CASES & HARDWARE

## [2026-10-24] (Stage 3)
### Added
- BYTE mining currency with per‑second income based on component power.
- Unified 6‑hour storage limit, dynamic maxStorage recalculation.
- Offline progress calculation on load.
- Exchange screen: convert BYTE to COIN, configurable rate, history log.
- Experience system and player level, basic achievements.
- Updated garage UI to show BYTE balance, hourly income, storage bar, timer, and exchange rate.
- Navigation entry for Exchange.
- Workshop now updates global mining stats after installations.
- Added state.exchangeLog for exchange history.
- Minor UI refinements and bug fixes.
- Added Farm screen for multi‑PC management, `activePCId`, add PC button, and UI to select active PC.
- Replaced alerts with roulette animation for case openings; added overlay UI and result handling.


- Fixed exchange handling: added `exchangeRate` to state (default 1000) and validated amounts/balance.
- Deleted unused `collectCoins` function.

