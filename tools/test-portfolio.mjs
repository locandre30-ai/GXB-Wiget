import assert from 'node:assert/strict';
import test from 'node:test';
import { accountTotals, cleanPortfolio, depositCash, newPaperPortfolio, portfolioReplay, savePortfolioWeek } from '../arena/portfolio.mjs';
import { exportBook, importBook, newProfile, validateBook } from '../arena/store.mjs';

test('linked week reserves cash, restores open positions, and posts each trade only once', async () => {
  const account = newPaperPortfolio(1000);
  const run = { id: 'week-1', funding: 1000, complete: false };
  const replay = await portfolioReplay('stocks', run);
  const close = replay.snapshot().latest.close;
  const order = { type: 'entry', side: 'long', stop: close - 30, target: close + 30, fee: 1, quantity: 1, slippage: 0 };
  assert.throws(() => replay.order({ ...order, quantity: 3 }), /available paper cash/);
  replay.order(order);
  replay.step();
  const active = replay.snapshot().paper;
  assert.ok(active.position);
  assert.ok(accountTotals(account, active).available < 600);
  savePortfolioWeek(account, run, replay.checkpoint(), active);
  assert.throws(() => depositCash(account, 200, 'deposit-1'), /Finish the active/);
  assert.throws(() => savePortfolioWeek(account, { ...run, id: 'week-2' }, replay.checkpoint(), active), /active practice week/);
  const saved = cleanPortfolio({ stocks: account });
  const resumed = await portfolioReplay('stocks', saved.stocks.run);
  assert.deepEqual(resumed.snapshot(), replay.snapshot());
  while (resumed.step()) {}
  resumed.settle();
  const terminal = resumed.snapshot();
  assert.equal(terminal.paper.position, null);
  assert.equal(terminal.paper.closed[0].reason, 'Week-end settlement');
  run.complete = true;
  savePortfolioWeek(account, run, resumed.checkpoint(), terminal.paper);
  savePortfolioWeek(account, run, resumed.checkpoint(), terminal.paper);
  assert.equal(account.ledger.length, 1);
  assert.equal(accountTotals(account).cash, 1000 + terminal.paper.closed[0].net);
  assert.equal(accountTotals(account).fees, 2);
  depositCash(account, 200, 'deposit-1');
  assert.equal(accountTotals(account).deposits, 200);
});

test('portfolio backup round-trips independent profiles and market ledgers', () => {
  const one = newProfile('One', 'beginner'), two = newProfile('Two', 'beginner');
  one.portfolio.gold = newPaperPortfolio(2500);
  one.portfolio.stocks = newPaperPortfolio(1000);
  depositCash(one.portfolio.gold, 500, 'deposit-1');
  const book = validateBook({ version: 1, active: 'one', profiles: { one, two }, imports: [] });
  const restored = importBook({ version: 1, active: null, profiles: {}, imports: [] }, exportBook(book));
  assert.deepEqual(restored, book);
  assert.equal(accountTotals(restored.profiles.one.portfolio.gold).cash, 3000);
  assert.equal(accountTotals(restored.profiles.one.portfolio.stocks).cash, 1000);
  assert.deepEqual(restored.profiles.two.portfolio, {});
});
