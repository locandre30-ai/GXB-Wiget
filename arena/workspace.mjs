export const NAV_ORDER = ['home', 'academy', 'practice', 'studio'];
export const WATCH_DEFAULT = {
  gold: ['OANDA:XAUUSD', 'COMEX:GC1!', 'AMEX:GLD'],
  stocks: ['AMEX:SPY', 'NASDAQ:QQQ', 'NASDAQ:AAPL', 'NASDAQ:NVDA']
};
const symbol = /^[A-Z0-9_]{1,20}:[A-Z0-9._!-]{1,24}$/;

export function cleanOrder(input) {
  const items = Array.isArray(input) ? input.filter(id => NAV_ORDER.includes(id)) : [];
  return [...new Set([...items, ...NAV_ORDER])];
}

export function cleanWatch(input) {
  return Object.fromEntries(Object.entries(WATCH_DEFAULT).map(([market, defaults]) => [market,
    Array.isArray(input?.[market]) ? [...new Set(input[market].filter(value => typeof value === 'string' && symbol.test(value)))].slice(0, 12) : [...defaults]]));
}

export function watchSymbol(input) {
  const value = input.trim().toUpperCase();
  return symbol.test(value) ? value : null;
}
