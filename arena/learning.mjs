import { cleanActivity } from './activity.mjs?v=daily-10';
export const assessmentFields = {
  goal: ['Learn the basics', 'Practice day trades', 'Study longer-term entries'],
  experience: ['New to charts', 'Some chart practice', 'Regular practice'],
  focus: ['Structure', 'Risk', 'Entries and exits']
};
const tracks = ['gold', 'bitcoin'];
const paperActions = ['long', 'short', 'cancel', 'exit'];
export const GUIDE_NAME = 'GXB AI';
export const DAILY_QUESTIONS = 10;
export const reinforcementDrills = ['Trend Confirmation', 'Trend Confirmation', 'Continuation Recognition',
  'Entries', 'Entries', 'Exits', 'Avoiding Chase Trades'];
export const marketObservation = [
  'Label the structure you see: uptrend, downtrend, or range. Identify two turning points that support your read.',
  'Compare two swing highs and two swing lows. Then zoom out and see whether the broader structure agrees.',
  'Find a pullback. Mark the trough that launched the last rally and check whether price held or crossed it.',
  'Identify a hypothetical entry and invalidation level. Measure the distance per unit before considering size.',
  'Name a possible entry trigger and decide what would invalidate it. Check whether the trigger has actually happened.',
  'Choose an example exit rule and identify where the chart would have given you evidence to act.',
  'Write down one decision rule from today and find a setup where you would apply it or stand aside.'
];

const skillApplications = [
  [
    ['Two candles close higher, but the last two swing highs are lower. What has the stronger claim on your trend read?', 'The sequence of swing points', 'The two candle colors', 'The latest opening price', 'Individual candles can move against the broader structure.'],
    ['Price repeatedly turns near the same upper and lower areas. What would you label first?', 'A range', 'A confirmed uptrend', 'A guaranteed breakdown', 'Repeated turns without sustained progress describe a range.']
  ],
  [
    ['A rally sets a higher high. The next pullback undercuts the previous swing low. How should you describe the structure?', 'Mixed structure that needs more evidence', 'A clean uptrend', 'A confirmed downtrend', 'Higher highs and lower lows do not form a clean directional sequence.'],
    ['The last peak is lower and the next trough is lower. What do those two observations support?', 'A downtrend read', 'A confirmed upside reversal', 'Direction based on candle color alone', 'Lower lows and lower highs support a downtrend read.']
  ],
  [
    ['Price dips into a support zone and closes back inside it. What is still useful to watch?', 'Whether later candles hold or break the zone', 'Whether the first wick guaranteed a reversal', 'Whether the opening price was a round number', 'A test of a zone gives evidence. Follow-through helps clarify it.'],
    ['Two troughs are visible. Which one is the useful starting reference for the latest rally?', 'The trough that launched that rally', 'Always the oldest trough', 'Always the lowest wick on the screen', 'Match the swing reference to the move and timeframe you are evaluating.']
  ],
  [
    ['The planned stop distance doubles and the risk budget is unchanged. What happens to planned size before costs?', 'It halves', 'It doubles', 'It stays the same', 'Planned risk is stop distance multiplied by position size.'],
    ['Price gaps through the planned stop. Why can the realized loss exceed the plan?', 'The next available fill can be worse', 'A stop guarantees its trigger price', 'Only position direction matters', 'A trigger and an execution price can differ.']
  ],
  [
    ['Your plan requires a close beyond a zone. So far only a wick went beyond it. What follows the plan?', 'Wait for the required close', 'Enter on the wick', 'Remove the trigger', 'The planned event has not happened yet.'],
    ['The setup meets your trigger, but you cannot name an invalidation point. What is missing?', 'A condition that would disprove the trade idea', 'A more exciting target', 'A larger position', 'The plan needs an observable condition for being wrong.']
  ],
  [
    ['Price reaches your preplanned exit condition, then bounces. Which information should guide your original decision?', 'The rule and evidence visible at the exit', 'The later bounce', 'The next session’s open', 'Evaluate decisions using information available at the time.'],
    ['You feel tempted to move the stop farther away after entry. What should you check first?', 'Whether the written plan ever permitted that change', 'Whether hoping feels justified', 'Whether the last candle was small', 'Compare changes with the management rules you chose before entry.']
  ],
  [
    ['Two trades made the same profit. One ignored the plan. How should you compare them?', 'Review process and outcome separately', 'Rate them equally by profit alone', 'Ignore both decisions', 'Similar outcomes can come from very different decisions.'],
    ['Which journal entry gives you something concrete to test tomorrow?', 'Wait for a close above the zone before considering entry', 'Make more money', 'Always trust my first impulse', 'A repeatable rule can be tested on a new setup.']
  ]
];

