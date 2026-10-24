// Bottom-navigation controller.
// Every screen is a pure render function from ui.js; this module only swaps them.
const SCREENS = ['garage', 'cases', 'workshop', 'inventory', 'exchange', 'farm', 'menu'];

const nav = {
    current: 'garage',

    show(screen) {
        this.current = SCREENS.indexOf(screen) !== -1 ? screen : 'garage';
        this.render();
    },

    getContainer() {
        return document.getElementById('content') || document.getElementById('app-container');
    },

    render() {
        const content = this.getContainer();
        if (!content) return;
        content.innerHTML = '';
        const renderers = {
            garage: function () { content.appendChild(renderGarage()); content.appendChild(renderPCGrid()); },
            cases: function () { content.appendChild(renderCases()); },
            workshop: function () { content.appendChild(renderWorkshop()); },
            inventory: function () { content.appendChild(renderInventory()); },
            exchange: function () { content.appendChild(renderExchange()); },
            farm: function () { content.appendChild(renderFarm()); },
            menu: function () { content.appendChild(renderMenu()); }
        };
        const render = renderers[this.current] || renderers.garage;
        render();
        this.updateActiveButton();
        // Paint live values (storage bar) immediately instead of waiting for the next tick.
        if (typeof refreshHUD === 'function') refreshHUD();
    },

    updateActiveButton() {
        const buttons = document.querySelectorAll('#main-nav [data-screen]');
        Array.prototype.forEach.call(buttons, function (button) {
            const isActive = button.getAttribute('data-screen') === nav.current;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }
};
