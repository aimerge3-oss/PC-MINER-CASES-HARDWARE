// Entry point: boots the game, runs the mining loop and handles saving.
(function () {
    'use strict';

    const TICK_MS = 1000;
    const AUTOSAVE_EVERY_TICKS = 10; // save every ~10 seconds
    let ticksSinceSave = 0;
    let loopHandle = null;

    function showFatalError(message) {
        const content = document.getElementById('content') || document.getElementById('app-container');
        if (content) {
            content.innerHTML = '<div class="card"><h2>Ошибка запуска</h2><p>' + message + '</p></div>';
        }
        console.error(message);
    }

    let ticksSinceRate = 0;
    const RATE_EVERY_TICKS = 15; // exchange rate fluctuates every 15 seconds

    function tick() {
        tickMining(1);
        refreshHUD();
        ticksSinceSave += 1;
        ticksSinceRate += 1;
        if (ticksSinceRate >= RATE_EVERY_TICKS) {
            ticksSinceRate = 0;
            if (typeof fluctuateExchangeRate === 'function') {
                fluctuateExchangeRate();
                // Live-update rate label if Exchange screen is open
                const rateNode = document.getElementById('liveExchangeRate');
                if (rateNode) rateNode.textContent = String(state.exchangeRate);
                refreshHUD();
            }
        }
        if (ticksSinceSave >= AUTOSAVE_EVERY_TICKS) {
            ticksSinceSave = 0;
            saveGame();
        }
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            saveGame();
            return;
        }
        // Catch up on time lost while the tab was in the background.
        updateMiningStats();
        applyOfflineProgress();
        refreshHUD();
        if (typeof nav !== 'undefined' && nav.current) nav.render();
    }

    function handleClick(event) {
        const target = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
        if (!target || typeof handleAction !== 'function') return;
        handleAction(target.getAttribute('data-action'), target.dataset || {});
    }

    function init() {
        if (typeof ITEMS === 'undefined' || typeof CASES === 'undefined') {
            showFatalError('Не загружены каталоги предметов и кейсов (js/data/items.js, js/data/cases.js).');
            return;
        }
        loadGame();
        updateMiningStats();
        nav.show('garage');

        if (loopHandle === null) loopHandle = setInterval(tick, TICK_MS);

        document.addEventListener('click', handleClick);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', saveGame);
        window.addEventListener('beforeunload', saveGame);
        // Save immediately after boot so fresh progress is never lost.
        saveGame();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