const transferQuestions = [
  ['Why compare more than one timeframe before finalizing a read?', 'To see how the local move fits the broader structure', 'To find whichever view agrees with me', 'To make the next candle predictable', 'Different scales show different parts of the same move.'],
  ['Which part of a candle shows its highest and lowest traded prices?', 'The wick tips', 'The body midpoint', 'The color alone', 'The body gives the open and close. The wick tips show the range.'],
  ['A setup looks promising. What makes the decision testable?', 'An observable trigger and a condition that would invalidate it', 'Confidence in the outcome', 'A popular ticker', 'A testable plan states what must happen and what would make the idea wrong.'],
  ['What is the useful response when the chart evidence conflicts?', 'Name what is unclear and wait for more evidence', 'Force a direction', 'Increase the planned size', 'Standing aside gives you room to reassess.'],
  ['When reviewing a setup, which detail should be written before seeing the outcome?', 'What I saw and the decision rule I used', 'The final profit', 'The next swing high', 'Recording your reasoning early helps reduce hindsight bias.'],
  ['Why can two learners make reasonable reads of the same chart?', 'They may be evaluating different timeframes or decision rules', 'Price always has two guaranteed directions', 'Only one candle can be viewed', 'Make the timeframe and the decision rule explicit before comparing interpretations.'],
  ['A clue helped you answer correctly. What would test whether the skill transferred?', 'Explain your reasoning on a different setup without the clue', 'Repeat the same answer from memory', 'Skip the topic permanently', 'A fresh setup tests recognition instead of recall.'],
  ['You are eager to act after a fast candle. What is a useful pause?', 'Check whether the written trigger happened', 'Treat speed as confirmation', 'Widen the risk limit', 'The written rule gives you something observable to check.'],
  ['Which is the better evidence that price is holding beyond a zone?', 'Price stays beyond its edge over subsequent candles', 'A single wick extends past it', 'The zone has a round-number label', 'Follow-through provides more context than a brief excursion.']
];

export function dailyApplications(chapter, attempts) {
  const start = Math.floor(attempts / DAILY_QUESTIONS) % transferQuestions.length;
  const rotated = [...transferQuestions.slice(start), ...transferQuestions.slice(0,start)];
  return [...skillApplications[chapter], ...rotated.slice(0,7)];
}

export function academyDay(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}

function cleanDailyReports(raw) {
  const byDay = new Map();
  for (const row of Array.isArray(raw) ? raw.slice(-366) : []) {
    const total = row?.total === DAILY_QUESTIONS ? DAILY_QUESTIONS : 3;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row?.day ?? '') || !tracks.includes(row.market) ||
        !Number.isInteger(row.chapter) || row.chapter < 0 || row.chapter > 6 ||
        !Number.isInteger(row.independent) || row.independent < 0 || row.independent > total) continue;
    byDay.set(row.day, { day: row.day, market: row.market, chapter: row.chapter, independent: row.independent, total });
  }
  return [...byDay.values()].sort((a,b) => a.day.localeCompare(b.day));
}

export function academyGrowth(learning) {
  const days = learning?.daily?.length ?? 0;
  const level = days >= 14 ? 'Level 3 · Practiced' : days >= 4 ? 'Level 2 · Novice' : 'Level 1 · Beginner';
  return { days, level };
}

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
  return { activity: cleanActivity(raw?.activity), introduction: cleanIntroduction(raw?.introduction), paper, assessment: valid ? Object.fromEntries(Object.keys(assessmentFields).map(key => [key, assessment[key]])) : null, evidence, daily: cleanDailyReports(raw?.daily) };
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
  return { chapter, source: 'assessment', reason: profile.goal + ' · Based on your assessment.' };
}

