// ========== GARAGE ==========
function renderGarage() {
    const container = document.createElement('div');
    container.className = 'card fade-in';
    const hourlyIncome = (state.miningRate * 3600).toFixed(2);
    const timeToFullSec = state.storage >= state.maxStorage ? 0 : Math.ceil((state.maxStorage - state.storage) / state.miningRate);
    const hrs = Math.floor(timeToFullSec / 3600);
    const mins = Math.floor((timeToFullSec % 3600) / 60);
    const secs = timeToFullSec % 60;
    const timeLeft = `${hrs}h ${mins}m ${secs}s`;
    container.innerHTML = `
        <h2>Доход майнинга</h2>
        <p>Баланс: <span id='byteBalance'>${state.bytes.toFixed(0)}</span> BYTE</p>
        <p>Доход в час: ${hourlyIncome} BYTE</p>
        <p>Текущая мощность: ${state.computers.reduce((sum, pc) => sum + pc.power, 0)}</p>
        <p>Хранилище: <span id='storageBar'>${state.storage.toFixed(0)} / ${state.maxStorage.toFixed(0)}</span></p>
        <p>Время до заполнения: ${timeLeft}</p>
        <button class='button' onclick='collectBytes()'>Забрать</button>
        <p>Курс BYTE→COIN: ${state.exchangeRate} BYTE = 1 COIN</p>
    `;
    return container;
}

function renderPCGrid() {
    const grid = document.createElement('div');
    grid.className = 'pc-grid';
    state.computers.forEach(pc => {
        const card = document.createElement('div');
        card.className = 'pc-card';
        const caseId = pc.components && pc.components.case;
        const caseItem = caseId ? getItemById(caseId) : null;
        const img = document.createElement('img');
        img.src = caseItem ? caseItem.image : '';
        img.alt = caseItem ? caseItem.name : 'Case';
        card.appendChild(img);
        const nameDiv = document.createElement('div');
        nameDiv.innerText = pc.name;
        card.appendChild(nameDiv);
        const powerDiv = document.createElement('div');
        powerDiv.innerText = `Power: ${pc.power}`;
        card.appendChild(powerDiv);
        grid.appendChild(card);
    });
    return grid;
}

// ========== CASES ==========
function renderCases() {
    const container = document.createElement('div');
    container.className = 'card fade-in';
    container.innerHTML = `<h2>Кейсы</h2>`;
    const list = document.createElement('div');
    CASES.forEach(k => {
        const caseCard = document.createElement('div');
        caseCard.className = 'card';
        caseCard.style.marginBottom = '10px';
        caseCard.innerHTML = `
            <h3>${k.name}</h3>
            <p>Цена: ${k.price} ₽</p>
            <button class='button' onclick="openCase(${k.id},1)" ${state.money < k.price ? 'disabled' : ''}>Open ×1</button>
            <button class='button' onclick="openCase(${k.id},3)" ${state.money < k.price*3 ? 'disabled' : ''}>Open ×3</button>
            <button class='button' onclick="openCase(${k.id},5)" ${state.money < k.price*5 ? 'disabled' : ''}>Open ×5</button>
            <button class='button' onclick="openCase(${k.id},10)" ${state.money < k.price*10 ? 'disabled' : ''}>Open ×10</button>
        `;
        list.appendChild(caseCard);
    });
    container.appendChild(list);
    return container;
}
function openCase(caseId, count) {
    const caseDef = CASES.find(c => c.id === caseId);
    if (!caseDef) return;
    const totalCost = caseDef.price * count;
    if (state.money < totalCost) {
        alert('Недостаточно средств');
        return;
    }
    state.money -= totalCost;
    saveGame();
    const results = [];
    for (let i = 0; i < count; i++) {
        const roll = Math.random() * caseDef.totalWeight;
        let cum = 0;
        for (const item of caseDef.itemPool) {
            cum += item.weight;
            if (roll <= cum) {
                results.push(item);
                break;
            }
        }
    }
    const showResult = (index) => {
        if (index >= results.length) {
            nav.render();
            return;
        }
        const finalItem = results[index];
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        overlay.appendChild(modal);
        const track = document.createElement('div');
        track.className = 'roulette-track';
        const pool = [];
        for (let j = 0; j < 12; j++) {
            const rand = caseDef.itemPool[Math.floor(Math.random() * caseDef.itemPool.length)];
            pool.push(rand);
        }
        const midIdx = Math.floor(pool.length / 2);
        pool[midIdx] = finalItem;
        pool.forEach(it => {
            const el = document.createElement('div');
            el.className = 'roulette-item';
            const img = document.createElement('img');
            img.src = it.image;
            img.style.width = '60px';
            img.style.height = '60px';
            const name = document.createElement('div');
            name.innerText = it.name;
            name.style.fontSize = '12px';
            el.appendChild(img);
            el.appendChild(name);
            track.appendChild(el);
        });
        const pointer = document.createElement('div');
        pointer.className = 'roulette-pointer';
        const rouletteContainer = document.createElement('div');
        rouletteContainer.className = 'roulette-container';
        rouletteContainer.appendChild(track);
        rouletteContainer.appendChild(pointer);
        modal.appendChild(rouletteContainer);
        document.body.appendChild(overlay);
        const itemWidth = 110;
        const targetOffset = -(midIdx * itemWidth);
        track.style.transition = 'transform 2s cubic-bezier(0.25, 0.1, 0.25, 1)';
        requestAnimationFrame(() => {
            track.style.transform = `translateX(${targetOffset}px)`;
        });
        setTimeout(() => {
            if (finalItem.type === 'case') {
                state.casesOwned[finalItem.id] = (state.casesOwned[finalItem.id] || 0) + finalItem.quantity;
            } else if (finalItem.type === 'hardware') {
                state.inventory.push({ ...finalItem, owned: true });
            }
            document.body.removeChild(overlay);
            setTimeout(() => showResult(index + 1), 300);
        }, 2200);
    };
    showResult(0);
}

