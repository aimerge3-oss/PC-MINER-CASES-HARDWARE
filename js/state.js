// ==========================================================================
// Game state, persistence and economy rules
// ==========================================================================

const SAVE_KEY = 'pcMinerSave';
const MINING_FACTOR = 0.1;
const STORAGE_HOURS = 6;
const SELL_RATE = 0.5;
const PC_BUILD_COST = 25000;
const DEFAULT_EXCHANGE_RATE = 1000;
const RATE_MIN = 800;
const RATE_MAX = 1200;
const RATE_STEP = 0.03;
const COIN_TO_RUB = 50;
const MAX_EXCHANGE_LOG = 50;
const EXP_REWARDS = { caseOpen: 5, install: 5, exchange: 10 };

const state = {
    money: 0, bytes: 0, coins: 0, storage: 0, maxStorage: 0, miningRate: 0,
    exp: 0, level: 1, achievements: {}, inventory: [], activePCId: 1, computers: [],
    lastUpdate: null, exchangeLog: [], exchangeRate: DEFAULT_EXCHANGE_RATE,
    casesOpened: 0, totalSpent: 0, quests: { daily: {}, weekly: {} }, questDay: null, questWeek: null
};

function createStarterState() {
    const now = Date.now();
    const components = { cpu: 1, gpu: 2, mobo: 3, ram: 4, storage: 5, psu: 6, case: 7 };
    return {
        money: 50000, bytes: 0, coins: 0, storage: 0, maxStorage: 0, miningRate: 0,
        exp: 0, level: 1, achievements: {}, inventory: [], activePCId: 1,
        computers: [{ id: 1, name: 'Starter PC', components: components, power: 0 }],
        lastUpdate: now, exchangeLog: [], exchangeRate: DEFAULT_EXCHANGE_RATE,
        casesOpened: 0, totalSpent: 0, quests: { daily: {}, weekly: {} }, questDay: null, questWeek: null
    };
}

function toNonNegativeNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function saveGame() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; }
    catch (err) { console.warn('Не удалось сохранить игру:', err); return false; }
}

function loadGame() {
    let saved = null;
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) saved = JSON.parse(raw); }
    catch (err) { console.warn('Сохранение повреждено, начинаем новую игру:', err); saved = null; }
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
    merged.casesOpened = Math.floor(toNonNegativeNumber(raw.casesOpened, 0));
    merged.totalSpent = toNonNegativeNumber(raw.totalSpent, 0);
    merged.quests = raw.quests && typeof raw.quests === 'object'
        ? { daily: raw.quests.daily || {}, weekly: raw.quests.weekly || {} }
        : { daily: {}, weekly: {} };
    merged.questDay = raw.questDay || null;
    merged.questWeek = raw.questWeek || null;
    return merged;
}

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
    state.computers.forEach(function (pc) { pc.power = calculatePower(pc); });
    const totalPower = state.computers.reduce(function (sum, pc) { return sum + pc.power; }, 0);
    state.miningRate = totalPower * MINING_FACTOR;
    state.maxStorage = state.miningRate * 3600 * STORAGE_HOURS;
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
    if (!Number.isFinite(elapsedSec) || elapsedSec <= 0) { state.lastUpdate = now; return 0; }
    updateMiningStats();
    const spaceLeft = Math.max(0, state.maxStorage - state.storage);
    if (state.miningRate <= 0 || spaceLeft <= 0) { state.lastUpdate = now; return 0; }
    const possibleAdd = elapsedSec * state.miningRate;
    const actualAdd = Math.min(possibleAdd, spaceLeft);
    state.storage += actualAdd;
    if (actualAdd < possibleAdd) {
        const secsUntilFull = Math.floor(spaceLeft / state.miningRate);
        state.lastUpdate = state.lastUpdate + secsUntilFull * 1000;
    } else { state.lastUpdate = now; }
    return actualAdd;
}

function collectBytes() {
    if (state.storage <= 0) { notify('Хранилище пусто'); return 0; }
    const collected = state.storage;
    state.bytes += collected;
    state.storage = 0;
    state.lastUpdate = Date.now();
    if (typeof bumpQuest === 'function') bumpQuest('collect', collected);
    checkAchievements();
    saveGame();
    return collected;
}

