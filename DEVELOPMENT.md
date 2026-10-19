# GXB application — development context

Repository: https://github.com/locandre30-ai/GXB-Wiget
Local branch: codex/gxb-application

## Source of truth
- Product vision and release notes: https://www.notion.so/3a937293ef3a8119baa0dbd45a4145ca
- Code and history: GitHub repository above.
- Read CLAUDE.md for architecture and Kingdom standards.

## Starting point
The local branch includes main plus Claude's three existing commits through 8c506ee: separate player profiles, compact profile controls, and Exits R crediting. These changes were fetched from origin/claude/arena-practice-session-yb75rj. No remote branch or live deployment was changed during setup.

practice.html contains the training application. index.html is the separate financial hero widget. Both are self-contained HTML/CSS/JavaScript.

## Local preview
Run: node tools/preview.cjs
Open: http://127.0.0.1:8766/practice.html
The server binds only to 127.0.0.1. It is for development, not production.
Preview launch was attempted during setup but the browser timed out; visual validation remains pending.

## Next work
1. Verify profiles, Exits scoring, and session completion in a working browser preview.
2. Add scored-trade count and R per scored trade, with a scoring-version boundary for history.
3. Close the Kingdom Note rule gap for negative R below 70% accuracy.
4. Establish the standalone app navigation and session-history foundation, retaining the existing Notion embed URL.

Keep Notion current when shipping. Do not treat the August Notion backlog as proof a fix is missing: check all Git branches first.
