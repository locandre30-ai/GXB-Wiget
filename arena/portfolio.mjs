import { createReplay, datasetId } from './replay.mjs';
import { practiceWeek } from './studio-week.mjs';
const MARKETS = ['gold', 'stocks'];
const validMoney = value => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1e9;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const uid = /^[a-z0-9-]{1,80}$/i;

export function cleanPortfolio(raw) {
  const portfolio = {};
  for (const market of MARKETS) {
    const item = raw?.[market];
    if (!validMoney(item?.starting)) continue;
    const ledger = [];
    const seen = new Set();
    for (const record of Array.isArray(item.ledger) ? item.ledger.slice(0, 10000) : []) {
      if (!record || typeof record.id !== 'string' || !/^[a-z\d:-]{1,110}$/i.test(record.id) ||
          seen.has(record.id) || !finite(record.time) || Math.abs(record.time) > 8.64e15) continue;
      if (record.type === 'deposit' && validMoney(record.amount)) {
        ledger.push({ id: record.id, type: 'deposit', amount: record.amount, time: record.time });
      } else if (record.type === 'trade' && ['long', 'short'].includes(record.side) &&
          [record.quantity, record.entry, record.exit, record.net, record.fees].every(finite) &&
          record.quantity > 0 && record.entry > 0 && record.exit > 0 && record.fees >= 0) {
        ledger.push({ id: record.id, type: 'trade', time: record.time, side: record.side, quantity: record.quantity,
          entry: record.entry, exit: record.exit, net: record.net, fees: record.fees, reason: String(record.reason ?? '').slice(0, 50) });
      } else continue;
      seen.add(record.id);
    }
    const account = { starting: item.starting, ledger, run: null };
    const run = item.run;
    if (uid.test(run?.id ?? '') && finite(run?.funding) && run.funding >= 0 && typeof run.complete === 'boolean' &&
        run.checkpoint?.format === 'gxb-market-studio-checkpoint' && run.checkpoint.version === 1 &&
        typeof run.checkpoint.datasetId === 'string' && /^[a-f0-9]{64}$/.test(run.checkpoint.datasetId) &&
        run.complete === (run.checkpoint.settled === true) &&
        Number.isSafeInteger(run.checkpoint.cursor) && run.checkpoint.cursor >= 1 && run.checkpoint.cursor <= 30 &&
        Array.isArray(run.checkpoint.commands) && run.checkpoint.commands.length <= 10000) {
      account.run = {
        id: run.id, funding: run.funding, complete: run.complete,
        checkpoint: { format: run.checkpoint.format, version: 1, datasetId: run.checkpoint.datasetId,
          cursor: run.checkpoint.cursor, minutes: run.checkpoint.minutes, ...(run.complete ? { settled: true } : {}), commands: run.checkpoint.commands.map(event => ({
          cursor: event?.cursor,
          command: { type: event?.command?.type, side: event?.command?.side, quantity: event?.command?.quantity,
            stop: event?.command?.stop, target: event?.command?.target, fee: event?.command?.fee, slippage: event?.command?.slippage }
        })) }
      };
    }
    portfolio[market] = account;
  }
  return portfolio;
}

export function accountTotals(account, paper = {}) {
  const deposits = account.ledger.filter(row => row.type === 'deposit').reduce((total, row) => total + row.amount, 0);
  const trades = account.ledger.filter(row => row.type === 'trade');
  const realized = trades.reduce((total, row) => total + row.net, 0);
  const fees = trades.reduce((total, row) => total + row.fees, 0) + (paper.position?.fee ?? 0);
  const cash = account.starting + deposits + realized;
  const reserved = paper.position ? paper.position.entry * paper.position.quantity + 2 * paper.position.fee :
    paper.pending?.type === 'entry' && finite(paper.reference) ? paper.reference * paper.pending.quantity + 2 * paper.pending.fee : 0;
  return { cash, deposits, realized, fees, available: Math.max(0, cash - reserved), equity: cash + (paper.marked ?? 0), trades };
}

export function savePortfolioWeek(account, run, checkpoint, paper) {
  if (account.run && account.run.id !== run.id && !account.run.complete) throw new Error('An active practice week already exists.');
  if (account.run?.id === run.id &&
      (checkpoint.cursor < account.run.checkpoint.cursor || checkpoint.commands.length < account.run.checkpoint.commands.length)) {
    throw new Error('This paper week is older than the saved checkpoint.');
  }
  const existing = new Set(account.ledger.map(row => row.id));
  const additions = paper.closed.flatMap((trade, index) => {
    const id = run.id + ':' + index;
    return existing.has(id) ? [] : [{ id, type: 'trade', time: trade.exitTime, side: trade.side, quantity: trade.quantity,
      entry: trade.entry, exit: trade.exit, net: trade.net, fees: 2 * trade.fee, reason: trade.reason }];
  });
  if (account.ledger.length + additions.length > 10000) throw new Error('This paper ledger has reached its storage limit.');
  account.ledger.push(...additions);
  account.run = { ...run, checkpoint };
}

export function depositCash(account, amount, id) {
  if (!validMoney(amount)) throw new Error('Choose an amount above zero and at most 1 billion.');
  if (account.run && !account.run.complete) throw new Error('Finish the active practice week before adding funds.');
  if (account.ledger.length >= 10000) throw new Error('This paper ledger has reached its storage limit.');
  account.ledger.push({ id, type: 'deposit', amount, time: Date.now() });
}

export function newPaperPortfolio(starting) {
  if (!validMoney(starting)) throw new Error('Choose a starting paper balance above zero and at most 1 billion.');
  return { starting, ledger: [], run: null };
}

export async function portfolioReplay(market, run) {
  const { dataset, text } = practiceWeek(market);
  const id = await datasetId(text, dataset.metadata);
  return createReplay(dataset, id, run.checkpoint, run.funding);
}
