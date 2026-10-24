#!/usr/bin/env node
/**
 * Browser-level tests for PC MINER (jsdom + a real static HTTP server).
 *
 * Unlike tests/validate.js (pure logic), this suite loads index.html,
 * executes the real script chain, clicks real buttons and asserts on the DOM.
 *
 * Run: npm run test:browser   (requires `npm install`)
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.ico': 'image/x-icon'
};

let passed = 0;
const failures = [];
const serverLog = [];

function assert(condition, message) {
    if (!condition) throw new Error(message || 'assertion failed');
}

function equal(actual, expected, message) {
    if (actual !== expected) {
        throw new Error((message || 'value mismatch') + ' (expected ' + expected + ', got ' + actual + ')');
    }
}

function close(actual, expected, epsilon, message) {
    if (Math.abs(actual - expected) > (epsilon || 1e-6)) {
        throw new Error((message || 'value mismatch') + ' (expected ~' + expected + ', got ' + actual + ')');
    }
}

async function test(name, fn) {
    try {
        await fn();
        passed += 1;
        console.log('  ✓ ' + name);
    } catch (err) {
        failures.push({ name, message: err.message });
        console.log('  ✗ ' + name + ' — ' + err.message);
    }
}

function startServer() {
    const server = http.createServer((req, res) => {
        const urlPath = decodeURIComponent(req.url.split('?')[0]);
        const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
        const filePath = path.join(ROOT, relative);
        if (!filePath.startsWith(ROOT)) {
            res.writeHead(403);
            res.end('forbidden');
            return;
        }
        fs.readFile(filePath, (err, data) => {
            if (err) {
                serverLog.push({ url: urlPath, status: 404 });
                res.writeHead(404, { 'content-type': 'text/plain' });
                res.end('not found');
                return;
            }
            serverLog.push({ url: urlPath, status: 200 });
            res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
            res.end(data);
        });
    });
    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

const scriptErrors = [];

function createVirtualConsole() {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (error) => {
        // jsdom's CSS parser is older than the stylesheets; ignore CSS warnings.
        if (/Could not parse CSS|Not implemented/i.test(error.message)) return;
        scriptErrors.push(error.message);
    });
    virtualConsole.on('error', (...args) => scriptErrors.push(args.join(' ')));
    return virtualConsole;
}

async function loadPage(baseUrl, seedSave) {
    const dom = await JSDOM.fromURL(baseUrl + '/index.html', {
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        virtualConsole: createVirtualConsole(),
        beforeParse(window) {
            window.__alerts = [];
            window.alert = (message) => window.__alerts.push(String(message));
            window.confirm = () => true;
            // Speed up the roulette animation for tests (still asynchronous).
            const nativeSetTimeout = window.setTimeout.bind(window);
            window.setTimeout = (fn, ms, ...rest) => nativeSetTimeout(fn, Math.min(Number(ms) || 0, 40), ...rest);
            if (seedSave) window.localStorage.setItem('pcMinerSave', seedSave);
        }
    });
    await waitForReady(dom);
    return dom;
}

async function waitForReady(dom) {
    const { window } = dom;
    if (window.document.readyState !== 'complete') {
        await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
}

function text(node) {
    return (node && node.textContent ? node.textContent : '').replace(/\s+/g, ' ').trim();
}

async function wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

(async function main() {
    const server = await startServer();
    const base = 'http://127.0.0.1:' + server.address().port;
    let dom = await loadPage(base);
    let win = dom.window;
    let doc = win.document;
    let ev = (code) => win.eval(code);

    const byText = (selector, needle) => Array.from(doc.querySelectorAll(selector))
        .find((node) => text(node).indexOf(needle) !== -1);
    const byExactText = (selector, needle) => Array.from(doc.querySelectorAll(selector))
        .find((node) => text(node) === needle);
    const clickText = (selector, needle) => {
        const node = byText(selector, needle);
        assert(node, 'cannot find ' + selector + ' containing "' + needle + '"');
        node.click();
        return node;
    };
    const clickExact = (selector, needle) => {
        const node = byExactText(selector, needle);
        assert(node, 'cannot find ' + selector + ' exactly "' + needle + '"');
        node.click();
        return node;
    };

    console.log('\nPC MINER — browser tests (jsdom)\n');

    await test('page boots and renders the Garage without errors', () => {
        equal(doc.title, 'PC MINER: CASES & HARDWARE', 'title');
        assert(text(doc.getElementById('content')).indexOf('Доход майнинга') !== -1, 'garage did not render');
        equal(doc.querySelectorAll('link[rel="stylesheet"]').length, 4, 'stylesheet count');
        equal(doc.querySelectorAll('#main-nav button').length, 7, 'navigation entries');
        equal(serverLog.filter((entry) => entry.status === 404).length, 0, 'no 404 for assets');
        equal(scriptErrors.length, 0, 'script errors: ' + scriptErrors.join(' | '));
    });

    await test('starter state matches the documented economy', () => {
        const snapshot = JSON.parse(ev('JSON.stringify({ money: state.money, rate: state.miningRate, max: state.maxStorage, pcs: state.computers.length, inv: state.inventory.length, power: state.computers[0].power })'));
        equal(snapshot.money, 50000, 'starter money');
        close(snapshot.rate, 1.5, 1e-9, 'mining rate');
        close(snapshot.max, 32400, 1e-6, 'storage capacity');
        equal(snapshot.pcs, 1, 'one PC');
        equal(snapshot.inv, 0, 'starter inventory is empty');
        equal(snapshot.power, 15, 'starter power');
        assert(text(doc.getElementById('content')).indexOf('5400.00') !== -1, 'hourly rate not shown');
        assert(doc.querySelector('[role="progressbar"]'), 'storage progressbar missing');
    });

    await test('bottom navigation opens every screen', () => {
        const screens = [
            ['cases', 'Кейсы'],
            ['workshop', 'Мастерская'],
            ['inventory', 'Инвентарь'],
            ['exchange', 'Обменник'],
            ['farm', 'Farm'],
            ['menu', 'Меню'],
            ['garage', 'Доход майнинга']
        ];
        screens.forEach(([screen, marker]) => {
            doc.querySelector('#main-nav button[data-screen="' + screen + '"]').click();
            assert(text(doc.getElementById('content')).indexOf(marker) !== -1, screen + ' screen missing marker');
            equal(ev('nav.current'), screen, 'current screen');
            const active = doc.querySelector('#main-nav button.active');
            assert(active && active.getAttribute('data-screen') === screen, 'active tab not set for ' + screen);
            equal(active.getAttribute('aria-current'), 'page', 'aria-current for ' + screen);
        });
    });

    await test('the 1s game loop accumulates BYTE in storage', async () => {
        ev('state.storage = 0; saveGame();');
        const before = ev('state.storage');
        await wait(1250);
        const after = ev('state.storage');
        assert(after > before, 'storage did not grow (' + before + ' -> ' + after + ')');
        assert(after <= ev('state.maxStorage'), 'storage exceeds capacity');
    });

    await test('Collect button moves storage into the balance', () => {
        ev('state.storage = 250; state.bytes = 0; state.achievements = {}; nav.show("garage"); refreshHUD();');
        clickText('button', 'Забрать');
        equal(ev('state.bytes'), 250, 'balance');
        equal(ev('state.storage'), 0, 'storage reset');
        equal(ev('state.achievements.firstMine'), true, 'firstMine unlocked');
        assert(text(doc.querySelector('#byteBalance')).indexOf('250') !== -1, 'HUD balance not refreshed');
    });

    await test('Exchange converts BYTE, validates input and logs history', () => {
        ev('resetGame(); state.bytes = 5000; nav.show("exchange");');
        const input = doc.getElementById('exchangeAmount');
        input.value = '5000';
        clickText('button', 'Обменять');
        equal(ev('state.coins'), 5, 'coins gained');
        equal(ev('state.bytes'), 0, 'bytes spent');
        assert(text(doc.getElementById('exchangeHistory')).indexOf('COIN') !== -1, 'history not rendered');

        win.__alerts = [];
        input.value = '-100';
        clickText('button', 'Обменять');
        assert(win.__alerts.length > 0, 'invalid amount was not rejected');
        equal(ev('state.coins'), 5, 'coins unchanged after invalid exchange');

        ev('state.bytes = 2500; nav.render();');
        clickText('button', 'Обменять всё');
        equal(ev('state.coins'), 7, 'exchange-all coins');
        equal(ev('state.bytes'), 500, 'exchange-all remainder');
    });

    await test('opening a case charges once, awards an item and cleans up the overlay', async () => {
        ev('resetGame(); state.money = 100000; state.inventory = []; nav.show("cases");');
        const before = ev('state.money');
        clickText('button', 'Открыть ×1');
        await wait(700);
        equal(ev('state.money'), before - 3000, 'case cost');
        equal(ev('state.inventory.length'), 1, 'item awarded');
        equal(ev('caseOpening'), false, 'opening flag released');
        equal(doc.querySelectorAll('.modal-overlay').length, 0, 'overlay removed');
    });

    await test('re-entrant case opening is blocked', () => {
        const before = ev('state.money');
        const invBefore = ev('state.inventory.length');
        ev('caseOpening = true; openCase(1, 1); caseOpening = false;');
        equal(ev('state.money'), before, 'no second charge');
        equal(ev('state.inventory.length'), invBefore, 'no extra reward');
    });

    await test('Inventory sells an item for half its price', () => {
        ev('nav.show("inventory")');
        const price = ev('getSellPrice(state.inventory[0])');
        const money = ev('state.money');
        clickText('button', 'Продать');
        equal(ev('state.inventory.length'), 0, 'item removed');
        equal(ev('state.money'), money + price, 'sale credited');
    });

    await test('Workshop installs a compatible part and recalculates income', () => {
        ev('resetGame(); state.inventory = [Object.assign({}, getItemById(102))]; nav.show("workshop");');
        const rateBefore = ev('state.miningRate');
        const row = Array.from(doc.querySelectorAll('.workshop-row'))
            .find((node) => text(node.querySelector('.slot-label')) === 'GPU');
        assert(row, 'GPU row missing');
        const select = row.querySelector('select');
        select.value = select.options[0].value;
        Array.from(row.querySelectorAll('button')).find((button) => text(button) === 'Установить').click();
        equal(ev('state.computers[0].components.gpu'), 102, 'new GPU installed');
        assert(ev('state.miningRate') > rateBefore, 'rate increased');
        equal(ev('state.inventory.length'), 1, 'old GPU returned');
        equal(ev('state.inventory[0].id'), 2, 'returned item is the old GPU');
    });

    await test('Workshop rejects an incompatible CPU', () => {
        ev('resetGame(); state.inventory = [Object.assign({}, getItemById(101))]; nav.show("workshop");');
        win.__alerts = [];
        const row = Array.from(doc.querySelectorAll('.workshop-row'))
            .find((node) => text(node.querySelector('.slot-label')) === 'CPU');
        const select = row.querySelector('select');
        select.value = select.options[0].value;
        Array.from(row.querySelectorAll('button')).find((button) => text(button) === 'Установить').click();
        equal(ev('state.computers[0].components.cpu'), 1, 'CPU unchanged');
        assert(win.__alerts.length > 0, 'compatibility error was not shown');
    });

    await test('Farm builds a PC and switches the active one', () => {
        ev('resetGame(); state.money = 50000; nav.show("farm");');
        clickText('button', 'Добавить ПК');
        equal(ev('state.computers.length'), 2, 'second PC built');
        equal(ev('state.money'), 25000, 'build cost');
        const cards = doc.querySelectorAll('.pc-card');
        equal(cards.length, 2, 'two cards rendered');
        Array.from(cards[1].querySelectorAll('button')).find((button) => text(button) === 'Выбрать').click();
        equal(ev('state.activePCId'), 2, 'active PC switched');
    });

    await test('Menu saves the exchange rate and persists the game', () => {
        ev('resetGame(); nav.show("menu");');
        const rateInput = doc.getElementById('exchangeRateInput');
        rateInput.value = '500';
        clickText('button', 'Сохранить курс');
        equal(ev('state.exchangeRate'), 500, 'rate applied');
        const saved = JSON.parse(win.localStorage.getItem('pcMinerSave'));
        equal(saved.exchangeRate, 500, 'rate persisted');
        assert(typeof saved.lastUpdate === 'number', 'lastUpdate persisted');
        win.__alerts = [];
        clickExact('button', 'Сохранить');
        assert(win.__alerts.some((message) => message.indexOf('сохранена') !== -1), 'save confirmation missing');
    });

    await test('a saved game reloads and applies offline progress', async () => {
        ev('resetGame(); state.bytes = 1000; state.storage = 0; saveGame();');
        const seed = JSON.parse(win.localStorage.getItem('pcMinerSave'));
        seed.lastUpdate = Date.now() - 3600 * 1000; // one hour away
        const dom2 = await loadPage(base, JSON.stringify(seed));
        try {
            equal(dom2.window.eval('state.bytes'), 1000, 'saved balance restored');
            const storage = dom2.window.eval('state.storage');
            close(storage, 5400, 120, 'one hour of offline income');
            assert(Math.abs(Date.now() - dom2.window.eval('state.lastUpdate')) < 5001, 'timestamp refreshed');
            assert(text(dom2.window.document.getElementById('content')).indexOf('Доход майнинга') !== -1, 'garage rendered after reload');
        } finally {
            dom2.window.close();
        }
    });

    await test('offline progress never exceeds storage capacity', async () => {
        ev('resetGame(); saveGame();');
        const seed = JSON.parse(win.localStorage.getItem('pcMinerSave'));
        seed.storage = 0;
        seed.lastUpdate = Date.now() - 10 * 3600 * 1000; // ten hours away
        const dom3 = await loadPage(base, JSON.stringify(seed));
        try {
            const state3 = JSON.parse(dom3.window.eval('JSON.stringify({ storage: state.storage, max: state.maxStorage })'));
            close(state3.storage, state3.max, 1e-6, 'offline income capped at capacity');
        } finally {
            dom3.window.close();
        }
    });

    await test('Reset returns to a clean starter game', () => {
        ev('nav.show("menu")');
        clickText('button', 'Сбросить прогресс');
        equal(ev('state.money'), 50000, 'money reset');
        equal(ev('state.bytes'), 0, 'bytes reset');
        equal(ev('state.computers.length'), 1, 'PC reset');
        equal(ev('state.level'), 1, 'level reset');
        equal(JSON.parse(win.localStorage.getItem('pcMinerSave')).money, 50000, 'reset persisted');
    });

    await test('markup stays accessible and free of inline handlers', () => {
        ev('nav.show("garage")');
        assert(doc.querySelectorAll('[onclick], [onload], [onerror]').length === 0, 'inline event handler found');
        equal(doc.getElementById('main-nav').getAttribute('aria-label'), 'Основная навигация', 'nav aria-label');
        Array.from(doc.querySelectorAll('button')).forEach((button) => {
            equal(button.getAttribute('type'), 'button', 'button without type: ' + text(button));
        });
        Array.from(doc.querySelectorAll('img')).forEach((image) => {
            assert(image.getAttribute('alt'), 'image without alt text');
        });
        const ids = Array.from(doc.querySelectorAll('[id]')).map((node) => node.id);
        equal(new Set(ids).size, ids.length, 'duplicate ids on Garage');
        ev('nav.show("exchange")');
        Array.from(doc.querySelectorAll('input')).forEach((input) => {
            assert(input.id, 'input without id');
            assert(doc.querySelector('label[for="' + input.id + '"]'), 'input without label: ' + input.id);
        });
        ev('nav.show("garage")');
        equal(doc.querySelectorAll('[onclick]').length, 0, 'inline handler after re-render');
    });

    await test('runs directly from file:// even when localStorage is unavailable', async () => {
        const fileDom = await JSDOM.fromFile(path.join(ROOT, 'index.html'), {
            runScripts: 'dangerously',
            resources: 'usable',
            pretendToBeVisual: true,
            virtualConsole: createVirtualConsole(),
            beforeParse(window) {
                window.alert = () => {};
                window.confirm = () => true;
                const nativeSetTimeout = window.setTimeout.bind(window);
                window.setTimeout = (fn, ms, ...rest) => nativeSetTimeout(fn, Math.min(Number(ms) || 0, 40), ...rest);
            }
        });
        try {
            await waitForReady(fileDom);
            const fileDoc = fileDom.window.document;
            assert(text(fileDoc.getElementById('content')).indexOf('Доход майнинга') !== -1, 'game did not boot from file://');
            equal(fileDom.window.eval('state.money'), 50000, 'starter money without storage');
        } finally {
            fileDom.window.close();
        }
    });

    await test('no serious accessibility violations (axe-core)', async () => {
        ev('nav.show("garage")');
        if (!win.axe) {
            win.eval(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
        }
        const results = await win.axe.run(doc, {
            resultTypes: ['violations'],
            rules: { 'color-contrast': { enabled: false } }
        });
        const serious = results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
        assert(serious.length === 0, serious.map((violation) => violation.id + ' (' + violation.nodes.length + ' nodes)').join(', '));
    });

    await test('no runtime errors were logged during the whole session', () => {
        equal(scriptErrors.length, 0, scriptErrors.join(' | '));
        equal(serverLog.filter((entry) => entry.status === 404).length, 0, '404 responses: ' + JSON.stringify(serverLog.filter((entry) => entry.status === 404)));
    });

    const total = passed + failures.length;
    if (failures.length > 0) {
        console.error('\n✗ Browser tests: ' + failures.length + ' of ' + total + ' failed\n');
        failures.forEach((failure) => console.error('  - ' + failure.name + ': ' + failure.message));
    } else {
        console.log('\n✓ All ' + total + ' browser tests passed.');
    }

    try { dom.window.close(); } catch (err) { /* already closed */ }
    server.close();
    process.exit(failures.length > 0 ? 1 : 0);
})().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