function renderInventory() {
    const container = document.createElement('div');
    container.className = 'card fade-in';
    container.innerHTML = `<h2>Инвентарь</h2>`;
    if (!state.inventory || state.inventory.length === 0) {
        const empty = document.createElement('p');
        empty.innerText = 'Инвентарь пуст.';
        container.appendChild(empty);
        return container;
    }
    const list = document.createElement('div');
    list.className = 'inventory-list';
    state.inventory.forEach((item, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.style.border = `2px solid ${rarityColor(item.rarity)}`;
        itemDiv.style.padding = '8px';
        itemDiv.style.marginBottom = '8px';
        const name = document.createElement('span');
        name.innerText = `${item.name} (${item.rarity}) – ${item.price} ₽`;
        itemDiv.appendChild(name);
        const sellBtn = document.createElement('button');
        sellBtn.className = 'button';
        sellBtn.style.marginLeft = '10px';
        sellBtn.innerText = 'Продать';
        sellBtn.onclick = () => sellItem(idx);
        itemDiv.appendChild(sellBtn);
        list.appendChild(itemDiv);
    });
    container.appendChild(list);
    return container;
}

function sellItem(invIndex) {
    const item = state.inventory[invIndex];
    if (!item) return;
    state.money += item.price;
    state.inventory.splice(invIndex, 1);
    saveGame();
    nav.render();
}

function rarityColor(rarity) {
    const map = {
        gray: '#888',
        blue: '#007aff',
        purple: '#a020f0',
        yellow: '#ffd700',
        red: '#ff3b30',
        black: '#000'
    };
    return map[rarity] || '#888';
}

