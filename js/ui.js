// ========== HELPERS ==========
function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function formatNumber(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    return Math.round(num).toLocaleString('ru-RU');
}
function formatDuration(totalSeconds) {
    const secs = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    if (secs <= 0) return '—';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const rest = secs % 60;
    return hrs + 'ч ' + mins + 'м ' + rest + 'с';
}
function formatTimeToFull() {
    if (state.miningRate <= 0 || state.maxStorage <= 0) return '—';
    if (state.storage >= state.maxStorage) return 'хранилище заполнено';
    return formatDuration(getTimeToFull());
}
function rarityColor(rarity) {
    const map = { gray: '#888', blue: '#007aff', purple: '#a020f0', yellow: '#ffd700', red: '#ff3b30', black: '#000' };
    return map[rarity] || map.gray;
}
function getActivePC() {
    if (!Array.isArray(state.computers) || state.computers.length === 0) return null;
    return state.computers.find(function (pc) { return pc.id === state.activePCId; }) || state.computers[0];
}
function totalPower() {
    if (!Array.isArray(state.computers)) return 0;
    return state.computers.reduce(function (sum, pc) { return sum + (pc.power || 0); }, 0);
}

function renderGarage() {
    const container = createEl('div', 'card fade-in');
    const power = totalPower();
    const fillPercent = state.maxStorage > 0 ? Math.min(100, (state.storage / state.maxStorage) * 100) : 0;
    container.innerHTML = `
        <h2>Доход майнинга</h2>
        <p>Деньги: <strong><span id="moneyBalance">${formatNumber(state.money)}</span> ₽</strong></p>
        <p>Баланс: <strong><span id="byteBalance">${formatNumber(state.bytes)}</span> BYTE</strong></p>
        <p>Монеты: <strong>${formatNumber(state.coins)} COIN</strong> · Уровень ${state.level} (${formatNumber(state.exp)} / ${formatNumber(expNeeded(state.level))} EXP)</p>
        <p>Доход в час: <span id="hourlyIncome">${(state.miningRate * 3600).toFixed(2)}</span> BYTE</p>
        <p>Текущая мощность: <span id="totalPower">${power}</span></p>
        <p>Хранилище: <span id="storageText">${formatNumber(state.storage)} / ${formatNumber(state.maxStorage)}</span></p>
        <div class="storage-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${fillPercent.toFixed(0)}" aria-label="Заполнение хранилища">
            <div class="storage-fill" id="storageFill"></div>
        </div>
        <p>Время до заполнения: <span id="timeToFull">${formatTimeToFull()}</span></p>
        <button type="button" class="button" data-action="collect">Забрать</button>
        <p>Курс BYTE→COIN: ${state.exchangeRate} BYTE = 1 COIN</p>
    `;
    return container;
}
function renderPCGrid() {
    const grid = createEl('div', 'pc-grid');
    state.computers.forEach(function (pc) {
        const card = createEl('div', 'pc-card' + (pc.id === state.activePCId ? ' active' : ''));
        const caseId = pc.components && pc.components.case;
        const caseItem = caseId ? getItemById(caseId) : null;
        const img = document.createElement('img');
        img.src = caseItem ? caseItem.image : 'assets/icons/case.svg';
        img.alt = caseItem ? caseItem.name : 'Case';
        card.appendChild(img);
        card.appendChild(createEl('div', 'pc-name', pc.name));
        card.appendChild(createEl('div', 'pc-power', 'Мощность: ' + pc.power));
        grid.appendChild(card);
    });
    return grid;
}