export const bitcoinReads = [
  ['BTC trades around the clock. On this weekend example, what do progressively lower rallies and lows show?', ['Lower highs and lower lows', 'A confirmed rebound', 'A flat range'], 0, 'Lower highs and lower lows point to downward structure. The calendar alone does not tell you direction.'],
  ['On this BTC chart, which evidence shows buyers advancing over several swings?', ['One green candle', 'Higher highs and higher lows', 'The price has more digits'], 1, 'Several higher turning points provide stronger evidence than a single green candle.'],
  ['BTC repeatedly returns between the two recent turning zones. How should you describe the tape?', ['A certain breakdown', 'A trend that must continue', 'A range with no confirmed break'], 2, 'The repeated returns show a range. A touch or wick alone does not establish a sustained break.']
];

export const bitcoinLessons = {
  1: { intro: 'BTC venues can print different prices. Read structure on one consistent quote feed before comparing markets.', questions: [
    ['BTC/USD makes a higher swing low after a higher swing high. Which evidence matters most?', ['The sequence of swing points', 'The newest candle color alone', 'The exact same price on all venues'], 0, 'Higher highs and higher lows describe the uptrend on this quote feed. Compare wick tips at the swing points.'],
    ['A BTC candle closes below its own open. The prior swing low remains intact. Which observation would strengthen a reversal case?', ['Another exchange has a slightly different price', 'A break followed by lower swing structure', 'The last candle was red'], 1, 'A break of the marked low followed by lower lows and lower highs would provide more evidence.'],
    ['BTC bounces repeatedly inside the same zone. What should you wait for before calling this a trend?', ['Sustained progress beyond the range', 'Any wick past the midpoint', 'A round-number price'], 0, 'Look for price to make and hold directional progress beyond the overlap.']
  ] },
  2: { intro: 'Fast price changes can make BTC pullbacks look dramatic. Check which prior level actually gave way.', questions: [
    ['Compare the BTC downswing with the trough marked in gold. What remains open?', ['The rise may resume, but needs confirmation', 'A crash has already been confirmed', 'Every lower close invalidates the setup'], 0, 'A retracement with intact structure leaves continuation possible, with no guarantee.'],
    ['Trace the BTC rally from the gold dot. Compare the latest candles with that low. Which note belongs in your plan?', ['This break challenges my long thesis', 'Increase exposure because price is cheaper', 'Delete the level because it failed'], 0, 'Price fell below the trough that launched the latest rally. Reassess that leg and watch for lower lows and lower highs.'],
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

export function cleanIntroduction(value) {
  return typeof value === 'string' ? value.trim().slice(0, 500) : '';
}

export function introductionReply(value) {
  const words = cleanIntroduction(value).toLowerCase();
  if (/\b(brand new|beginner|just starting|new to|never traded|never invested)\b/.test(words)) {
    return 'We’ll start with what the chart is showing. I’ll explain the terms as we go and leave room to try again.';
  }
  if (/\b(longer.term|long.term|investing|investor|swing trad(?:e|ing|er))\b/.test(words)) {
    return 'You mentioned a longer view. We can use that perspective when we compare timeframes and decide what counts as meaningful evidence.';
  }
  if (/\b(day trad(?:e|ing|er|es)|scalp(?:ing|er)?|intraday)\b/.test(words)) {
    return 'You brought up intraday trading. We’ll practice reading the setup and spelling out what needs to happen before making a decision.';
  }
  if (/\b(fear|greed|fomo|hesitat\w*|nervous|confidence|confident|emotions?)\b/.test(words)) {
    return 'You brought up how it feels to make a decision. We can slow down at those moments and work through what would help you stick to a plan.';
  }
  return 'Thanks for introducing yourself. We’ll build from reading the market to planning risk, entries and exits, then reviewing your decisions.';
}
