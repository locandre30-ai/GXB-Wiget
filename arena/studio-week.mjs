import { parseReplayFile } from './replay.mjs';

export const WEEK_SOURCE = 'Synthetic practice week';
export const WEEK_GOAL = [2, 3];

export function practiceWeek(market) {
  const gold = market === 'gold';
  let price = gold ? 2400 : 480;
  const step = gold ? 2.2 : .85;
  const monday = Date.UTC(2026, 0, 5, 14);
  const rows = ['timestamp,open,high,low,close,volume'];
  for (let day = 0; day < 5; day++) {
    for (let hour = 0; hour < 6; hour++) {
      const index = day * 6 + hour;
      const drift = [1, -.4, -1, .2, .75][day];
      const open = price + (hour === 0 && day > 0 ? Math.sin(index) * step : 0);
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
  return { text, dataset: { ...dataset, metadata: Object.freeze({ ...dataset.metadata, practiceWeek: true }) } };
}

export function practiceDay(time) {
  return Math.max(1, Math.min(5, new Date(time).getUTCDay()));
}
