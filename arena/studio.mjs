import { accountTotals, portfolioReplay } from './portfolio.mjs';
import { CURRENT_WEEK_VERSION, practiceDay, practiceWeek, revealPracticeOpening, WEEK_GOAL } from './studio-week.mjs';
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

function chart({ bars, range, paper }, pick, inspect) {
  const plot = svg('svg', { viewBox: '0 0 820 300', role: 'img', 'aria-label': 'Candlestick chart using revealed candles. Use left and right arrow keys to inspect.', tabindex: 0 });
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
  const ticks = Math.min(5, bars.length);
  for (let i = 0; i < ticks; i++) {
    const index = ticks === 1 ? 0 : Math.round(i * (bars.length - 1) / (ticks - 1));
    const tick = svg('text', { x: Math.max(38, Math.min(710, 12 + (index + .5) * bucket)), y: 294,
      class: 'studio-tick', 'text-anchor': 'middle' });
    const time = new Date(bars[index].time).toISOString();
    tick.textContent = time.slice(5, 10) + ' ' + time.slice(11, 16);
    plot.append(tick);
  }
  const order = paper.position ?? paper.pending;
  for (const [label, price, color] of [
    ['Entry', order?.entry, '#dcbb73'], ['Stop', order?.stop, '#ff8295'], ['Target', order?.target, '#44d4a6']
  ]) {
    if (!Number.isFinite(price) || y(price) < 20 || y(price) > 280) continue;
    const axis = y(price);
    plot.append(svg('line', { x1: 12, x2: 742, y1: axis, y2: axis, stroke: color, 'stroke-dasharray': '5 4' }));
    const text = svg('text', { x: 18, y: axis - 4, fill: color, class: 'studio-order-label' });
    text.textContent = label + ' ' + formatPrice(price);
    plot.append(text);
  }
  const crosshair = svg('g', { visibility: 'hidden', class: 'studio-crosshair', 'aria-hidden': 'true' });
  const horizontal = svg('line', { x1: 12, x2: 742 });
  const vertical = svg('line', { y1: 20, y2: 280 });
  const axisLabel = svg('text', { class: 'studio-cross-label', x: 746 });
  const timeLabel = svg('text', { class: 'studio-cross-label', y: 291, 'text-anchor': 'middle' });
  crosshair.append(horizontal, vertical, axisLabel, timeLabel);
  plot.append(crosshair);
  let inspected = bars.length - 1;
  function at(index, pointerY) {
    inspected = index;
    const bar = bars[index];
    const price = range.high + spread * .05 - (pointerY - 20) / 260 * spread * 1.1;
    const px = 12 + (index + .5) * bucket;
    crosshair.setAttribute('visibility', 'visible');
    horizontal.setAttribute('y1', pointerY);
    horizontal.setAttribute('y2', pointerY);
    vertical.setAttribute('x1', px);
    vertical.setAttribute('x2', px);
    axisLabel.setAttribute('y', pointerY + 4);
    axisLabel.textContent = price.toLocaleString(undefined, { maximumFractionDigits: price >= 1 ? 2 : 7 });
    timeLabel.setAttribute('x', Math.max(54, Math.min(696, px)));
    timeLabel.textContent = new Date(bar.time).toISOString().slice(5, 16).replace('T', ' ');
    inspect(bar, price);
    return price;
  }
  function point(event) {
    const matrix = plot.getScreenCTM();
    if (!matrix) return null;
    const coordinates = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    if (coordinates.x < 12 || coordinates.x > 742 || coordinates.y < 20 || coordinates.y > 280) return null;
    return { index: Math.min(bars.length - 1, Math.floor((coordinates.x - 12) / bucket)), y: coordinates.y };
  }
  function clear() { crosshair.setAttribute('visibility', 'hidden'); inspect(); }
  plot.addEventListener('pointermove', event => {
    const coordinates = point(event);
    if (coordinates) at(coordinates.index, coordinates.y);
    else clear();
  });
  plot.addEventListener('pointerleave', clear);
  plot.addEventListener('blur', clear);
  plot.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') { clear(); return; }
    const index = Math.max(0, Math.min(bars.length - 1, inspected + (event.key === 'ArrowLeft' ? -1 : 1)));
    at(index, y(bars[index].close));
  });
  if (pick) {
    plot.classList.add('studio-picking');
    plot.addEventListener('click', event => {
      const coordinates = point(event);
      if (coordinates) pick(Number(at(coordinates.index, coordinates.y).toFixed(8)));
    });
  }
  return plot;
}

