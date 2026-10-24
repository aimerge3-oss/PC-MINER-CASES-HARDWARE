// ==========================================================================
// Game state, persistence and economy rules
// ==========================================================================

const SAVE_KEY = 'pcMinerSave';
const MINING_FACTOR = 0.1;      // BYTE per second per power point
const STORAGE_HOURS = 6;        // storage holds this many hours of production
const SELL_RATE = 0.5;          // items sell for this share of their price
const PC_BUILD_COST = 25000;    // cost of an additional PC in the Farm
const DEFAULT_EXCHANGE_RATE = 1000; // BYTE per 1 COIN
const MAX_EXCHANGE_LOG = 50;
const EXP_REWARDS = { caseOpen: 5, install: 5, exchange: 10 };

const state = {
    // Purchase currency (RUB)
    money: 0,
    // Mined currency
    bytes: 0,
    // Exchangeable prestige currency
    coins: 0,
    // BYTE waiting to be collected
    storage: 0,
    // Maximum storable BYTE (6 hours of current income)
    maxStorage: 0,
    // Mining rate in BYTE per second, summed over all computers
    miningRate: 0,
    exp: 0,
    level: 1,
    achievements: {},
    inventory: [],
    activePCId: 1,
    computers: [],
    lastUpdate: null,
    exchangeLog: [],
    exchangeRate: DEFAULT_EXCHANGE_RATE
};

function createStarterState() {
    const now = Date.now();
    const components = { cpu: 1, gpu: 2, mobo: 3, ram: 4, storage: 5, psu: 6, case: 7 };
    const starterPc = { id: 1, name: 'Starter PC', components: components, power: 0 };
    return {
        money: 50000,
        bytes: 0,
        coins: 0,
        storage: 0,
        maxStorage: 0,
        miningRate: 0,
        exp: 0,
        level: 1,
        achievements: {},
        // Everything in the starter kit is installed, so the inventory starts empty.
        inventory: [],
        activePCId: 1,
        computers: [starterPc],
        lastUpdate: now,
        exchangeLog: [],
        exchangeRate: DEFAULT_EXCHANGE_RATE
    };
}

// ---------- helpers ----------

function toNonNegativeNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function saveGame() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        return true;
    } catch (err) {
        // Storage can be unavailable (private mode) or full; the game keeps running.
        console.warn('Не удалось сохранить игру:', err);
        return false;
    }
}

function loadGame() {
    let saved = null;
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) saved = JSON.parse(raw);
    } catch (err) {
        console.warn('Сохранение повреждено, начинаем новую игру:', err);
        saved = null;
    }

    const source = saved && typeof saved === 'object' ? normalizeState(saved) : createStarterState();
    Object.keys(state).forEach(function (key) { delete state[key]; });
    Object.assign(state, source);

    updateMiningStats();
    if (saved) applyOfflineProgress();
    if (!state.lastUpdate) state.lastUpdate = Date.now();

    checkAchievements();
    saveGame();
    return state;
}

// Fills in missing / invalid fields so an old or hand-edited save cannot break the game.
function normalizeState(raw) {
    const defaults = createStarterState();
    const merged = Object.assign({}, defaults, raw);

    merged.money = toNonNegativeNumber(raw.money, defaults.money);
    merged.bytes = toNonNegativeNumber(raw.bytes, 0);
    merged.coins = toNonNegativeNumber(raw.coins, 0);
    merged.storage = toNonNegativeNumber(raw.storage, 0);
    merged.maxStorage = toNonNegativeNumber(raw.maxStorage, 0);
    merged.miningRate = toNonNegativeNumber(raw.miningRate, 0);
    merged.exp = toNonNegativeNumber(raw.exp, 0);
    merged.level = Math.max(1, Math.floor(toNonNegativeNumber(raw.level, 1)));
    merged.exchangeRate = toNonNegativeNumber(raw.exchangeRate, DEFAULT_EXCHANGE_RATE) || DEFAULT_EXCHANGE_RATE;
    merged.achievements = raw.achievements && typeof raw.achievements === 'object' ? raw.achievements : {};
    merged.exchangeLog = Array.isArray(raw.exchangeLog) ? raw.exchangeLog.slice(0, MAX_EXCHANGE_LOG) : [];
    merged.inventory = Array.isArray(raw.inventory) ? raw.inventory.filter(function (item) {
        return item && typeof item === 'object' && item.id !== undefined;
    }) : [];

    const computers = Array.isArray(raw.computers) ? raw.computers.filter(function (pc) {
        return pc && typeof pc === 'object' && Number.isFinite(Number(pc.id));
    }).map(function (pc) {
        return {
            id: Number(pc.id),
            name: typeof pc.name === 'string' && pc.name ? pc.name : 'PC ' + pc.id,
            components: pc.components && typeof pc.components === 'object' ? pc.components : {},
            power: 0
        };
    }) : [];

    merged.computers = computers.length ? computers : defaults.computers;
    const activeExists = merged.computers.some(function (pc) { return pc.id === Number(raw.activePCId); });
    merged.activePCId = activeExists ? Number(raw.activePCId) : merged.computers[0].id;
    merged.lastUpdate = Number.isFinite(Number(raw.lastUpdate)) ? Number(raw.lastUpdate) : Date.now();

    return merged;
}

// ---------- mining ----------

