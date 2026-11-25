import { createReplay, datasetId, displayIntervals, parseReplayFile } from './replay.mjs';

const MAX_BYTES = 20 * 1024 * 1024;
const SVG = 'http://www.w3.org/2000/svg';
const labelMarket = { stocks: 'Stocks and ETFs', gold: 'XAU/USD Gold' };
let current;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function field(label, control) {
  const wrapper = element('label', label, 'field');
  control.setAttribute('aria-label', label);
  wrapper.append(control);
  return wrapper;
}

function options(values) {
  const select = element('select');
  for (const [value, label] of values) {
    const option = element('option', label);
    option.value = value;
    select.append(option);
  }
  return select;
}

function svg(tag, attributes) {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function formatPrice(value) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function chart({ bars, range }) {
  const plot = svg('svg', { viewBox: '0 0 820 300', role: 'img', 'aria-label': 'Candlestick chart using revealed candles' });
  const spread = range.high - range.low || range.high * .01;
  const y = value => 20 + (range.high - value + spread * .05) / (spread * 1.1) * 260;
  const bucket = 730 / bars.length;
  const width = Math.min(22, bucket * .65);
  for (let i = 0; i <= 4; i++) {
    const value = range.high - spread * i / 4;
    const gridY = y(value);
    plot.append(svg('line', { x1: 12, x2: 742, y1: gridY, y2: gridY, class: 'studio-grid' }));
    const tick = svg('text', { x: 748, y: gridY + 4, class: 'studio-tick' });
    tick.textContent = formatPrice(value);
    if (range.high !== range.low || i === 0) plot.append(tick);
  }
  for (const [index, bar] of bars.entries()) {
    const x = 12 + (index + .5) * bucket;
    const color = bar.close >= bar.open ? 'studio-up' : 'studio-down';
    const candle = svg('g', { class: color + (bar.partial ? ' studio-partial' : '') });
    candle.append(svg('line', { x1: x, x2: x, y1: y(bar.high), y2: y(bar.low) }),
      svg('rect', { x: x - width / 2, y: Math.min(y(bar.open), y(bar.close)), width,
        height: Math.max(1, Math.abs(y(bar.open) - y(bar.close))) }));
    plot.append(candle);
  }
  return plot;
}

function downloadCheckpoint(replay) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(replay.checkpoint(), null, 2)], { type: 'application/json' }));
  const link = element('a');
  link.href = url;
  link.download = 'gxb-market-studio-checkpoint.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function paperPanel(replay, repaint) {
  const card = element('section', undefined, 'stack studio-paper');
  card.append(element('h2', 'Paper execution'), element('small', 'One simulated position per replay. Entries and manual exits use the next revealed open. Stop wins an ambiguous stop/target bar.'));
  const form = element('form', undefined, 'stack');
  const fields = element('div', undefined, 'two');
  const side = options([['long', 'Long'], ['short', 'Short']]);
  fields.append(field('Direction', side));
  const inputs = {};
  for (const [key, label, value] of [
    ['quantity', 'Units', ''], ['stop', 'Stop price', ''], ['target', 'Target price', ''],
    ['fee', 'Fee per fill', '0'], ['slippage', 'Adverse slippage (bps)', '0']
  ]) {
    const input = element('input');
    input.type = 'number';
    input.step = 'any';
    input.min = '0';
    input.required = true;
    input.value = value;
    inputs[key] = input;
    fields.append(field(label, input));
  }
  const submit = element('button', 'Queue paper entry');
  submit.type = 'submit';
  form.append(fields, submit);
  const cancel = element('button', 'Cancel pending order');
  cancel.type = 'button';
  const exit = element('button', 'Queue paper exit');
  exit.type = 'button';
  const actions = element('div', undefined, 'actions');
  actions.append(cancel, exit);
  const status = element('p');
  status.setAttribute('role', 'status');
  const summary = element('p');
  const history = element('div', undefined, 'activity');
  const run = command => {
    try {
      replay.order(command);
      repaint();
    } catch (error) {
      status.textContent = error.message;
    }
  };
  form.onsubmit = event => {
    event.preventDefault();
    run({ type: 'entry', side: side.value, ...Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.valueAsNumber])) });
  };
  cancel.onclick = () => run({ type: 'cancel' });
  exit.onclick = () => run({ type: 'exit' });
  card.append(form, actions, status, summary, history);
  return {
    card,
    paint(paper, ended) {
      submit.disabled = ended || Boolean(paper.pending || paper.position);
      cancel.hidden = !paper.pending;
      exit.hidden = ended || !paper.position || Boolean(paper.pending);
      status.textContent = paper.message;
      const state = paper.position ? paper.position.side + ' · ' + paper.position.quantity + ' units at ' + formatPrice(paper.position.entry) :
        paper.pending ? 'Entry pending' : 'No open position';
      summary.textContent = state + ' · Studio realized P/L ' + formatPrice(paper.realized) +
        (paper.marked === null ? '' : ' · Marked P/L ' + formatPrice(paper.marked));
      history.replaceChildren(element('h3', 'Closed paper trades · ' + paper.closed.length));
      for (const trade of paper.closed.slice(-10).reverse()) {
        const row = element('article', undefined, 'record');
        row.append(element('strong', trade.side + ' · ' + trade.reason), element('span', formatPrice(trade.net)),
          element('small', 'Entry ' + formatPrice(trade.entry) + ' · Exit ' + formatPrice(trade.exit) +
            ' · Fees ' + formatPrice(2 * trade.fee) + ' · ' + new Date(trade.exitTime).toISOString()));
        history.append(row);
      }
    }
  };
}

