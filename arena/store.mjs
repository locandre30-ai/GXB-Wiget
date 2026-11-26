import { cleanPortfolio } from './portfolio.mjs';
import { cleanStudy } from './study-store.mjs';
import { cleanLearning } from './learning.mjs';
import { cleanOrder, cleanWatch } from './workspace.mjs';
export const KEY = 'gxb_arena_v2_r1';
export const LEGACY_BOOK = 'gxb_arena_profiles_v1';
export const LEGACY_STATE = 'gxb_arena_v1';
export const MARKETS = ['gold', 'bitcoin'];
export const PALETTES = ['classic', 'ocean', 'mono', 'holo'];
export const DRILLS = ['Trend Confirmation', 'Continuation Recognition', 'Entries', 'Exits', 'Avoiding Chase Trades'];
const counters = ['xp', 'dayStreak', 'sessions', 'bestCombo', 'rounds', 'correct'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const count = value => Number.isSafeInteger(value) && value >= 0;
const number = value => typeof value === 'number' && Number.isFinite(value);
const validDate = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) &&
  !['__proto__', 'constructor', 'prototype'].includes(value);
const sessionId = value => typeof value === 'string' && /^[\w:-]{1,150}$/.test(value);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function cleanState(raw = {}, owner = 'local') {
  check(object(raw), 'Invalid training state.');
  const state = Object.fromEntries(counters.map(key => [key, count(raw[key]) ? raw[key] : 0]));
  state.lastDay = typeof raw.lastDay === 'string' && /^\d{4}-\d\d-\d\d$/.test(raw.lastDay) ? raw.lastDay : '';
  state.mode = ['guided', 'pro'].includes(raw.mode) ? raw.mode : state.sessions ? 'pro' : 'guided';
  state.candleTheme = PALETTES.includes(raw.candleTheme) ? raw.candleTheme : 'classic';
  state.assist = raw.assist !== false;
  state.learning = cleanLearning(raw.learning);
  state.skills = {};
  for (const [name, skill] of Object.entries(raw.skills ?? {})) {
    if (!DRILLS.includes(name) || !object(skill)) continue;
    const rounds = count(skill.rounds) ? skill.rounds : 0;
    state.skills[name] = { rounds, correct: count(skill.correct) ? Math.min(rounds, skill.correct) : 0,
      rSum: number(skill.rSum) ? skill.rSum : 0, rCount: count(skill.rCount) ? skill.rCount : 0 };
  }
  const journey = raw.journey ?? {};
  state.journey = { completed: {}, skills: {}, skillDates: {} };
  if (MARKETS.includes(journey.market)) state.journey.market = journey.market;
  for (const market of MARKETS) {
    const completed = journey.completed?.[market];
    if (object(completed) && completed.version === 1) {
      state.journey.completed[market] = { version: 1 };
      if (validDate(completed.date)) state.journey.completed[market].date = completed.date;
    }
    if (Array.isArray(journey.skills?.[market])) {
      state.journey.skills[market] = [...new Set(journey.skills[market].filter(i => Number.isInteger(i) && i >= 1 && i <= 6))];
      const dates = state.journey.skills[market].filter(i => validDate(journey.skillDates?.[market]?.[i]));
      if (dates.length) state.journey.skillDates[market] = Object.fromEntries(dates.map(i => [i, journey.skillDates[market][i]]));
    }
  }
  check(raw.history === undefined || Array.isArray(raw.history), 'Invalid session history.');
  const seen = new Set();
  state.history = (raw.history ?? []).map((record, index) => {
    check(object(record) && validDate(record.date) && count(record.rounds) && record.rounds > 0 &&
      count(record.correct) && record.correct <= record.rounds, 'An invalid historical session needs review.');
    const id = sessionId(record.id) ? record.id : 'legacy:' + owner + ':' + index;
    check(!seen.has(id), 'Duplicate session identifier within a profile.');
    seen.add(id);
    const item = { id, date: record.date, focus: typeof record.focus === 'string' ? record.focus.slice(0, 80) : 'Unspecified',
      correct: record.correct, rounds: record.rounds, provenance: 'legacy-drill',
      scoringVersion: count(record.scoringVersion) && record.scoringVersion > 0 ? record.scoringVersion : null };
    if (number(record.r)) item.r = record.r;
    if (typeof record.grade === 'string') item.grade = record.grade.slice(0, 12);
    for (const key of ['minutes', 'xp', 'combo', 'scored']) if (count(record[key])) item[key] = record[key];
    return item;
  });
  if (raw.draft !== undefined) {
    state.draft = cleanDraft(raw.draft);
    check(!seen.has(state.draft.session.id), 'A completed session cannot also be a draft.');
  }
  return state;
}

