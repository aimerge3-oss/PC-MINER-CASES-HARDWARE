// Bottom-navigation controller.
const SCREENS = ['garage', 'cases', 'workshop', 'inventory', 'exchange', 'farm', 'menu', 'profile', 'service', 'races'];

const nav = {
    current: 'garage',
    workshopTab: 'build',

    show(screen) {
        this.current = SCREENS.indexOf(screen) !== -1 ? screen : 'garage';
        if (screen === 'inventory') this.workshopTab = 'stock';
        if (screen === 'workshop') this.workshopTab = this.workshopTab || 'build';
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
            garage: function () {
                content.appendChild(renderGarage());
                content.appendChild(renderPCGrid());
            },
            cases: function () { content.appendChild(renderCases()); },
            workshop: function () {
                if (typeof nav !== 'undefined') nav.workshopTab = nav.workshopTab || 'build';
                content.appendChild(renderWorkshop());
            },
            inventory: function () {
                if (typeof nav !== 'undefined') nav.workshopTab = 'stock';
                content.appendChild(renderWorkshop());
            },
            exchange: function () { content.appendChild(renderExchange()); },
            farm: function () { content.appendChild(renderFarm()); },
            menu: function () { content.appendChild(renderMenu()); },
            profile: function () { content.appendChild(renderProfile()); },
            service: function () { content.appendChild(renderService()); },
            races: function () { content.appendChild(renderRaces()); }
        };
        const render = renderers[this.current] || renderers.garage;
        render();
        this.updateActiveButton();
        if (typeof refreshHUD === 'function') refreshHUD();
    },

    updateActiveButton() {
        const buttons = document.querySelectorAll('#main-nav [data-screen]');
        Array.prototype.forEach.call(buttons, function (button) {
            const screen = button.getAttribute('data-screen');
            const isActive = screen === nav.current ||
                (screen === 'workshop' && nav.current === 'workshop');
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }
};
