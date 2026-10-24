#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
let passed = 0;
const failures = [];
function check(name, fn) { try { fn(); passed += 1; } catch (err) { failures.push(name + ': ' + err.message); } }
function assert(condition, message) { if (!condition) throw new Error(message || 'assertion failed'); }
function assertEqual(actual, expected, message) { if (actual !== expected) throw new Error((message || 'value mismatch') + ' (expected ' + expected + ', got ' + actual + ')'); }
function assertClose(actual, expected, epsilon, message) { if (Math.abs(actual - expected) > (epsilon || 1e-9)) throw new Error((message || 'value mismatch') + ' (expected ~' + expected + ', got ' + actual + ')'); }
// Minimal suite covering critical economy + case coverage after the update
check('item icons exist', () => {
  const src = read('js/data/items.js');
  const images = [...src.matchAll(/image:\s*"([^"]+)"/g)].map(m => m[1]);
  assert(images.length > 0, 'no images');
  images.forEach(img => assert(exists(img), 'missing ' + img));
});
check('all cases reference existing items and EV below price', () => {
  global.window = {};
  eval(read('js/data/items.js'));
  eval(read('js/data/cases.js'));
  const ITEMS = window.ITEMS, CASES = window.CASES;
  const ids = new Set(ITEMS.map(i => i.id));
  CASES.forEach(c => {
    assert(c.price > 0, 'bad price');
    const w = c.contents.reduce((s, e) => s + e.weight, 0);
    let ev = 0;
    c.contents.forEach(e => {
      assert(ids.has(e.itemId), 'missing item ' + e.itemId);
      const it = ITEMS.find(i => i.id === e.itemId);
      ev += (e.weight / w) * it.price * 0.5;
    });
    assert(c.price > ev, c.name + ' arbitrage');
  });
  const covered = new Set();
  CASES.forEach(c => c.contents.forEach(e => covered.add(e.itemId)));
  assert(covered.size === ids.size, 'not all items in cases');
  assert(CASES.some(c => c.price === 500000), 'elite case missing');
});
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('✓ All ' + passed + ' checks passed.');
