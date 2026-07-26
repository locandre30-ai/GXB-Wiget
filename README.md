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

Extras: tap any dotted term (ATR, R, stop, consolidating, …) for a plain-English
breakdown in a bottom sheet, and switch candle color themes (mint / classic / tv / holo)
to train your eye on the palette you trade with — choice persists.

Progress (XP, level, streak) persists in `localStorage` per browser.

## Development

Edit the HTML files directly and open in a browser — no build step.
Test at desktop width and ≤980px, and check `prefers-reduced-motion`.
See `CLAUDE.md` for full architecture and brand standards.
