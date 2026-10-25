// Depth UI: service visual, race anim, workshop slots, quiet toasts
(function () {
    'use strict';
    window.showToast = function (message, opts) {
        opts = opts || {};
        if (opts.silent) return;
        var now = Date.now();
        if (!opts.important && window._lastToastAt && now - window._lastToastAt < 800) return;
        window._lastToastAt = now;
        var existing = document.querySelector('.toast-msg');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        var el = document.createElement('div');
        el.className = 'toast-msg' + (opts.important ? ' toast-important' : '');
        el.textContent = String(message || '');
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, opts.important ? 3200 : 2000);
    };
    function brandBadge(brand) {
        if (!brand) return null;
        var tag = typeof brandTag === 'function' ? brandTag(brand) : brand;
        return createEl('span', 'brand-badge brand-' + String(brand).toLowerCase().replace(/\s/g, ''), tag);
    }
    function pcSilhouette(pc) {
        var wrap = createEl('div', 'pc-visual');
        var slots = (typeof PC_SLOTS !== 'undefined') ? PC_SLOTS : ['cpu', 'gpu', 'mobo', 'ram', 'storage', 'psu', 'case'];
        slots.forEach(function (slot) {
            var item = pc && pc.components ? getItemById(pc.components[slot]) : null;
            var cell = createEl('div', 'pc-slot' + (item ? ' filled rarity-' + (item.rarity || 'gray') : ' empty'));
            cell.appendChild(createEl('span', 'pc-slot-label', slot.toUpperCase()));
            if (item) {
                var img = document.createElement('img');
                img.src = item.image || 'assets/icons/cpu.svg';
                img.alt = item.name;
                cell.appendChild(img);
                cell.appendChild(createEl('span', 'pc-slot-name', item.name.split(' ').slice(0, 2).join(' ')));
                var b = brandBadge(item.brand);
                if (b) cell.appendChild(b);
            } else {
                cell.appendChild(createEl('span', 'pc-slot-empty', 'пусто'));
            }
            wrap.appendChild(cell);
        });
        return wrap;
    }
    window.renderService = function () {
        var container = createEl('div', 'card fade-in');
        container.appendChild(createEl('h2', '', 'Обслуживание'));
        container.appendChild(createEl('p', 'hint', 'Диагностика: что чинить. Полный ремонт → кулдаун 5 мин.'));
        (state.computers || []).forEach(function (pc) {
            var block = createEl('div', 'service-pc');
            block.appendChild(createEl('strong', '', pc.name + ' · ' + (pc.power || 0) + ' л.с.'));
            block.appendChild(pcSilhouette(pc));
            var left = typeof getServiceCooldownLeft === 'function' ? getServiceCooldownLeft(pc.id) : 0;
            if (left > 0) {
                block.appendChild(createEl('p', 'hint', 'Сервис через ' + Math.ceil(left / 60) + ' мин'));
            } else {
                var diag = typeof diagnosePc === 'function' ? diagnosePc(pc.id) : { parts: [] };
                var open = (diag.parts || []).filter(function (p) { return !p.fixed; });
                if (!open.length) {
                    block.appendChild(createEl('p', 'hint', 'Всё исправно.'));
                } else {
                    open.forEach(function (part) {
                        var row = createEl('div', 'service-part');
                        var info = createEl('div', 'service-part-info');
                        info.appendChild(createEl('strong', '', part.title));
                        info.appendChild(createEl('span', 'hint', part.hint));
                        row.appendChild(info);
                        var btn = createEl('button', 'button', 'Починить');
                        btn.type = 'button';
                        btn.setAttribute('data-action', 'pc-service');
                        btn.setAttribute('data-pc-id', String(pc.id));
                        btn.setAttribute('data-service', part.id);
                        row.appendChild(btn);
                        block.appendChild(row);
                    });
                }
            }
            container.appendChild(block);
        });
        return container;
    };
    var raceState = { trackId: 'city', moveId: 'normal' };
    window.renderRaces = function () {
        var container = createEl('div', 'card fade-in races-screen');
        container.appendChild(createEl('h2', '', 'Гонки'));
        var info = typeof getStaminaInfo === 'function' ? getStaminaInfo() : { global: 0, globalMax: 15, pcs: [], nextGlobalSec: 0 };
        var stam = createEl('div', 'stamina-bar');
        stam.innerHTML = '<strong>Энергия</strong> ' + info.global + '/' + info.globalMax +
            (info.nextGlobalSec > 0 ? ' · +1 через ' + info.nextGlobalSec + 'с' : '');
        container.appendChild(stam);
        var pc = typeof getActivePC === 'function' ? getActivePC() : null;
        if (!pc) { container.appendChild(createEl('p', '', 'Нет ПК')); return container; }
        var pcSt = (info.pcs || []).find(function (p) { return p.id === pc.id; });
        container.appendChild(createEl('p', 'hint', pc.name + ' · бак ' + (pcSt ? pcSt.stamina : 0) + '/' + (pcSt ? pcSt.max : 3) + ' · ' + (pc.power || 0) + ' л.с.'));
        container.appendChild(createEl('h3', '', 'Трасса'));
        var tracks = typeof getTracks === 'function' ? getTracks() : [];
        var trackRow = createEl('div', 'track-picker');
        tracks.forEach(function (t) {
            var chip = createEl('button', 'track-chip' + (raceState.trackId === t.id ? ' active' : ''), t.name);
            chip.type = 'button';
            chip.appendChild(createEl('span', 'hint', t.label));
            chip.addEventListener('click', function () { raceState.trackId = t.id; nav.render(); });
            trackRow.appendChild(chip);
        });
        container.appendChild(trackRow);
        container.appendChild(createEl('h3', '', 'Стиль'));
        var moves = typeof getRiskMoves === 'function' ? getRiskMoves() : [];
        var moveRow = createEl('div', 'track-picker');
        moves.forEach(function (m) {
            var chip = createEl('button', 'track-chip' + (raceState.moveId === m.id ? ' active' : ''), m.name);
            chip.type = 'button';
            chip.appendChild(createEl('span', 'hint', m.label));
            chip.addEventListener('click', function () { raceState.moveId = m.id; nav.render(); });
            moveRow.appendChild(chip);
        });
        container.appendChild(moveRow);
        var opponents = typeof generateRaceOpponents === 'function' ? generateRaceOpponents(pc, raceState.trackId) : [];
        opponents.forEach(function (opp) {
            var row = createEl('div', 'race-opp');
            var left = createEl('div', 'race-opp-info');
            left.appendChild(createEl('strong', '', opp.name));
            left.appendChild(createEl('span', 'hint', opp.power + ' л.с. · ~' + Math.round(opp.chance * 100) + '%'));
            row.appendChild(left);
            var wrap = createEl('div', 'race-bet');
            var btn = createEl('button', 'button', 'Старт · +' + formatNumber(opp.stake * 3));
            btn.type = 'button';
            btn.addEventListener('click', function () { runRaceAnimation(pc, opp); });
            wrap.appendChild(btn);
            wrap.appendChild(createEl('span', 'hint', 'взнос ' + formatNumber(opp.stake) + ' ₽'));
            row.appendChild(wrap);
            container.appendChild(row);
        });
        return container;
    };
    function runRaceAnimation(pc, opp) {
        var overlay = createEl('div', 'modal-overlay race-overlay');
        var modal = createEl('div', 'modal-content race-anim');
        modal.appendChild(createEl('h3', '', 'Заезд'));
        var track = (typeof getTracks === 'function' ? getTracks() : []).find(function (t) { return t.id === raceState.trackId; });
        modal.appendChild(createEl('p', 'hint', (track ? track.name : '') + ' · vs ' + opp.name));
        var bar = createEl('div', 'race-progress');
        var you = createEl('div', 'race-lane');
        var youFill = createEl('div', 'race-fill you');
        you.appendChild(createEl('span', '', 'Вы')); you.appendChild(youFill);
        var them = createEl('div', 'race-lane');
        var themFill = createEl('div', 'race-fill them');
        them.appendChild(createEl('span', '', opp.name)); them.appendChild(themFill);
        bar.appendChild(you); bar.appendChild(them); modal.appendChild(bar);
        var status = createEl('p', 'race-status', 'Старт…');
        modal.appendChild(status); overlay.appendChild(modal); document.body.appendChild(overlay);
        var result = null;
        var t0 = Date.now();
        var duration = 2200 + Math.random() * 800;
        function frame() {
            var p = Math.min(1, (Date.now() - t0) / duration);
            youFill.style.width = (Math.min(0.98, p * (0.85 + Math.random() * 0.2)) * 100).toFixed(1) + '%';
            themFill.style.width = (Math.min(0.98, p * (0.8 + Math.random() * 0.25)) * 100).toFixed(1) + '%';
            if (p < 1) requestAnimationFrame(frame);
            else {
                result = typeof doRace === 'function' ? doRace(pc.id, {
                    trackId: raceState.trackId, moveId: raceState.moveId, stake: opp.stake,
                    oppPower: opp.power, oppName: opp.name, tier: opp.tier
                }) : { ok: false, msg: 'Ошибка' };
                finish();
            }
        }
        function finish() {
            if (!result || !result.ok) { status.textContent = (result && result.msg) || 'Сбой'; setTimeout(close, 1200); return; }
            if (result.burned) { youFill.style.width = '40%'; status.textContent = 'Перегрев! Сгорели на дистанции.'; }
            else if (result.won) {
                youFill.style.width = '100%'; themFill.style.width = result.nearWin ? '92%' : '78%';
                status.textContent = result.nearWin ? 'На миллиметр! +' + formatNumber(result.prize) + ' ₽' : 'Победа! +' + formatNumber(result.prize) + ' ₽';
            } else {
                themFill.style.width = '100%'; youFill.style.width = result.nearMiss ? '94%' : '70%';
                status.textContent = result.nearMiss ? 'Почти! −' + formatNumber(result.stake) + ' ₽' : 'Поражение. −' + formatNumber(result.stake) + ' ₽';
            }
            setTimeout(close, 1800);
        }
        function close() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (typeof nav !== 'undefined') nav.render();
            if (typeof refreshHUD === 'function') refreshHUD();
        }
        requestAnimationFrame(frame);
    }
    if (typeof renderWorkshop === 'function') {
        var _workshop = renderWorkshop;
        window.renderWorkshop = function () {
            var tab = (typeof nav !== 'undefined' && nav.workshopTab) || 'build';
            if (tab === 'stock') return _workshop();
            var container = createEl('div', 'card fade-in');
            var tabs = createEl('div', 'segmented');
            var buildBtn = createEl('button', 'seg-btn active', 'Сборка');
            buildBtn.type = 'button'; buildBtn.setAttribute('data-action', 'workshop-tab'); buildBtn.setAttribute('data-tab', 'build');
            var stockBtn = createEl('button', 'seg-btn', 'Склад');
            stockBtn.type = 'button'; stockBtn.setAttribute('data-action', 'workshop-tab'); stockBtn.setAttribute('data-tab', 'stock');
            tabs.appendChild(buildBtn); tabs.appendChild(stockBtn); container.appendChild(tabs);
            var pc = typeof getActivePC === 'function' ? getActivePC() : null;
            if (!pc) { container.appendChild(createEl('p', '', 'Нет ПК')); return container; }
            container.appendChild(createEl('h2', '', 'Мастерская — ' + pc.name));
            if (pc.brandBonus > 0) container.appendChild(createEl('p', 'hint brand-bonus', 'Бренд-сет +' + Math.round(pc.brandBonus * 100) + '%'));
            container.appendChild(pcSilhouette(pc));
            var slots = (typeof PC_SLOTS !== 'undefined') ? PC_SLOTS : ['cpu', 'gpu', 'mobo', 'ram', 'storage', 'psu', 'case'];
            slots.forEach(function (slot) {
                var installed = getItemById(pc.components[slot]);
                var options = (state.inventory || []).filter(function (item) { return item.category === slot; });
                var row = createEl('div', 'workshop-row');
                row.appendChild(createEl('strong', 'slot-label', slot.toUpperCase()));
                var cur = createEl('span', 'slot-current');
                if (installed) {
                    cur.appendChild(document.createTextNode(installed.name + ' '));
                    var b = brandBadge(installed.brand); if (b) cur.appendChild(b);
                } else {
                    cur.appendChild(createEl('span', 'slot-missing', 'Нужен ' + slot.toUpperCase()));
                }
                row.appendChild(cur);
                if (!options.length) { row.appendChild(createEl('span', 'hint', 'нет деталей')); container.appendChild(row); return; }
                var select = document.createElement('select');
                options.forEach(function (item) {
                    var opt = document.createElement('option');
                    opt.value = String(state.inventory.indexOf(item));
                    var tag = item.brand && typeof brandTag === 'function' ? ' [' + brandTag(item.brand) + ']' : '';
                    var conflict = '';
                    if (slot === 'cpu' && pc.components.mobo && item.compat) {
                        var mobo = getItemById(pc.components.mobo);
                        if (mobo && mobo.compat && mobo.compat.socket && item.compat.socket && mobo.compat.socket !== item.compat.socket) conflict = ' ⚠ сокет';
                    }
                    opt.text = item.name + tag + ' · +' + (item.power || 0) + conflict;
                    select.appendChild(opt);
                });
                row.appendChild(select);
                var btn = createEl('button', 'button', 'Установить');
                btn.type = 'button';
                btn.setAttribute('data-action', 'install');
                btn.setAttribute('data-slot', slot);
                btn.setAttribute('data-index', select.value);
                select.addEventListener('change', function () {
                    btn.setAttribute('data-index', select.value);
                    var warn = document.getElementById('compatWarn');
                    if (warn) warn.remove();
                    var item = state.inventory[Number(select.value)];
                    if (item && item.compat && slot === 'cpu' && pc.components.mobo) {
                        var mobo = getItemById(pc.components.mobo);
                        if (mobo && mobo.compat && mobo.compat.socket && item.compat.socket && mobo.compat.socket !== item.compat.socket) {
                            var w = createEl('div', 'compat-drama', '⚠ Конфликт сокета: CPU ' + item.compat.socket + ' ≠ плата ' + mobo.compat.socket);
                            w.id = 'compatWarn';
                            row.parentNode.insertBefore(w, row.nextSibling);
                        }
                    }
                });
                row.appendChild(btn);
                container.appendChild(row);
            });
            container.appendChild(createEl('p', 'hint', 'Мощность ' + (pc.power || 0)));
            return container;
        };
    }
    if (typeof renderMenu === 'function') {
        window.renderMenu = function () {
            var container = createEl('div', 'card fade-in menu-screen');
            container.appendChild(createEl('h2', '', 'Меню'));
            var grid = createEl('div', 'menu-grid');
            [
                { action: 'nav', screen: 'profile', title: 'Профиль', hint: 'Уровень и задания', color: 'purple' },
                { action: 'nav', screen: 'exchange', title: 'Обменник', hint: 'По желанию', color: 'blue' },
                { action: 'nav', screen: 'farm', title: 'Ферма', hint: 'Управление ПК', color: 'green' },
                { action: 'nav', screen: 'service', title: 'Обслуживание', hint: 'Диагностика', color: 'gray' },
                { action: 'nav', screen: 'races', title: 'Гонки', hint: 'Трассы · риск', color: 'red' },
                { action: 'save', screen: '', title: 'Сохранить', hint: 'Прогресс', color: 'gray' },
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
    }
    if (typeof handleAction === 'function') {
        var _ha = handleAction;
        handleAction = function (action, dataset) {
            var data = dataset || {};
            if (action === 'pc-service') {
                var res = typeof doPcService === 'function' ? doPcService(data.pcId, data.service) : null;
                if (res && res.ok) showToast(res.title + ': +' + res.reward + ' ₽', { important: true });
                else if (res && res.msg) showToast(res.msg);
                nav.render();
                return;
            }
            return _ha(action, dataset);
        };
    }
})();
