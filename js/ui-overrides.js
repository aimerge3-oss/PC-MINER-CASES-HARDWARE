// UI overrides — onboarding, brand bonus, slim garage/menu/profile
function hourlyIncome() { return state.miningRate * 3600; }

function renderGarage() {
    if (typeof ensureOnboarding === 'function') ensureOnboarding();
    if (typeof tryCompleteChallenge === 'function') tryCompleteChallenge();
    const container = createEl('div', 'card fade-in');
    const power = totalPower();
    const fillPercent = state.maxStorage > 0 ? Math.min(100, (state.storage / state.maxStorage) * 100) : 0;
    const ob = state.onboarding || {};
    if (ob.challengeActive && !ob.challengeClaimed) {
        const left = typeof challengeSecondsLeft === 'function' ? challengeSecondsLeft() : 0;
        const need = typeof ONBOARD_CHALLENGE_POWER !== 'undefined' ? ONBOARD_CHALLENGE_POWER : 40;
        const reward = typeof ONBOARD_CHALLENGE_REWARD !== 'undefined' ? ONBOARD_CHALLENGE_REWARD : 2000;
        const banner = createEl('div', 'challenge-banner');
        const mm = Math.floor(left / 60);
        const ss = left % 60;
        banner.innerHTML = '<strong>Мини-цель:</strong> мощность ' + need + ' за ' + mm + ':' + (ss < 10 ? '0' : '') + ss +
            ' → <strong>+' + formatNumber(reward) + ' ₽</strong><br><span class="hint">Сейчас: ' + power + ' / ' + need + '</span>';
        container.appendChild(banner);
    } else if (ob.challengeClaimed) {
        container.appendChild(createEl('p', 'hint', '✓ Мини-цель выполнена'));
    }
    const tasks = createEl('div', 'onboard-tasks');
    [{ key: 'openCase', label: 'Открой кейс' }, { key: 'install', label: 'Установи деталь' }, { key: 'collect', label: 'Забери BYTE' }].forEach(function (td) {
        const done = ob.tasks && ob.tasks[td.key];
        const claimed = ob.tasksClaimed && ob.tasksClaimed[td.key];
        const chip = createEl('button', 'task-chip' + (done ? ' done' : '') + (claimed ? ' claimed' : ''),
            (claimed ? '✓ ' : done ? '● ' : '○ ') + td.label);
        chip.type = 'button';
        if (done && !claimed) {
            chip.setAttribute('data-action', 'claim-onboard-task');
            chip.setAttribute('data-task', td.key);
        } else { chip.disabled = true; }
        tasks.appendChild(chip);
    });
    container.appendChild(tasks);
    const stats = createEl('div');
    stats.innerHTML = '<h2>Доход майнинга</h2><p>Доход в час: <strong><span id="hourlyIncome">' + hourlyIncome().toFixed(2) +
        '</span> BYTE</strong></p><p>Текущая мощность: <strong><span id="totalPower">' + power +
        '</span></strong></p><p>Хранилище: <span id="storageText">' + formatNumber(state.storage) + ' / ' + formatNumber(state.maxStorage) +
        '</span></p><div class="storage-track" role="progressbar"><div class="storage-fill" id="storageFill"></div></div><p>Время до заполнения: <span id="timeToFull">' +
        formatTimeToFull() + '</span></p>';
    container.appendChild(stats);
    const collectBtn = createEl('button', 'button' + (ob.hintStep === 3 ? ' hint-pulse' : ''), 'Забрать');
    collectBtn.type = 'button'; collectBtn.id = 'btnCollect'; collectBtn.setAttribute('data-action', 'collect');
    container.appendChild(collectBtn);
    const active = typeof getActivePC === 'function' ? getActivePC() : null;
    if (active && active.brandBonus > 0) {
        container.appendChild(createEl('p', 'hint brand-bonus', 'Бонус бренда +' + Math.round(active.brandBonus * 100) + '% к доходу'));
    }
    return container;
}

