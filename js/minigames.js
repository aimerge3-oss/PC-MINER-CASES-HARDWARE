// Mini-games: service diagnose + races (tracks, risk, near-miss)
(function () {
    'use strict';
    const SERVICE_COOLDOWN_MS = 5 * 60 * 1000;
    const GLOBAL_STAMINA_MAX = 15;
    const GLOBAL_STAMINA_TICK_MS = 60 * 1000;
    const PC_STAMINA_MAX = 3;
    const PC_STAMINA_TICK_MS = 10 * 60 * 1000;
    const SERVICE_PARTS = [
        { id: 'cpu', title: 'CPU · термопаста', hint: 'Перегрев процессора', mult: 0.85 },
        { id: 'gpu', title: 'GPU · переустановка', hint: 'Артефакты / шум кулера', mult: 1.25 },
        { id: 'dust', title: 'Корпус · пыль', hint: 'Забит радиатор', mult: 1.0 },
        { id: 'psu', title: 'БП · контакты', hint: 'Просадки по питанию', mult: 0.95 },
        { id: 'ram', title: 'RAM · слоты', hint: 'Нестабильный разгон', mult: 0.8 }
    ];
    const TRACKS = [
        { id: 'city', name: 'Городской драг', risk: 0, stakeMult: 1.0, label: 'Стабильно' },
        { id: 'night', name: 'Ночной стрит', risk: 0.08, stakeMult: 1.25, label: 'Риск +' },
        { id: 'highway', name: 'Трасса 402', risk: 0.15, stakeMult: 1.55, label: 'Высокий риск' }
    ];
    const RISK_MOVES = [
        { id: 'safe', name: 'Контроль', delta: -0.05, label: '−шанс / меньше риска' },
        { id: 'normal', name: 'Обычный', delta: 0, label: 'Стандарт' },
        { id: 'push', name: 'На пределе', delta: 0.12, label: '+шанс / можно сгореть' }
    ];
    function ensureMinigames() {
        if (!state.minigames || typeof state.minigames !== 'object') {
            state.minigames = { globalStamina: GLOBAL_STAMINA_MAX, lastGlobalTick: Date.now(), pcStamina: {}, lastPcTick: {}, lastService: {}, diagnose: {} };
        }
        if (!state.minigames.pcStamina) state.minigames.pcStamina = {};
        if (!state.minigames.lastPcTick) state.minigames.lastPcTick = {};
        if (!state.minigames.lastService) state.minigames.lastService = {};
        if (!state.minigames.diagnose) state.minigames.diagnose = {};
    }
    function regenStamina() {
        ensureMinigames();
        const now = Date.now();
        const mg = state.minigames;
        if (!mg.lastGlobalTick) mg.lastGlobalTick = now;
        const gTicks = Math.floor((now - mg.lastGlobalTick) / GLOBAL_STAMINA_TICK_MS);
        if (gTicks > 0) {
            mg.globalStamina = Math.min(GLOBAL_STAMINA_MAX, (mg.globalStamina || 0) + gTicks);
            mg.lastGlobalTick += gTicks * GLOBAL_STAMINA_TICK_MS;
        }
        (state.computers || []).forEach(function (pc) {
            const id = String(pc.id);
            if (mg.pcStamina[id] == null) mg.pcStamina[id] = PC_STAMINA_MAX;
            if (!mg.lastPcTick[id]) mg.lastPcTick[id] = now;
            const ticks = Math.floor((now - mg.lastPcTick[id]) / PC_STAMINA_TICK_MS);
            if (ticks > 0) {
                mg.pcStamina[id] = Math.min(PC_STAMINA_MAX, mg.pcStamina[id] + ticks);
                mg.lastPcTick[id] += ticks * PC_STAMINA_TICK_MS;
            }
        });
    }
    function pcValue(pc) {
        if (!pc || !pc.components) return 5000;
        let total = 0;
        Object.keys(pc.components).forEach(function (slot) {
            const item = getItemById(pc.components[slot]);
            if (item) total += Number(item.price) || 0;
        });
        return Math.max(5000, total);
    }
    function serviceReward(pc, mult) {
        const value = pcValue(pc);
        const t = Math.min(1, Math.log10(value / 5000 + 1) / 2);
        const base = 500 + Math.round(t * 4500);
        return Math.max(500, Math.min(5000, Math.round(base * mult)));
    }
    window.diagnosePc = function (pcId) {
        ensureMinigames();
        const id = String(pcId);
        const existing = state.minigames.diagnose[id];
        if (existing && existing.parts && existing.parts.length) return existing;
        const shuffled = SERVICE_PARTS.slice().sort(function () { return Math.random() - 0.5; });
        const n = 2 + (Math.random() < 0.4 ? 1 : 0);
        const parts = shuffled.slice(0, n).map(function (p) {
            return { id: p.id, title: p.title, hint: p.hint, mult: p.mult, fixed: false };
        });
        state.minigames.diagnose[id] = { parts: parts, generatedAt: Date.now() };
        saveGame();
        return state.minigames.diagnose[id];
    };
    window.doPcService = function (pcId, partId) {
        ensureMinigames();
        const pc = (state.computers || []).find(function (c) { return c.id === Number(pcId); });
        if (!pc) return { ok: false, msg: 'ПК не найден' };
        const last = state.minigames.lastService[String(pc.id)] || 0;
        if (Date.now() - last < SERVICE_COOLDOWN_MS) {
            const left = Math.ceil((SERVICE_COOLDOWN_MS - (Date.now() - last)) / 1000);
            return { ok: false, msg: 'Кулдаун ' + Math.ceil(left / 60) + ' мин' };
        }
        const diag = diagnosePc(pc.id);
        const part = (diag.parts || []).find(function (p) { return p.id === partId && !p.fixed; });
        if (!part) return { ok: false, msg: 'Эта зона уже в порядке' };
        const reward = serviceReward(pc, part.mult);
        part.fixed = true;
        state.money += reward;
        if (diag.parts.every(function (p) { return p.fixed; })) {
            state.minigames.lastService[String(pc.id)] = Date.now();
            state.minigames.diagnose[String(pc.id)] = { parts: [], generatedAt: Date.now() };
        }
        saveGame();
        return { ok: true, reward: reward, title: part.title, allFixed: diag.parts.every(function (p) { return p.fixed; }) };
    };
    window.getServiceParts = function () { return SERVICE_PARTS; };
    window.getServiceActions = function () { return SERVICE_PARTS; };
    window.getServiceCooldownLeft = function (pcId) {
        ensureMinigames();
        const last = state.minigames.lastService[String(pcId)] || 0;
        return Math.max(0, Math.ceil((SERVICE_COOLDOWN_MS - (Date.now() - last)) / 1000));
    };
    window.getTracks = function () { return TRACKS; };
    window.getRiskMoves = function () { return RISK_MOVES; };
    function winChance(playerPower, oppPower, trackRisk, moveDelta) {
        const ratio = playerPower / Math.max(1, oppPower);
        let c = 0.5 + (ratio - 1) * 0.35 + (moveDelta || 0) - (trackRisk || 0);
        return Math.max(0.12, Math.min(0.88, c));
    }
    function raceStake(pc, tier, trackMult) {
        const pct = [0.03, 0.06, 0.10][tier] || 0.05;
        return Math.max(500, Math.round(pcValue(pc) * pct * (trackMult || 1)));
    }
    window.generateRaceOpponents = function (pc, trackId) {
        const track = TRACKS.find(function (t) { return t.id === trackId; }) || TRACKS[0];
        const power = pc.power || (typeof calculatePower === 'function' ? calculatePower(pc) : 15) || 15;
        const names = ['Сашка_Буст', 'NeonRider', 'ByteKiller', 'Overclock99', 'FarmKing', 'SilentGPU', 'RGBMaster', 'ThermoX'];
        return [0, 1, 2].map(function (tier, i) {
            const mult = 0.7 + tier * 0.35 + Math.random() * 0.2;
            const oppPower = Math.max(10, Math.round(power * mult));
            const stake = raceStake(pc, tier, track.stakeMult);
            return { id: i, name: names[(Date.now() + i * 11) % names.length], power: oppPower, stake: stake, chance: winChance(power, oppPower, track.risk, 0), tier: tier, trackId: track.id };
        });
    };
    window.doRace = function (pcId, opts) {
        ensureMinigames();
        regenStamina();
        opts = opts || {};
        const pc = (state.computers || []).find(function (c) { return c.id === Number(pcId); });
        if (!pc) return { ok: false, msg: 'ПК не найден' };
        const mg = state.minigames;
        const pid = String(pc.id);
        if ((mg.globalStamina || 0) < 1) return { ok: false, msg: 'Нет общей энергии' };
        if ((mg.pcStamina[pid] || 0) < 1) return { ok: false, msg: 'У ПК нет энергии' };
        const track = TRACKS.find(function (t) { return t.id === opts.trackId; }) || TRACKS[0];
        const move = RISK_MOVES.find(function (m) { return m.id === opts.moveId; }) || RISK_MOVES[1];
        const stake = Number(opts.stake) || raceStake(pc, opts.tier || 1, track.stakeMult);
        if (state.money < stake) return { ok: false, msg: 'Недостаточно ₽' };
        const power = pc.power || 15;
        const oppPower = Number(opts.oppPower) || power;
        let chance = winChance(power, oppPower, track.risk, move.delta);
        let burned = false;
        if (move.id === 'push' && Math.random() < 0.12 + track.risk) { burned = true; chance *= 0.4; }
        state.money -= stake;
        mg.globalStamina -= 1;
        mg.pcStamina[pid] -= 1;
        const roll = Math.random();
        const won = !burned && roll < chance;
        const margin = chance - roll;
        const nearMiss = !won && margin > -0.08;
        const nearWin = won && margin < 0.06;
        let prize = 0;
        if (won) { prize = Math.round(stake * 3); state.money += prize; }
        saveGame();
        return { ok: true, won: won, burned: burned, nearMiss: nearMiss, nearWin: nearWin, stake: stake, prize: prize, chance: chance, roll: roll, margin: margin, track: track, move: move, oppName: opts.oppName || 'Соперник', oppPower: oppPower };
    };
    window.getStaminaInfo = function () {
        ensureMinigames();
        regenStamina();
        const mg = state.minigames;
        const pcs = (state.computers || []).map(function (pc) {
            return { id: pc.id, name: pc.name, power: pc.power || 0, stamina: mg.pcStamina[String(pc.id)] || 0, max: PC_STAMINA_MAX };
        });
        const nextGlobal = Math.max(0, Math.ceil((GLOBAL_STAMINA_TICK_MS - (Date.now() - (mg.lastGlobalTick || Date.now()))) / 1000));
        return { global: mg.globalStamina || 0, globalMax: GLOBAL_STAMINA_MAX, nextGlobalSec: nextGlobal, pcs: pcs };
    };
})();
