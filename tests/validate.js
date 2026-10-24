#!/usr/bin/env node
/**
 * Headless compliance checks for PC MINER.
 * No dependencies: run with `node tests/validate.js`.
 *
 *  - static checks: referenced assets exist, no dangling APIs/inline handlers
 *  - logic checks: economy, storage, offline accrual, exchange, progression
 *  - smoke test: boots the game in a stubbed DOM and opens a case
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

let passed = 0;
const failures = [];

function check(name, fn) {
    try {
        fn();
        passed += 1;
    } catch (err) {
        failures.push(name + ': ' + err.message);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'assertion failed');
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error((message || 'value mismatch') + ' (expected ' + expected + ', got ' + actual + ')');
    }
}

function assertClose(actual, expected, epsilon, message) {
    if (Math.abs(actual - expected) > (epsilon || 1e-9)) {
        throw new Error((message || 'value mismatch') + ' (expected ~' + expected + ', got ' + actual + ')');
    }
}

// ---------- fake DOM ----------
function makeElement(tag) {
    const el = {
        tagName: String(tag).toUpperCase(),
        children: [],
        style: {},
        dataset: {},
        className: '',
        disabled: false,
        parentNode: null,
        attributes: {},
        appendChild(child) { child.parentNode = el; el.children.push(child); return child; },
        removeChild(child) {
            el.children = el.children.filter((node) => node !== child);
            child.parentNode = null;
            return child;
        },
        setAttribute(name, value) { el.attributes[name] = String(value); },
        getAttribute(name) { return Object.prototype.hasOwnProperty.call(el.attributes, name) ? el.attributes[name] : null; },
        addEventListener() {},
        querySelectorAll() { return []; },
        classList: { toggle() {}, add() {}, remove() {} }
    };
    let html = '';
    Object.defineProperty(el, 'innerHTML', {
        get() { return html; },
        set(value) { html = String(value); el.children = []; }
    });
    return el;
}

function createSandbox() {
    const storage = new Map();
    const timers = [];
    const alerts = [];
    const content = makeElement('main');
    const sandbox = {
        console: { log: console.log, error: console.error, warn: () => {} },
        Math,
        Date,
        JSON,
        Number,
        Object,
        Array,
        String,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        alert: (message) => alerts.push(String(message)),
        confirm: () => true,
        setTimeout: (fn) => { timers.push(fn); return timers.length; },
        clearTimeout: () => {},
        setInterval: () => 0,
        clearInterval: () => {},
        requestAnimationFrame: (fn) => { fn(); return 0; },
        localStorage: {
            getItem: (key) => (storage.has(key) ? storage.get(key) : null),
            setItem: (key, value) => storage.set(key, String(value)),
            removeItem: (key) => storage.delete(key)
        },
        document: {
            readyState: 'complete',
            hidden: false,
            body: makeElement('body'),
            getElementById: (id) => (id === 'content' || id === 'app-container' ? content : null),
            createElement: (tag) => makeElement(tag),
            querySelectorAll: () => [],
            addEventListener: () => {}
        },
        addEventListener: () => {}
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    return { sandbox, storage, timers, alerts, content };
}

// ---------- static checks ----------
const JS_FILES = ['js/data/items.js', 'js/data/cases.js', 'js/state.js', 'js/navigation.js', 'js/ui.js', 'js/main.js'];
const CSS_FILES = ['css/style.css', 'css/components.css', 'css/animations.css', 'css/garage.css'];

check('all JS files referenced by index.html exist and parse', () => {
    const html = read('index.html');
    const refs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
    assert(refs.length >= 6, 'index.html should load the full script chain');
    refs.forEach((ref) => {
        assert(exists(ref), 'missing script ' + ref);
        new vm.Script(read(ref), { filename: ref });
    });
    assert(refs.indexOf('js/data/items.js') < refs.indexOf('js/state.js'), 'items.js must load before state.js');
    assert(refs.indexOf('js/data/cases.js') < refs.indexOf('js/main.js'), 'cases.js must load before main.js');
});

check('all CSS files referenced by index.html exist', () => {
    const html = read('index.html');
    const refs = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((match) => match[1]);
    assert(refs.length >= 4, 'index.html should link every stylesheet');
    refs.forEach((ref) => assert(exists(ref), 'missing stylesheet ' + ref));
});

check('every JS and CSS file on disk is loaded by index.html', () => {
    const html = read('index.html');
    JS_FILES.concat(CSS_FILES).forEach((file) => {
        assert(html.indexOf('"' + file + '"') !== -1, file + ' is never referenced');
    });
});

check('item icons exist on disk', () => {
    const html = read('js/data/items.js');
    const images = [...html.matchAll(/image:\s*"([^"]+)"/g)].map((match) => match[1]);
    assert(images.length > 0, 'no item images found');
    images.forEach((image) => assert(exists(image), 'missing icon ' + image));
});

check('no inline event handlers or inline styles in markup', () => {
    ['index.html', 'js/ui.js'].forEach((file) => {
        const source = read(file);
        assert(!/\son(click|load|error|change)=/.test(source), file + ' still contains inline event handlers');
        assert(!/\sstyle="/.test(source), file + ' still contains inline style attributes');
    });
});

check('no references to removed/broken APIs', () => {
    JS_FILES.forEach((file) => {
        const source = read(file);
        ['totalWeight', 'itemPool', 'casesOwned', 'collectCoins'].forEach((token) => {
            assert(source.indexOf(token) === -1, file + ' references stale API ' + token);
        });
    });
});

check('single source of truth for save key and economy constants', () => {
    const stateSource = read('js/state.js');
    assert(/const SAVE_KEY = 'pcMinerSave'/.test(stateSource), 'SAVE_KEY missing');
    assert(/MINING_FACTOR = 0\.1/.test(stateSource), 'mining factor must stay 0.1');
    assert(/STORAGE_HOURS = 6/.test(stateSource), 'storage must hold 6 hours');
    assert(/DEFAULT_EXCHANGE_RATE = 1000/.test(stateSource), 'default exchange rate must be 1000');
});

check('every data-action used in markup has a handler', () => {
    const sources = [read('index.html'), read('js/ui.js')].join('\n');
    const actions = new Set([...sources.matchAll(/data-action="([a-z0-9-]+)"/g)].map((match) => match[1]));
    assert(actions.size > 0, 'no data-action attributes found');
    const handlerSource = read('js/ui.js');
    actions.forEach((action) => {
        assert(handlerSource.indexOf("case '" + action + "':") !== -1, 'no handler for data-action="' + action + '"');
    });
});

check('index.html exposes the container and navigation ids used by the app', () => {
    const html = read('index.html');
    assert(/id="content"/.test(html), 'missing #content container');
    assert(/id="main-nav"/.test(html), 'missing #main-nav');
    assert(/<html lang="ru">/.test(html), 'missing language attribute');
    assert(/<meta charset="UTF-8">/.test(html), 'missing charset');
    assert(/<meta name="viewport"/.test(html), 'missing viewport');
});

check('index.html uses relative asset paths (deployable from any subpath)', () => {
    const html = read('index.html');
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    assert(refs.length > 0, 'no asset references found');
    refs.forEach((ref) => {
        assert(!/^(\/|[a-z]+:)/i.test(ref), 'absolute asset path breaks subpath hosting: ' + ref);
    });
});

// ---------- boot in a stubbed DOM ----------
const env = createSandbox();
const context = vm.createContext(env.sandbox);
const run = (code) => vm.runInContext(code, context);
JS_FILES.forEach((file) => {
    new vm.Script(read(file), { filename: file }).runInContext(context);
});

function drainTimers(limit) {
    let count = 0;
    while (env.timers.length > 0 && count < (limit || 100)) {
        env.timers.shift()();
        count += 1;
    }
}

const ITEMS = env.sandbox.ITEMS;
const CASES = env.sandbox.CASES;

check('game boots with the starter PC', () => {
    assert(Array.isArray(ITEMS) && ITEMS.length > 0, 'ITEMS not exposed');
    assert(Array.isArray(CASES) && CASES.length > 0, 'CASES not exposed');
    assertEqual(run('state.money'), 50000, 'starter money');
    assertEqual(run('state.computers.length'), 1, 'starter PC count');
    assertEqual(run('state.computers[0].components.cpu'), 1, 'starter CPU');
    assert(env.content.children.length >= 2, 'garage screen was not rendered');
});

check('item catalog is internally consistent', () => {
    const ids = new Set();
    const categories = ['cpu', 'gpu', 'mobo', 'ram', 'storage', 'psu', 'case'];
    const rarities = ['gray', 'blue', 'purple', 'yellow', 'red', 'black'];
    ITEMS.forEach((item) => {
        assert(!ids.has(item.id), 'duplicate item id ' + item.id);
        ids.add(item.id);
        assert(typeof item.name === 'string' && item.name.length > 0, 'item ' + item.id + ' has no name');
        assert(categories.indexOf(item.category) !== -1, 'item ' + item.id + ' has invalid category');
        assert(rarities.indexOf(item.rarity) !== -1, 'item ' + item.id + ' has invalid rarity');
        assert(Number.isFinite(item.price) && item.price >= 0, 'item ' + item.id + ' has invalid price');
        assert(Number.isFinite(item.power) && item.power >= 0, 'item ' + item.id + ' has invalid power');
        assert(item.type === 'hardware', 'item ' + item.id + ' must be hardware');
    });
});

check('every case entry points at an existing item with positive weight', () => {
    const ids = new Set(ITEMS.map((item) => item.id));
    CASES.forEach((gameCase) => {
        assert(Number.isFinite(gameCase.price) && gameCase.price > 0, 'case ' + gameCase.id + ' has invalid price');
        assert(Array.isArray(gameCase.contents) && gameCase.contents.length > 0, 'case ' + gameCase.id + ' is empty');
        gameCase.contents.forEach((entry) => {
            assert(ids.has(entry.itemId), 'case ' + gameCase.id + ' references missing item ' + entry.itemId);
            assert(Number.isFinite(entry.weight) && entry.weight > 0, 'case ' + gameCase.id + ' has a zero-weight entry');
        });
    });
});

// ---------- economy and mining ----------
check('starter PC power and mining rate follow the GDD formula', () => {
    run('resetGame()');
    assertEqual(run('state.computers[0].power'), 15, 'starter power (5+8+1+1)');
    assertClose(run('state.miningRate'), 1.5, 1e-9, 'rate = power * 0.1');
    assertClose(run('state.maxStorage'), 1.5 * 3600 * 6, 1e-6, 'storage = 6h of income');
});

check('an empty PC has zero power (no free income)', () => {
    run('resetGame(); state.computers.push({ id: 99, name: "Empty", components: {}, power: 0 }); updateMiningStats();');
    assertEqual(run('state.computers[1].power'), 0, 'empty PC power');
    assertClose(run('state.miningRate'), 1.5, 1e-9, 'empty PC must not add income');
});

check('power sums every installed component', () => {
    assertEqual(run('calculatePower({ components: { cpu: 101, gpu: 102 } })'), 42, '12 + 30');
    assertEqual(run('calculatePower({})'), 0, 'empty object');
    assertEqual(run('calculatePower(null)'), 0, 'null PC');
    assertEqual(run('calculatePower({ components: { cpu: 999 } })'), 0, 'unknown item');
});

check('mining tick fills storage and never exceeds capacity', () => {
    run('resetGame(); tickMining(60)');
    assertClose(run('state.storage'), 90, 1e-9, '60s * 1.5 BYTE/s');
    run('state.storage = state.maxStorage - 1; tickMining(3600)');
    assertClose(run('state.storage'), run('state.maxStorage'), 1e-9, 'storage must cap at maxStorage');
});

check('downgrading hardware clamps stored BYTE to the new capacity', () => {
    run('resetGame(); state.storage = state.maxStorage; state.computers[0].components.cpu = null; updateMiningStats();');
    assert(run('state.storage') <= run('state.maxStorage'), 'storage exceeded capacity after downgrade');
    assertClose(run('state.maxStorage'), 1.0 * 3600 * 6, 1e-6, 'capacity recalculated without the CPU');
});

check('offline progress accrues only up to storage capacity', () => {
    run('resetGame(); state.storage = 0; state.lastUpdate = Date.now() - 100000 * 1000;');
    run('applyOfflineProgress()');
    assertClose(run('state.storage'), run('state.maxStorage'), 1e-6, 'offline gain must be capped');
    assert(run('state.lastUpdate') <= Date.now(), 'lastUpdate must not be in the future');
    assert(run('Number.isFinite(state.lastUpdate)'), 'lastUpdate must stay finite');
});

check('offline progress with zero mining rate is safe', () => {
    run('resetGame(); state.computers[0].components = {}; updateMiningStats(); state.storage = 0; state.lastUpdate = Date.now() - 5000 * 1000;');
    run('applyOfflineProgress()');
    assertEqual(run('state.miningRate'), 0, 'rate');
    assertEqual(run('state.storage'), 0, 'storage');
    assert(run('Number.isFinite(state.storage) && Number.isFinite(state.lastUpdate)'), 'no NaN/Infinity allowed');
});

check('collect moves storage into the balance and unlocks achievements', () => {
    run('resetGame(); state.storage = 2500; collectBytes();');
    assertEqual(run('state.bytes'), 2500, 'balance after collect');
    assertEqual(run('state.storage'), 0, 'storage after collect');
    assertEqual(run('state.achievements.firstMine'), true, 'firstMine achievement');
    assertEqual(run('state.achievements.firstThousand'), true, 'firstThousand achievement');
    assert(run('Number.isFinite(state.lastUpdate)'), 'lastUpdate must be refreshed');
});

// ---------- exchange ----------
check('exchange uses the configured rate and logs history', () => {
    run('resetGame(); state.bytes = 5000; state.exchangeRate = 1000; exchangeBytesToCoins(5000);');
    assertEqual(run('state.bytes'), 0, 'spent BYTE');
    assertEqual(run('state.coins'), 5, 'gained COIN');
    assertEqual(run('state.exchangeLog.length'), 1, 'history entry');
    assertEqual(run('state.exp'), 10, 'exchange awards experience');
});

check('exchange rejects invalid amounts without changing the balance', () => {
    run('resetGame(); state.bytes = 5000;');
    [0, -100, 1.5, 999, 6000, NaN].forEach((amount) => {
        assertEqual(run('exchangeBytesToCoins(' + String(amount) + ')'), null, 'amount ' + amount + ' must be rejected');
    });
    assertEqual(run('state.bytes'), 5000, 'balance must be untouched');
    assertEqual(run('state.coins'), 0, 'coins must be untouched');
    assertEqual(run('state.exchangeLog.length'), 0, 'no history entry for failed exchanges');
});

check('exchange history is capped', () => {
    run('resetGame(); state.bytes = 1e9; for (let i = 0; i < 70; i++) exchangeBytesToCoins(1000);');
    assertEqual(run('state.exchangeLog.length'), 50, 'history cap');
});

// ---------- progression ----------
check('experience levels up repeatedly without losing the remainder', () => {
    run('resetGame(); addExp(5000)');
    assertEqual(run('state.level'), 3, 'level after 5000 exp');
    assertEqual(run('state.exp'), 2000, 'leftover exp');
    assertEqual(run('expNeeded(3)'), 3000, 'next level requirement');
});

check('addExp ignores invalid amounts', () => {
    run('resetGame(); addExp(0); addExp(-50); addExp(NaN);');
    assertEqual(run('state.exp'), 0, 'exp unchanged');
    assertEqual(run('state.level'), 1, 'level unchanged');
});

// ---------- compatibility ----------
check('workshop blocks incompatible CPU, RAM and motherboard combinations', () => {
    assert(run('checkCompatibility(state.computers[0], "cpu", getItemById(101))') !== null, 'LGA1200 CPU on LGA1151 board');
    assert(run('checkCompatibility(state.computers[0], "ram", getItemById(104))') !== null, 'DDR4 RAM on DDR3 board');
    assert(run('checkCompatibility(state.computers[0], "cpu", getItemById(1))') === null, 'basic CPU fits');
    assert(run('checkCompatibility(state.computers[0], "ram", getItemById(4))') === null, 'DDR3 RAM fits');
    assert(run('checkCompatibility(state.computers[0], "mobo", getItemById(103))') !== null, 'DDR3 sticks block DDR4 board');
});

check('compatible motherboard swap is allowed once parts match', () => {
    assert(run('checkCompatibility({ components: { cpu: 101, ram: 104 } }, "mobo", getItemById(103))') === null, 'matching LGA1200/DDR4 build');
});

// ---------- cases ----------
check('case rolls only return items from the case pool', () => {
    const allowed = new Set([1, 2, 4]);
    for (let i = 0; i < 300; i++) {
        const item = env.sandbox.rollCaseItem(CASES[0]);
        assert(item && allowed.has(item.id), 'unexpected drop ' + (item && item.id));
    }
    assertEqual(env.sandbox.rollCaseItem({ contents: [] }), null, 'empty case returns null');
});

check('case prices cannot be arbitraged by reselling contents', () => {
    CASES.forEach((gameCase) => {
        const weightSum = gameCase.contents.reduce((sum, entry) => sum + entry.weight, 0);
        const expectedValue = gameCase.contents.reduce((sum, entry) => {
            const item = ITEMS.find((candidate) => candidate.id === entry.itemId);
            return sum + (entry.weight / weightSum) * item.price * 0.5;
        }, 0);
        assert(gameCase.price > expectedValue, gameCase.name + ' can be resold for a profit (' + expectedValue.toFixed(0) + ' vs ' + gameCase.price + ')');
    });
});

check('opening a case charges once and awards every item', () => {
    run('resetGame(); state.money = 100000; state.inventory = []; openCase(1, 3);');
    drainTimers();
    assertEqual(run('state.money'), 91000, 'charged 3 x 3000');
    assertEqual(run('state.inventory.length'), 3, 'three items awarded');
    assertEqual(run('caseOpening'), false, 'opening flag released');
    assertEqual(run('state.exp'), 15, '5 exp per case');
});

check('opening a case without enough money changes nothing', () => {
    run('resetGame(); state.money = 100; state.inventory = []; openCase(1, 1);');
    drainTimers();
    assertEqual(run('state.money'), 100, 'money untouched');
    assertEqual(run('state.inventory.length'), 0, 'no reward');
    assertEqual(run('caseOpening'), false, 'flag stays released');
});

check('selling an item returns half its price', () => {
    run('resetGame(); state.money = 0; state.inventory = [Object.assign({}, getItemById(2))]; sellItem(0);');
    assertEqual(run('state.money'), 4000, 'Basic GPU sells for 50% of 8000');
    assertEqual(run('state.inventory.length'), 0, 'item removed');
});

check('installing a component swaps inventory and recalculates income', () => {
    run('resetGame(); state.money = 0; state.inventory = [Object.assign({}, getItemById(102))];');
    const beforeRate = run('state.miningRate');
    run('installComponent(state.computers[0], "gpu", 0)');
    assertEqual(run('state.computers[0].components.gpu'), 102, 'new GPU installed');
    assert(run('state.miningRate') > beforeRate, 'income increased');
    assertEqual(run('state.inventory.length'), 1, 'old GPU returned to inventory');
    assertEqual(run('state.inventory[0].id'), 2, 'returned item is the previous GPU');
});

check('installing an incompatible part is rejected', () => {
    run('resetGame(); state.inventory = [Object.assign({}, getItemById(101))];');
    run('installComponent(state.computers[0], "cpu", 0)');
    assertEqual(run('state.computers[0].components.cpu'), 1, 'CPU unchanged');
    assertEqual(run('state.inventory.length'), 1, 'item stays in inventory');
});

check('farm rejects a new PC when funds are short', () => {
    run('resetGame(); state.money = 0; addComputer();');
    assertEqual(run('state.computers.length'), 1, 'no free PC');
    run('state.money = 50000; addComputer();');
    assertEqual(run('state.computers.length'), 2, 'PC added when affordable');
    assertEqual(run('state.money'), 25000, 'build cost charged');
});

// ---------- persistence ----------
check('save and load round-trip preserves progress', () => {
    run('resetGame(); state.money = 12345; state.bytes = 777; saveGame();');
    run('state.money = 0; state.bytes = 0; loadGame();');
    assertEqual(run('state.money'), 12345, 'money restored');
    assertEqual(run('state.bytes'), 777, 'BYTE restored');
});

check('corrupted save data falls back to a fresh game', () => {
    env.storage.set('pcMinerSave', '{not json');
    run('loadGame()');
    assertEqual(run('state.money'), 50000, 'defaults restored');
    assertEqual(run('state.level'), 1, 'level reset');
});

check('legacy or partial saves are normalised', () => {
    env.storage.set('pcMinerSave', JSON.stringify({ money: 'oops', level: 0, exchangeRate: -5, computers: [], inventory: 'x' }));
    run('loadGame()');
    assertEqual(run('state.money'), 50000, 'invalid money replaced');
    assert(run('state.level') >= 1, 'level clamped');
    assert(run('state.exchangeRate') >= 1, 'exchange rate clamped');
    assertEqual(run('state.computers.length'), 1, 'at least one PC restored');
    assert(Array.isArray(run('state.inventory')), 'inventory restored as array');
    assertEqual(run('state.activePCId'), run('state.computers[0].id'), 'active PC repaired');
});

check('reset restores the full starter kit', () => {
    run('state.money = 1; state.bytes = 999; resetGame();');
    assertEqual(run('state.money'), 50000, 'money');
    assertEqual(run('state.bytes'), 0, 'BYTE');
    assertEqual(run('state.computers[0].components.case'), 7, 'starter case');
});

// ---------- formatting ----------
check('HUD formatting handles empty and zero values', () => {
    assertEqual(run('formatDuration(3661)'), '1ч 1м 1с', 'duration');
    assertEqual(run('formatDuration(0)'), '—', 'zero duration');
    assertEqual(run('formatDuration(NaN)'), '—', 'invalid duration');
    assertEqual(run('formatNumber(1234.6)').replace(/\s/g, ''), '1235', 'rounding');
    assertEqual(run('formatNumber(NaN)'), '0', 'invalid number');
});

check('every screen renders without throwing', () => {
    run('resetGame(); state.inventory = [Object.assign({}, getItemById(102))]; state.bytes = 5000; state.exchangeLog = [{ time: Date.now(), bytes: 1000, coins: 1 }];');
    ['garage', 'cases', 'workshop', 'inventory', 'exchange', 'farm', 'menu'].forEach((screen) => {
        run('nav.show("' + screen + '")');
        assert(env.content.children.length > 0, screen + ' rendered nothing');
        assertEqual(run('nav.current'), screen, 'navigation state for ' + screen);
    });
    run("nav.show('does-not-exist')");
    assertEqual(run('nav.current'), 'garage', 'unknown screen falls back to garage');
});

check('a long simulated session keeps every invariant', () => {
    run('resetGame(); state.money = 200000;');
    for (let i = 0; i < 3000; i++) {
        run('tickMining(1)');
        if (i % 300 === 299) run('collectBytes()');
        if (i % 400 === 0) run('openCase(2, 1)');
        if (i % 500 === 499) drainTimers();
    }
    drainTimers();
    const snapshot = run('({ storage: state.storage, max: state.maxStorage, rate: state.miningRate, bytes: state.bytes, coins: state.coins, money: state.money, level: state.level, exp: state.exp, inventory: state.inventory.length, nextLevel: expNeeded(state.level) })');
    Object.keys(snapshot).forEach((key) => {
        assert(Number.isFinite(snapshot[key]), key + ' is not finite');
    });
    assert(snapshot.storage <= snapshot.max + 1e-9, 'storage exceeded capacity');
    assert(snapshot.bytes >= 0 && snapshot.coins >= 0 && snapshot.money >= 0, 'negative balance');
    assert(snapshot.level >= 1 && snapshot.exp < snapshot.nextLevel, 'experience out of range');
    assert(snapshot.rate > 0, 'mining stopped unexpectedly');
});

check('idle time at zero rate is never credited retroactively', () => {
    run('resetGame(); state.computers[0].components = {}; updateMiningStats(); state.storage = 0; state.lastUpdate = Date.now() - 3600 * 1000;');
    run('tickMining(1)');
    assert(Math.abs(Date.now() - run('state.lastUpdate')) < 2000, 'tick must refresh lastUpdate even at zero rate');
    run('state.computers[0].components.cpu = 1; updateMiningStats(); applyOfflineProgress();');
    assertEqual(run('state.storage'), 0, 'installing the first part must not back-pay idle time');
});

// ---------- summary ----------
const total = passed + failures.length;
if (failures.length > 0) {
    console.error('\n✗ ' + failures.length + ' of ' + total + ' checks failed:\n');
    failures.forEach((failure) => console.error('  - ' + failure));
    process.exit(1);
}
console.log('✓ All ' + total + ' checks passed.');