function renderWorkshop() {
    const container = createEl('div', 'card fade-in');
    const tab = (typeof nav !== 'undefined' && nav.workshopTab) || 'build';
    const tabs = createEl('div', 'segmented');
    const buildBtn = createEl('button', 'seg-btn' + (tab === 'build' ? ' active' : ''), 'Сборка');
    buildBtn.type = 'button'; buildBtn.setAttribute('data-action', 'workshop-tab'); buildBtn.setAttribute('data-tab', 'build');
    const stockBtn = createEl('button', 'seg-btn' + (tab === 'stock' ? ' active' : ''), 'Склад');
    stockBtn.type = 'button'; stockBtn.setAttribute('data-action', 'workshop-tab'); stockBtn.setAttribute('data-tab', 'stock');
    tabs.appendChild(buildBtn); tabs.appendChild(stockBtn); container.appendChild(tabs);
    if (tab === 'stock') {
        const inv = renderInventory(); inv.classList.remove('card', 'fade-in'); container.appendChild(inv); return container;
    }
    const pc = getActivePC();
    if (!pc) { container.appendChild(createEl('h2', '', 'Мастерская')); container.appendChild(createEl('p', '', 'Нет доступных ПК.')); return container; }
    container.appendChild(createEl('h2', '', 'Мастерская — ' + pc.name));
    if (pc.brandBonus > 0) container.appendChild(createEl('p', 'hint brand-bonus', 'Полный набор бренда: +' + Math.round(pc.brandBonus * 100) + '% к майнингу'));
    else container.appendChild(createEl('p', 'hint', 'Собери все слоты одного бренда (Gigabyte / MSI / ASUS) — +10% к доходу'));
    PC_SLOTS.forEach(function (slot) {
        const installed = getItemById(pc.components[slot]);
        const options = state.inventory.filter(function (item) { return item.category === slot; });
        const row = createEl('div', 'workshop-row');
        row.appendChild(createEl('strong', 'slot-label', slot.toUpperCase()));
        row.appendChild(createEl('span', 'slot-current', installed ? installed.name + (installed.brand ? ' · ' + installed.brand : '') : '—'));
        if (options.length === 0) { row.appendChild(createEl('span', 'hint', 'нет запчастей')); container.appendChild(row); return; }
        const select = document.createElement('select');
        options.forEach(function (item) {
            const opt = document.createElement('option');
            opt.value = String(state.inventory.indexOf(item));
            opt.text = item.name + (item.brand ? ' [' + item.brand + ']' : '') + ' · +' + (item.power || 0);
            select.appendChild(opt);
        });
        row.appendChild(select);
        const btn = createEl('button', 'button' + ((state.onboarding && state.onboarding.hintStep === 2) ? ' hint-pulse' : ''), 'Установить');
        btn.type = 'button'; btn.setAttribute('data-action', 'install'); btn.setAttribute('data-slot', slot); btn.setAttribute('data-index', select.value);
        select.addEventListener('change', function () { btn.setAttribute('data-index', select.value); });
        row.appendChild(btn); container.appendChild(row);
    });
    container.appendChild(createEl('p', 'hint', 'Суммарная мощность: ' + pc.power + ' · Доход: ' + hourlyIncome().toFixed(2) + ' BYTE/ч'));
    return container;
}

function renderMenu() {
    const container = createEl('div', 'card fade-in menu-screen');
    container.appendChild(createEl('h2', '', 'Меню'));
    const grid = createEl('div', 'menu-grid');
    [{ action: 'nav', screen: 'profile', title: 'Профиль', hint: 'Уровень, задания, статистика', color: 'purple' },
     { action: 'nav', screen: 'exchange', title: 'Обменник', hint: 'BYTE → COIN → ₽', color: 'blue' },
     { action: 'nav', screen: 'farm', title: 'Ферма', hint: 'Управление ПК', color: 'green' },
     { action: 'save', screen: '', title: 'Сохранить', hint: 'Записать прогресс', color: 'gray' },
     { action: 'reset', screen: '', title: 'Сбросить', hint: 'Новая игра', color: 'red' }].forEach(function (item) {
        const card = createEl('button', 'menu-tile menu-' + item.color);
        card.type = 'button'; card.setAttribute('data-action', item.action);
        if (item.screen) card.setAttribute('data-screen', item.screen);
        card.appendChild(createEl('strong', '', item.title));
        card.appendChild(createEl('span', 'hint', item.hint));
        grid.appendChild(card);
    });
    container.appendChild(grid);
    container.appendChild(createEl('p', 'hint', 'Курс: ' + state.exchangeRate + ' BYTE = 1 COIN'));
    return container;
}

