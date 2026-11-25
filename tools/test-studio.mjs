import test from 'node:test';
import assert from 'node:assert/strict';
import { createReplay, datasetId, parseReplayFile } from '../arena/replay.mjs';

const meta = { market: 'stocks', symbol: 'SPY', source: 'Synthetic test fixture', minutes: 1 };
const header = 'timestamp,open,high,low,close,volume';
const start = Date.parse('2026-01-05T14:30:00Z');
const row = (i, open = 100 + i, volume = 10) =>
  [new Date(start + i * 60000).toISOString(), open, open + 2, open - 1, open + 1, volume].join(',');
const csv = lines => [header, ...lines].join('\n');
const prefix = Array.from({ length: 27 }, (_, i) => row(i));
const standard = csv([...prefix, row(27), row(28)]);
const changed = csv([...prefix, row(27, 100000, 800000), row(28), row(29), row(30)]);

test('unrevealed suffix prices, volumes and length cannot change any visible replay state', () => {
  const a = createReplay(parseReplayFile(standard, meta), 'a');
  const b = createReplay(parseReplayFile(changed, meta), 'b');
  a.setInterval(5);
  b.setInterval(5);
  for (let i = 1; i <= prefix.length; i++) {
    assert.deepEqual(a.snapshot(), b.snapshot());
    if (i < prefix.length) {
      assert.equal(a.step(), true);
      assert.equal(b.step(), true);
    }
  }
  assert.equal(a.snapshot().bars.at(-1).partial, true);
  assert.equal(a.snapshot().sma5, 115);
  assert.equal(a.snapshot().time, start + 27 * 60000);
  a.step();
  b.step();
  assert.notDeepEqual(a.snapshot(), b.snapshot());
});

test('checkpoint restores the exact revealed prefix and interval for the original file', async () => {
  const dataset = parseReplayFile(changed, meta);
  const id = await datasetId(changed, dataset.metadata);
  const a = createReplay(dataset, id);
  a.setInterval(5);
  a.step();
  const checkpoint = a.checkpoint();
  const b = createReplay(dataset, id, JSON.parse(JSON.stringify(checkpoint)));
  assert.deepEqual(a.snapshot(), b.snapshot());
  assert.notEqual(id, await datasetId(standard, dataset.metadata));
  assert.throws(() => createReplay(dataset, 'different', checkpoint), /does not match/);
  assert.throws(() => createReplay(dataset, id, { ...checkpoint, cursor: -1 }), /does not match/);
});

test('market, provenance, intervals and candle rows are validated', () => {
  const rows = csv([row(0), row(1)]);
  assert.equal(parseReplayFile(rows, { ...meta, market: 'gold', symbol: 'XAU/USD' }).metadata.symbol, 'XAU/USD');
  assert.throws(() => parseReplayFile(rows, { ...meta, source: ' ' }), /source name/);
  assert.throws(() => parseReplayFile(rows, { ...meta, market: 'gold' }), /symbol/);
  assert.throws(() => parseReplayFile(rows, { ...meta, minutes: 5 }), /aligned/);
  assert.throws(() => parseReplayFile(csv([row(0), row(0)]), meta), /increasing/);
  assert.throws(() => parseReplayFile(csv([row(0), row(1).replace('01-05', '02-31')]), meta), /UTC timestamp/);
  assert.throws(() => parseReplayFile(csv([row(0), row(1).replace(',103,', ',1,')]), meta), /OHLCV/);
  assert.throws(() => parseReplayFile(rows.replace('volume', 'secret'), meta), /CSV columns/);
});

test('same revealed inputs preserve paper plans, pending orders and fills until the changed event', async () => {
  const normal = parseReplayFile(standard, meta);
  const unusual = parseReplayFile(changed, meta);
  const id = await datasetId(standard, normal.metadata);
  const a = createReplay(normal, id);
  const b = createReplay(unusual, 'unusual');
  a.setInterval(5);
  b.setInterval(5);
  for (let i = 1; i < prefix.length; i++) { a.step(); b.step(); }
  const command = { type: 'entry', side: 'long', quantity: 2, stop: 126, target: 129, fee: .5, slippage: 0 };
  a.order(command);
  b.order(command);
  assert.deepEqual(a.snapshot(), b.snapshot());
  assert.equal(a.snapshot().paper.position, null);
  assert.equal(a.snapshot().paper.closed.length, 0);
  const resumed = createReplay(normal, id, a.checkpoint());
  assert.deepEqual(resumed.snapshot(), a.snapshot());
  a.step();
  b.step();
  resumed.step();
  assert.deepEqual(a.snapshot(), resumed.snapshot());
  assert.equal(a.snapshot().paper.closed[0].reason, 'Stop');
  assert.equal(a.snapshot().paper.realized, -3);
  assert.equal(b.snapshot().paper.closed.length, 0);
  assert.match(b.snapshot().paper.message, /outside the bracket/);
});

test('short fill, fee and slippage, manual next-open exit, and invalid commands', () => {
  const dataset = parseReplayFile(csv([row(0), row(1), row(2), row(3)]), meta);
  const replay = createReplay(dataset, 'example');
  const order = { type: 'entry', side: 'short', quantity: 4, stop: 110, target: 90, fee: 1, slippage: 10 };
  assert.throws(() => replay.order({ ...order, stop: 95 }), /bracket/);
  assert.throws(() => replay.order({ type: 'exit' }), /unavailable/);
  replay.order(order);
  replay.order({ type: 'cancel' });
  assert.equal(replay.snapshot().paper.pending, null);
  replay.order(order);
  replay.step();
  assert.equal(replay.snapshot().paper.position.entry, 101 * .999);
  replay.order({ type: 'exit' });
  assert.equal(replay.snapshot().paper.closed.length, 0);
  replay.step();
  assert.equal(replay.snapshot().paper.closed[0].exit, 102 * 1.001);
  assert.equal(replay.snapshot().paper.realized, (101 * .999 - 102 * 1.001) * 4 - 2);
});
