import { watchSymbol } from './workspace.mjs';

function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

function button(label, callback) {
  const node = element('button', label);
  node.type = 'button';
  node.onclick = callback;
  return node;
}

const instruments = {
  'OANDA:XAUUSD': 'Spot gold / US dollar',
  'COMEX:GC1!': 'Continuous gold futures chart',
  'AMEX:GLD': 'Gold ETF',
  'AMEX:SPY': 'S&P 500 ETF',
  'NASDAQ:QQQ': 'Nasdaq-100 ETF',
  'NASDAQ:AAPL': 'Apple',
  'NASDAQ:NVDA': 'NVIDIA'
};

function quoteFrame(symbols) {
  const frame = element('iframe', undefined, 'quote-widget');
  frame.title = 'TradingView market quotes';
  frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  frame.referrerPolicy = 'no-referrer';
  const list = symbols.map(watchSymbol).filter(Boolean).join(',');
  frame.srcdoc = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
    '<style>body{margin:0;background:#101a2a;color:#d2dbeb;font:14px system-ui}tv-ticker-tape:not(:defined){display:block;padding:12px}</style>' +
    '<script type="module" src="https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js"></script>' +
    '<tv-ticker-tape symbols="' + list + '" direction="vertical" item-size="compact" theme="dark" hide-chart>' +
    'Waiting for TradingView. If unavailable, open an instrument chart from the watchlist.</tv-ticker-tape>';
  return frame;
}

export function watchlist(profile, title, save, initiallyOpen = false) {
  const rail = element('section', undefined, 'panel watch-panel');
  const market = profile.market;
  let symbols = [...profile.watch[market]];
  const heading = element('h2', undefined, 'icon-heading');
  const icon = element('span', undefined, 'arena-icon icon-watch');
  icon.setAttribute('aria-hidden', 'true');
  heading.append(icon, 'Market watchlist');
  heading.tabIndex = -1;
  rail.append(heading, element('p', title + ' · Saved locally'));
  const list = element('ul', undefined, 'watch-list');
  const quotes = element('div');
  const form = element('form', undefined, 'watch-form');
  const input = element('input');
  input.required = true;
  input.maxLength = 45;
  input.placeholder = 'EXCHANGE:SYMBOL';
  input.setAttribute('aria-label', 'Watchlist symbol');
  const add = element('button', 'Add');
  add.type = 'submit';
  const feedback = element('p');
  feedback.setAttribute('role', 'status');
  let showQuotes = initiallyOpen;
  let busy = false;
  const show = button('Load TradingView quotes', () => {
    showQuotes = !showQuotes;
    paintQuotes();
  });
  show.setAttribute('aria-expanded', 'false');

  function paintQuotes() {
    show.disabled = !symbols.length;
    show.textContent = showQuotes ? 'Hide TradingView quotes' : 'Load TradingView quotes';
    show.setAttribute('aria-expanded', String(showQuotes));
    quotes.replaceChildren();
    if (showQuotes && symbols.length) quotes.append(quoteFrame(symbols));
  }

  function paintList() {
    list.replaceChildren();
    if (!symbols.length) list.append(element('li', 'Add a symbol to start watching.'));
    for (const symbol of symbols) {
      const item = element('li');
      const [venue, ticker] = symbol.split(':');
      const chart = element('a', ticker, 'watch-symbol');
      chart.href = 'https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(symbol);
      chart.target = '_blank';
      chart.rel = 'noopener noreferrer';
      chart.setAttribute('aria-label', symbol + ' chart on TradingView');
      chart.append(element('small', instruments[symbol] ?? venue));
      const remove = button('×', async () => {
        await update(symbols.filter(item => item !== symbol));
        input.focus();
      });
      remove.setAttribute('aria-label', 'Remove ' + symbol);
      item.append(chart, remove);
      list.append(item);
    }
  }

  async function update(next) {
    if (busy) return;
    busy = true;
    try {
      if (!await save(market, next)) return;
      symbols = next;
      paintList();
      paintQuotes();
      feedback.textContent = 'Watchlist saved.';
    } finally {
      busy = false;
    }
  }
  form.onsubmit = async event => {
    event.preventDefault();
    const symbol = watchSymbol(input.value);
    if (!symbol || symbols.includes(symbol) || symbols.length === 12) {
      feedback.textContent = !symbol ? 'Use an exchange-qualified symbol, such as NASDAQ:AAPL.' :
        symbols.includes(symbol) ? 'That symbol is already on this list.' : 'This watchlist holds up to 12 symbols.';
      return;
    }
    await update([...symbols, symbol]);
    if (symbols.includes(symbol)) input.value = '';
  };
  form.append(input, add);
  rail.append(list, form, feedback, show, element('small', 'TradingView coverage and delays vary by exchange. Loading quotes sends these symbols to TradingView.'), quotes);
  paintList();
  paintQuotes();
  return rail;
}

export function marketBrief(profile, title, getSymbols) {
  const panel = element('section', undefined, 'panel market-brief');
  panel.append(element('h2', 'Market assistant'),
    element('p', 'Local pre-trade checklist and an optional brief to paste into your AI assistant.'));
  const checklist = element('details');
  const steps = element('ul');
  for (const text of ['Check the quote source and timestamp.', 'Define the setup, trigger, and invalidation.', 'Decide what would make you wait.']) {
    steps.append(element('li', text));
  }
  checklist.append(element('summary', 'Pre-trade checklist'), steps);
  panel.append(checklist);
  const result = element('textarea');
  result.readOnly = true;
  result.rows = 7;
  result.hidden = true;
  result.setAttribute('aria-label', 'Market review brief');
  const status = element('p');
  status.setAttribute('role', 'status');
  const make = button('Build market review brief', () => {
    const focus = profile.state.draft?.focus ?? 'Market structure';
    const symbols = getSymbols().join(', ') || 'No symbols selected';
    result.value = [
      'Help me prepare a read-only market review for ' + title + '.',
      'My watchlist: ' + symbols + '. Training focus: ' + focus + '.',
      'Check source timestamps and identify delayed or missing data. Summarize trend, levels and upcoming events only when supported by sources.',
      'Ask me for my setup, trigger and invalidation. Help me define what evidence would make me wait. Keep any proposed exercise paper-only.'
    ].join('\n\n');
    result.hidden = false;
    copy.hidden = false;
    result.focus();
  });
  const copy = button('Copy brief', async () => {
    try {
      await navigator.clipboard.writeText(result.value);
      status.textContent = 'Brief copied.';
    } catch {
      result.focus();
      result.select();
      status.textContent = 'Brief selected for copying.';
    }
  });
  copy.hidden = true;
  panel.append(make, result, copy, status);
  return panel;
}