function renderProfile() {
    if (typeof ensureQuests === 'function') ensureQuests();
    const container = createEl('div', 'card fade-in profile-screen');
    const head = createEl('div', 'profile-head');
    head.appendChild(createEl('div', 'profile-avatar-lg', String(state.level)));
    head.appendChild(createEl('h2', '', 'Игрок'));
    head.appendChild(createEl('p', 'hint', 'Уровень ' + state.level));
    const need = expNeeded(state.level);
    const expBar = createEl('div', 'exp-track');
    const expFill = document.createElement('div');
    expFill.className = 'exp-fill';
    expFill.style.width = Math.min(100, (state.exp / need) * 100).toFixed(1) + '%';
    expBar.appendChild(expFill); head.appendChild(expBar);
    head.appendChild(createEl('p', 'hint', formatNumber(state.exp) + ' / ' + formatNumber(need) + ' опыта'));
    container.appendChild(head);
    container.appendChild(createEl('h3', '', 'Статистика'));
    const stats = createEl('div', 'stats-grid');
    [[String((state.computers || []).length), 'в гараже'],
     [(typeof collectionCount === 'function' ? collectionCount() : 0) + '/' + (ITEMS ? ITEMS.length : '?'), 'коллекция'],
     [formatNumber(typeof collectionValue === 'function' ? collectionValue() : 0), 'стоимость, ₽'],
     [String(state.casesOpened || 0), 'кейсов'],
     [formatNumber(state.bytes), 'BYTE'],
     [formatNumber(state.totalSpent || 0), 'потрачено ₽']].forEach(function (pair) {
        const cell = createEl('div', 'stat-cell');
        cell.appendChild(createEl('strong', '', pair[0]));
        cell.appendChild(createEl('span', '', pair[1]));
        stats.appendChild(cell);
    });
    container.appendChild(stats);
    return container;
}

function showIncomeDeltaPopup(beforeRate, afterRate) {
    if (!state.onboarding || state.onboarding.incomePopupShown) return;
    state.onboarding.incomePopupShown = true; saveGame();
    const beforeH = beforeRate * 3600, afterH = afterRate * 3600;
    const pct = beforeH > 0 ? Math.round(((afterH - beforeH) / beforeH) * 100) : 100;
    const overlay = createEl('div', 'modal-overlay');
    const modal = createEl('div', 'modal-content');
    modal.appendChild(createEl('h3', '', 'Доход вырос!'));
    modal.appendChild(createEl('p', '', formatNumber(Math.round(beforeH)) + ' → ' + formatNumber(Math.round(afterH)) + ' BYTE/ч'));
    modal.appendChild(createEl('p', '', '+' + pct + '% к майнингу'));
    const btn = createEl('button', 'button', 'Круто!');
    btn.type = 'button';
    btn.addEventListener('click', function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); });
    modal.appendChild(btn); overlay.appendChild(modal); document.body.appendChild(overlay);
}

function showFreeCaseIntro() {
    if (!state.onboarding || state.onboarding.freeCaseDone) return;
    const overlay = createEl('div', 'modal-overlay');
    const modal = createEl('div', 'modal-content');
    modal.appendChild(createEl('h3', '', 'Приветственный кейс!'));
    modal.appendChild(createEl('p', '', 'Открой бесплатный Базовый кейс и получи первую деталь.'));
    const btn = createEl('button', 'button', 'Открыть бесплатно');
    btn.type = 'button';
    btn.addEventListener('click', function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        state.onboarding.freeCaseDone = true; saveGame();
        const item = typeof grantFreeCase === 'function' ? grantFreeCase(1) : null;
        if (item && typeof showLootGrid === 'function') showLootGrid([item]);
        else if (item) { notify('Выпало: ' + item.name); nav.render(); }
        advanceHint(2);
        if (typeof startOnboardingChallenge === 'function') startOnboardingChallenge();
    });
    modal.appendChild(btn); overlay.appendChild(modal); document.body.appendChild(overlay);
}

