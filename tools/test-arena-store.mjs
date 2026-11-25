import assert from 'node:assert/strict';
import test from 'node:test';
import { exportBook, importBook, KEY, LEGACY_BOOK, LEGACY_STATE, migrate, newProfile, openStore } from '../arena/store.mjs';

const date = '2026-10-18T12:00:00.000Z';
const record = { date, focus: 'Entries', grade: 'B', correct: 7, rounds: 10, r: 2, scoringVersion: 2 };
const legacy = {
  active: 'king',
  profiles: {
    king: { name: 'King', icon: '👑', onboarded: true, state: {
      xp: 100, sessions: 4, rounds: 10, correct: 7, assist: false, candleTheme: 'ocean', mode: 'pro',
      history: [record], skills: { Entries: { rounds: 10, correct: 7, rCount: 5, rSum: 2 } },
      journey: { market: 'gold', completed: { gold: { date, version: 1 } }, skills: { bitcoin: [1, 2] } }
    } },
    guest2: { name: 'Trader Two', state: { xp: 10 } }
  }
};
function setup(values = {}) {
  const entries = new Map(Object.entries(values));
  let fail = false;
  let tail = Promise.resolve();
  return {
    entries,
    fail: () => { fail = true; },
    storage: {
      getItem: key => entries.get(key) ?? null,
      setItem: (key, value) => { if (fail) throw new Error('quota exceeded'); entries.set(key, value); }
    },
    locks: { request: (key, operation) => {
      const request = tail.then(operation);
      tail = request.catch(() => {});
      return request;
    } }
  };
}

test('profile migration preserves ownership, known scoring and preferences without inventing sessions', async () => {
  const seed = JSON.stringify(legacy);
  const env = setup({ [LEGACY_BOOK]: seed, [LEGACY_STATE]: JSON.stringify({ xp: 800 }) });
  const first = await openStore(env);
  const { active, profiles, imports } = first.book;
  assert.equal(active, 'king');
  assert.deepEqual(imports, ['profiles-v1']);
  assert.equal(profiles.king.state.sessions, 4);
  assert.equal(profiles.king.state.history.length, 1);
  assert.deepEqual(profiles.king.state.history[0], {
    ...record, id: 'legacy:king:0', provenance: 'legacy-drill'
  });
  assert.equal(profiles.king.state.draft, undefined);
  assert.equal(profiles.king.state.candleTheme, 'ocean');
  assert.equal(profiles.king.state.assist, false);
  assert.equal(profiles.king.experience, 'experienced');
  assert.deepEqual(profiles.king.state.journey.skills.bitcoin, [1, 2]);
  assert.equal(profiles.guest2.state.xp, 10);
  assert.equal(env.entries.get(LEGACY_BOOK), seed);
  assert.equal(env.entries.get(LEGACY_STATE), '{"xp":800}');
  const next = first.book;
  next.profiles.king.state.xp++;
  assert.equal(await first.save(next), true);
  const reopened = await openStore(env);
  assert.equal(reopened.book.profiles.king.state.xp, 101);
  assert.equal(reopened.book.profiles.king.state.history[0].id, 'legacy:king:0');
});

test('device import identifies unknown ownership and unknown scoring version', () => {
  const old = { ...record };
  delete old.scoringVersion;
  const { storage } = setup({ [LEGACY_STATE]: JSON.stringify({ history: [old] }) });
  const first = migrate(storage);
  const second = migrate(storage);
  assert.deepEqual(first, second);
  const profile = first.profiles[first.active];
  assert.equal(profile.origin, 'legacy-device');
  assert.equal(profile.state.history[0].scoringVersion, null);
});

test('malformed legacy storage stays untouched and surfaces the error', async () => {
  for (const value of ['{', JSON.stringify({ ...legacy, active: 'wrong' }),
    JSON.stringify({ active: 'king', profiles: { king: { name: 'King', state: { history: [{ date }] } } } })]) {
    const env = setup({ [LEGACY_BOOK]: value });
    const problems = [];
    const store = await openStore({ ...env, notify: message => problems.push(message) });
    assert.match(store.problem, /Storage unavailable/);
    assert.equal(env.entries.get(LEGACY_BOOK), value);
    assert.equal(env.entries.has(KEY), false);
    assert.equal(problems.length, 1);
  }
});

test('duplicate backup is a no-op, conflicts require restore, and other profiles survive', () => {
  const env = setup({ [LEGACY_BOOK]: JSON.stringify(legacy) });
  const old = migrate(env.storage);
  const backup = exportBook(old);
  assert.deepEqual(importBook(old, backup), old);
  const blank = migrate(setup().storage);
  assert.deepEqual(importBook(blank, backup), old);
  const newer = structuredClone(old);
  newer.profiles.king.state.xp++;
  newer.profiles.third = newProfile('Trader Three', 'beginner');
  assert.throws(() => importBook(newer, backup), /newer or different copy/);
  assert.throws(() => importBook(newer, '{}'), /Arena Release 1 backup/);
  const restored = importBook(newer, backup, true);
  assert.equal(restored.profiles.king.state.xp, 100);
  assert.equal(restored.profiles.third.name, 'Trader Three');
  const broken = JSON.parse(backup);
  broken.book.profiles.king.state.history.push(broken.book.profiles.king.state.history[0]);
  assert.throws(() => importBook(old, JSON.stringify(broken)), /Duplicate session/);
});

test('serialized writers reject stale revisions and preserve the last snapshot on quota failure', async () => {
  const env = setup({ [LEGACY_BOOK]: JSON.stringify(legacy) });
  const [one, two] = await Promise.all([openStore(env), openStore(env)]);
  const changeOne = one.book;
  const changeTwo = two.book;
  changeOne.profiles.king.state.xp++;
  changeTwo.profiles.king.state.xp += 5;
  assert.deepEqual(await Promise.all([one.save(changeOne), two.save(changeTwo)]), [true, false]);
  assert.match(two.problem, /another tab/);
  const committed = env.entries.get(KEY);
  env.fail();
  changeOne.profiles.king.state.xp++;
  assert.equal(await one.save(changeOne), false);
  assert.match(one.problem, /quota exceeded/);
  assert.equal(env.entries.get(KEY), committed);
  assert.equal(one.book.profiles.king.state.xp, 101);
});
