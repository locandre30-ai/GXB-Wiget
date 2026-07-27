# GXB-Wiget

Premium embed widgets for the GXB Financial Command Center (Notion, via iframe).
Pure HTML/CSS/vanilla JS — zero dependencies, zero build step, zero external requests.

Served via GitHub Pages: `https://locandre30-ai.github.io/GXB-Wiget/`

## Widgets

| File | Widget | Embeds into |
|---|---|---|
| `index.html` | **Financial Command Center hero** — Capital / Growth / Legacy orbs, mode status, canvas FX | 💎 GXB hub page |
| `practice.html` | **ICC Practice Arena** — gamified chart-reading drills with XP, levels, combos, and a daily streak | 📈 Trading Journal — ICC Command Center |

## ICC Practice Arena

Synthetic chart drills mapped 1:1 to the **ICC Practice Sessions** database focus areas:

- Trend Confirmation
- Continuation Recognition
- Entries (Long / Short / No Trade, scored in R-multiples: 1.2×ATR stop, 2R target)
- Exits (hold the runner vs. bank profit)
- Avoiding Chase Trades (the no-FOMO filter)

Every answer reveals the "future" bars for a visual payoff. Correct calls earn XP with
combo multipliers; completed sessions build a daily 🔥 streak and end with an A–F grade
plus a **Copy Session Log** button formatted to paste straight into the Notion database.

Two modes: **Guided** (per-drill "what you're looking at" briefing before you answer,
tappable follow-up questions, habit-building lesson after, assist rails always on) and
**Pro** (clean self-test). Guided briefings carry 3–4 follow-up question chips —
"How was the stop calculated?", "Exhaustion or just a breather?", "Why might it
reverse?" — answered from the live chart's own measurements (real ATR, entry, stop,
retrace %, wick ratios). Answers argue both sides and never reference the hidden
outcome, so they teach reasoning rather than leak the answer.
New users start Guided. Charts carry a permanent "Synthetic data · training only" badge.
Lifetime per-skill accuracy and R persist and feed a rule-based **coach card** on the
session summary (weakest skill, accuracy-vs-R divergence, insufficient data) — derived
strictly from logged reps, never invented. Grade ladder: A / A- / B / C / D.

The summary also carries a 👑 **Kingdom Note** — an earned affirmation in the Kingdom
voice, paired with the evidence sentence that triggered it. Nine rules evaluated
top-down (management leak, big R, focused mastery, sustained combo, patience, capital
intact, streak, rough tape, fallback); an affirmation never appears without the
session data that justifies it, and a leaky session gets an honest read rather than
praise. Combo milestones surface a short Kingdom line mid-session.

Extras: an 👁 Assist toggle overlays the live decision levels on the chart —
entry/stop/target rails on trade drills, ±1R rails on exits, and the two
structure-break lines on continuation drills — and hides them for clean self-testing.
Tap any dotted term (ATR, R, stop, consolidating, …) for a plain-English
breakdown in a top sheet, and switch candle color themes — classic green/red,
ocean blue/orange (colorblind-safe), mono white/slate (emotion-neutral), and holo
brand cyan/violet — to train your eye on the palette you trade with. Choice persists.

Progress (XP, level, streak) persists in `localStorage` per browser.

## Development

Edit the HTML files directly and open in a browser — no build step.
Test at desktop width and ≤980px, and check `prefers-reduced-motion`.
See `CLAUDE.md` for full architecture and brand standards.
