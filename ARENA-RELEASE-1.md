# Arena V2 Release 1

## Architecture and verification

The shell uses native modules, CSS and hash routes. The seven lessons and drill engines live in the compatibility page. The shell embeds only the selected workspace and pins its training connection to the selected profile. Guest work uses an in-memory connection. The standalone compatibility page opens the same versioned store. The committed training snapshot contains local identity, profile preferences, separate Academy tracks, legacy drill totals, saved session details and a versioned practice draft. The baseline inventory is in [arena/BASELINE.md](arena/BASELINE.md).

Run these checks from the repo root:

```powershell
node tools/test-home.cjs
node --test tools/test-arena-store.mjs
node tools/test-future-scale.cjs
node tools/launch.cjs --no-open
node tools/test-arena-browser.cjs
```

The browser test requires Playwright and Chromium or Edge, for testing only. Set `PLAYWRIGHT_MODULE` to an existing Playwright installation if it is outside this repository. Set `ARENA_BROWSER` to a browser executable when using a locally installed browser. Set `ARENA_SCREENSHOTS` to a writable directory to capture the four desktop views and mobile Command Center. The browser verification uses a temporary profile and labeled test fixture data. Instructions for real browser data and rollback are in [LOCAL-APP.md](LOCAL-APP.md).

Verification passed for the existing Academy regression, five migration and storage tests, and the hidden-candle renderer regression. Headless Edge passed at desktop (1360px), tablet (768px), and mobile (390px). The browser run covered keyboard navigation and glossary focus, both entry points, a ten-round session, exact pending-chart reload, checkpoint resume, clipboard copy, preference and profile isolation, duplicate import, explicit restore with a pre-restore download, stale-tab rejection, and guest access during a storage failure. The launcher was exercised with `--no-open`. Migration coverage used controlled browser fixtures. It did not read the trader’s actual browser profile.

The legacy renderer’s horizontal layout and price scale depend on visible bars and displayed decision guides. The regression compares draw calls while varying unrevealed prices and length before and during reveal. Legacy drills still use synthetic scenarios and outcome-based exercise rules. The legacy scoring version remains attached to the result, including version 2 for new sessions on that engine. The renderer fix is independent of scoring.

## Release 2 proposal for review

1. Create local dataset adapters for Stocks and ETFs and XAU/USD Gold with a common instrument model. Validate symbol, dataset provenance, timestamps, timezone, resolution, OHLC integrity and session calendar. Resolve data licensing before bundling any historical dataset. Preserve Bitcoin in the Academy.
2. Isolate the historical data source from the visible replay state. Give charts, indicators, decision tools and analytics only the snapshot revealed at the cursor. Advance the clock in deterministic events with a reproducible replay log and versioned checkpoints.
3. Introduce paper-only position planning and order simulation with explicit fees, slippage, fill rules and deterministic handling of intrabar stop/target ambiguity. Keep a separate Market Studio execution analytics model and schema version. Allow direct access from either training path.
4. Define a future read-only portfolio snapshot importer with source, as-of timestamp, currency, available cash and holdings with units and acquisition cost or cost basis when supplied. Retain source and stable keys for deduplication. Stocks and ETFs and the independently configurable Gold portfolio should have separate ledgers and settings. A later brokerage connector would require separate authorization. Keep portfolio data out of synthetic drill scoring.
5. Keep local identity as the default. The shell uses a list/select/create identity boundary. A managed identity provider and synchronization adapter can later add credential handling, stable remote IDs and per-profile conflict resolution behind that boundary.

### Future-data isolation acceptance test

Run the same replay twice with identical instrument metadata, clock, inputs and revealed candles. Replace the entire unrevealed suffix in one run with extreme prices, different volumes, and a different length. Before the first changed event is revealed, assert identical visible chart geometry and range, indicator values, pre-reveal decision scoring, position-planning outputs, support and resistance suggestions, annotations, and all order/position/account state. Then advance to the changed event and assert that only eligible state can diverge. Include pending stop/target orders, an incomplete aggregation bucket and a reload at a checkpoint.

Release 1 stops at review. Market Studio historical replay, execution analytics, real-account and portfolio imports, managed sign-in, and synchronization are deferred.
