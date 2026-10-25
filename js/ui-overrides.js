// UI overrides loaded after ui.js
function renderGarage() {
    const container = createEl('div', 'card fade-in');
    const power = totalPower();
    const fillPercent = state.maxStorage > 0 ? Math.min(100, (state.storage / state.maxStorage) * 100) : 0;
    container.innerHTML = `
        <h2>Доход майнинга</h2>
        <p>Доход в час: <strong><span id="hourlyIncome">${(state.miningRate * 3600).toFixed(2)}</span> BYTE</strong></p>
        <p>Текущая мощность: <strong><span id="totalPower">${power}</span></strong></p>
        <p>Хранилище: <span id="storageText">${formatNumber(state.storage)} / ${formatNumber(state.maxStorage)}</span></p>
        <div class="storage-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${fillPercent.toFixed(0)}" aria-label="Заполнение хранилища">
            <div class="storage-fill" id="storageFill"></div>
        </div>
        <p>Время до заполнения: <span id="timeToFull">${formatTimeToFull()}</span></p>
        <button type="button" class="button" data-action="collect">Забрать</button>
    `;
    return container;
}

function renderWorkshop() {
    const container = createEl('div', 'card fade-in');
    const tab = (typeof nav !== 'undefined' && nav.workshopTab) || 'build';
    const tabs = createEl('div', 'segmented');
    const buildBtn = createEl('button', 'seg-btn' + (tab === 'build' ? ' active' : ''), 'Сборка');
    buildBtn.type = 'button';
    buildBtn.setAttribute('data-action', 'workshop-tab');
    buildBtn.setAttribute('data-tab', 'build');
    const stockBtn = createEl('button', 'seg-btn' + (tab === 'stock' ? ' active' : ''), 'Склад');
    stockBtn.type = 'button';
    stockBtn.setAttribute('data-action', 'workshop-tab');
    stockBtn.setAttribute('data-tab', 'stock');
    tabs.appendChild(buildBtn);
    tabs.appendChild(stockBtn);
    container.appendChild(tabs);
    if (tab === 'stock') {
        const inv = renderInventory();
        inv.classList.remove('card', 'fade-in');
        container.appendChild(inv);
        return container;
    }
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

function renderMenu() {
    const container = createEl('div', 'card fade-in menu-screen');
    container.appendChild(createEl('h2', '', 'Меню'));
    const grid = createEl('div', 'menu-grid');
    const items = [
        { action: 'nav', screen: 'profile', title: 'Профиль', hint: 'Уровень, задания, статистика', color: 'purple' },
        { action: 'nav', screen: 'exchange', title: 'Обменник', hint: 'BYTE → COIN → ₽', color: 'blue' },
        { action: 'nav', screen: 'farm', title: 'Ферма', hint: 'Управление ПК', color: 'green' },
        { action: 'save', screen: '', title: 'Сохранить', hint: 'Записать прогресс', color: 'gray' },
        { action: 'reset', screen: '', title: 'Сбросить', hint: 'Новая игра', color: 'red' }
    ];
    items.forEach(function (item) {
        const card = createEl('button', 'menu-tile menu-' + item.color);
        card.type = 'button';
        card.setAttribute('data-action', item.action);
        if (item.screen) card.setAttribute('data-screen', item.screen);
        card.appendChild(createEl('strong', '', item.title));
        card.appendChild(createEl('span', 'hint', item.hint));
        grid.appendChild(card);
    });
    container.appendChild(grid);
    container.appendChild(createEl('p', 'hint', 'Курс: ' + state.exchangeRate + ' BYTE = 1 COIN · 1 COIN = ' + (typeof COIN_TO_RUB !== 'undefined' ? COIN_TO_RUB : 50) + ' ₽'));
    return container;
}

function renderProfile() {
    if (typeof ensureQuests === 'function') ensureQuests();
    const container = createEl('div', 'card fade-in profile-screen');
    const head = createEl('div', 'profile-head');
    head.appendChild(createEl('div', 'profile-avatar-lg', String(state.level)));
    head.appendChild(createEl('h2', '', 'Игрок'));
    head.appendChild(createEl('p', 'hint', 'Уровень ' + state.level + ' · ID demo'));
    const badges = createEl('div', 'profile-badges');
    badges.innerHTML = '<span class="badge">Майнер</span><span class="badge badge-blue">Бета</span>';
    head.appendChild(badges);
    const need = expNeeded(state.level);
    const expPct = Math.min(100, (state.exp / need) * 100);
    const expBar = createEl('div', 'exp-track');
    const expFill = document.createElement('div');
    expFill.className = 'exp-fill';
    expFill.style.width = expPct.toFixed(1) + '%';
    expBar.appendChild(expFill);
    head.appendChild(expBar);
    head.appendChild(createEl('p', 'hint', formatNumber(state.exp) + ' / ' + formatNumber(need) + ' опыта · ' + formatNumber(state.coins) + ' COIN'));
    container.appendChild(head);

    container.appendChild(createEl('h3', '', 'Статистика'));
    const stats = createEl('div', 'stats-grid');
    const cells = [
        [String((state.computers || []).length), 'в гараже'],
        [(typeof collectionCount === 'function' ? collectionCount() : 0) + '/' + (typeof ITEMS !== 'undefined' ? ITEMS.length : '?'), 'коллекция'],
        [formatNumber(typeof collectionValue === 'function' ? collectionValue() : 0), 'стоимость, ₽'],
        [String(state.casesOpened || 0), 'кейсов'],
        [formatNumber(state.bytes), 'BYTE'],
        [formatNumber(state.totalSpent || 0), 'потрачено ₽']
    ];
    cells.forEach(function (pair) {
        const cell = createEl('div', 'stat-cell');
        cell.appendChild(createEl('strong', '', pair[0]));
        cell.appendChild(createEl('span', '', pair[1]));
        stats.appendChild(cell);
    });
    container.appendChild(stats);
    container.appendChild(createEl('p', 'hint', 'Опыт дают кейсы, установка деталей, обмен и задания.'));

    function renderQuestList(title, list, bag, scope) {
        container.appendChild(createEl('h3', '', title));
        (list || []).forEach(function (q) {
            const entry = (bag && bag[q.id]) || { progress: 0, claimed: false };
            const row = createEl('div', 'quest-row');
            const left = createEl('div', 'quest-info');
            left.appendChild(createEl('strong', '', q.title));
            left.appendChild(createEl('span', 'hint', (entry.progress || 0) + ' / ' + q.target + ' · +' + q.rewardExp + ' EXP · +' + q.rewardRub + ' ₽'));
            row.appendChild(left);
            const btn = createEl('button', 'button', entry.claimed ? '✓' : 'Забрать');
            btn.type = 'button';
            btn.disabled = entry.claimed || (entry.progress || 0) < q.target;
            btn.setAttribute('data-action', 'claim-quest');
            btn.setAttribute('data-scope', scope);
            btn.setAttribute('data-quest-id', q.id);
            row.appendChild(btn);
            container.appendChild(row);
        });
    }
    if (typeof DAILY_QUESTS !== 'undefined' && state.quests) {
        renderQuestList('Задания на сегодня', DAILY_QUESTS, state.quests.daily, 'daily');
        renderQuestList('Задания на неделю', WEEKLY_QUESTS, state.quests.weekly, 'weekly');
    }
    return container;
}

(function () {
    if (typeof handleAction !== 'function') return;
    var _orig = handleAction;
    handleAction = function (action, dataset) {
        var data = dataset || {};
        if (action === 'workshop-tab') {
            if (typeof nav !== 'undefined') nav.workshopTab = data.tab || 'build';
            nav.render();
            return;
        }
        if (action === 'claim-quest') {
            if (typeof claimQuest === 'function') claimQuest(data.scope, data.questId);
            nav.render();
            return;
        }
        return _orig(action, dataset);
    };
})();

(function () {
    if (typeof openCase !== 'function') return;
    var _open = openCase;
    openCase = function (caseId, count) {
        var beforeInv = (state.inventory || []).length;
        var beforeMoney = state.money;
        _open(caseId, count);
        var opened = (state.inventory || []).length - beforeInv;
        if (opened > 0) {
            state.casesOpened = (state.casesOpened || 0) + opened;
            state.totalSpent = (state.totalSpent || 0) + (beforeMoney - state.money);
            if (typeof bumpQuest === 'function') bumpQuest('cases', opened);
        }
    };
})();

(function () {
    if (typeof installComponent !== 'function') return;
    var _inst = installComponent;
    installComponent = function (pc, slot, inventoryIndex) {
        _inst(pc, slot, inventoryIndex);
        if (typeof bumpQuest === 'function') bumpQuest('install', 1);
    };
})();

(function () {
    if (typeof addComputer !== 'function') return;
    var _add = addComputer;
    addComputer = function () {
        var before = (state.computers || []).length;
        _add();
        if ((state.computers || []).length > before && typeof bumpQuest === 'function') bumpQuest('pcs', 1);
    };
})();

(function () {
    if (typeof refreshHUD !== 'function') return;
    var _hud = refreshHUD;
    refreshHUD = function () {
        _hud();
        var node = document.getElementById('hdrAvatar');
        if (node) node.textContent = String(state.level);
    };
})();
