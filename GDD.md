# PC MINER: CASES & HARDWARE — Game Design Document

## 1. Concept

PC MINER is a browser-based incremental game about building, upgrading and managing mining PCs. Players earn BYTE, open cases for better hardware, and exchange BYTE for COIN. The interface follows an iOS-inspired “liquid glass” style.

## 2. Core loop

1. **Mine** – every installed component adds power; power produces BYTE over time.
2. **Collect** – claim stored BYTE from the Garage before storage fills up.
3. **Upgrade** – install better parts in the Workshop or find them in Cases.
4. **Exchange** – convert BYTE into COIN.
5. **Expand** – manage several PCs in the Farm and keep raising total power.

## 3. UI/UX style

- **Style**: iOS Liquid Glass — translucent cards, rounded corners, soft shadows.
- **Background**: `#f2f2f7` in light mode, `#000000` in dark mode (follows `prefers-color-scheme`).
- **Cards**: translucent surface, `16px` radius, `backdrop-filter: blur(20px)`.
- **Typography**: system font stack (SF Pro / Segoe UI / Roboto / Helvetica / Arial).
- **Interactions**: springy press feedback, fade-in screens, roulette case reveal, `prefers-reduced-motion` support.
- **Accessibility**: labelled inputs, `aria-current` on the active tab, `role="progressbar"` storage meter, no inline event handlers (delegated `data-action` clicks).

## 4. Sections

| Screen | Purpose |
|--------|---------|
| **Garage** | BYTE balance, hourly income, total power, storage bar, time-to-full, exchange rate, collect button, PC grid. |
| **Cases** | Loot boxes with visible contents and odds; ×1/×3/×5/×10 opening. |
| **Workshop** | Install inventory parts into the active PC per slot (CPU, GPU, motherboard, RAM, storage, PSU, case). |
| **Inventory** | All spare hardware with sell buttons. |
| **Exchange** | Convert BYTE → COIN, shows rate and exchange history. |
| **Farm** | All PCs, active-PC selection, build a new PC. |
| **Menu** | Level/EXP, achievements, exchange-rate setting, save, reset. |

## 5. Economy

### Currencies
- **₽ (money)** – purchase currency for cases and new PCs; earned by selling hardware.
- **BYTE** – mined currency, produced by installed components.
- **COIN** – exchange currency, obtained from BYTE.

### Mining
```
miningRate = totalPower × 0.1 BYTE/sec
totalPower = Σ power of every installed component on every PC
hourlyIncome = miningRate × 3600
```
PSUs, motherboards and cases have **0 power**; CPUs, GPUs, RAM and drives provide power.

### Storage
```
maxStorage = miningRate × 3600 × 6      // six hours of production
```
Storage fills in real time; when full, mining pauses until the player collects. Collecting moves all stored BYTE into the balance and resets storage. Reducing total power clamps stored BYTE to the new capacity.

### Offline progress
On load, elapsed real time since `lastUpdate` is applied:
```
earned = min(elapsedSeconds, timeToFull) × miningRate
timeToFull = maxStorage / miningRate
```
If storage filled while the player was away, `lastUpdate` is clamped to the moment it filled. No BYTE is granted beyond capacity.

### Exchange
- Default rate: `1000` BYTE = 1 COIN (`state.exchangeRate`, configurable in the Menu, minimum 1).
- COIN gained: `floor(amount / exchangeRate)`.
- Amount must be a positive integer and must not exceed the BYTE balance.
- Each exchange grants **10 EXP** and is recorded in `state.exchangeLog` (last 50 entries).

### Selling
Spare hardware can be sold for **50%** of its catalog price (`SELL_RATE`).

## 6. Progression

- **Experience**: +5 per opened case, +5 per installed component, +10 per exchange.
- **Level-up**: when `exp >= level × 1000`, the level increases and the requirement is subtracted. Multiple level-ups in one action are supported.
- **Achievements**:
  - *Первый майнинг* – collect any BYTE.
  - *1 000 BYTE* – hold at least 1 000 BYTE.
  - *Первая монета* – own at least 1 COIN.

## 7. Components & compatibility

- Slots: `cpu`, `gpu`, `mobo`, `ram`, `storage`, `psu`, `case`.
- CPU ↔ motherboard: CPU `compat.socket` must equal motherboard `compat.socket`.
- RAM ↔ motherboard: RAM `compat.type` (DDR3/DDR4) must equal motherboard `compat.ramType`.
- Installing a motherboard is rejected when the already-installed CPU or RAM is incompatible.
- Item power is summed per PC; a PC with no components produces nothing.

## 8. Cases

- Contents are weighted lists of catalog items; odds are displayed as percentages.
- Rewards are rolled before the animation and granted immediately, so reloading mid-spin cannot lose them.
- Duplicate clicks are blocked while an opening animation is running.

## 9. Balancing (current values)

| Item | Category | Power | Price (₽) | Rarity |
|------|----------|-------|-----------|--------|
| Basic CPU | cpu | 5 | 5 000 | gray |
| Basic GPU | gpu | 8 | 8 000 | gray |
| Basic Motherboard | mobo | 0 | 4 000 | gray |
| 4GB RAM | ram | 1 | 2 000 | gray |
| 256GB SSD | storage | 1 | 3 000 | gray |
| 300W PSU | psu | 0 | 3 500 | gray |
| Standard Black Case | case | 0 | 0 | gray |
| Mid CPU | cpu | 12 | 15 000 | blue |
| High GPU | gpu | 30 | 40 000 | purple |
| Mid Motherboard | mobo | 0 | 12 000 | blue |
| 8GB DDR4 RAM | ram | 2 | 6 000 | blue |
| 500GB NVMe SSD | storage | 2 | 8 000 | purple |
| Enthusiast PSU 750W | psu | 0 | 12 000 | yellow |
| Legendary Case | case | 0 | 100 000 | red |

Cases: Basic (3 000 ₽), CPU (5 000 ₽), GPU (8 000 ₽), Enthusiast (20 000 ₽), Premium (50 000 ₽).

## 10. Technical stack

- HTML5, CSS3 (custom properties, backdrop-filter, media queries) and vanilla ES6 JavaScript.
- `localStorage` persistence with schema validation and safe fallbacks.
- SVG icons for component artwork.
- Dependency-free Node test harness (`tests/validate.js`).
