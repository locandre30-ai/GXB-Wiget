import { cleanActivity, pressureQuestion, recordActivity, tutoringEvidence } from '../arena/activity.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanLearning, learningFocus, recordCheckpoint, recordPaperDecision } from '../arena/learning.mjs';
import { cleanState } from '../arena/store.mjs';

test('assessment, track-specific first attempts and simulated practice adapt the recommendation', () => {
  const state = cleanState();
  assert.equal(learningFocus(state, 'gold'), null);
  state.learning.assessment = { goal: 'Study longer-term entries', experience: 'Some chart practice', focus: 'Risk' };
  assert.equal(learningFocus(state, 'gold').chapter, 3);
  recordCheckpoint(state, 'gold', 1, false);
  recordCheckpoint(state, 'gold', 1, true);
  assert.equal(learningFocus(state, 'gold').chapter, 1);
  assert.equal(learningFocus(state, 'bitcoin').chapter, 3);
  state.skills.Exits = { rounds: 3, correct: 1 };
  assert.equal(learningFocus(state, 'bitcoin').chapter, 5);
  assert.match(learningFocus(state, 'bitcoin').reason, /1\/3 in simulated Free Practice/);
  assert.deepEqual(cleanState(JSON.parse(JSON.stringify(state))).learning, state.learning);
});

test('invalid assessment and impossible first-attempt counts are ignored', () => {
  const raw = { assessment: { goal: 'arbitrary' }, evidence: { gold: {
    2: { attempts: 3, firstCorrect: 4 }, 4: { attempts: 2, firstCorrect: 1 }
  } } };
  assert.deepEqual(cleanLearning(raw), { activity: [], paper: {}, assessment: null, evidence: {
    gold: { 4: { attempts: 2, firstCorrect: 1 } }, bitcoin: {}
  } });
});

test('paper actions inform the learning plan without claiming live trade behavior', () => {
  const state = cleanState();
  for (const side of ['long', 'short', 'long']) recordPaperDecision(state, { type: 'entry', side });
  assert.equal(learningFocus(state, 'gold').chapter, 4);
  recordPaperDecision(state, { type: 'exit' });
  recordPaperDecision(state, { type: 'exit' });
  assert.equal(learningFocus(state, 'gold').chapter, 5);
  assert.deepEqual(cleanState(state).learning.paper, { long: 2, short: 1, exit: 2 });
});

test('observed activity stays bounded, validated and scoped to a learner and track', () => {
  const state = cleanState();
  const other = cleanState();
  assert.equal(recordActivity(state.learning, { type: 'research', market: 'gold', title: 'Unsafe', url: 'javascript:alert(1)' }), false);
  for (let count = 0; count < 121; count++) recordActivity(state.learning, { type: 'check-in', feeling: 'Calm' });
  assert.equal(state.learning.activity.length, 120);
  recordActivity(state.learning, { type: 'check-in', feeling: 'Fear of loss' });
  assert.match(pressureQuestion(state.learning.activity)[0], /might lose/);
  assert.equal(pressureQuestion(other.learning.activity), null);
  recordActivity(state.learning, { type: 'research', market: 'bitcoin', title: 'Source', url: 'https://example.com/research' });
  assert.equal(tutoringEvidence(state.learning.activity, 'gold').some(line => line.includes('example.com')), false);
  assert.equal(tutoringEvidence(state.learning.activity, 'bitcoin').some(line => line.includes('example.com')), true);
  assert.deepEqual(cleanActivity(state.learning.activity), state.learning.activity);
});