function exchangeBytesToCoins(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
        notify('Введите корректное целое количество BYTE'); return null;
    }
    if (value > state.bytes) { notify('Недостаточно BYTE для обмена'); return null; }
    const coinsGained = Math.floor(value / state.exchangeRate);
    if (coinsGained <= 0) {
        notify('Слишком мало BYTE для обмена: нужно минимум ' + state.exchangeRate); return null;
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

function fluctuateExchangeRate() {
    const direction = Math.random() < 0.5 ? -1 : 1;
    const step = RATE_STEP * (0.5 + Math.random());
    let next = Math.round(state.exchangeRate * (1 + direction * step));
    if (next < RATE_MIN) next = RATE_MIN;
    if (next > RATE_MAX) next = RATE_MAX;
    if (next === state.exchangeRate) next = Math.min(RATE_MAX, Math.max(RATE_MIN, next + direction));
    state.exchangeRate = next;
    return next;
}

function exchangeCoinsToMoney(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
        notify('Введите корректное целое количество COIN'); return null;
    }
    if (value > state.coins) { notify('Недостаточно COIN'); return null; }
    const rub = value * COIN_TO_RUB;
    state.coins -= value;
    state.money += rub;
    if (!Array.isArray(state.exchangeLog)) state.exchangeLog = [];
    state.exchangeLog.unshift({ time: Date.now(), coins: value, rub: rub, type: 'coin-to-rub' });
    state.exchangeLog = state.exchangeLog.slice(0, MAX_EXCHANGE_LOG);
    saveGame();
    return rub;
}

function expNeeded(level) { return Math.max(1, Math.floor(level)) * 1000; }

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
    if (levelsGained > 0) notify('Поздравляем! Вы достигли уровня ' + state.level);
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

function dayKey(ts) {
    const d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function weekKey(ts) {
    const d = new Date(ts || Date.now());
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + week;
}

const DAILY_QUESTS = [
    { id: 'open3', title: 'Открыть 3 кейса', target: 3, metric: 'cases', rewardExp: 30, rewardRub: 500 },
    { id: 'collect1k', title: 'Собрать 1 000 BYTE', target: 1000, metric: 'collect', rewardExp: 25, rewardRub: 300 },
    { id: 'install1', title: 'Установить деталь', target: 1, metric: 'install', rewardExp: 20, rewardRub: 200 }
];
const WEEKLY_QUESTS = [
    { id: 'open20', title: 'Открыть 20 кейсов', target: 20, metric: 'cases', rewardExp: 150, rewardRub: 3000 },
    { id: 'mine50k', title: 'Намайнить 50 000 BYTE', target: 50000, metric: 'collect', rewardExp: 120, rewardRub: 2500 },
    { id: 'build2', title: 'Собрать 2 ПК', target: 2, metric: 'pcs', rewardExp: 100, rewardRub: 2000 }
];

function ensureQuests() {
    const today = dayKey();
    const week = weekKey();
    if (!state.quests || typeof state.quests !== 'object') state.quests = { daily: {}, weekly: {} };
    if (state.questDay !== today) {
        state.questDay = today;
        state.quests.daily = {};
        DAILY_QUESTS.forEach(function (q) { state.quests.daily[q.id] = { progress: 0, claimed: false }; });
    }
    if (state.questWeek !== week) {
        state.questWeek = week;
        state.quests.weekly = {};
        WEEKLY_QUESTS.forEach(function (q) { state.quests.weekly[q.id] = { progress: 0, claimed: false }; });
    }
}

function bumpQuest(metric, amount) {
    ensureQuests();
    const add = Number(amount) || 1;
    function bump(list, bag) {
        list.forEach(function (q) {
            if (q.metric !== metric) return;
            const entry = bag[q.id];
            if (!entry || entry.claimed) return;
            entry.progress = Math.min(q.target, (entry.progress || 0) + add);
        });
    }
    bump(DAILY_QUESTS, state.quests.daily);
    bump(WEEKLY_QUESTS, state.quests.weekly);
}

function claimQuest(scope, questId) {
    ensureQuests();
    const list = scope === 'weekly' ? WEEKLY_QUESTS : DAILY_QUESTS;
    const bag = scope === 'weekly' ? state.quests.weekly : state.quests.daily;
    const def = list.find(function (q) { return q.id === questId; });
    const entry = bag[questId];
    if (!def || !entry || entry.claimed) return false;
    if ((entry.progress || 0) < def.target) { notify('Задание ещё не выполнено'); return false; }
    entry.claimed = true;
    addExp(def.rewardExp);
    state.money += def.rewardRub;
    notify('+' + def.rewardExp + ' EXP · +' + def.rewardRub + ' ₽');
    saveGame();
    return true;
}

function collectionCount() {
    const ids = new Set();
    (state.inventory || []).forEach(function (item) { if (item && item.id != null) ids.add(item.id); });
    (state.computers || []).forEach(function (pc) {
        if (!pc.components) return;
        Object.keys(pc.components).forEach(function (slot) {
            const id = pc.components[slot];
            if (id != null) ids.add(id);
        });
    });
    return ids.size;
}

function collectionValue() {
    let total = 0;
    (state.inventory || []).forEach(function (item) { total += Number(item && item.price) || 0; });
    (state.computers || []).forEach(function (pc) {
        if (!pc.components) return;
        Object.keys(pc.components).forEach(function (slot) {
            const item = getItemById(pc.components[slot]);
            if (item) total += Number(item.price) || 0;
        });
    });
    return total;
}

function notify(message) {
    if (typeof alert === 'function') alert(message);
}
