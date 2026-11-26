import { parseReplayFile } from './replay.mjs';

export const WEEK_SOURCE = 'Synthetic practice week';
export const WEEK_GOAL = [2, 3];
export const CURRENT_WEEK_VERSION = 2;

export function practiceWeek(market, version = 1) {
  const gold = market === 'gold';
  let price = gold ? 2400 : 480;
  const step = gold ? 2.2 : .85;
  const continuous = version === 2;
  const days = continuous ? 7 : 5;
  const dailyBars = continuous ? 24 : 6;
  const monday = Date.UTC(2026, 0, 5, continuous ? 0 : 14);
  const rows = ['timestamp,open,high,low,close,volume'];
  for (let day = 0; day < days; day++) {
    for (let hour = 0; hour < dailyBars; hour++) {
      const index = day * dailyBars + hour;
      const drift = continuous ? [.35, -.13, -.3, .25, .17, -.28, .14][day] : [1, -.4, -1, .2, .75][day];
      const open = price + (!continuous && hour === 0 && day > 0 ? Math.sin(index) * step : 0);
      const close = open + step * (drift + Math.sin(index * 1.3) * .9);
      const wick = step * (.3 + .3 * Math.abs(Math.cos(index)));
      const time = new Date(monday + (day * 24 + hour) * 3600000).toISOString();
      rows.push([time, open.toFixed(2), (Math.max(open, close) + wick).toFixed(2),
        (Math.min(open, close) - wick).toFixed(2), close.toFixed(2), 800 + (index * 137) % 1300].join(','));
      price = close;
    }
  }
  const text = rows.join('\n');
  const dataset = parseReplayFile(text, { market, symbol: gold ? 'XAU/USD' : 'PAPER-ETF', source: WEEK_SOURCE, minutes: 60 });
  return { text, dataset: { ...dataset, metadata: Object.freeze({ ...dataset.metadata, practiceWeek: true, scenarioVersion: version, practiceBars: days * dailyBars, practiceDays: days, practiceStart: monday }) } };
}

export function practiceDay(time, metadata) {
  if (metadata) return Math.max(1, Math.min(metadata.practiceDays, Math.floor((time - metadata.practiceStart) / 86400000) + 1));
  return Math.max(1, Math.min(5, new Date(time).getUTCDay()));
}

export function revealPracticeOpening(replay, version) {
  if (version === CURRENT_WEEK_VERSION) for (let index = 1; index < 8; index++) replay.step();
  return replay;
}