let selectedCaseId = 1;
let selectedOpenCount = 1;
let caseOpening = false;
function getCasePool(caseDef) {
    if (!caseDef || !Array.isArray(caseDef.contents)) return [];
    return caseDef.contents.map(function (entry) {
        return { item: getItemById(entry.itemId), weight: Math.max(0, Number(entry.weight) || 0) };
    }).filter(function (entry) { return entry.item && entry.weight > 0; });
}
function rollCaseItem(caseDef) {
    const pool = getCasePool(caseDef);
    if (pool.length === 0) return null;
    const weightSum = pool.reduce(function (sum, entry) { return sum + entry.weight; }, 0);
    let roll = Math.random() * weightSum;
    for (let i = 0; i < pool.length; i++) {
        roll -= pool[i].weight;
        if (roll < 0) return pool[i].item;
    }
    return pool[pool.length - 1].item;
}
function getSelectedCase() {
    return CASES.find(function (c) { return c.id === selectedCaseId; }) || CASES[0];
}
function renderCases() {
    const container = createEl('div', 'card fade-in cases-screen');
    const caseDef = getSelectedCase();
    const picker = createEl('div', 'case-picker');
    CASES.forEach(function (c) {
        const chip = createEl('button', 'case-chip' + (c.id === selectedCaseId ? ' active' : ''), c.name);
        chip.type = 'button';
        chip.setAttribute('data-action', 'select-case');
        chip.setAttribute('data-case-id', String(c.id));
        picker.appendChild(chip);
    });
    container.appendChild(picker);
    const pool = getCasePool(caseDef);
    const weightSum = pool.reduce(function (sum, entry) { return sum + entry.weight; }, 0) || 1;
    const odds = createEl('div', 'case-odds');
    odds.appendChild(createEl('div', 'case-odds-title', caseDef.name + ' · ' + formatNumber(caseDef.price) + ' ₽'));
    const bars = createEl('div', 'case-odds-bars');
    const byRarity = {};
    pool.forEach(function (entry) {
        const r = entry.item.rarity || 'gray';
        byRarity[r] = (byRarity[r] || 0) + entry.weight;
    });
    ['gray', 'blue', 'purple', 'yellow', 'red'].forEach(function (r) {
        if (!byRarity[r]) return;
        const pct = ((byRarity[r] / weightSum) * 100).toFixed(0);
        const row = createEl('div', 'odds-row');
        row.appendChild(createEl('span', 'odds-dot rarity-' + r));
        row.appendChild(createEl('span', '', pct + '%'));
        bars.appendChild(row);
    });
    odds.appendChild(bars);
    const details = document.createElement('details');
    details.className = 'case-details';
    const sum = document.createElement('summary');
    sum.textContent = 'Содержимое';
    details.appendChild(sum);
    const ul = document.createElement('ul');
    pool.forEach(function (entry) {
        const li = document.createElement('li');
        li.textContent = entry.item.name + ' — ' + ((entry.weight / weightSum) * 100).toFixed(1) + '%';
        ul.appendChild(li);
    });
    details.appendChild(ul);
    odds.appendChild(details);
    container.appendChild(odds);
    const preview = createEl('div', 'case-preview-grid');
    pool.slice(0, 10).forEach(function (entry) {
        const cell = createEl('div', 'loot-cell rarity-bg-' + (entry.item.rarity || 'gray'));
        const img = document.createElement('img');
        img.src = entry.item.image;
        img.alt = entry.item.name;
        cell.appendChild(img);
        cell.appendChild(createEl('span', 'loot-name', entry.item.name));
        preview.appendChild(cell);
    });
    container.appendChild(preview);
    const qty = createEl('div', 'case-qty');
    [1, 3, 5, 10].forEach(function (n) {
        const btn = createEl('button', 'qty-btn' + (n === selectedOpenCount ? ' active' : ''), '×' + n);
        btn.type = 'button';
        btn.setAttribute('data-action', 'select-count');
        btn.setAttribute('data-count', String(n));
        qty.appendChild(btn);
    });
    container.appendChild(qty);
    const totalCost = caseDef.price * selectedOpenCount;
    const openBtn = createEl('button', 'button case-open-btn', 'Открыть ×' + selectedOpenCount + ' · ' + formatNumber(totalCost) + ' ₽');
    openBtn.type = 'button';
    openBtn.disabled = state.money < totalCost || caseOpening;
    openBtn.setAttribute('data-action', 'open-case');
    openBtn.setAttribute('data-case-id', String(caseDef.id));
    openBtn.setAttribute('data-count', String(selectedOpenCount));
    container.appendChild(openBtn);
    return container;
}
function openCase(caseId, count) {
    if (caseOpening) return;
    const caseDef = CASES.find(function (c) { return c.id === caseId; });
    if (!caseDef) return;
    const amount = Math.max(1, Math.floor(Number(count) || 1));
    const totalCost = caseDef.price * amount;
    if (state.money < totalCost) { notify('Недостаточно средств'); return; }
    const results = [];
    for (let i = 0; i < amount; i++) {
        const item = rollCaseItem(caseDef);
        if (item) results.push(item);
    }
    if (results.length !== amount) { notify('Кейс пуст'); return; }
    state.money -= caseDef.price * results.length;
    results.forEach(function (item) { state.inventory.push(Object.assign({}, item, { owned: true })); });
    addExp(EXP_REWARDS.caseOpen * results.length);
    caseOpening = true;
    saveGame();
    showLootGrid(results);
}
function showLootGrid(results) {
    const overlay = createEl('div', 'modal-overlay');
    const modal = createEl('div', 'modal-content loot-modal');
    modal.appendChild(createEl('h3', '', 'Получено: ' + results.length));
    const grid = createEl('div', 'loot-result-grid');
    results.forEach(function () {
        const cell = createEl('div', 'loot-cell loot-empty');
        cell.innerHTML = '<span class="loot-q">?</span>';
        grid.appendChild(cell);
    });
    modal.appendChild(grid);
    const closeBtn = createEl('button', 'button', 'Забрать');
    closeBtn.type = 'button';
    closeBtn.disabled = true;
    closeBtn.addEventListener('click', function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        caseOpening = false;
        saveGame();
        nav.render();
    });
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    let i = 0;
    function revealNext() {
        if (i >= results.length) { closeBtn.disabled = false; caseOpening = false; return; }
        const item = results[i];
        const cell = grid.children[i];
        cell.className = 'loot-cell rarity-bg-' + (item.rarity || 'gray') + ' loot-reveal';
        cell.innerHTML = '';
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;
        cell.appendChild(img);
        cell.appendChild(createEl('span', 'loot-name', item.name));
        i += 1;
        setTimeout(revealNext, 280);
    }
    setTimeout(revealNext, 200);
}

