// Mini-games: PC service + FPS races (energy system)
(function () {
    'use strict';

    const SERVICE_COOLDOWN_MS = 5 * 60 * 1000;
    const GLOBAL_STAMINA_MAX = 15;
    const GLOBAL_STAMINA_TICK_MS = 60 * 1000;
    const PC_STAMINA_MAX = 3;
    const PC_STAMINA_TICK_MS = 10 * 60 * 1000;

    const SERVICE_ACTIONS = [
        { id: 'paste', title: 'Нанести термопасту', mult: 0.7 },
        { id: 'clean', title: 'Почистить ПК', mult: 1.0 },
        { id: 'gpu', title: 'Переустановить GPU', mult: 1.3 }
    ];

    function ensureMinigames() {
        if (!state.minigames || typeof state.minigames !== 'object') {
            state.minigames = {
                globalStamina: GLOBAL_STAMINA_MAX,
                lastGlobalTick: Date.now(),
                pcStamina: {},
                lastPcTick: {},
                lastService: {}
            };
        }
        if (!state.minigames.pcStamina) state.minigames.pcStamina = {};
        if (!state.minigames.lastPcTick) state.minigames.lastPcTick = {};
        if (!state.minigames.lastService) state.minigames.lastService = {};
        // do NOT call regenStamina here — it would recurse forever
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

    function serviceReward(pc, actionMult) {
        const value = pcValue(pc);
        const t = Math.min(1, Math.log10(value / 5000 + 1) / 2);
        const base = 500 + Math.round(t * 4500);
        return Math.max(500, Math.min(5000, Math.round(base * actionMult)));
    }

    window.doPcService = function (pcId, actionId) {
        ensureMinigames();
        const pc = (state.computers || []).find(function (c) { return c.id === Number(pcId); });
        if (!pc) { notify('ПК не найден'); return null; }
        const action = SERVICE_ACTIONS.find(function (a) { return a.id === actionId; }) || SERVICE_ACTIONS[1];
        const last = state.minigames.lastService[String(pc.id)] || 0;
        if (Date.now() - last < SERVICE_COOLDOWN_MS) {
            const left = Math.ceil((SERVICE_COOLDOWN_MS - (Date.now() - last)) / 1000);
            notify('Подождите ещё ' + Math.ceil(left / 60) + ' мин');
            return null;
        }
        const reward = serviceReward(pc, action.mult);
        state.money += reward;
        state.minigames.lastService[String(pc.id)] = Date.now();
        saveGame();
        notify(action.title + ': +' + reward + ' ₽');
        return reward;
    };

    window.getServiceActions = function () { return SERVICE_ACTIONS; };

    window.getServiceCooldownLeft = function (pcId) {
        ensureMinigames();
        const last = state.minigames.lastService[String(pcId)] || 0;
        return Math.max(0, Math.ceil((SERVICE_COOLDOWN_MS - (Date.now() - last)) / 1000));
    };

    function winChance(playerPower, oppPower) {
        const ratio = playerPower / Math.max(1, oppPower);
        return Math.max(0.15, Math.min(0.85, 0.5 + (ratio - 1) * 0.35));
    }

    function raceStake(pc, tier) {
        const pct = [0.03, 0.06, 0.10][tier] || 0.05;
        return Math.max(500, Math.round(pcValue(pc) * pct));
    }

    window.generateRaceOpponents = function (pc) {
        const power = pc.power || (typeof calculatePower === 'function' ? calculatePower(pc) : 15) || 15;
        const names = ['Сашка_Буст', 'NeonRider', 'ByteKiller', 'Overclock99', 'FarmKing', 'SilentGPU', 'RGBMaster'];
        return [0, 1, 2].map(function (tier, i) {
            const mult = 0.7 + tier * 0.35 + Math.random() * 0.2;
            const oppPower = Math.max(10, Math.round(power * mult));
            const stake = raceStake(pc, tier);
            return {
                id: i,
                name: names[(Date.now() + i * 7) % names.length],
                power: oppPower,
                stake: stake,
                chance: winChance(power, oppPower),
                tier: tier
            };
        });
    };

    window.doRace = function (pcId, opponent) {
        ensureMinigames();
        regenStamina();
        const pc = (state.computers || []).find(function (c) { return c.id === Number(pcId); });
        if (!pc) { notify('ПК не найден'); return null; }
        const mg = state.minigames;
        const pid = String(pc.id);
        if ((mg.globalStamina || 0) < 1) { notify('Нет общей энергии'); return null; }
        if ((mg.pcStamina[pid] || 0) < 1) { notify('У этого ПК нет энергии'); return null; }
        const stake = opponent.stake;
        if (state.money < stake) { notify('Недостаточно ₽ для взноса'); return null; }
        state.money -= stake;
        mg.globalStamina -= 1;
        mg.pcStamina[pid] -= 1;
        const won = Math.random() < opponent.chance;
        let prize = 0;
        if (won) {
            prize = stake * 3;
            state.money += prize;
            notify('Победа! +' + prize + ' ₽ (взнос ' + stake + ')');
        } else {
            notify('Поражение. −' + stake + ' ₽');
        }
        saveGame();
        return { won: won, stake: stake, prize: prize };
    };

    window.getStaminaInfo = function () {
        ensureMinigames();
        regenStamina();
        const mg = state.minigames;
        const pcs = (state.computers || []).map(function (pc) {
            return {
                id: pc.id,
                name: pc.name,
                power: pc.power || 0,
                stamina: mg.pcStamina[String(pc.id)] || 0,
                max: PC_STAMINA_MAX
            };
        });
        const nextGlobal = Math.max(0, Math.ceil((GLOBAL_STAMINA_TICK_MS - (Date.now() - (mg.lastGlobalTick || Date.now()))) / 1000));
        return {
            global: mg.globalStamina || 0,
            globalMax: GLOBAL_STAMINA_MAX,
            nextGlobalSec: nextGlobal,
            pcs: pcs
        };
    };
})();