const freshBook = () => ({ version: 1, active: null, profiles: {}, imports: [] });

function cleanProfile(id, raw) {
  check(validId(id) && object(raw) && typeof raw.name === 'string' && raw.name.trim() && raw.name.length <= 24,
    'Invalid local profile.');
  const state = cleanState(raw.state, id);
  return {
    name: raw.name.trim(),
    icon: typeof raw.icon === 'string' && /^[\p{Extended_Pictographic}\uFE0F\u200D]{1,8}$/u.test(raw.icon) ? raw.icon : '👑',
    onboarded: raw.onboarded === true,
    experience: raw.experience === 'experienced' || (raw.experience !== 'beginner' && state.mode === 'pro') ? 'experienced' : 'beginner',
    market: raw.market === 'stocks' ? 'stocks' : 'gold',
    navOrder: cleanOrder(raw.navOrder),
    watch: cleanWatch(raw.watch),
    study: cleanStudy(raw.study),
    portfolio: cleanPortfolio(raw.portfolio),
    ...(raw.origin === 'legacy-device' ? { origin: raw.origin } : {}),
    state
  };
}

export function validateBook(value) {
  check(object(value) && value.version === 1 && object(value.profiles) && Array.isArray(value.imports) &&
    value.imports.every(id => typeof id === 'string' && ['profiles-v1', 'device-v1'].includes(id)),
    'Unsupported or invalid Arena data format.');
  const book = freshBook();
  book.imports = [...new Set(value.imports)];
  for (const [id, profile] of Object.entries(value.profiles)) {
    check(object(profile?.state), 'Missing profile training state.');
    book.profiles[id] = cleanProfile(id, profile);
  }
  check(value.active === null || (validId(value.active) && Object.hasOwn(book.profiles, value.active)), 'Invalid selected profile.');
  book.active = value.active;
  return book;
}

function parse(raw, label) {
  try { return JSON.parse(raw); }
  catch { throw new Error(label + ' contains invalid JSON.'); }
}

export function migrate(storage) {
  const book = freshBook();
  const profiles = storage.getItem(LEGACY_BOOK);
  const device = storage.getItem(LEGACY_STATE);
  if (profiles !== null) {
    const source = parse(profiles, 'Legacy profiles');
    check(object(source?.profiles) && Object.keys(source.profiles).length && validId(source.active) &&
      Object.hasOwn(source.profiles, source.active), 'Legacy profile ownership could not be verified.');
    for (const [id, profile] of Object.entries(source.profiles)) {
      check(object(profile?.state), 'Missing legacy profile training state.');
      book.profiles[id] = cleanProfile(id, profile);
    }
    book.active = source.active;
    book.imports.push('profiles-v1');
  } else if (device !== null) {
    const raw = parse(device, 'Legacy device data');
    check(object(raw) && Object.keys(raw).some(key => [...counters, 'mode', 'history', 'journey', 'candleTheme', 'assist'].includes(key)),
      'Legacy device data has no recognized training fields.');
    const id = 'legacy-device-v1';
    book.profiles[id] = cleanProfile(id, { name: 'King', state: raw, origin: 'legacy-device' });
    book.active = id;
    book.imports.push('device-v1');
  }
  return book;
}

export function newProfile(name, experience) {
  return cleanProfile('new', { name, experience, onboarded: true, state: { mode: experience === 'experienced' ? 'pro' : 'guided' } });
}

export function exportBook(book) {
  return JSON.stringify({ format: 'gxb-arena-backup', book: validateBook(book) }, null, 2);
}

