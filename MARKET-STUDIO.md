# Market Studio · Release 2

Launch with `Start GXB.cmd` or run `node tools/preview.cjs` and open http://127.0.0.1:8766/arena.html#studio. Choose a profile first or enter as a guest. Market Studio is open on either training path.

## Practice a trading week

Choose Gold or Stocks and ETFs, then select **Start practice week**. New weeks contain seven continuous synthetic days with 24 hourly candles per day. The first eight candles are visible when you start so you have a setup to read. Earlier five-day checkpoints can still be resumed. Use **Reveal next candle**, **Advance 24h**, or **Play replay** and **Pause replay** to advance the clock. Trading two or three completed setups is a practice goal. It is also valid to let the week finish with fewer trades.

Hover over a candle, or focus the chart and press the left or right arrow key, to inspect its UTC time, price, and OHLC. Choose **Buy / Long** or **Sell / Short** to prefill an editable one-unit paper order ticket using the latest visible range. **Hold / Wait** advances one candle without submitting an order. Use **Pick stop on chart** or **Pick target on chart** and click a visible price, or type exact prices into the ticket. The ticket queues a paper market entry for the next revealed open. Pending and active order levels within the visible chart range appear as guides.

Use **Export checkpoint** to keep your place. To resume this built-in week, select the same market and open **Restore a practice-week checkpoint**. The built-in scenario provides repeatable training. To keep the results in an ongoing paper account, use **Start linked practice week** with a Portfolio Lab account.

## Connect a Portfolio Lab paper account

Open **Portfolio Lab** and choose a starting USD paper balance for Gold, Stocks & ETFs, or both. The accounts and ledgers are separate. Open Market Studio for that market and choose **Start linked practice week**. A linked week saves the replay cursor, orders and settled trades in your local profile. After refresh, **Resume linked practice week** restores the open position and replay clock.

The account reserves the position’s full notional plus both fees for long or short exposure. At entry the engine checks cash again at the actual simulated fill price. The Lab shows settled cash, available paper cash, marked equity and P/L based on the last revealed close, realized P/L, and fees. P/L is in simulated USD. A session can span multiple days and browser visits. At the final candle, **Settle paper week** cancels any unfilled order and closes any remaining position at the final revealed close with the configured slippage. Then you can add simulated funds or start another week using the carried cash balance and ledger.

Settings backups include both accounts and the linked-week checkpoint. Linked account support covers the built-in synthetic weeks. CSV replays continue to have their own paper results. Broker accounts, leverage, real money, and position carry into a fresh scenario remain outside this workflow.

## Load candles

Expand **Import historical CSV** below the chart. Choose **Stocks and ETFs** or **XAU/USD Gold**. Enter a symbol for stocks and ETFs, name the data source, specify its input interval, and select the local CSV. The header is:

```text
timestamp,open,high,low,close,volume
```

Use ascending UTC ISO timestamps at the **start** of each interval. For example, a one-minute row beginning at `2026-01-05T14:30:00Z` becomes visible at `14:31:00Z`. Supported intervals are 1, 5, 15, 60 and 1,440 minutes, aligned to UTC. Prices are positive decimals and volume is nonnegative. Files may contain gaps. Larger chart intervals aggregate only the disclosed input candles. The working chart shows up to 60 aggregated candles and displays SMA(5) when five completed chart candles are available.

Studio uses the file you supply. Use a dataset you are authorized to use. The release bundles no historical market files. Exchange calendars, time-zone conversion, session-specific bars, and data-provider adapters remain future work.

## Replay and paper orders

Reveal one candle at a time. The live chart, range and indicator read from the revealed prefix. The replay processes orders only when a candle is disclosed. One paper position can be active per replay. Enter a long or short side, size, stop, target, fee per fill, and adverse slippage in basis points. The bracket must contain the latest revealed close when queued.

- Market entries and manual exits fill at the next revealed open with configured adverse slippage. An entry is canceled if its slippage-adjusted fill falls outside the bracket.
- A stop gapped through fills from the next open. A target gapped through uses the target price as its base fill. If a single candle touches both levels and neither is reached at its open, the stop takes precedence. Exit fills also include configured adverse slippage.
- Studio reports marked and realized P/L in the price units of the input file, net of both fills’ fees. Closed paper trades use their own ledger and remain separate from Academy and legacy drill scoring. CSV replays use an unlinked paper ledger. Margin, partial fills, FX conversion and broker-specific fees remain outside this implementation.

**Export checkpoint** saves the replay cursor, display interval, and paper action log. To resume after closing or refreshing the tab, load the exact same CSV and dataset metadata alongside that checkpoint. The SHA-256 dataset identifier detects mismatches. Instrument data and paper history live in the tab until exported. The checkpoint contains no candle file.

## Verification and next work

```powershell
node --test tools/test-studio.mjs
node tools/test-studio-browser.cjs
```

The browser test uses Playwright and Chromium or Edge. See [Release 1 verification](ARENA-RELEASE-1.md) for browser environment variables. The Studio regression substitutes unseen extremes, volumes and dataset lengths. It compares chart geometry, range, the replay clock, SMA, the partial bucket, and pending and completed paper state until the first affected event arrives. It also checks deterministic checkpoint reload with a pending order. Separate pre-reveal decision scoring, levels and annotation suggestions remain future interfaces and should join that isolation test when added.

The future portfolio importer remains a read-only boundary. Import snapshots with source, as-of date, instrument identity, currency, available cash, holding units and supplied acquisition costs. Use separate stock and Gold ledgers and preserve Gold-specific settings. Portfolio snapshots, real account integrations, managed identity and cross-device synchronization are deferred. No real trade execution is in this release.

To return to Release 1, stop the local preview and run `git switch release/gxb-arena-v2-r1`. The Arena profile snapshot is shared with Release 1. Export any Studio checkpoint before leaving the branch.