function getSellPrice(item) { return Math.floor((Number(item.price) || 0) * SELL_RATE); }
function renderInventory() {
    const container = createEl('div', 'card fade-in');
    container.appendChild(createEl('h2', '', 'Инвентарь'));
    container.appendChild(createEl('p', '', 'Баланс: ' + formatNumber(state.money) + ' ₽'));
    if (!Array.isArray(state.inventory) || state.inventory.length === 0) {
        container.appendChild(createEl('p', '', 'Инвентарь пуст.'));
        return container;
    }
    const list = createEl('div', 'inventory-list');
    state.inventory.forEach(function (item) {
        const row = createEl('div', 'inventory-item');
        row.style.borderColor = rarityColor(item.rarity);
        const img = document.createElement('img');
        img.src = item.image || 'assets/icons/case.svg';
        img.alt = item.name;
        row.appendChild(img);
        const info = createEl('div', 'inventory-info');
        info.appendChild(createEl('strong', '', item.name));
        info.appendChild(createEl('span', 'hint', item.rarity + ' · мощность ' + (item.power || 0)));
        row.appendChild(info);
        const sellBtn = createEl('button', 'button', 'Продать за ' + formatNumber(getSellPrice(item)) + ' ₽');
        sellBtn.type = 'button';
        sellBtn.setAttribute('data-action', 'sell-item');
        sellBtn.setAttribute('data-index', String(state.inventory.indexOf(item)));
        row.appendChild(sellBtn);
        list.appendChild(row);
    });
    container.appendChild(list);
    return container;
}
function sellItem(invIndex) {
    const item = state.inventory[invIndex];
    if (!item) return;
    state.money += getSellPrice(item);
    state.inventory.splice(invIndex, 1);
    saveGame();
    nav.render();
}