export function importBook(current, serialized, restore = false) {
  const backup = parse(serialized, 'Backup');
  check(backup?.format === 'gxb-arena-backup', 'Choose an Arena Release 1 backup.');
  const incoming = validateBook(backup.book);
  const next = validateBook(current);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const [id, profile] of Object.entries(incoming.profiles)) {
    check(restore || !Object.hasOwn(next.profiles, id) || same(next.profiles[id], profile),
      'A newer or different copy of ' + profile.name + ' exists here. Use restore to replace those snapshots.');
    next.profiles[id] = profile;
  }
  next.imports = [...new Set([...next.imports, ...incoming.imports])];
  next.active ??= incoming.active;
  return next;
}

// A single versioned snapshot is the unit of commit. Web Locks serializes the
// read/compare/write across tabs; stale writers must reload before trying again.
export async function openStore({ storage, locks, notify = () => {} }) {
  let raw = null;
  let book = freshBook();
  let problem = '';
  let tail = Promise.resolve();
  const report = message => { problem = message; notify(message); };
  const lock = operation => {
    check(locks, 'This browser does not support safe concurrent local writes.');
    return locks.request(KEY, operation);
  };
  try {
    await lock(() => {
      raw = storage.getItem(KEY);
      if (raw !== null) book = validateBook(parse(raw, 'Arena storage'));
      else {
        book = migrate(storage);
        const initial = JSON.stringify(book);
        storage.setItem(KEY, initial);
        check(storage.getItem(KEY) === initial, 'The browser did not retain the Arena data.');
        raw = initial;
      }
    });
  } catch (error) {
    report('Storage unavailable: ' + error.message + ' Original data is preserved. Use guest practice or reload after resolving the issue.');
  }
  return {
    get book() { return structuredClone(book); },
    get problem() { return problem; },
    flush: () => tail,
    save(next) {
      const pending = structuredClone(next);
      const task = tail.then(async () => {
        if (problem) return false;
        try {
          const validated = validateBook(pending);
          await lock(() => {
            check(storage.getItem(KEY) === raw, 'Arena data changed in another tab. Reload this page before making more changes.');
            const serialized = JSON.stringify(validated);
            if (serialized !== raw) {
              storage.setItem(KEY, serialized);
              check(storage.getItem(KEY) === serialized, 'The browser did not retain the save.');
            }
            raw = serialized;
            book = validated;
          });
          return true;
        } catch (error) {
          report('Save failed: ' + error.message + ' The last saved snapshot remains available.');
          return false;
        }
      });
      tail = task;
      return task;
    }
  };
}

function cleanDraft(draft) {
  const session = draft?.session;
  const focuses = ['All Drills', ...DRILLS];
  check(object(draft) && draft.version === 1 && focuses.includes(draft.focus) &&
    (draft.seed === null || (count(draft.seed) && draft.seed <= 0xffffffff)) &&
    object(session) && sessionId(session.id) && count(session.round) && session.round <= 10 &&
    session.round >= 1 && count(session.start) && Array.isArray(session.results) &&
    session.results.length === session.round - (draft.seed === null ? 0 : 1) &&
    number(session.rTotal) && object(session.focusCounts), 'Invalid practice draft.');
  const stats = ['correct', 'combo', 'bestCombo', 'xpGained', 'waits', 'losses'];
  check(stats.every(key => count(session[key])) && session.correct <= session.results.length &&
    session.results.every(result => object(result) && DRILLS.includes(result.drill) &&
    typeof result.correct === 'boolean' && (result.r === null || number(result.r))), 'Invalid practice draft results.');
  check(Object.entries(session.focusCounts).every(([drill, value]) => DRILLS.includes(drill) && count(value)),
    'Invalid practice draft focus counts.');
  return { version: 1, focus: draft.focus, seed: draft.seed,
    session: { id: session.id, round: session.round, start: session.start, rTotal: session.rTotal,
      results: session.results.map(({ drill, correct, r }) => ({ drill, correct, r })),
      focusCounts: { ...session.focusCounts }, ...Object.fromEntries(stats.map(key => [key, session[key]])) } };
}
