const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../practice.html'), 'utf8');
const source = html.slice(html.indexOf('    function drawChart('), html.indexOf('    // celebratory particles'));
function render(future, revealed = []) {
  const calls = [];
  const cctx = new Proxy({}, {
    get: (_, name) => (...args) => calls.push([name, ...args]),
    set: (_, name, value) => { calls.push([name, value]); return true; }
  });
  const bars = [{ o: 10, h: 12, l: 8, c: 11 }, { o: 11, h: 13, l: 9, c: 10 }];
  const context = { bars, revealed, sc: { future, lines: { entry: 10 }, assist: [{ p: 12, c: '#fff', l: 'Structure' }] },
    cctx, chart: { width: 400, height: 240 }, ST: { mode: 'guided' }, DPR: 1, CANDLES: ['#fff', '#000'] };
  vm.runInNewContext(source + 'drawChart(bars, revealed, sc);', context);
  return JSON.parse(JSON.stringify(calls));
}
const calm = { o: 10, h: 14, l: 7, c: 12 };
const extreme = { o: 500, h: 50000, l: -9000, c: 1100 };
assert.deepEqual(render([calm]), render([extreme, extreme]), 'Unrevealed prices and count must leave all draw calls unchanged');
assert.deepEqual(render([calm, calm], [calm]), render([calm, extreme, extreme], [calm]), 'The still-hidden tail cannot affect a partially revealed chart');
assert.notDeepEqual(render([calm]), render([calm], [calm]), 'Revealed prices participate in rendering');
console.log('PASS: legacy chart geometry is invariant to unrevealed prices and length, before and during reveal.');