function calculatePower(pc) {
    if (!pc || !pc.components) return 0;
    let total = 0;
    Object.keys(pc.components).forEach(function (slot) {
        const item = getItemById(pc.components[slot]);
        if (item && Number.isFinite(item.power)) total += item.power;
    });
    return total;
}

function updateMiningStats() {
    if (!Array.isArray(state.computers)) state.computers = [];
    state.computers.forEach(function (pc) {
        pc.power = calculatePower(pc);
    });
    const totalPower = state.computers.reduce(function (sum, pc) { return sum + pc.power; }, 0);
    state.miningRate = totalPower * MINING_FACTOR;
    state.maxStorage = state.miningRate * 3600 * STORAGE_HOURS;
    // A downgrade must never leave more in storage than the new capacity.
    if (state.storage > state.maxStorage) state.storage = state.maxStorage;
    return { totalPower: totalPower, miningRate: state.miningRate, maxStorage: state.maxStorage };
}

function getTimeToFull() {
    if (state.miningRate <= 0 || state.maxStorage <= 0) return 0;
    if (state.storage >= state.maxStorage) return 0;
    return Math.ceil((state.maxStorage - state.storage) / state.miningRate);
}

function tickMining(seconds) {
    const dt = Number.isFinite(seconds) && seconds > 0 ? seconds : 1;
    // Always advance the timestamp: idle time at zero rate must not be credited later.
    state.lastUpdate = Date.now();
    if (state.miningRate <= 0) return 0;
    const spaceLeft = Math.max(0, state.maxStorage - state.storage);
    const gained = Math.min(spaceLeft, state.miningRate * dt);
    state.storage += gained;
    return gained;
}

function applyOfflineProgress() {
    const now = Date.now();
    const elapsedSec = Math.floor((now - state.lastUpdate) / 1000);
    if (!Number.isFinite(elapsedSec) || elapsedSec <= 0) {
        state.lastUpdate = now;
        return 0;
    }
    updateMiningStats();
    const spaceLeft = Math.max(0, state.maxStorage - state.storage);
    if (state.miningRate <= 0 || spaceLeft <= 0) {
        // Nothing can be produced; start counting again from now.
        state.lastUpdate = now;
        return 0;
    }
    const possibleAdd = elapsedSec * state.miningRate;
    const actualAdd = Math.min(possibleAdd, spaceLeft);
    state.storage += actualAdd;
    if (actualAdd < possibleAdd) {
        // Storage filled up before the player returned: keep the timestamp at that moment.
        const secsUntilFull = Math.floor(spaceLeft / state.miningRate);
        state.lastUpdate = state.lastUpdate + secsUntilFull * 1000;
    } else {
        state.lastUpdate = now;
    }
    return actualAdd;
}

function collectBytes() {
    if (state.storage <= 0) {
        notify('Хранилище пусто');
        return 0;
    }
    const collected = state.storage;
    state.bytes += collected;
    state.storage = 0;
    state.lastUpdate = Date.now();
    checkAchievements();
    saveGame();
    return collected;
}

// ---------- exchange ----------

function exchangeBytesToCoins(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
        notify('Введите корректное целое количество BYTE');
        return null;
    }
    if (value > state.bytes) {
        notify('Недостаточно BYTE для обмена');
        return null;
    }
    const coinsGained = Math.floor(value / state.exchangeRate);
    if (coinsGained <= 0) {
        notify('Слишком мало BYTE для обмена: нужно минимум ' + state.exchangeRate);
        return null;
    }
    if (!Array.isArray(state.exchangeLog)) state.exchangeLog = [];
    state.exchangeLog.unshift({ time: Date.now(), bytes: value, coins: coinsGained });
    state.exchangeLog = state.exchangeLog.slice(0, MAX_EXCHANGE_LOG);
    state.bytes -= value;
    state.coins += coinsGained;
    addExp(EXP_REWARDS.exchange);
    saveGame();
    return coinsGained;
}

// ---------- progression ----------

function expNeeded(level) {
    return Math.max(1, Math.floor(level)) * 1000;
}

function addExp(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return 0;
    state.exp += value;
    let levelsGained = 0;
    while (state.exp >= expNeeded(state.level)) {
        state.exp -= expNeeded(state.level);
        state.level += 1;
        levelsGained += 1;
    }
    if (levelsGained > 0) {
        notify('Поздравляем! Вы достигли уровня ' + state.level);
    }
    checkAchievements();
    saveGame();
    return levelsGained;
}

const ACHIEVEMENTS = [
    { id: 'firstMine', title: 'Первый майнинг', test: function () { return state.bytes > 0; } },
    { id: 'firstThousand', title: '1 000 BYTE', test: function () { return state.bytes >= 1000; } },
    { id: 'firstCoin', title: 'Первая монета', test: function () { return state.coins >= 1; } }
];

function checkAchievements() {
    if (!state.achievements || typeof state.achievements !== 'object') state.achievements = {};
    const unlocked = [];
    ACHIEVEMENTS.forEach(function (achievement) {
        if (!state.achievements[achievement.id] && achievement.test()) {
            state.achievements[achievement.id] = true;
            unlocked.push(achievement.id);
            notify('Достижение: ' + achievement.title + '!');
        }
    });
    return unlocked;
}

function notify(message) {
    if (typeof alert === 'function') alert(message);
}
