export const CHECK_INS = ['Calm', 'Uncertain', 'Fear of missing out', 'Fear of loss', 'Urge to recover a loss', 'Overconfidence'];
const MARKETS = ['gold', 'bitcoin', 'stocks'];
const LIMIT = 120;

function cleanEvent(event) {
  if (!event || typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at))) return null;
  const base = { at: event.at, type: event.type };
  if (event.type === 'check-in' && CHECK_INS.includes(event.feeling)) return { ...base, feeling: event.feeling };
  if (event.type === 'pressure' && CHECK_INS.includes(event.feeling) && typeof event.planned === 'boolean') return { ...base, feeling: event.feeling, planned: event.planned };
  if (event.type === 'academy' && MARKETS.slice(0, 2).includes(event.market) &&
      Number.isInteger(event.chapter) && event.chapter >= 0 && event.chapter <= 6 &&
      Number.isInteger(event.question) && event.question >= 0 && event.question < 12 &&
      Number.isInteger(event.choice) && event.choice >= 0 && event.choice < 4 &&
      typeof event.correct === 'boolean' && typeof event.first === 'boolean' && typeof event.hint === 'boolean') {
    const { market, chapter, question, choice, correct, first, hint } = event;
    return { ...base, market, chapter, question, choice, correct, first, hint };
  }
  if (event.type === 'practice' && ['Trend Confirmation', 'Continuation Recognition', 'Entries', 'Exits', 'Avoiding Chase Trades'].includes(event.drill) &&
      typeof event.correct === 'boolean' && typeof event.choice === 'string' && /^[a-z0-9_-]{1,24}$/i.test(event.choice)) {
    return { ...base, drill: event.drill, correct: event.correct, choice: event.choice };
  }
  if (event.type === 'studio' && ['long', 'short', 'exit', 'cancel'].includes(event.action) && MARKETS.includes(event.market)) {
    return { ...base, action: event.action, market: event.market };
  }
  if (event.type === 'research' && MARKETS.includes(event.market) &&
      typeof event.title === 'string' && event.title.trim() && event.title.length <= 100 &&
      typeof event.url === 'string' && event.url.length <= 1000) {
    try {
      const url = new URL(event.url);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      return { ...base, market: event.market, title: event.title.trim(), url: url.href };
    } catch { return null; }
  }
  return null;
}

export function cleanActivity(raw) {
  return Array.isArray(raw) ? raw.slice(-LIMIT).map(cleanEvent).filter(Boolean) : [];
}

export function recordActivity(learning, event) {
  const entry = cleanEvent({ ...event, at: new Date().toISOString() });
  if (!entry) return false;
  learning.activity = [...(learning.activity ?? []).slice(1 - LIMIT), entry];
  return true;
}

export function latestCheckIn(activity) {
  return activity.findLast(event => event.type === 'check-in');
}

const pressureQuestions = {
  'Fear of missing out': ['Price moves before your entry trigger. What matches your plan?', 'Wait for the trigger or skip the trade', 'Chase to avoid missing out'],
  'Fear of loss': ['What can you decide before entering a trade that might lose?', 'The maximum planned risk and the exit rule', 'That the trade will recover if you wait'],
  'Urge to recover a loss': ['After a loss, what should determine whether you take another setup?', 'Whether it meets the same criteria and risk limit', 'How much you need to make back'],
  'Overconfidence': ['You just had a winning streak. What should determine position size?', 'The written risk rule for this setup', 'The confidence from your streak'],
  'Uncertain': ['You cannot explain what would invalidate the setup. What comes next?', 'Define the invalidation or stand aside', 'Enter and decide the exit later'],
  'Calm': ['You feel calm and the chart looks promising. What still has to happen?', 'The trigger and risk conditions need to be met', 'A calm feeling is sufficient confirmation']
};

export function pressureQuestion(activity) {
  const checkIn = latestCheckIn(activity);
  return checkIn ? pressureQuestions[checkIn.feeling] : null;
}

export function tutoringEvidence(activity, market) {
  const attempts = activity.filter(event => event.type === 'academy' && event.market === market && event.first).slice(-12);
  const practice = activity.filter(event => event.type === 'practice').slice(-10);
  const lines = [];
  if (attempts.length) lines.push('Recent first answers on this track: ' + attempts.filter(event => event.correct && !event.hint).length +
    '/' + attempts.length + ' correct without a hint.');
  if (practice.length) lines.push('Recent Free Practice decisions: ' + practice.filter(event => event.correct).length +
    '/' + practice.length + ' correct in simulation.');
  const checkIn = latestCheckIn(activity);
  const reflection = activity.findLast(event => event.type === 'pressure');
  if (reflection) lines.push('In the latest decision exercise I selected ' + (reflection.planned ? 'the plan-based option.' : 'the impulse option.'));
  if (checkIn) lines.push('My latest voluntary check-in: ' + checkIn.feeling + '. Treat this as self-reported context.');
  const research = activity.filter(event => event.type === 'research' && event.market === market).slice(-3);
  if (research.length) lines.push('Research I saved for this market. Verify source and publication time before using: ' +
    research.map(item => item.url).join(' '));
  return lines;
}
