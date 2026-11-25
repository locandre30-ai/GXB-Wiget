export const assessmentFields = {
  goal: ['Learn the basics', 'Practice day trades', 'Study longer-term entries'],
  experience: ['New to charts', 'Some chart practice', 'Regular practice'],
  focus: ['Structure', 'Risk', 'Entries and exits']
};
const tracks = ['gold', 'bitcoin'];
const paperActions = ['long', 'short', 'cancel', 'exit'];

export function cleanLearning(raw) {
  const assessment = raw?.assessment;
  const valid = Object.entries(assessmentFields).every(([key, options]) => options.includes(assessment?.[key]));
  const evidence = {};
  for (const market of tracks) {
    evidence[market] = {};
    for (let chapter = 0; chapter <= 6; chapter++) {
      const skill = raw?.evidence?.[market]?.[chapter];
      if (Number.isSafeInteger(skill?.attempts) && skill.attempts > 0 && skill.attempts <= 100000 &&
          Number.isSafeInteger(skill.firstCorrect) && skill.firstCorrect >= 0 && skill.firstCorrect <= skill.attempts) {
        evidence[market][chapter] = { attempts: skill.attempts, firstCorrect: skill.firstCorrect };
      }
    }
  }
  const paper = {};
  for (const action of paperActions) {
    const value = raw?.paper?.[action];
    if (Number.isSafeInteger(value) && value > 0 && value <= 100000) paper[action] = value;
  }
  return { paper, assessment: valid ? Object.fromEntries(Object.keys(assessmentFields).map(key => [key, assessment[key]])) : null, evidence };
}

export function recordCheckpoint(state, market, chapter, correct) {
  state.learning ??= cleanLearning();
  const chapters = state.learning.evidence[market];
  const prior = chapters[chapter] ?? { attempts: 0, firstCorrect: 0 };
  if (prior.attempts >= 100000) return;
  chapters[chapter] = { attempts: prior.attempts + 1, firstCorrect: prior.firstCorrect + Number(correct) };
}

export function recordPaperDecision(state, command) {
  const action = command.type === 'entry' ? command.side : command.type;
  if (!paperActions.includes(action)) return;
  state.learning ??= cleanLearning();
  const paper = state.learning.paper;
  paper[action] = Math.min(100000, (paper[action] ?? 0) + 1);
}

export function paperLearningSummary(state) {
  const paper = state.learning?.paper ?? {};
  const entries = (paper.long ?? 0) + (paper.short ?? 0);
  const exits = paper.exit ?? 0;
  const cancellations = paper.cancel ?? 0;
  if (!entries && !exits && !cancellations) return '';
  return 'Studio decisions · ' + entries + ' paper entries queued · ' + exits + ' exits queued · ' + cancellations + ' cancellations.';
}

export function learningFocus(state, market) {
  const learning = state.learning ?? cleanLearning();
  const reps = Object.entries(state.skills ?? {}).filter(([, s]) => s.rounds >= 3 && s.correct / s.rounds < .7)
    .sort(([, a], [, b]) => a.correct / a.rounds - b.correct / b.rounds);
  const lessons = Object.entries(learning.evidence[market]).filter(([, s]) => s.attempts >= 2 && s.firstCorrect / s.attempts < .7)
    .sort(([, a], [, b]) => a.firstCorrect / a.attempts - b.firstCorrect / b.attempts);
  if (lessons.length) return { chapter: Number(lessons[0][0]), reason: 'Your first answers on this track suggest revisiting this skill.' };
  if (reps.length) {
    const chapters = { 'Trend Confirmation': 1, 'Continuation Recognition': 2, 'Entries': 4, 'Avoiding Chase Trades': 4, 'Exits': 5 };
    const [name, score] = reps[0];
    if (Object.hasOwn(chapters, name)) return { chapter: chapters[name], reason: name + ' · ' + score.correct + '/' + score.rounds + ' in simulated Free Practice.' };
  }
  if ((learning.paper.exit ?? 0) >= 2) return { chapter: 5, reason: 'You have queued multiple manual exits in paper replay. Review how you define an exit before entry.' };
  if ((learning.paper.long ?? 0) + (learning.paper.short ?? 0) >= 3) return { chapter: 4, reason: 'You have practiced several paper entries. Compare your replay triggers with this exercise.' };
  const profile = learning.assessment;
  if (!profile) return null;
  const chapter = profile.experience === 'New to charts' ? 0 : { Structure: 1, Risk: 3, 'Entries and exits': 4 }[profile.focus];
  return { chapter, reason: profile.goal + ' · Based on your assessment.' };
}