function replayPanel(host, replay) {
  const snapshot = replay.snapshot();
  const panel = element('section', undefined, 'panel stack studio-chart');
  const heading = element('h2', snapshot.metadata.market === 'gold' ? labelMarket.gold : snapshot.metadata.symbol + ' · ' + labelMarket.stocks);
  const info = element('p', undefined, 'studio-clock');
  const display = options(displayIntervals(snapshot.metadata.minutes).map(minutes => [minutes, minutes + ' min']));
  display.value = snapshot.minutes;
  const next = element('button', 'Reveal next candle', 'primary');
  next.type = 'button';
  const checkpoint = element('button', 'Export checkpoint');
  checkpoint.type = 'button';
  checkpoint.onclick = () => downloadCheckpoint(replay);
  const controls = element('div', undefined, 'actions');
  controls.append(field('Chart interval', display), next, checkpoint);
  const plot = element('div', undefined, 'studio-plot');
  const stats = element('p');
  const feedback = element('p');
  feedback.setAttribute('role', 'status');
  const paper = paperPanel(replay, () => paint());
  const paint = () => {
    const state = replay.snapshot();
    const { open, high, low, close, volume } = state.latest;
    info.textContent = 'Replay clock · ' + new Date(state.time).toISOString() + ' · ' + state.revealed + ' revealed';
    stats.textContent = 'Latest input candle · Open ' + formatPrice(open) + ' · High ' + formatPrice(high) +
      ' · Low ' + formatPrice(low) + ' · Close ' + formatPrice(close) + ' · Volume ' + formatPrice(volume) +
      ' · SMA (5 closed chart candles) ' + (state.sma5 === null ? '—' : formatPrice(state.sma5));
    plot.replaceChildren(chart(state));
    paper.paint(state.paper, next.disabled);
  };
  next.onclick = () => {
    if (!replay.step()) {
      next.disabled = true;
      feedback.textContent = 'End of this dataset.';
      paint();
      return;
    }
    paint();
    feedback.textContent = info.textContent + ' · Close ' + formatPrice(replay.snapshot().latest.close);
  };
  display.onchange = () => { replay.setInterval(Number(display.value)); paint(); };
  panel.append(heading, element('small', 'Source · ' + snapshot.metadata.source + ' · UTC · ' + snapshot.metadata.minutes + ' min input'),
    controls, info, plot, stats, feedback, paper.card);
  paint();
  host.replaceChildren(panel);
}

export function renderStudio(workspace, preferredMarket, owner) {
  const intro = element('section', undefined, 'panel stack');
  intro.append(element('h2', 'Load historical candles'),
    element('p', 'Replay a local OHLCV file one candle at a time. The chart and SMA use revealed data. Paper orders fill against the replay clock and produce separate Studio results.'),
    element('small', 'CSV columns: timestamp,open,high,low,close,volume. Use UTC ISO timestamps, a fixed interval, and ascending rows.'));
  const form = element('form', undefined, 'stack');
  const details = element('div', undefined, 'two');
  const market = options(Object.entries(labelMarket));
  market.value = preferredMarket;
  const symbol = element('input');
  symbol.required = true;
  symbol.maxLength = 20;
  const source = element('input');
  source.required = true;
  source.maxLength = 120;
  source.placeholder = 'Dataset provider or file source';
  const resolution = options([1, 5, 15, 60, 1440].map(minutes => [minutes, minutes + ' min']));
  const setSymbol = () => {
    symbol.value = market.value === 'gold' ? 'XAU/USD' : '';
    symbol.readOnly = market.value === 'gold';
    symbol.placeholder = 'e.g. SPY';
  };
  market.onchange = setSymbol;
  setSymbol();
  details.append(field('Market', market), field('Instrument symbol', symbol), field('Data source', source), field('Input interval', resolution));
  const csv = element('input');
  csv.type = 'file';
  csv.accept = '.csv,text/csv';
  csv.required = true;
  const backup = element('input');
  backup.type = 'file';
  backup.accept = '.json,application/json';
  const load = element('button', 'Load replay', 'primary');
  load.type = 'submit';
  const status = element('p');
  status.setAttribute('role', 'status');
  form.append(details, field('Candle CSV', csv), field('Checkpoint (optional)', backup), load, status);
  const output = element('div', undefined, 'studio-output');
  if (current?.owner === owner) replayPanel(output, current.replay);
  intro.append(form);
  workspace.append(intro, output);
  form.onsubmit = async event => {
    event.preventDefault();
    load.disabled = true;
    status.textContent = 'Validating dataset…';
    try {
      if (csv.files[0].size > MAX_BYTES) throw new Error('Choose a CSV smaller than 20 MB.');
      if (backup.files[0]?.size > 2 * 1024 * 1024) throw new Error('Choose a valid Studio checkpoint file.');
      const metadata = { market: market.value, symbol: symbol.value.trim().toUpperCase(), source: source.value, minutes: Number(resolution.value) };
      const text = await csv.files[0].text();
      const dataset = parseReplayFile(text, metadata);
      const id = await datasetId(text, dataset.metadata);
      const restored = backup.files[0] ? JSON.parse(await backup.files[0].text()) : undefined;
      const replay = createReplay(dataset, id, restored);
      if (!form.isConnected) return;
      current = { owner, replay };
      replayPanel(output, replay);
      status.textContent = restored ? 'Checkpoint restored.' : 'Replay loaded.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      load.disabled = false;
    }
  };
}

export function clearStudio() {
  current = undefined;
}
