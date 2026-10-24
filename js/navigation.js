const nav = {
    current: 'garage',
    show(screen) {
        this.current = screen;
        this.render();
    },
    render() {
        const content = document.getElementById('content');
        content.innerHTML = '';
        if (this.current === 'farm') {
            content.appendChild(renderFarm());
        } else if (this.current === 'garage') {
            content.appendChild(renderGarage());
            content.appendChild(renderPCGrid());
        } else if (this.current === 'cases') {
            content.appendChild(renderCases());
        } else if (this.current === 'inventory') {
            content.appendChild(renderInventory());
        } else if (this.current === 'workshop') {
            content.appendChild(renderWorkshop());
        } else if (this.current === 'exchange') {
            content.appendChild(renderExchange());
        }
    },};
