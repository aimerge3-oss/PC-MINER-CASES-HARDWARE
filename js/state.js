// Updated state with BYTE and COIN currencies, mining stats, offline progress
const state = {
    // Primary currency (RUB) for purchases
    money: 0,
    // Mining currency
    bytes: 0,
    // Exchangeable currency
    coins: 0,
    // Storage for mined bytes
    storage: 0,
    // Max storage (6 hours worth of current total rate)
    maxStorage: 0,
    // Total mining rate in bytes per second (sum of all computers)
    miningRate: 0,
    // Experience and level
    exp: 0,
    level: 1,
    // Achievements flags
    achievements: {},
    // Inventory of items not currently installed
    inventory: [],
    activePCId: 1,
    // List of computers (including starter)
    computers: [
        { id: 1, name: "Starter PC", components: {}, power: 0 }
    ],
    // Timestamp of last mining update (ms since epoch)
    lastUpdate: null,
    // History of BYTE↔COIN exchanges
    exchangeLog: [],
    exchangeRate: 1000,

};

function saveGame() {
    localStorage.setItem('pcMinerSave', JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem('pcMinerSave');
    if (saved) {
        Object.assign(state, JSON.parse(saved));
        // Ensure timestamp exists
        if (!state.lastUpdate) state.lastUpdate = Date.now();
        applyOfflineProgress();
    } else {
        // First launch – initialize starter conditions
        state.money = 50000;
        state.bytes = 0;
        state.coins = 0;
        state.lastUpdate = Date.now();
        // Add starter components to inventory and install on starter PC
        const starterIds = [1,2,3,4,5,6,7]; // IDs from items catalog
        state.inventory = starterIds.map(id => ({ ...getItemById(id), owned: true }));
        const pc = state.computers[0];
        pc.components = {
            cpu: 1,
            gpu: 2,
            mobo: 3,
            ram: 4,
            storage: 5,
            psu: 6,
            case: 7
        };
        // Remove installed items from inventory (they become part of PC)
        state.inventory = state.inventory.filter(item => !Object.values(pc.components).includes(item.id));
        // Initial power & mining stats
        pc.power = calculatePower(pc);
        updateMiningStats();
        saveGame();
    }
}

function applyOfflineProgress() {
    const now = Date.now();
    const elapsedSec = Math.floor((now - state.lastUpdate) / 1000);
    if (elapsedSec <= 0) {
        state.lastUpdate = now;
        return;
    }
    // Ensure current rates are correct
    updateMiningStats();
    const possibleAdd = elapsedSec * state.miningRate;
    const spaceLeft = state.maxStorage - state.storage;
    const actualAdd = Math.min(possibleAdd, spaceLeft);
    state.storage += actualAdd;
    // Update lastUpdate: if storage filled before full elapsed time, clamp timestamp
    if (actualAdd < possibleAdd) {
        const secsUntilFull = Math.floor(spaceLeft / state.miningRate);
        state.lastUpdate = state.lastUpdate + secsUntilFull * 1000;
    } else {
        state.lastUpdate = now;
    }
    saveGame();
}

function calculatePower(pc) {
    // Sum power of installed components (fallback 0)
    let total = 0;
    for (const slot in pc.components) {
        const item = getItemById(pc.components[slot]);
        if (item && item.power) total += item.power;
    }
    return total || 1;
}

function updateMiningStats() {
    // Recalculate each computer's power based on its components
    state.computers.forEach(pc => {
        pc.power = calculatePower(pc);
    });
    const totalPower = state.computers.reduce((sum, pc) => sum + pc.power, 0);
    const factor = 0.1; // each power point gives 0.1 BYTE per second
    state.miningRate = totalPower * factor;
    // Max storage = 6 hours worth of current rate
    state.maxStorage = state.miningRate * 3600 * 6;
}

function collectBytes() {
    state.bytes += state.storage;
    state.storage = 0;
    // Recalculate max storage after collection (rate may have changed)
    state.maxStorage = state.miningRate * 3600 * 6;
    state.lastUpdate = Date.now();
    saveGame();
    if (document.getElementById('byteBalance')) {
        document.getElementById('byteBalance').innerText = state.bytes.toFixed(0);
    }
    if (document.getElementById('storageBar')) {
        document.getElementById('storageBar').innerText = `${state.storage.toFixed(0)} / ${state.maxStorage.toFixed(0)}`;
    }
}

function exchangeBytesToCoins(amount) {
    if (amount > state.bytes) {
        alert('Недостаточно BYTE для обмена');
        return;
    }
    const coinsGained = Math.floor(amount / state.exchangeRate);
    if (coinsGained <= 0) {
        alert('Слишком мало BYTE для обмена');
        return;
    }
    // Record exchange in history
    if (!state.exchangeLog) state.exchangeLog = [];
    state.exchangeLog.unshift({ time: Date.now(), bytes: amount, coins: coinsGained });
    state.bytes -= amount;
    state.coins += coinsGained;
    addExp(10);
    saveGame();
    nav.render();

}

function addExp(amount) {
    state.exp += amount;
    const needed = state.level * 1000;
    if (state.exp >= needed) {
        state.level += 1;
        state.exp -= needed;
        alert(`Поздравляем! Вы достигли уровня ${state.level}`);
    }
    // Simple achievements
    if (!state.achievements.firstMine && state.bytes > 0) {
        state.achievements.firstMine = true;
        alert('Достижение: Первый майнинг!');
    }
    if (!state.achievements.firstThousand && state.bytes >= 1000) {
        state.achievements.firstThousand = true;
        alert('Достижение: 1 000 BYTE!');
    }
    saveGame();
}

