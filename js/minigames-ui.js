// Minigames screens + brand badges + toast + menu tiles
function showToast(message) {
    var existing = document.querySelector('.toast-msg');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = String(message || '');
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2400);
}

function brandBadge(brand) {
    if (!brand) return null;
    var tag = typeof brandTag === 'function' ? brandTag(brand) : brand;
    return createEl('span', 'brand-badge brand-' + String(brand).toLowerCase(), tag);
}

function renderService() {
    var container = createEl('div', 'card fade-in');
    container.appendChild(createEl('h2', '', 'Обслуживание ПК'));
    container.appendChild(createEl('p', 'hint', 'Раз в 5 мин: термопаста / чистка / GPU. 500–5000 ₽.'));
    var actions = typeof getServiceActions === 'function' ? getServiceActions() : [];
    (state.computers || []).forEach(function (pc) {
        var block = createEl('div', 'service-pc');
        block.appendChild(createEl('strong', '', pc.name + ' · мощн. ' + (pc.power || 0)));
        var left = typeof getServiceCooldownLeft === 'function' ? getServiceCooldownLeft(pc.id) : 0;
        if (left > 0) {
            block.appendChild(createEl('p', 'hint', 'Через ' + Math.ceil(left / 60) + ' мин'));
        } else {
            var row = createEl('div', 'service-actions');
            actions.forEach(function (a) {
                var btn = createEl('button', 'button secondary', a.title);
                btn.type = 'button';
                btn.setAttribute('data-action', 'pc-service');
                btn.setAttribute('data-pc-id', String(pc.id));
                btn.setAttribute('data-service', a.id);
                row.appendChild(btn);
            });
            block.appendChild(row);
        }
        container.appendChild(block);
    });
    return container;
}

function renderRaces() {
    var container = createEl('div', 'card fade-in races-screen');
    container.appendChild(createEl('h2', '', 'Гонки'));
    var info = typeof getStaminaInfo === 'function' ? getStaminaInfo() : { global: 0, globalMax: 15, pcs: [], nextGlobalSec: 0 };
    var stam = createEl('div', 'stamina-bar');
    stam.innerHTML = '<strong>Энергия</strong> ' + info.global + '/' + info.globalMax +
        (info.nextGlobalSec > 0 ? ' · +1 через ' + info.nextGlobalSec + 'с' : '');
    container.appendChild(stam);
    var pc = getActivePC();
    if (!pc) { container.appendChild(createEl('p', '', 'Нет ПК')); return container; }
    var pcSt = (info.pcs || []).find(function (p) { return p.id === pc.id; });
    container.appendChild(createEl('p', 'hint',
        pc.name + ' · бак ' + (pcSt ? pcSt.stamina : 0) + '/' + (pcSt ? pcSt.max : 3) + ' · ' + (pc.power || 0) + ' л.с.'));
    container.appendChild(createEl('p', 'hint', 'Взнос 3/6/10% стоимости ПК. Победа = ×3.'));
    var opponents = typeof generateRaceOpponents === 'function' ? generateRaceOpponents(pc) : [];
    opponents.forEach(function (opp) {
        var row = createEl('div', 'race-opp');
        var left = createEl('div', 'race-opp-info');
        left.appendChild(createEl('strong', '', opp.name));
        left.appendChild(createEl('span', 'hint', opp.power + ' л.с. · шанс ' + Math.round(opp.chance * 100) + '%'));
        row.appendChild(left);
        var wrap = createEl('div', 'race-bet');
        var btn = createEl('button', 'button', '+' + formatNumber(opp.stake * 3) + ' ₽');
        btn.type = 'button';
        btn.setAttribute('data-action', 'race');
        btn.setAttribute('data-pc-id', String(pc.id));
        btn.setAttribute('data-stake', String(opp.stake));
        btn.setAttribute('data-chance', String(opp.chance));
        btn.setAttribute('data-opp-power', String(opp.power));
        btn.setAttribute('data-opp-name', opp.name);
        wrap.appendChild(btn);
        wrap.appendChild(createEl('span', 'hint', 'взнос ' + formatNumber(opp.stake) + ' ₽'));
        row.appendChild(wrap);
        container.appendChild(row);
    });
    return container;
}

(function () {
    if (typeof renderMenu !== 'function') return;
    renderMenu = function () {
        var container = createEl('div', 'card fade-in menu-screen');
        container.appendChild(createEl('h2', '', 'Меню'));
        var grid = createEl('div', 'menu-grid');
        [
            { action: 'nav', screen: 'profile', title: 'Профиль', hint: 'Уровень и статистика', color: 'purple' },
            { action: 'nav', screen: 'exchange', title: 'Обменник', hint: 'BYTE → COIN → ₽', color: 'blue' },
            { action: 'nav', screen: 'farm', title: 'Ферма', hint: 'Управление ПК', color: 'green' },
            { action: 'nav', screen: 'service', title: 'Обслуживание', hint: 'Чистка · 500–5000 ₽', color: 'gray' },
            { action: 'nav', screen: 'races', title: 'Гонки', hint: 'FPS · энергия · ставки', color: 'red' },
            { action: 'save', screen: '', title: 'Сохранить', hint: 'Записать прогресс', color: 'gray' },
            { action: 'reset', screen: '', title: 'Сбросить', hint: 'Новая игра', color: 'red' }
        ].forEach(function (item) {
            var card = createEl('button', 'menu-tile menu-' + item.color);
            card.type = 'button';
            card.setAttribute('data-action', item.action);
            if (item.screen) card.setAttribute('data-screen', item.screen);
            card.appendChild(createEl('strong', '', item.title));
            card.appendChild(createEl('span', 'hint', item.hint));
            grid.appendChild(card);
        });
        container.appendChild(grid);
        return container;
    };
})();

(function () {
    if (typeof handleAction !== 'function') return;
    var _orig = handleAction;
    handleAction = function (action, dataset) {
        var data = dataset || {};
        if (action === 'pc-service') {
            if (typeof doPcService === 'function') doPcService(data.pcId, data.service);
            nav.render();
            return;
        }
        if (action === 'race') {
            if (typeof doRace === 'function') {
                doRace(data.pcId, {
                    stake: Number(data.stake),
                    chance: Number(data.chance),
                    power: Number(data.oppPower),
                    name: data.oppName
                });
            }
            nav.render();
            return;
        }
        return _orig(action, dataset);
    };
})();