function advanceHint(step) {
    if (!state.onboarding) return;
    state.onboarding.hintStep = step; saveGame(); updateHints();
}

function updateHints() {
    document.querySelectorAll('.nav-hint, .hint-pulse').forEach(function (el) { el.classList.remove('nav-hint', 'hint-pulse'); });
    const step = state.onboarding && state.onboarding.hintStep;
    if (step === 1) { const b = document.querySelector('#main-nav [data-screen="cases"]'); if (b) b.classList.add('nav-hint'); }
    else if (step === 2) { const b = document.querySelector('#main-nav [data-screen="workshop"]'); if (b) b.classList.add('nav-hint'); }
    else if (step === 3) {
        const b = document.querySelector('#main-nav [data-screen="garage"]'); if (b) b.classList.add('nav-hint');
        const c = document.getElementById('btnCollect'); if (c) c.classList.add('hint-pulse');
    }
    if (step > 0 && step < 4) {
        setTimeout(function () {
            if (state.onboarding && state.onboarding.hintStep === step) { state.onboarding.hintStep = 0; saveGame(); updateHints(); }
        }, 30000);
    }
}

(function () {
    if (typeof handleAction !== 'function') return;
    var _orig = handleAction;
    handleAction = function (action, dataset) {
        var data = dataset || {};
        if (action === 'workshop-tab') { if (nav) nav.workshopTab = data.tab || 'build'; nav.render(); return; }
        if (action === 'claim-quest') { if (typeof claimQuest === 'function') claimQuest(data.scope, data.questId); nav.render(); return; }
        if (action === 'claim-onboard-task') {
            if (typeof claimOnboardTask === 'function') claimOnboardTask(data.task);
            if (data.task === 'openCase') advanceHint(2);
            if (data.task === 'install') advanceHint(3);
            if (data.task === 'collect') advanceHint(0);
            nav.render(); return;
        }
        if (action === 'collect') { _orig(action, dataset); if (typeof markOnboardTask === 'function') markOnboardTask('collect'); return; }
        return _orig(action, dataset);
    };
})();

(function () {
    if (typeof openCase !== 'function') return;
    var _open = openCase;
    openCase = function (caseId, count) {
        var beforeInv = (state.inventory || []).length, beforeMoney = state.money;
        _open(caseId, count);
        var opened = (state.inventory || []).length - beforeInv;
        if (opened > 0) {
            state.casesOpened = (state.casesOpened || 0) + opened;
            state.totalSpent = (state.totalSpent || 0) + (beforeMoney - state.money);
            if (typeof bumpQuest === 'function') bumpQuest('cases', opened);
            if (typeof markOnboardTask === 'function') markOnboardTask('openCase');
            advanceHint(2);
        }
    };
})();

(function () {
    if (typeof installComponent !== 'function') return;
    var _inst = installComponent;
    installComponent = function (pc, slot, inventoryIndex) {
        var beforeRate = state.miningRate;
        _inst(pc, slot, inventoryIndex);
        if (typeof bumpQuest === 'function') bumpQuest('install', 1);
        if (typeof markOnboardTask === 'function') markOnboardTask('install');
        if (typeof tryCompleteChallenge === 'function') tryCompleteChallenge();
        if (state.miningRate > beforeRate) showIncomeDeltaPopup(beforeRate, state.miningRate);
        advanceHint(3);
    };
})();

(function () {
    if (typeof refreshHUD !== 'function') return;
    var _hud = refreshHUD;
    refreshHUD = function () {
        _hud();
        var node = document.getElementById('hdrAvatar');
        if (node) node.textContent = String(state.level);
        if (typeof tryCompleteChallenge === 'function') tryCompleteChallenge();
    };
})();

function bootOnboarding() {
    if (typeof ensureOnboarding !== 'function') return;
    ensureOnboarding();
    if (!state.onboarding.freeCaseDone) {
        advanceHint(1);
        setTimeout(function () { showFreeCaseIntro(); }, 1200);
    }
    updateHints();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(bootOnboarding, 400); });
else setTimeout(bootOnboarding, 400);
