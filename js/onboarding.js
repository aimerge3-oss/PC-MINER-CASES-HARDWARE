// Onboarding + brand set bonus (loaded after state.js)
(function () {
    'use strict';

    const ONBOARD_CHALLENGE_POWER = 40;
    const ONBOARD_CHALLENGE_MS = 3 * 60 * 1000;
    const ONBOARD_CHALLENGE_REWARD = 2000;
    const ONBOARD_TASK_REWARDS = {
        openCase: { rub: 300, exp: 15 },
        install: { rub: 400, exp: 20 },
        collect: { rub: 500, exp: 25 }
    };

    function defaultOnboarding() {
        return {
            freeCaseDone: false,
            incomePopupShown: false,
            challengeActive: false,
            challengeEndsAt: 0,
            challengeClaimed: false,
            tasks: { openCase: false, install: false, collect: false },
            tasksClaimed: { openCase: false, install: false, collect: false },
            bonusCaseClaimed: false,
            hintStep: 0
        };
    }

    window.ONBOARD_CHALLENGE_POWER = ONBOARD_CHALLENGE_POWER;
    window.ONBOARD_CHALLENGE_REWARD = ONBOARD_CHALLENGE_REWARD;
    window.ONBOARD_TASK_REWARDS = ONBOARD_TASK_REWARDS;

    window.getPcBrandBonus = function (pc) {
        if (!pc || !pc.components) return 0;
        const slots = (typeof BRAND_SLOTS !== 'undefined') ? BRAND_SLOTS : ['cpu', 'gpu', 'mobo', 'ram', 'storage', 'psu', 'case'];
        let brand = null;
        for (let i = 0; i < slots.length; i++) {
            const item = getItemById(pc.components[slots[i]]);
            if (!item || !item.brand) return 0;
            if (brand === null) brand = item.brand;
            else if (item.brand !== brand) return 0;
        }
        return typeof BRAND_SET_BONUS !== 'undefined' ? BRAND_SET_BONUS : 0.10;
    };

    if (typeof updateMiningStats === 'function') {
        window.updateMiningStats = function () {
            if (!Array.isArray(state.computers)) state.computers = [];
            let weighted = 0;
            state.computers.forEach(function (pc) {
                pc.power = calculatePower(pc);
                const bonus = getPcBrandBonus(pc);
                pc.brandBonus = bonus;
                weighted += pc.power * (1 + bonus);
            });
            state.miningRate = weighted * MINING_FACTOR;
            state.maxStorage = state.miningRate * 3600 * STORAGE_HOURS;
            if (state.storage > state.maxStorage) state.storage = state.maxStorage;
            return { totalPower: weighted, miningRate: state.miningRate, maxStorage: state.maxStorage };
        };
    }

    window.ensureOnboarding = function () {
        if (!state.onboarding || typeof state.onboarding !== 'object') {
            state.onboarding = defaultOnboarding();
        }
        if (!state.onboarding.tasks) state.onboarding.tasks = { openCase: false, install: false, collect: false };
        if (!state.onboarding.tasksClaimed) state.onboarding.tasksClaimed = { openCase: false, install: false, collect: false };
    };

    window.startOnboardingChallenge = function () {
        ensureOnboarding();
        if (state.onboarding.challengeActive || state.onboarding.challengeClaimed) return;
        state.onboarding.challengeActive = true;
        state.onboarding.challengeEndsAt = Date.now() + ONBOARD_CHALLENGE_MS;
        saveGame();
    };

    window.challengeSecondsLeft = function () {
        ensureOnboarding();
        if (!state.onboarding.challengeActive || state.onboarding.challengeClaimed) return 0;
        return Math.max(0, Math.ceil((state.onboarding.challengeEndsAt - Date.now()) / 1000));
    };

    window.tryCompleteChallenge = function () {
        ensureOnboarding();
        if (!state.onboarding.challengeActive || state.onboarding.challengeClaimed) return false;
        if (challengeSecondsLeft() <= 0) {
            state.onboarding.challengeActive = false;
            saveGame();
            return false;
        }
        const power = (state.computers || []).reduce(function (s, pc) { return s + (pc.power || 0); }, 0);
        if (power < ONBOARD_CHALLENGE_POWER) return false;
        state.onboarding.challengeClaimed = true;
        state.onboarding.challengeActive = false;
        state.money += ONBOARD_CHALLENGE_REWARD;
        addExp(50);
        notify('Мини-цель! +' + ONBOARD_CHALLENGE_REWARD + ' ₽');
        saveGame();
        return true;
    };

    window.markOnboardTask = function (key) {
        ensureOnboarding();
        if (state.onboarding.tasks[key]) return;
        state.onboarding.tasks[key] = true;
        saveGame();
    };

    window.claimOnboardTask = function (key) {
        ensureOnboarding();
        if (!state.onboarding.tasks[key] || state.onboarding.tasksClaimed[key]) return false;
        const reward = ONBOARD_TASK_REWARDS[key];
        if (!reward) return false;
        state.onboarding.tasksClaimed[key] = true;
        state.money += reward.rub;
        addExp(reward.exp);
        if (key === 'collect' && !state.onboarding.bonusCaseClaimed) {
            state.onboarding.bonusCaseClaimed = true;
            const item = grantFreeCase(1);
            notify('+' + reward.rub + ' ₽ · +' + reward.exp + ' EXP · бонусный кейс!');
            if (item && typeof showLootGrid === 'function') {
                setTimeout(function () { showLootGrid([item]); }, 300);
            }
        } else {
            notify('+' + reward.rub + ' ₽ · +' + reward.exp + ' EXP');
        }
        saveGame();
        return true;
    };

    window.grantFreeCase = function (caseId) {
        const id = caseId || 1;
        const caseDef = (typeof CASES !== 'undefined') ? CASES.find(function (c) { return c.id === id; }) : null;
        if (!caseDef || typeof rollCaseItem !== 'function') return null;
        const item = rollCaseItem(caseDef);
        if (!item) return null;
        state.inventory.push(Object.assign({}, item, { owned: true }));
        state.casesOpened = (state.casesOpened || 0) + 1;
        markOnboardTask('openCase');
        if (typeof bumpQuest === 'function') bumpQuest('cases', 1);
        saveGame();
        return item;
    };

    if (typeof state !== 'undefined') {
        ensureOnboarding();
        if (typeof updateMiningStats === 'function') updateMiningStats();
    }
})();
