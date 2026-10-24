# Progress - PC MINER: CASES & HARDWARE

## Stage 1: Core & UI (Current)
- [x] Project architecture setup
- [x] Initial documentation (GDD, PROGRESS, CHANGELOG, README)
- [x] Starter conditions (money, components) initialized
- [x] Item catalog created (items.js)
- [x] Cases catalog created (cases.js)
- [x] Cases UI and opening logic with multi‑open
- [x] Inventory UI with sell functionality
- [x] Workshop UI for installing components
- [x] Basic compatibility checks
- [x] Updated navigation to include new screens
- [x] Full mining system with BYTE, storage limit (6 h), offline accrual.
- [x] Exchange screen (BYTE ↔ COIN) with history.
- [x] Experience, levels, and basic achievements.
- [x] UI updates for garage (BYTE balance, hourly income, storage bar, timer).
- [x] Workshop now triggers mining stat recalculation.
- [x] Added state.exchangeLog and related UI.

- Implemented multi‑PC management: added Farm screen, `state.activePCId`, ability to add PCs, select active PC for workshop, and all PCs contribute to total mining rate.
- Replaced alert-based case opening with animated roulette overlay, pre‑determined results, and prevented duplicate charges.


- [x] P1 – Exchange BYTE/COIN fixed (exchangeRate defined, collectCoins removed)