const PC_SLOTS = ['cpu', 'gpu', 'mobo', 'ram', 'storage', 'psu', 'case'];
function checkCompatibility(pc, slot, item) {
    if (!pc || !item) return 'Некорректный предмет';
    const cpu = getItemById(pc.components.cpu);
    const mobo = getItemById(pc.components.mobo);
    const ram = getItemById(pc.components.ram);
    const itemCompat = item.compat || {};
    const moboCompat = (mobo && mobo.compat) || {};
    if (slot === 'cpu' && mobo && moboCompat.socket && itemCompat.socket && moboCompat.socket !== itemCompat.socket) return 'Несовместимый сокет процессора и материнской платы';
    if (slot === 'ram' && mobo && moboCompat.ramType && itemCompat.type && moboCompat.ramType !== itemCompat.type) return 'Материнская плата не поддерживает этот тип памяти';
    if (slot === 'mobo') {
        if (cpu && cpu.compat && cpu.compat.socket && itemCompat.socket && cpu.compat.socket !== itemCompat.socket) return 'Установленный процессор не подходит к этой материнской плате';
        if (ram && ram.compat && ram.compat.type && itemCompat.ramType && ram.compat.type !== itemCompat.ramType) return 'Установленная память не подходит к этой материнской плате';
    }
    return null;
}
function renderWorkshop() {
    const container = createEl('div', 'card fade-in');
    const pc = getActivePC();
    if (!pc) {
        container.appendChild(createEl('h2', '', 'Мастерская'));
        container.appendChild(createEl('p', '', 'Нет доступных ПК.'));
        return container;
    }
    container.appendChild(createEl('h2', '', 'Мастерская — ' + pc.name));
    PC_SLOTS.forEach(function (slot) {
        const installed = getItemById(pc.components[slot]);
        const options = state.inventory.filter(function (item) { return item.category === slot; });
        const row = createEl('div', 'workshop-row');
        row.appendChild(createEl('strong', 'slot-label', slot.toUpperCase()));
        row.appendChild(createEl('span', 'slot-current', installed ? installed.name : '—'));
        if (options.length === 0) {
            row.appendChild(createEl('span', 'hint', 'нет запчастей'));
            container.appendChild(row);
            return;
        }
        const select = document.createElement('select');
        select.setAttribute('aria-label', 'Запчасти для слота ' + slot);
        options.forEach(function (item) {
            const opt = document.createElement('option');
            opt.value = String(state.inventory.indexOf(item));
            opt.text = item.name + ' (' + item.rarity + ') · +' + (item.power || 0);
            select.appendChild(opt);
        });
        row.appendChild(select);
        const btn = createEl('button', 'button', 'Установить');
        btn.type = 'button';
        btn.setAttribute('data-action', 'install');
        btn.setAttribute('data-slot', slot);
        btn.setAttribute('data-index', select.value);
        select.addEventListener('change', function () { btn.setAttribute('data-index', select.value); });
        row.appendChild(btn);
        container.appendChild(row);
    });
    container.appendChild(createEl('p', 'hint', 'Суммарная мощность: ' + pc.power + ' · Доход: ' + (state.miningRate * 3600).toFixed(2) + ' BYTE/ч'));
    return container;
}
function installComponent(pc, slot, inventoryIndex) {
    const index = parseInt(inventoryIndex, 10);
    if (isNaN(index)) return;
    const chosen = state.inventory[index];
    if (!chosen || chosen.category !== slot) return;
    const error = checkCompatibility(pc, slot, chosen);
    if (error) { notify(error); return; }
    const previous = getItemById(pc.components[slot]);
    state.inventory.splice(index, 1);
    if (previous) state.inventory.push(Object.assign({}, previous, { owned: true }));
    pc.components[slot] = chosen.id;
    pc.power = calculatePower(pc);
    updateMiningStats();
    addExp(EXP_REWARDS.install);
    saveGame();
    nav.render();
}