function renderWorkshop() {
    const container = document.createElement('div');
    container.className = 'card fade-in';
    const pc = state.computers.find(c => c.id === state.activePCId) || state.computers[0];
    if (!pc) {
        container.innerHTML = `<h2>Мастерская</h2><p>Нет доступных ПК.</p>`;
        return container;
    }
    container.innerHTML = `<h2>Мастерская – ${pc.name}</h2>`;
    const slots = ['cpu', 'gpu', 'mobo', 'ram', 'storage', 'psu', 'case'];
    slots.forEach(slot => {
        const installedId = pc.components[slot];
        const installed = installedId ? getItemById(installedId) : null;
        const options = state.inventory.filter(i => i.category === slot);
        const row = document.createElement('div');
        row.style.marginBottom = '8px';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        const label = document.createElement('strong');
        label.innerText = slot.toUpperCase() + ': ';
        row.appendChild(label);
        const currentSpan = document.createElement('span');
        currentSpan.innerText = installed ? installed.name : '—';
        currentSpan.style.marginRight = '8px';
        row.appendChild(currentSpan);
        const select = document.createElement('select');
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.text = installed ? `Оставить (${installed.name})` : '—';
        select.appendChild(emptyOpt);
        options.forEach(item => {
            const opt = document.createElement('option');
            opt.value = state.inventory.indexOf(item);
            opt.text = `${item.name} (${item.rarity})`;
            select.appendChild(opt);
        });
        row.appendChild(select);
        const btn = document.createElement('button');
        btn.className = 'button';
        btn.innerText = 'Установить';
        btn.onclick = () => {
            const chosenIdx = parseInt(select.value);
            if (isNaN(chosenIdx)) return;
            const chosenItem = state.inventory[chosenIdx];
            if (slot === 'cpu' && pc.components.mobo) {
                const mobo = getItemById(pc.components.mobo);
                if (mobo.socket && chosenItem.compat && mobo.socket !== chosenItem.compat.socket) {
                    alert('Несовместимый сокет процессора и мат.платы');
                    return;
                }
            }
            if (installed) {
                state.inventory.push({ ...installed, owned: true });
            }
            state.inventory.splice(chosenIdx, 1);
            pc.components[slot] = chosenItem.id;
            pc.power = calculatePower(pc);
            updateMiningStats();
            saveGame();
            nav.render();
        };
        row.appendChild(btn);
        container.appendChild(row);
    });
    return container;
}


function renderExchange() {
    const container = document.createElement('div');
    container.className = 'card fade-in';
    container.innerHTML = `
        <h2>Обменник</h2>
        <p>Ваш баланс: <strong>${state.bytes.toFixed(0)} BYTE</strong> (${state.coins.toFixed(0)} COIN)</p>
        <p>Текущий курс: ${state.exchangeRate} BYTE = 1 COIN</p>
        <input type='number' id='exchangeAmount' min='0' placeholder='Введите количество BYTE' style='width:100%;margin-bottom:8px;'>
        <button class='button' onclick='performExchange()'>Обменять</button>
        <h3>История обменов</h3>
        <div id='exchangeHistory'>${renderExchangeHistory()}</div>
    `;
    return container;
}

function performExchange() {
    const amt = parseInt(document.getElementById('exchangeAmount').value);
    if (isNaN(amt) || amt <= 0) {
        alert('Введите корректную сумму');
        return;
    }
    exchangeBytesToCoins(amt);
    document.getElementById('exchangeHistory').innerHTML = renderExchangeHistory();
}

function renderExchangeHistory() {
    if (!state.exchangeLog || state.exchangeLog.length === 0) return '<p>Нет обменов.</p>';
    return state.exchangeLog.map(entry => {
        const d = new Date(entry.time);
        return `<p>${d.toLocaleString()}: ${entry.bytes} BYTE → ${entry.coins} COIN</p>`;
    }).join('');
}

function renderFarm() {
    const container = document.createElement('div');
    container.className = 'card fade-in';
    container.innerHTML = `<h2>Farm – Управление ПК</h2>`;
    const list = document.createElement('div');
    list.className = 'pc-grid';
    state.computers.forEach(pc => {
        const card = document.createElement('div');
        card.className = 'pc-card';
        const caseId = pc.components && pc.components.case;
        const caseItem = caseId ? getItemById(caseId) : null;
        const img = document.createElement('img');
        img.src = caseItem ? caseItem.image : '';
        img.alt = caseItem ? caseItem.name : 'Case';
        card.appendChild(img);
        const nameDiv = document.createElement('div');
        nameDiv.innerText = pc.name + (pc.id === state.activePCId ? ' (active)' : '');
        card.appendChild(nameDiv);
        const powerDiv = document.createElement('div');
        powerDiv.innerText = `Power: ${pc.power}`;
        card.appendChild(powerDiv);
        const selectBtn = document.createElement('button');
        selectBtn.className = 'button';
        selectBtn.innerText = 'Выбрать';
        selectBtn.onclick = () => {
            state.activePCId = pc.id;
            saveGame();
            nav.render();
        };
        card.appendChild(selectBtn);
        list.appendChild(card);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'button';
    addBtn.innerText = 'Добавить ПК';
    addBtn.onclick = () => {
        const newId = Math.max(...state.computers.map(c => c.id)) + 1;
        const newPc = { id: newId, name: `PC ${newId}`, components: {}, power: 0 };
        state.computers.push(newPc);
        saveGame();
        nav.render();
    };
    container.appendChild(list);
    container.appendChild(addBtn);
    return container;
}
