import { advancePaper, applyPaperCommand, createPaperAccount, paperSnapshot, settlePaperWeek } from './paper.mjs';
const HEADER = 'timestamp,open,high,low,close,volume';
const RESOLUTIONS = [1, 5, 15, 60, 1440];
const MINUTE = 60_000;
export const STUDIO_MARKETS = ['stocks', 'gold'];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function timestamp(value) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:00(?:\.000)?Z$/.test(value)) return NaN;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value.replace(/(?:\.000)?Z$/, '.000Z') ? time : NaN;
}

export function parseReplayFile(text, metadata) {
  const { market, symbol, source, minutes } = metadata;
  check(STUDIO_MARKETS.includes(market), 'Choose a supported market.');
  check(market === 'gold' ? symbol === 'XAU/USD' : /^[A-Z0-9][A-Z0-9.:-]{0,19}$/.test(symbol), 'Enter a valid instrument symbol.');
  check(typeof source === 'string' && source.trim() && source.length <= 120, 'Enter a source name of up to 120 characters.');
  check(RESOLUTIONS.includes(minutes), 'Choose a supported input interval.');
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  check(lines.shift() === HEADER, 'Expected CSV columns: ' + HEADER);
  check(lines.length >= 2 && lines.length <= 100_000, 'Choose a CSV with 2 to 100,000 candle rows.');
  let previous = -Infinity;
  const bars = lines.map((line, i) => {
    const [date, ...values] = line.split(',').map(cell => cell.trim());
    const time = timestamp(date);
    const location = ' at CSV row ' + (i + 2) + '.';
    check(Number.isFinite(time) && time > previous && time % (minutes * MINUTE) === 0,
      'Expected increasing UTC timestamps aligned to the input interval' + location);
    check(values.length === 5 && values.every(cell => /^\d+(?:\.\d+)?$/.test(cell)), 'Expected five decimal values' + location);
    const [open, high, low, close, volume] = values.map(Number);
    check([open, high, low, close, volume].every(value => Number.isFinite(value) && value <= 1e12) && low > 0 &&
      low <= Math.min(open, close) && high >= Math.max(open, close), 'Invalid OHLCV values' + location);
    previous = time;
    return Object.freeze({ time, open, high, low, close, volume });
  });
  return Object.freeze({ metadata: Object.freeze({ market, symbol, source: source.trim(), minutes }), bars: Object.freeze(bars) });
}

export async function datasetId(text, metadata) {
  const bytes = new TextEncoder().encode(JSON.stringify([metadata.market, metadata.symbol, metadata.source, metadata.minutes, text]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

export function displayIntervals(input) {
  return [...RESOLUTIONS.slice(0, -1), 240, 1440].filter(minutes => minutes >= input && minutes % input === 0);
}

function aggregate(bars, interval) {
  const groups = [];
  for (const bar of bars) {
    const time = Math.floor(bar.time / interval) * interval;
    const group = groups.at(-1);
    if (group?.time !== time) {
      groups.push({ ...bar, time });
      continue;
    }
    group.high = Math.max(group.high, bar.high);
    group.low = Math.min(group.low, bar.low);
    group.close = bar.close;
    group.volume += bar.volume;
  }
  return groups;
}

function visibleState(revealed, metadata, minutes) {
  const latest = revealed.at(-1);
  const interval = minutes * MINUTE;
  const grouped = aggregate(revealed, interval);
  const bars = grouped.slice(-60).map(bar => ({
    ...bar,
    partial: bar.time + interval > latest.time + metadata.minutes * MINUTE
  }));
  const range = { low: Math.min(...bars.map(bar => bar.low)), high: Math.max(...bars.map(bar => bar.high)) };
  const completed = bars.filter(bar => !bar.partial).slice(-5);
  const sma5 = completed.length === 5 ? completed.reduce((sum, bar) => sum + bar.close / 5, 0) : null;
  return { metadata, minutes, revealed: revealed.length, time: latest.time + metadata.minutes * MINUTE, latest, bars, range, sma5 };
}

export function createReplay(dataset, id, checkpoint, funding = null) {
  const { metadata, bars } = dataset;
  const paper = createPaperAccount(funding);
  let settled = false;
  const commands = [];
  let cursor = 1;
  let minutes = metadata.minutes;
  const step = () => {
    if (cursor === bars.length) return false;
    advancePaper(paper, bars[cursor++]);
    return true;
  };
  const order = action => {
    check(!settled, 'The paper week is complete.');
    const { type, side, quantity, stop, target, fee, slippage } = action ?? {};
    const command = type === 'entry' ? { type, side, quantity, stop, target, fee, slippage } : { type };
    check(commands.length < 10000, 'This replay has reached its paper action limit.');
    applyPaperCommand(paper, command, bars[cursor - 1]);
    commands.push({ cursor, command });
  };
  const settle = () => {
    check(funding !== null && cursor === bars.length, 'Finish revealing the week before settling it.');
    if (!settled) {
      settlePaperWeek(paper, bars[cursor - 1]);
      settled = true;
    }
  };
  if (checkpoint !== undefined) {
    check(checkpoint?.format === 'gxb-market-studio-checkpoint' && checkpoint.version === 1 &&
      checkpoint.datasetId === id && Number.isSafeInteger(checkpoint.cursor) &&
      checkpoint.cursor >= 1 && checkpoint.cursor <= bars.length &&
      displayIntervals(metadata.minutes).includes(checkpoint.minutes) &&
      Array.isArray(checkpoint.commands) && checkpoint.commands.length <= 10000,
      'Checkpoint does not match this dataset or uses an unsupported format.');
    minutes = checkpoint.minutes;
    for (const event of checkpoint.commands) {
      check(Number.isSafeInteger(event?.cursor) && event.cursor >= cursor &&
        event.cursor <= checkpoint.cursor, 'Invalid checkpoint order event.');
      while (cursor < event.cursor) step();
      order(event.command);
    }
    while (cursor < checkpoint.cursor) step();
    if (checkpoint.settled === true) settle();
  }
  return {
    snapshot: () => ({
      ...visibleState(bars.slice(0, cursor), metadata, minutes),
      paper: paperSnapshot(paper, bars[cursor - 1]), settled
    }),
    step,
    settle,
    order,
    setInterval(value) {
      check(displayIntervals(metadata.minutes).includes(value), 'Choose a compatible chart interval.');
      minutes = value;
    },
    checkpoint: () => structuredClone({ format: 'gxb-market-studio-checkpoint', version: 1, datasetId: id,
      cursor, minutes, commands, ...(settled ? { settled: true } : {}) })
  };
}