function renderExchange() {
    const container = createEl('div', 'card fade-in');
    const coinRate = typeof COIN_TO_RUB !== 'undefined' ? COIN_TO_RUB : 50;
    container.innerHTML = `
        <h2>Обменник</h2>
        <p>BYTE: <strong>${formatNumber(state.bytes)}</strong> · COIN: <strong>${formatNumber(state.coins)}</strong> · ₽: <strong>${formatNumber(state.money)}</strong></p>
        <p>Курс: <span id="liveExchangeRate">${state.exchangeRate}</span> BYTE = 1 COIN <span class="hint">(меняется каждые 15 с)</span></p>
        <p class="hint">1 COIN = ${coinRate} ₽</p>
        <h3>BYTE → COIN</h3>
        <label for="exchangeAmount">Количество BYTE</label>
        <input type="number" id="exchangeAmount" min="1" step="1" inputmode="numeric" placeholder="Введите количество BYTE">
        <div class="exchange-actions">
            <button type="button" class="button" data-action="exchange">Обменять</button>
            <button type="button" class="button secondary" data-action="exchange-all">Обменять всё</button>
        </div>
        <h3>COIN → ₽</h3>
        <label for="coinExchangeAmount">Количество COIN</label>
        <input type="number" id="coinExchangeAmount" min="1" step="1" inputmode="numeric" placeholder="Введите количество COIN">
        <div class="exchange-actions">
            <button type="button" class="button" data-action="exchange-coins">Обменять в ₽</button>
        </div>
        <h3>История обменов</h3>
        <div id="exchangeHistory">${renderExchangeHistory()}</div>
    `;
    return container;
}
function performExchange() {
    const input = document.getElementById('exchangeAmount');
    if (!input) return;
    if (exchangeBytesToCoins(input.value) === null) return;
    nav.render();
}
function exchangeAll() {
    const available = Math.floor(state.bytes / state.exchangeRate) * state.exchangeRate;
    if (available <= 0) { notify('Недостаточно BYTE для обмена: нужно минимум ' + state.exchangeRate); return; }
    if (exchangeBytesToCoins(available) === null) return;
    nav.render();
}
function performCoinExchange() {
    const input = document.getElementById('coinExchangeAmount');
    if (!input) return;
    const gained = exchangeCoinsToMoney(input.value);
    if (gained === null) return;
    notify('Получено ' + formatNumber(gained) + ' ₽');
    nav.render();
}
function renderExchangeHistory() {
    if (!Array.isArray(state.exchangeLog) || state.exchangeLog.length === 0) return '<p>Нет обменов.</p>';
    return state.exchangeLog.map(function (entry) {
        const date = new Date(entry.time);
        if (entry.type === 'coin-to-rub') return '<p>' + date.toLocaleString('ru-RU') + ': ' + formatNumber(entry.coins) + ' COIN → ' + formatNumber(entry.rub) + ' ₽</p>';
        return '<p>' + date.toLocaleString('ru-RU') + ': ' + formatNumber(entry.bytes) + ' BYTE → ' + formatNumber(entry.coins) + ' COIN</p>';
    }).join('');
}

function nextPCId() {
    return state.computers.reduce(function (max, pc) { return Math.max(max, pc.id); }, 0) + 1;
}
function renderFarm() {
    const container = createEl('div', 'card fade-in');
    container.appendChild(createEl('h2', '', 'Farm — управление ПК'));
    const list = createEl('div', 'pc-grid');
    state.computers.forEach(function (pc) {
        const card = createEl('div', 'pc-card' + (pc.id === state.activePCId ? ' active' : ''));
        const caseItem = getItemById(pc.components && pc.components.case);
        const img = document.createElement('img');
        img.src = caseItem ? caseItem.image : 'assets/icons/case.svg';
        img.alt = caseItem ? caseItem.name : 'Case';
        card.appendChild(img);
        card.appendChild(createEl('div', 'pc-name', pc.name + (pc.id === state.activePCId ? ' (активный)' : '')));
        card.appendChild(createEl('div', 'pc-power', 'Мощность: ' + pc.power));
        const selectBtn = createEl('button', 'button', pc.id === state.activePCId ? 'Активный' : 'Выбрать');
        selectBtn.type = 'button';
        selectBtn.disabled = pc.id === state.activePCId;
        selectBtn.setAttribute('data-action', 'select-pc');
        selectBtn.setAttribute('data-pc-id', String(pc.id));
        card.appendChild(selectBtn);
        list.appendChild(card);
    });
    container.appendChild(list);
    container.appendChild(createEl('p', '', 'Баланс: ' + formatNumber(state.money) + ' ₽'));
    const addBtn = createEl('button', 'button', 'Добавить ПК — ' + formatNumber(PC_BUILD_COST) + ' ₽');
    addBtn.type = 'button';
    addBtn.disabled = state.money < PC_BUILD_COST;
    addBtn.setAttribute('data-action', 'add-pc');
    container.appendChild(addBtn);
    return container;
}
function addComputer() {
    if (state.money < PC_BUILD_COST) { notify('Недостаточно средств для сборки нового ПК'); return; }
    state.money -= PC_BUILD_COST;
    const id = nextPCId();
    state.computers.push({ id: id, name: 'PC ' + id, components: {}, power: 0 });
    updateMiningStats();
    saveGame();
    nav.render();
}