function downloadCheckpoint(replay, scenarioVersion) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ ...replay.checkpoint(), ...(scenarioVersion ? { scenarioVersion } : {}) }, null, 2)], { type: 'application/json' }));
  const link = element('a');
  link.href = url;
  link.download = 'gxb-market-studio-checkpoint.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function paperPanel(commit, wait, getState, pause) {
  const card = element('section', undefined, 'stack studio-paper');
  card.append(element('h2', 'Paper order'));
  const form = element('form', undefined, 'stack');
  const fields = element('div', undefined, 'two');
  const side = options([['long', 'Buy / Long'], ['short', 'Sell / Short']]);
  fields.append(field('Direction', side));
  const advanced = element('details');
  advanced.append(element('summary', 'Fees and slippage'));
  const inputs = {};
  for (const [key, label, value] of [
    ['quantity', 'Units', '1'], ['stop', 'Stop price', ''], ['target', 'Target price', ''],
    ['fee', 'Fee per fill', '0'], ['slippage', 'Adverse slippage (bps)', '0']
  ]) {
    const input = element('input');
    input.type = 'number';
    input.step = 'any';
    input.min = '0';
    input.required = true;
    input.value = value;
    inputs[key] = input;
    const location = key === 'fee' || key === 'slippage' ? advanced : fields;
    location.append(field(label, input));
  }
  const quick = element('div', undefined, 'studio-quick');
  const buy = element('button', 'Buy / Long', 'studio-buy');
  const hold = element('button', 'Hold / Wait');
  const sell = element('button', 'Sell / Short', 'studio-sell');
  for (const button of [buy, hold, sell]) button.type = 'button';
  quick.append(buy, hold, sell);
  function prepare(direction) {
    pause();
    const state = getState();
    const { high, low, close } = state.latest;
    const distance = Math.min(close * .2, Math.max(high - low, close * .002));
    const sign = direction === 'long' ? 1 : -1;
    side.value = direction;
    const price = value => state.metadata.practiceWeek ? value.toFixed(2) : String(Number(value.toPrecision(10)));
    inputs.stop.value = price(close - sign * distance);
    inputs.target.value = price(close + sign * 2 * distance);
    submit.focus();
  }
  buy.onclick = () => prepare('long');
  sell.onclick = () => prepare('short');
  hold.onclick = wait;
  const submit = element('button', 'Queue paper entry');
  submit.type = 'submit';
  form.append(quick, fields, submit, element('small', 'Paper entries fill at the next revealed open.'), advanced);
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
  const run = async command => {
    try { await commit(command); }
    catch (error) { status.textContent = error.message; }
  };
  form.onsubmit = event => {
    event.preventDefault();
    run({ type: 'entry', side: side.value, ...Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.valueAsNumber])) });
  };
  cancel.onclick = () => run({ type: 'cancel' });
  exit.onclick = () => run({ type: 'exit' });
  const trades = element('details');
  trades.append(element('summary', 'Paper trade history'), history);
  card.append(form, actions, status, summary, trades);
  return {
    card,
    setLevel(key, price) { inputs[key].value = String(price); },
    paint(paper, ended) {
      submit.disabled = buy.disabled = sell.disabled = ended || Boolean(paper.pending || paper.position);
      hold.disabled = ended;
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

function replayPanel(host, replay, observe, linked) {
  const snapshot = replay.snapshot();
  const panel = element('section', undefined, 'panel stack studio-chart');
  const heading = element('h2', snapshot.metadata.market === 'gold' ? labelMarket.gold : snapshot.metadata.symbol + ' · ' + labelMarket.stocks);
  const week = snapshot.metadata.practiceWeek === true;
  const lastWeekBar = state => week && state.revealed >= state.metadata.practiceBars;
  let picking;
  let timer;
  let saving = false;
  let blocked = false;
  const info = element('p', undefined, 'studio-clock');
  const display = options(displayIntervals(snapshot.metadata.minutes).map(minutes => [minutes, minutes + ' min']));
  display.value = snapshot.minutes;
  const next = element('button', 'Reveal next candle', 'primary');
  next.type = 'button';
  const checkpoint = element('button', 'Export checkpoint');
  checkpoint.type = 'button';
  checkpoint.onclick = () => downloadCheckpoint(replay, snapshot.metadata.scenarioVersion);
  const play = element('button', 'Play replay');
  play.type = 'button';
  function pause() {
    if (timer) clearInterval(timer);
    timer = undefined;
    play.textContent = 'Play replay';
  }
  const controls = element('div', undefined, 'actions');
  controls.append(field('Chart interval', display), next, play);
  const day = element('button', 'Advance 24h');
  day.type = 'button';
  if (week) controls.append(day);
  if (!linked) controls.append(checkpoint);
  const plot = element('div', undefined, 'studio-plot');
  const orderTools = element('div', undefined, 'actions studio-order-tools');
  const goal = element('p', undefined, 'studio-week-goal');
  const pickStatus = element('small');
  pickStatus.setAttribute('role', 'status');
  const levelButtons = {};
  for (const [key, label] of [['stop', 'Pick stop on chart'], ['target', 'Pick target on chart']]) {
    const button = element('button', label);
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.onclick = () => {
      pause();
      picking = picking === key ? undefined : key;
      pickStatus.textContent = picking ? 'Select a price inside the chart, or type it in the order ticket.' : '';
      paint();
    };
    levelButtons[key] = button;
    orderTools.append(button);
  }
  orderTools.append(pickStatus);
  const stats = element('p', undefined, 'studio-inspection');
  const details = element('details');
  const dataStats = element('p');
  details.append(element('summary', 'Candle details'), dataStats);
  const feedback = element('p');
  feedback.setAttribute('role', 'status');
  const paper = paperPanel(async command => {
    if (saving || blocked) return;
    if (linked && lastWeekBar(replay.snapshot()) && command.type !== 'cancel') throw new Error('Settle the week at the final revealed close.');
    pause();
    replay.order(command);
    if (linked) await persist(command);
    else observe(command, snapshot.metadata.market);
    paint();
  }, () => { pause(); advance(); }, () => replay.snapshot(), pause);
  async function persist(command) {
    saving = true;
    next.disabled = true;
    try {
      const state = replay.snapshot();
      const saved = await linked.save(snapshot.metadata.market, { ...linked.run, complete: state.settled }, replay.checkpoint(), state.paper, command);
      if (!saved) throw new Error('The checkpoint could not be saved.');
      linked.refresh();
    } catch (error) {
      blocked = true;
      pause();
      feedback.textContent = error.message + ' Reopen Market Studio to resume the last saved state.';
    } finally { saving = false; }
  }
  const paint = () => {
    const state = replay.snapshot();
    const { open, high, low, close, volume } = state.latest;
    info.textContent = 'Replay clock · ' + new Date(state.time).toISOString() + ' · ' + state.revealed + ' revealed';
    dataStats.textContent = 'Latest input candle · Open ' + formatPrice(open) + ' · High ' + formatPrice(high) +
      ' · Low ' + formatPrice(low) + ' · Close ' + formatPrice(close) + ' · Volume ' + formatPrice(volume) +
      ' · SMA (5 closed chart candles) ' + (state.sma5 === null ? '—' : formatPrice(state.sma5));
    if (week) {
      const trades = state.paper.closed.length;
      goal.textContent = 'Synthetic week · Day ' + practiceDay(state.latest.time, state.metadata) + ' of ' + state.metadata.practiceDays + ' · ' + trades +
        ' closed paper ' + (trades === 1 ? 'trade' : 'trades') + ' · Practice goal ' + WEEK_GOAL.join('–') +
        (trades >= WEEK_GOAL[0] && trades <= WEEK_GOAL[1] ? ' · Goal reached' : '');
    }
    const finished = state.settled || blocked;
    if (linked) {
      next.disabled = finished;
      play.disabled = finished || lastWeekBar(state);
      next.textContent = lastWeekBar(state) && !finished ? 'Settle paper week' : 'Reveal next candle';
    }
    day.disabled = finished || lastWeekBar(state);
    const bracketLocked = next.disabled || Boolean(linked && lastWeekBar(state)) ||
      Boolean(state.paper.pending || state.paper.position);
    if (bracketLocked) picking = undefined;
    for (const [key, button] of Object.entries(levelButtons)) {
      button.disabled = bracketLocked;
      button.setAttribute('aria-pressed', String(picking === key));
    }
    const inspect = (candle, level) => {
      const bar = candle ?? state.latest;
      const utc = new Date(bar.time).toISOString().slice(0, 16).replace('T', ' ');
      stats.textContent = utc + ' UTC · ' + (candle ? 'Price ' + formatPrice(level) + ' · ' : '') +
        'O ' + formatPrice(bar.open) + ' · H ' + formatPrice(bar.high) + ' · L ' + formatPrice(bar.low) + ' · C ' + formatPrice(bar.close);
    };
    inspect();
    plot.replaceChildren(chart(state, picking ? price => {
      const key = picking;
      paper.setLevel(key, price);
      picking = undefined;
      pickStatus.textContent = (key === 'stop' ? 'Stop' : 'Target') + ' set to ' + formatPrice(price) + '.';
      paint();
    } : null, inspect));
    paper.paint(state.paper, next.disabled || Boolean(linked && lastWeekBar(state)));
  };
  async function advance(count = 1) {
    if (!panel.isConnected) { pause(); return; }
    if (saving || blocked) return;
    if (linked && lastWeekBar(replay.snapshot())) {
      pause();
      replay.settle();
      await persist();
      paint();
      if (!blocked) feedback.textContent = 'Paper week settled. Portfolio Lab has the updated balance.';
      return;
    }
    let advanced = false;
    for (let offset = 0; offset < count && replay.step(); offset++) advanced = true;
    if (!advanced) {
      pause();
      next.disabled = true;
      day.disabled = true;
      play.disabled = true;
      feedback.textContent = 'End of this dataset.';
      paint();
      return;
    }
    if (linked) {
      if (lastWeekBar(replay.snapshot())) pause();
      await persist();
    }
    paint();
    if (!blocked) feedback.textContent = '';
  }
  next.onclick = () => { pause(); advance(); };
  day.onclick = () => { pause(); advance(24); };
  play.onclick = () => {
    if (timer) pause();
    else { timer = setInterval(() => advance(), 420); play.textContent = 'Pause replay'; }
  };
  display.onchange = async () => {
    if (saving || blocked) { display.value = replay.snapshot().minutes; return; }
    replay.setInterval(Number(display.value));
    if (linked) await persist();
    paint();
  };
  panel.append(heading, element('small', 'Source · ' + snapshot.metadata.source + ' · UTC · ' + snapshot.metadata.minutes + ' min input'),
    controls, info);
  if (linked) panel.append(element('small', 'Portfolio Lab linked · Cash and trades save to this local paper account. Open positions settle at the final revealed close.'));
  if (week) panel.append(goal);
  const dashboard = element('div', undefined, 'studio-dashboard');
  const chartArea = element('section', undefined, 'studio-chart-area');
  chartArea.append(orderTools, plot, stats, details, feedback);
  dashboard.append(chartArea, paper.card);
  panel.append(dashboard);
  paint();
  host.replaceChildren(panel);
}

export function renderStudio(workspace, preferredMarket, owner, observe, portfolio) {
  const weekCard = element('section', undefined, 'panel stack studio-week');
  weekCard.append(element('small', 'Synthetic data · Training only · Seven days, 24 hourly candles per day'));
  const weekMarket = options(Object.entries(labelMarket));
  weekMarket.value = preferredMarket;
  const start = element('button', 'Start practice week', 'primary');
  const linkedButton = element('button');
  linkedButton.type = 'button';
  const lab = element('a', 'Set up Portfolio Lab', 'button');
  lab.href = '#portfolio';
  start.type = 'button';
  const restoration = element('details');
  restoration.append(element('summary', 'Restore a practice-week checkpoint'));
  const checkpointFile = element('input');
  checkpointFile.type = 'file';
  checkpointFile.accept = '.json,application/json';
  const restore = element('button', 'Restore practice week');
  restore.type = 'button';
  const weekStatus = element('p');
  weekStatus.setAttribute('role', 'status');
  restoration.append(field('Practice-week checkpoint file', checkpointFile), restore);
  const weekActions = element('div', undefined, 'actions');
  weekActions.append(field('Practice market', weekMarket), start, linkedButton, lab);
  weekCard.append(weekActions, restoration, weekStatus);
  function paintAccountAction() {
    const account = portfolio.get(weekMarket.value);
    linkedButton.hidden = !account;
    lab.hidden = Boolean(account);
    linkedButton.textContent = account?.run && !account.run.complete ? 'Resume linked practice week' : 'Start linked practice week';
  }
  weekMarket.onchange = paintAccountAction;
  paintAccountAction();
  linkedButton.onclick = async () => {
    const market = weekMarket.value;
    const account = portfolio.get(market);
    if (!account) return;
    linkedButton.disabled = true;
    try {
      const active = account.run && !account.run.complete;
      const run = active ? account.run : { id: crypto.randomUUID(), funding: Math.max(0, accountTotals(account).cash), complete: false, scenarioVersion: CURRENT_WEEK_VERSION };
      if (!active && run.funding <= 0) throw new Error('Add paper funds in Portfolio Lab before starting a new week.');
      const replay = await portfolioReplay(market, run);
      if (!weekCard.isConnected) return;
      if (!active && !await portfolio.save(market, run, replay.checkpoint(), replay.snapshot().paper)) {
        throw new Error('The linked paper week could not be saved.');
      }
      if (!weekCard.isConnected) return;
      const linked = { run, save: portfolio.save, refresh: paintAccountAction };
      current = { owner, replay, linked };
      replayPanel(output, replay, observe, linked);
      weekStatus.textContent = active ? 'Linked week resumed.' : 'Linked week ready.';
      paintAccountAction();
      output.querySelector('h2')?.scrollIntoView({ block: 'nearest' });
    } catch (error) { weekStatus.textContent = error.message; }
    finally { linkedButton.disabled = false; }
  };
  async function loadWeek(file) {
    start.disabled = restore.disabled = true;
    try {
      if (file?.size > 2 * 1024 * 1024) throw new Error('Choose a valid Studio checkpoint file.');
      const checkpoint = file ? JSON.parse(await file.text()) : undefined;
      const version = checkpoint ? checkpoint.scenarioVersion ?? 1 : CURRENT_WEEK_VERSION;
      const { dataset, text } = practiceWeek(weekMarket.value, version);
      const id = await datasetId(text, dataset.metadata);
      const replay = createReplay(dataset, id, checkpoint);
      if (!checkpoint) revealPracticeOpening(replay, version);
      if (!weekCard.isConnected) return;
      current = { owner, replay };
      replayPanel(output, replay, observe);
      restoration.open = false;
      weekStatus.textContent = file ? 'Practice week restored.' : 'Practice week ready.';
      output.querySelector('h2')?.scrollIntoView({ block: 'nearest' });
    } catch (error) {
      weekStatus.textContent = error.message;
    } finally {
      start.disabled = restore.disabled = false;
    }
  }
  start.onclick = () => loadWeek();
  restore.onclick = () => {
    const file = checkpointFile.files[0];
    if (file) loadWeek(file);
    else weekStatus.textContent = 'Choose the checkpoint for this practice market.';
  };

  const intro = element('details', undefined, 'panel stack studio-csv');
  intro.append(element('summary', 'Import historical CSV'),
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
  if (current?.owner === owner && !current.linked) replayPanel(output, current.replay, observe);
  intro.append(form);
  workspace.append(weekCard, output, intro);
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
      replayPanel(output, replay, observe);
      status.textContent = restored ? 'Checkpoint restored.' : 'Replay loaded.';
      output.querySelector('h2')?.scrollIntoView({ block: 'nearest' });
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
