# Market Studio · Release 2

Launch with `Start GXB.cmd` or run `node tools/preview.cjs` and open http://127.0.0.1:8766/arena.html#studio. Choose a profile first or enter as a guest. Market Studio is open on either training path.

## Load candles

Choose **Stocks and ETFs** or **XAU/USD Gold**. Enter a symbol for stocks and ETFs, name the data source, specify its input interval, and select the local CSV. The header is:

```text
timestamp,open,high,low,close,volume
```

Use ascending UTC ISO timestamps at the **start** of each interval. For example, a one-minute row beginning at `2026-01-05T14:30:00Z` becomes visible at `14:31:00Z`. Supported intervals are 1, 5, 15, 60 and 1,440 minutes, aligned to UTC. Prices are positive decimals and volume is nonnegative. Files may contain gaps. Larger chart intervals aggregate only the disclosed input candles. The working chart shows up to 60 aggregated candles and displays SMA(5) when five completed chart candles are available.

Studio uses the file you supply. Use a dataset you are authorized to use. The release bundles no historical market files. Exchange calendars, time-zone conversion, session-specific bars, and data-provider adapters remain future work.

## Replay and paper orders

Reveal one candle at a time. The live chart, range and indicator read from the revealed prefix. The replay processes orders only when a candle is disclosed. One paper position can be active per replay. Enter a long or short side, size, stop, target, fee per fill, and adverse slippage in basis points. The bracket must contain the latest revealed close when queued.

- Market entries and manual exits fill at the next revealed open with configured adverse slippage. An entry is canceled if its slippage-adjusted fill falls outside the bracket.
- A stop gapped through fills from the next open. A target gapped through uses the target price as its base fill. If a single candle touches both levels and neither is reached at its open, the stop takes precedence. Exit fills also include configured adverse slippage.
- Studio reports marked and realized P/L in the price units of the input file, net of both fills’ fees. Closed paper trades use their own ledger and remain separate from Academy and legacy drill scoring. Cash constraints, margin, partial fills, FX conversion and broker-specific fee models remain outside this first Studio implementation.

**Export checkpoint** saves the replay cursor, display interval, and paper action log. To resume after closing or refreshing the tab, load the exact same CSV and dataset metadata alongside that checkpoint. The SHA-256 dataset identifier detects mismatches. Instrument data and paper history live in the tab until exported. The checkpoint contains no candle file.

## Verification and next work

```powershell
node --test tools/test-studio.mjs
node tools/test-studio-browser.cjs
```

The browser test uses Playwright and Chromium or Edge. See [Release 1 verification](ARENA-RELEASE-1.md) for browser environment variables. The Studio regression substitutes unseen extremes, volumes and dataset lengths. It compares chart geometry, range, the replay clock, SMA, the partial bucket, and pending and completed paper state until the first affected event arrives. It also checks deterministic checkpoint reload with a pending order. Separate pre-reveal decision scoring, levels and annotation suggestions remain future interfaces and should join that isolation test when added.

The future portfolio importer remains a read-only boundary. Import snapshots with source, as-of date, instrument identity, currency, available cash, holding units and supplied acquisition costs. Use separate stock and Gold ledgers and preserve Gold-specific settings. Portfolio snapshots, real account integrations, managed identity and cross-device synchronization are deferred. No real trade execution is in this release.

To return to Release 1, stop the local preview and run `git switch release/gxb-arena-v2-r1`. The Arena profile snapshot is shared with Release 1. Export any Studio checkpoint before leaving the branch.
