# PC MINER: CASES & HARDWARE

A browser-based PC building and mining simulator built with vanilla HTML5, CSS3 and ES6 JavaScript — no frameworks, no build step, no external dependencies.

## Features

- **Garage** – live BYTE balance, hourly income, total power, storage meter and exchange rate.
- **Cases** – weighted loot boxes with a roulette animation and ×1 / ×3 / ×5 / ×10 opening.
- **Workshop** – install inventory parts into the active PC, with socket and memory compatibility checks.
- **Inventory** – inspect and sell spare hardware (50% of catalog price).
- **Exchange** – convert BYTE into COIN at a configurable rate, with history.
- **Farm** – manage multiple PCs (all of them produce income) and build new ones.
- **Menu** – level, experience, achievements, exchange-rate setting, manual save and progress reset.
- **Progression** – experience and levels, level-up notifications, achievements, offline earnings.

## Mining & economy rules

| Rule | Value |
|------|-------|
| Mining rate | `totalPower × 0.1` BYTE/sec |
| Storage capacity | `miningRate × 3600 × 6` BYTE (6 hours) |
| Offline earnings | elapsed time × rate, capped at storage capacity |
| Exchange rate | `1000` BYTE = 1 COIN (default, configurable in the Menu) |
| Item sale price | 50% of catalog price |
| New PC cost | 25 000 ₽ |
| Experience | 5 EXP per case, 5 EXP per installation, 10 EXP per exchange |
| Level-up | `exp >= level × 1000` |

Progress is stored in `localStorage` under the `pcMinerSave` key and is validated on load, so corrupted or outdated saves fall back to safe defaults instead of breaking the game.

## How to run

Open `index.html` in any modern browser. No server or installation is required.

## How to test

```bash
npm test              # 44 dependency-free logic/static checks (no install needed)
npm run test:browser  # 20 browser tests in jsdom (npm install required)
npm run test:all      # both suites
```

- `tests/validate.js` — asset/script-order integrity, relative deploy paths,
  catalog and case definitions, economy maths, storage/offline caps, exchange
  validation, progression, compatibility, case opening, persistence migration,
  every screen rendering, and a 3 000-tick invariant simulation.
- `tests/browser.test.js` — serves the real site over HTTP and drives it in
  jsdom: boot, navigation, collect, exchange, case reveal, selling, workshop
  installs, farm, menu, reload with offline earnings, reset, markup checks and
  an axe-core accessibility audit.

## Project structure

```
index.html          # shell, navigation and script/style order
css/
  style.css         # theme tokens (light/dark), layout, navigation, forms
  components.css    # cards, buttons, modal
  animations.css    # fade/roulette animations, reduced-motion support
  garage.css        # garage, farm, workshop, inventory and case layouts
js/
  data/items.js     # item catalog (window.ITEMS, getItemById)
  data/cases.js     # case catalog with weighted contents
  state.js          # state, save/load, mining, exchange, progression
  navigation.js     # bottom-navigation controller
  ui.js             # screen renderers, actions and HUD updates
  main.js           # entry point: boot, game loop, autosave
assets/icons/       # SVG component icons
tests/validate.js   # dependency-free logic/static checks
tests/browser.test.js # jsdom browser tests (dev only)
```

## Documentation

- [GDD.md](GDD.md) – game design document
- [PROGRESS.md](PROGRESS.md) – implementation status
- [CHANGELOG.md](CHANGELOG.md) – change history
