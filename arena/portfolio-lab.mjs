import { accountTotals, depositCash, newPaperPortfolio, portfolioReplay } from './portfolio.mjs';

const markets = [['gold', 'Gold · XAU/USD'], ['stocks', 'Stocks & ETFs']];
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function el(tag, text, cls) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (cls) element.className = cls;
  return element;
}
function link(text, hash) {
  const anchor = el('a', text, 'button');
  anchor.href = hash;
  return anchor;
}

export function renderPortfolioLab(workspace, getPortfolio, update) {
  workspace.append(el('p', 'Two independent USD paper accounts. Starting balances and deposits are simulated. Linked Market Studio weeks save cash and trades to this profile.'));
  const grid = el('div', undefined, 'two portfolio-grid');
  workspace.append(grid);
  for (const [market, name] of markets) {
    const card = el('section', undefined, 'panel stack');
    grid.append(card);
    async function paint() {
      const account = getPortfolio()[market];
      card.replaceChildren(el('h2', name));
      const status = el('p');
      status.setAttribute('role', 'status');
      if (account) {
        let paper = {};
        if (account.run) {
          try {
            const replay = await portfolioReplay(market, account.run);
            const state = replay.snapshot();
            paper = { ...state.paper, reference: state.latest.close };
          } catch (error) {
            status.textContent = 'Saved week could not be loaded: ' + error.message;
          }
          if (!card.isConnected) return;
        }
        const totals = accountTotals(account, paper);
        const metrics = el('dl', undefined, 'portfolio-metrics');
        for (const [label, value] of [
          ['Cash balance', totals.cash], ['Available paper cash', totals.available], ['Paper equity', totals.equity],
          ['Realized P/L', totals.realized], ['Marked P/L', paper.position ? paper.marked : null], ['Fees paid', totals.fees]
        ]) {
          const pair = el('div');
          pair.append(el('dt', label), el('dd', value === null ? '—' : money.format(value)));
          metrics.append(pair);
        }
        card.append(metrics);
        if (paper.position) {
          const position = paper.position;
          card.append(el('p', position.side.toUpperCase() + ' · ' + position.quantity + ' units · Entry ' + money.format(position.entry) +
            ' · Stop ' + money.format(position.stop) + ' · Target ' + money.format(position.target)));
        } else if (paper.pending) card.append(el('p', 'Pending ' + (paper.pending.side ?? paper.pending.type) + ' order'));
        else card.append(el('p', 'No open paper position.'));
        const active = account.run && !account.run.complete;
        card.append(link(active ? 'Resume linked practice week' : 'Open Market Studio', '#studio/' + market));
        if (active) card.append(el('small', 'Finish this practice week to add paper funds or start another linked week.'));
        const history = el('details');
        history.append(el('summary', 'Activity ledger'), el('p', 'Starting paper balance · ' + money.format(account.starting)));
        if (!account.ledger.length) history.append(el('p', 'Completed trades and paper deposits will appear here.'));
        for (const record of [...account.ledger].reverse()) {
          const row = el('article', undefined, 'record');
          const amount = record.type === 'deposit' ? record.amount : record.net;
          row.append(el('strong', record.type === 'deposit' ? 'Paper deposit' : record.side + ' · ' + record.reason), el('span', money.format(amount)));
          row.append(el('small', record.type === 'deposit' ? new Date(record.time).toLocaleDateString() :
            'Replay ' + new Date(record.time).toISOString().slice(0, 16).replace('T', ' ') + ' UTC · ' + record.quantity +
            ' units · ' + money.format(record.entry) + ' → ' + money.format(record.exit) + ' · Fees ' + money.format(record.fees)));
          history.append(row);
        }
        card.append(history);
      } else card.append(el('p', 'Set a starting paper balance to link a simulated trading week.'));

      if (!account?.run || account.run.complete) {
        const form = el('form', undefined, 'stack');
        const label = el('label', account ? 'Add paper funds' : 'Starting paper balance', 'field');
        const amount = el('input');
        amount.type = 'number'; amount.min = '0.01'; amount.max = '1000000000'; amount.step = '.01'; amount.required = true;
        amount.setAttribute('aria-label', label.textContent + ' for ' + name);
        label.append(amount);
        const submit = el('button', account ? 'Add paper funds' : 'Create paper account', 'primary');
        submit.type = 'submit';
        form.append(label, submit);
        form.onsubmit = async event => {
          event.preventDefault();
          submit.disabled = true;
          try {
            const saved = await update(portfolio => {
              if (portfolio[market]) depositCash(portfolio[market], amount.valueAsNumber, crypto.randomUUID());
              else portfolio[market] = newPaperPortfolio(amount.valueAsNumber);
            });
            if (saved) await paint();
          } catch (error) { status.textContent = error.message; }
          finally { submit.disabled = false; }
        };
        card.append(form);
      }
      card.append(status);
    }
    paint();
  }
}
