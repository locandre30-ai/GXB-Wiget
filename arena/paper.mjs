const finite = value => typeof value === 'number' && Number.isFinite(value);
const positive = value => finite(value) && value > 0 && value <= 1e12;

export function createPaperAccount() {
  return { pending: null, position: null, closed: [], message: '' };
}

export function applyPaperCommand(account, command, bar) {
  if (command?.type === 'cancel' && account.pending) {
    account.pending = null;
    account.message = 'Pending order canceled.';
    return;
  }
  if (command?.type === 'exit' && account.position && !account.pending) {
    account.pending = { type: 'exit' };
    account.message = 'Exit queued for the next revealed open.';
    return;
  }
  if (command?.type !== 'entry' || account.pending || account.position) throw new Error('This paper action is unavailable.');
  const { side, quantity, stop, target, fee, slippage } = command;
  const long = side === 'long';
  if ((!long && side !== 'short') || !positive(quantity) || !positive(stop) || !positive(target) ||
      !finite(fee) || fee < 0 || fee > 1e12 || !finite(slippage) || slippage < 0 || slippage > 1000 ||
      (long ? !(stop < bar.close && bar.close < target) : !(target < bar.close && bar.close < stop))) {
    throw new Error('Use positive size and bracket the revealed close with valid stop and target prices. Slippage must be 0–1,000 bps.');
  }
  account.pending = { type: 'entry', side, quantity, stop, target, fee, slippage };
  account.message = 'Paper entry queued for the next revealed open.';
}

function priceWithSlippage(price, position, exiting) {
  const buying = (position.side === 'long') !== exiting;
  return price * (1 + (buying ? 1 : -1) * position.slippage / 10000);
}

function close(account, bar, price, reason) {
  const { position } = account;
  const fill = priceWithSlippage(price, position, true);
  const gross = (fill - position.entry) * position.quantity * (position.side === 'long' ? 1 : -1);
  account.closed.push({ ...position, exit: fill, exitTime: bar.time, reason, net: gross - 2 * position.fee });
  account.position = null;
  account.message = 'Paper position closed · ' + reason + '.';
}

export function advancePaper(account, bar) {
  if (account.pending?.type === 'exit') {
    account.pending = null;
    close(account, bar, bar.open, 'Manual exit');
    return;
  }
  if (account.pending?.type === 'entry') {
    const order = account.pending;
    account.pending = null;
    const entry = priceWithSlippage(bar.open, order, false);
    if (entry <= Math.min(order.stop, order.target) || entry >= Math.max(order.stop, order.target)) {
      account.message = 'Paper entry canceled · next fill was outside the bracket.';
      return;
    }
    const { type, ...details } = order;
    account.position = { ...details, entry, entryTime: bar.time };
    account.message = 'Paper entry filled.';
  }
  if (!account.position) return;
  const { side, stop, target } = account.position;
  const long = side === 'long';
  if (long ? bar.open <= stop : bar.open >= stop) return close(account, bar, bar.open, 'Stop gap');
  if (long ? bar.open >= target : bar.open <= target) return close(account, bar, target, 'Target');
  // A bar carries no tick order. Resolve ambiguous stop/target touches at the stop.
  if (long ? bar.low <= stop : bar.high >= stop) return close(account, bar, stop, 'Stop');
  if (long ? bar.high >= target : bar.low <= target) close(account, bar, target, 'Target');
}

export function paperSnapshot(account, bar) {
  const realized = account.closed.reduce((sum, trade) => sum + trade.net, 0);
  const position = account.position;
  const marked = position ? (priceWithSlippage(bar.close, position, true) - position.entry) *
    position.quantity * (position.side === 'long' ? 1 : -1) - 2 * position.fee : null;
  return structuredClone({ ...account, realized, marked });
}
