# Run GxB Trading Arena locally

Double-click **Start GXB.cmd**, or run `node tools/preview.cjs` from this folder and open http://127.0.0.1:8766/arena.html. Node.js is required. The server binds to loopback. Keep the same address, port and browser profile to access your existing data. Close training tabs running the audited baseline before first launch. If an earlier preview holds port 8766, stop that preview before starting this release.

- **Arena** · `/arena.html` and `/`
- **Legacy training compatibility** · `/practice.html`
- **Separate Financial Command Center** · `/index.html`

A returning trader can select their profile or open the remembered Command Center. Use **Switch profile** to choose or create another profile. **Guest practice** is held in memory and ends on refresh or when the tab closes. Both training paths can open both Academy tracks and Free Practice. **Settings** holds the training path, drill mode, candle palette, assists and backup controls.

## Command Center workspace

Hold the grip beside Command Center, Academy, Free Practice or Market Studio, then drag it onto the destination row. **Reorder navigation** opens keyboard-accessible move buttons. Each profile keeps its own order.

Select Gold or Stocks and ETFs to switch the right-hand watchlist. The starter symbols are editable. Enter exchange-qualified symbols such as `NASDAQ:MSFT`. Each row opens a TradingView chart. **Load TradingView quotes** requests an embedded quote panel from TradingView for the current symbols. Exchange coverage and delay depend on the provider. The watchlist and checklist are usable offline.

The **Market assistant** builds a local brief from the selected market, tracked symbols and available practice focus. You can copy it into an AI assistant. A future connected agent could add read-only, timestamped market context and ask for the trader’s setup, trigger and invalidation. This version generates the checklist and handoff locally.

## Your Academy learning plan

Choose Gold or Bitcoin to meet the GXB Academy Guide. Share a short introduction if you want. The guide responds and points you to the first market review. The complete seven-lesson path is available from the journey screen. Each track has its own checkpoints. A missed answer prompts an interactive follow-up and a chance to retry. The next recommendation can change based on first answers, simulated Free Practice results and new paper decisions made in Market Studio.

Academy keeps these signals with the local profile and includes them in backups. Studio supplies action counts for paper entries, exits and cancellations. It does not re-count actions replayed from a checkpoint. Guide replies and suggested reviews are rule-based. The **GxB Academy Guide** asks checkpoint questions and gives feedback beside the chart. Open **Continue with your own AI assistant** in the guide to preview and copy a tutoring prompt. Brokerage connections, AI-generated tutoring and live market data for Academy lessons remain future integrations.

On the Academy selection screen, **Learning activity** shows the current profile’s latest observations. Arena keeps up to 120 recent timestamped events per profile, including answers and retries, settled Free Practice choices, new Studio paper actions, optional check-ins and manually saved research links. Existing progress and aggregate counts are preserved. Use **Save check-in** to add your own description. A checkpoint can then add a decision question about that particular pressure. Arena does not infer feelings from trade outcomes.

**Save market research** keeps the public HTTPS source, market and time you saved it. Arena does not fetch or verify the source. The AI tutoring prompt previews recent learning evidence, the latest check-in and recent links for the selected market. It is shared only if you copy it and provide it to an assistant. Activity is included in profile backups. Local profiles are for use within this browser, with the same access boundaries as other Arena data.

## First launch and source of truth

Arena Release 1 uses the versioned snapshot in the browser’s `gxb_arena_v2_r1` localStorage key. The shell and the served compatibility entry point use that same snapshot. During migration, the profiles key `gxb_arena_profiles_v1` takes precedence because it owns the profile IDs and may already contain the device-era records. When the profiles key is absent, the device key `gxb_arena_v1` can supply one profile tagged as imported device history. Both original keys are retained verbatim.

Migration validates profile ownership and session detail, tags records as legacy drill results, and gives unkeyed history entries stable identifiers within each profile. Recorded aggregate totals are preserved when individual records are absent. Historical scoring versions and outcomes remain as recorded. Missing dates, session details, and old unfinished scenarios are left unavailable. The new snapshot is committed in one write under an origin-scoped Web Lock, and stale concurrent writers get a visible error and must reload.

Migration can only see keys on the same browser origin. A prior account on another browser, hostname, port, file URL, or hosted site has separate storage. Local profiles share access to this browser and have no password protection.

## Backup and recovery

**Settings → Export backup** downloads a JSON copy of every saved profile, including preferences, progress, session records and supported drafts. Keep the file somewhere you control. On a new browser, use **Restore a backup** on the entrance. Import adds missing profiles and skips identical snapshots. If a matching profile has diverged, ordinary import stops before writing. To restore matching profiles from a backup, check the restore option. The app downloads a copy of the current data before attempting replacement. Unrelated profiles remain in place.

If storage reports a problem, read the message and reopen the page after resolving it. Guest practice remains available when persistence is blocked. A draft created in this release stores the exact seed for an unanswered round or the completed decisions at the last checkpoint. An interruption during a reveal resumes from the prior checkpoint. Academy resumes from completed lessons. An in-progress Academy checkpoint starts again when reopened.

## Roll back locally

1. Export the Release 1 backup and stop the running preview. Keep the backup and both legacy storage keys.
2. From this repository, run `git switch codex/gxb-application` to return to the audited branch. To inspect the exact audited commit independently, use `git switch --detach 96575f9d8f42c38787cead65ea4e8a45be8bade5`.
3. Start the baseline launcher and open `/practice.html` on the same origin. The baseline reads the original legacy keys as they stood before Arena. Progress made in Release 1 remains in its versioned snapshot and can be accessed again by switching back to `release/gxb-arena-v2-r1`.

Avoid alternating between the baseline and Release 1 to record training. The baseline cannot read Release 1 records, and switching back to Release 1 will continue to use its saved snapshot.