export const bitcoinReads = [
  ['BTC trades around the clock. On this weekend example, what do progressively lower rallies and lows show?', ['Lower highs and lower lows', 'A confirmed rebound', 'A flat range'], 0, 'Lower highs and lower lows point to downward structure. The calendar alone does not tell you direction.'],
  ['On this BTC chart, which evidence shows buyers advancing over several swings?', ['One green candle', 'Higher highs and higher lows', 'The price has more digits'], 1, 'Several higher turning points provide stronger evidence than a single green candle.'],
  ['BTC repeatedly returns between the two recent turning zones. How should you describe the tape?', ['A certain breakdown', 'A trend that must continue', 'A range with no confirmed break'], 2, 'The repeated returns show a range. A touch or wick alone does not establish a sustained break.']
];

export const bitcoinLessons = {
  1: { intro: 'BTC venues can print different prices. Read structure on one consistent quote feed before comparing markets.', questions: [
    ['BTC/USD makes a higher swing low after a higher swing high. Which evidence matters most?', ['The sequence of swing points', 'The newest candle color alone', 'The exact same price on all venues'], 0, 'The sequence of higher turning points establishes the structure on the chart you are reading.'],
    ['A BTC candle closes below its own open. The prior swing low remains intact. Which observation would strengthen a reversal case?', ['Another exchange has a slightly different price', 'A break followed by lower swing structure', 'The last candle was red'], 1, 'A break of the marked low followed by lower structure would provide more evidence.'],
    ['BTC bounces repeatedly inside the same zone. What should you wait for before calling this a trend?', ['Sustained progress beyond the range', 'Any wick past the midpoint', 'A round-number price'], 0, 'Look for price to make and hold directional progress beyond the overlap.']
  ] },
  2: { intro: 'Fast price changes can make BTC pullbacks look dramatic. Check which prior level actually gave way.', questions: [
    ['On this BTC rebound, sellers retrace part of the rise and the prior low holds. What remains open?', ['The rise may resume, but needs confirmation', 'A crash has already been confirmed', 'Every lower close invalidates the setup'], 0, 'A retracement with intact structure leaves continuation possible, with no guarantee.'],
    ['The marked BTC swing low fails. Which note should you write before planning your next trade?', ['This break challenges my long thesis', 'Increase exposure because price is cheaper', 'Delete the level because it failed'], 0, 'The failed level changes the premise. Reassess the structure with fresh evidence.'],
    ['BTC compresses near its high. What would distinguish an actual break from a brief spike?', ['A social post mentions the symbol', 'Price holds beyond the level on your chosen timeframe', 'A single fast wick'], 1, 'A sustained move on the timeframe you planned gives more evidence than a momentary spike.']
  ] },
  3: { intro: 'BTC can trade in fractions. Define risk in dollars per BTC and size in BTC, then account for execution.', questions: [
    ['A practice BTC long has an entry at $60,000 and stop at $59,500. What is the planned price risk per BTC?', ['$50', '$500', '$59,500'], 1, 'The distance between entry and stop is $500 per BTC before costs.'],
    ['With $25 of simulated risk and $500 of risk per BTC, what fractional size fits before fees?', ['0.5 BTC', '0.25 BTC', '0.05 BTC'], 2, 'Divide $25 by $500 per BTC to get 0.05 BTC.'],
    ['BTC falls through $59,500 between available fills. What can happen to a market stop?', ['It can fill below the trigger price', 'It always fills at the trigger', 'Your risk automatically resets'], 0, 'A stop trigger starts the exit process. A fast or thin book can produce a worse fill.']
  ] },
  4: { intro: 'A fast BTC move can outpace your setup. Define the trigger for an entry on the venue and timeframe you are observing.', questions: [
    ['BTC surges after a headline. Your plan calls for a retest first. What action fits?', ['Enter before the spread changes', 'Wait for the retest and your confirmation', 'Move the trigger to match the price'], 1, 'Follow the setup you defined before the fast move. Skipping a missed entry preserves the rule.'],
    ['On this BTC rising structure, what belongs in a replay entry note?', ['The level that triggers entry and the level that cancels it', 'A price target with no trigger', 'A prediction about tomorrow’s price'], 0, 'A trigger and invalidation turn the idea into a testable decision.'],
    ['BTC moves inside a narrow range while spread and fees consume the expected room. Which choice fits?', ['Wait for a setup with enough room after costs', 'Trade both directions immediately', 'Use more size to offset fees'], 0, 'An unclear setup and insufficient room after costs support waiting.']
  ] },
  5: { intro: 'A 24-hour market can keep moving after you leave the screen. Plan how and when you will exit before the entry.', questions: [
    ['A BTC trade breaks your predefined exit level while you are watching. How should you judge the level?', ['The planned exit condition has been met', 'Extend the stop until BTC rebounds', 'Wait for tomorrow’s session open'], 0, 'The position hit your predefined invalidation. A round-the-clock market does not change the plan.'],
    ['A BTC position is profitable, and you are about to leave the screen. What should guide you?', ['The management rule you defined before entry', 'Remove risk controls because the trade is up', 'Keep the trade open because BTC trades all night'], 0, 'A management rule defines whether to reduce, exit or retain risk before you step away.'],
    ['BTC continues higher after your planned exit. What evidence belongs in the review?', ['Whether the exit matched your rule at the time', 'How much the highest later print would have paid', 'How quickly you can re-enter'], 0, 'Review the information available when the decision was made. A later rally does not invalidate the process.']
  ] },
  6: { intro: 'Review BTC execution and decision quality alongside outcomes. Fees and slippage deserve their own line in the journal.', questions: [
    ['Your BTC replay shows +3R, −1R and −1R before costs. What is the gross total?', ['+1R', '+3R', '−2R'], 0, 'Add the three outcomes to get +1R before trading costs.'],
    ['Your BTC result came in below planned R. Which records help determine whether execution contributed?', ['The quote and fill timestamps, prices and fees', 'Only the number of wins', 'Only the most recent chart candle'], 0, 'Those records capture spreads, execution differences and fees distinct from the setup.'],
    ['You repeatedly entered BTC before your trigger. Which review task can you test on the next replay?', ['Log the trigger and check it before each entry', 'Plan to predict every breakout', 'Increase volume until the session is profitable'], 0, 'A written trigger checked before each entry is observable and testable.']
  ] }
};

export const checkpointCues = [
  'Compare at least two highs and two lows from left to right.',
  'Compare the prior swing level with the latest candle before naming the trend.',
  'Identify the level that separates a retracement from a break.',
  'Write down planned entry, stop, and the units being measured.',
  'Check whether the trigger from the plan has actually happened.',
  'Find the condition that was written before the trade opened.',
  'Separate what the trader controlled from what price did next.'
];

export const recoveryQuestions = [
  ['Which gives the stronger read of direction?', 'Several swing highs and lows', 'The color of the last candle'],
  ['Which would help establish a new trend?', 'A break plus a new sequence of swing points', 'A single candle of the opposite color'],
  ['What should you check during a pullback?', 'Whether the prior structure still holds', 'Whether any candle closed lower'],
  ['What determines the planned loss before costs?', 'The stop distance and the position size', 'The entry price alone'],
  ['What tells you the entry is ready?', 'The trigger defined in the plan', 'A fast move in the desired direction'],
  ['What should guide an exit decision?', 'The rule and evidence available at the time', 'The price reached after you exited'],
  ['What can you repeat and measure next time?', 'A specific decision rule', 'A promise to win']
];
