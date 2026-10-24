document.addEventListener('DOMContentLoaded', () => {
    // 1. Load game state
    if (typeof loadGame === 'function') {
        loadGame();
    }
    
    // 2. Update mining stats
    if (typeof updateMiningStats === 'function') {
        updateMiningStats();
    }
    
    // 3. Render navigation bar (if exists)
    if (typeof nav !== 'undefined' && typeof nav.render === 'function') {
        nav.render();
    }
    
    // 4. Force first screen (Garage)
    if (typeof nav !== 'undefined' && typeof nav.show === 'function') {
        nav.show('garage');
    } else if (typeof renderGarage === 'function') {
        renderGarage();
    }
    
    // 5. Mining accumulation each second
    setInterval(() => {
        if (typeof state !== 'undefined' && state.storage < state.maxStorage) {
            state.storage = Math.min(state.maxStorage, state.storage + state.miningRate);
            state.lastUpdate = Date.now();
            if (typeof saveGame === 'function') {
                saveGame();
            }
            // Update UI only if on garage screen
            if (typeof nav !== 'undefined' && nav.current === 'garage') {
                const storageEl = document.getElementById('storageBar');
                if (storageEl) {
                    storageEl.innerText = `${state.storage.toFixed(0)} / ${state.maxStorage.toFixed(0)}`;
                }
            }
        }
    }, 1000);
});