function renderMenu() {
    const container = createEl('div', 'card fade-in');
    const unlocked = ACHIEVEMENTS.filter(function (a) { return state.achievements[a.id]; });
    const achievementList = ACHIEVEMENTS.map(function (a) {
        return '<li>' + (state.achievements[a.id] ? '✅' : '⬜') + ' ' + a.title + '</li>';
    }).join('');
    container.innerHTML = `
        <h2>Меню</h2>
        <p>Уровень ${state.level} · EXP ${formatNumber(state.exp)} / ${formatNumber(expNeeded(state.level))}</p>
        <p>Достижения: ${unlocked.length} из ${ACHIEVEMENTS.length}</p>
        <ul class="achievement-list">${achievementList}</ul>
        <h3>Курс обмена</h3>
        <label for="exchangeRateInput">BYTE за 1 COIN</label>
        <input type="number" id="exchangeRateInput" min="1" step="1" value="${state.exchangeRate}">
        <button type="button" class="button" data-action="set-rate">Сохранить курс</button>
        <h3>Игра</h3>
        <div class="menu-actions">
            <button type="button" class="button" data-action="save">Сохранить</button>
            <button type="button" class="button danger" data-action="reset">Сбросить прогресс</button>
        </div>
    `;
    return container;
}
function setExchangeRate() {
    const input = document.getElementById('exchangeRateInput');
    if (!input) return;
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < 1 || Math.floor(value) !== value) {
        notify('Курс должен быть целым числом не меньше 1');
        return;
    }
    state.exchangeRate = value;
    saveGame();
    nav.render();
}
function resetGame() {
    if (typeof confirm === 'function' && !confirm('Сбросить весь прогресс? Это действие нельзя отменить.')) return;
    try { localStorage.removeItem(SAVE_KEY); } catch (err) { console.warn(err); }
    const fresh = createStarterState();
    Object.keys(state).forEach(function (key) { delete state[key]; });
    Object.assign(state, fresh);
    updateMiningStats();
    saveGame();
    nav.show('garage');
}

function refreshHUD() {
    const setText = function (id, value) {
        const node = document.getElementById(id);
        if (node) node.textContent = value;
    };
    setText('hdrMoney', formatNumber(state.money));
    setText('hdrBytes', formatNumber(state.bytes));
    setText('hdrCoins', formatNumber(state.coins));
    setText('moneyBalance', formatNumber(state.money));
    setText('byteBalance', formatNumber(state.bytes));
    setText('hourlyIncome', (state.miningRate * 3600).toFixed(2));
    setText('totalPower', String(totalPower()));
    setText('storageText', formatNumber(state.storage) + ' / ' + formatNumber(state.maxStorage));
    setText('timeToFull', formatTimeToFull());
    const fill = document.getElementById('storageFill');
    if (fill) {
        const percent = state.maxStorage > 0 ? Math.min(100, (state.storage / state.maxStorage) * 100) : 0;
        fill.style.width = percent.toFixed(1) + '%';
        const track = fill.parentNode;
        if (track && track.setAttribute) track.setAttribute('aria-valuenow', percent.toFixed(0));
    }
}

function handleAction(action, dataset) {
    const data = dataset || {};
    switch (action) {
    case 'nav': nav.show(data.screen); break;
    case 'collect': collectBytes(); nav.render(); break;
    case 'open-case': openCase(Number(data.caseId), Number(data.count)); break;
    case 'select-case': selectedCaseId = Number(data.caseId) || selectedCaseId; nav.render(); break;
    case 'select-count': selectedOpenCount = Number(data.count) || 1; nav.render(); break;
    case 'exchange': performExchange(); break;
    case 'exchange-all': exchangeAll(); break;
    case 'exchange-coins': performCoinExchange(); break;
    case 'set-rate': setExchangeRate(); break;
    case 'save': saveGame(); notify('Игра сохранена'); break;
    case 'reset': resetGame(); break;
    case 'sell-item': sellItem(Number(data.index)); break;
    case 'install': {
        const pc = getActivePC();
        if (pc) installComponent(pc, data.slot, data.index);
        break;
    }
    case 'select-pc': state.activePCId = Number(data.pcId); saveGame(); nav.render(); break;
    case 'add-pc': addComputer(); break;
    default: break;
    }
}
