const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = 'http://127.0.0.1:8766/arena.html';
const header = 'timestamp,open,high,low,close,volume';
const rows = ['2026-01-05T14:30:00Z,100,102,99,101,10', '2026-01-05T14:31:00Z,102,110,97,105,20'];
const csv = tail => ({ name: 'fixture.csv', mimeType: 'text/csv',
  buffer: Buffer.from([header, ...rows.slice(0, 1), ...tail].join('\n')) });
const changed = csv(['2026-01-05T14:31:00Z,100000,100010,99990,100001,900',
  '2026-01-05T14:32:00Z,110000,110010,109990,110001,1000']);

async function run() {
  const browser = await chromium.launch(process.env.ARENA_BROWSER ? { executablePath: process.env.ARENA_BROWSER } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 960 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const enterStudio = async () => {
      await page.getByRole('link', { name: 'Market Studio', exact: true }).click();
      await page.getByRole('heading', { name: 'Market Studio', exact: true }).waitFor();
    };
    const load = async (file, checkpoint) => {
      if (!await page.getByLabel('Candle CSV').isVisible()) await page.getByText('Import historical CSV', { exact: true }).click();
      await page.getByLabel('Candle CSV').setInputFiles(file);
      await page.getByLabel('Checkpoint (optional)').setInputFiles(checkpoint || []);
      await page.getByRole('button', { name: 'Load replay' }).click();
      await page.getByText(checkpoint ? 'Checkpoint restored.' : 'Replay loaded.', { exact: true }).waitFor();
    };
    const plan = async () => {
      if (!await page.getByLabel('Fee per fill').isVisible()) await page.getByText('Fees and slippage', { exact: true }).click();
      await page.getByLabel('Units', { exact: true }).fill('2');
      await page.getByLabel('Stop price').fill('99');
      await page.getByLabel('Target price').fill('108');
      await page.getByLabel('Fee per fill').fill('.5');
      await page.getByRole('button', { name: 'Queue paper entry' }).click();
      await page.getByText(/Paper entry queued/).waitFor();
    };
    const chart = page.getByRole('img', { name: /Candlestick chart/ });
    await page.goto(url);
    await page.getByLabel('Local profile name').fill('Replay Tester');
    await page.getByRole('button', { name: 'Create profile and enter' }).click();
    await enterStudio();
    if (!await page.getByLabel('Market', { exact: true }).isVisible()) await page.getByText('Import historical CSV', { exact: true }).click();
    await page.getByLabel('Market', { exact: true }).selectOption('stocks');
    await page.getByLabel('Instrument symbol').fill('SPY');
    await page.getByLabel('Data source').fill('Synthetic browser test');
    const original = csv(rows.slice(1));
    await load(original);
    await plan();
    const first = await chart.evaluate(node => node.outerHTML);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export checkpoint' }).click();
    const file = await download;
    const checkpoint = { name: 'replay.json', mimeType: 'application/json', buffer: fs.readFileSync(await file.path()) };
    await load(changed);
    await plan();
    assert.equal(await chart.evaluate(node => node.outerHTML), first);
    await page.getByRole('button', { name: 'Reveal next candle' }).click();
    await page.getByText(/outside the bracket/).waitFor();
    assert.notEqual(await chart.evaluate(node => node.outerHTML), first);

    await page.reload();
    if (!await page.getByLabel('Market', { exact: true }).isVisible()) await page.getByText('Import historical CSV', { exact: true }).click();
    await page.getByLabel('Market', { exact: true }).selectOption('stocks');
    await page.getByLabel('Instrument symbol').fill('SPY');
    await page.getByLabel('Data source').fill('Synthetic browser test');
    await load(original, checkpoint);
    await page.getByText(/Paper entry queued/).waitFor();
    assert.equal(await chart.evaluate(node => node.outerHTML), first);
    await page.getByRole('button', { name: 'Reveal next candle' }).click();
    await page.getByText('Paper trade history', { exact: true }).click();
    await page.getByText('Closed paper trades · 1', { exact: true }).waitFor();
    await page.getByText(/Studio realized P\/L -7/).waitFor();
    if (process.env.STUDIO_SCREENSHOT) {
      fs.mkdirSync(path.dirname(process.env.STUDIO_SCREENSHOT), { recursive: true });
      await page.screenshot({ path: process.env.STUDIO_SCREENSHOT, fullPage: true, animations: 'disabled' });
    }
    await page.setViewportSize({ width: 390, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByLabel('Market', { exact: true }).selectOption('gold');
    assert.equal(await page.getByLabel('Instrument symbol').inputValue(), 'XAU/USD');
    await load(original);
    await page.getByRole('heading', { name: 'XAU/USD Gold' }).waitFor();
    await page.waitForFunction(() => {
      const book = JSON.parse(localStorage.getItem('gxb_arena_v2_r1'));
      return book.profiles[book.active].state.learning.paper.long === 2;
    });
    await page.getByRole('link', { name: 'Performance', exact: true }).click();
    await page.getByText('0 with saved details', { exact: true }).waitFor();
    await enterStudio();
    await page.getByLabel('Practice market').selectOption('gold');
    await page.getByRole('button', { name: 'Start practice week' }).click();
    await page.getByText(/Synthetic week · Day 1 of 7/).waitFor();
    assert.equal(await page.getByLabel('Candle CSV').isVisible(), false);
    await page.setViewportSize({ width: 1360, height: 960 });
    await chart.scrollIntoViewIfNeeded();
    await chart.hover({ position: { x: 100, y: 95 } });
    await page.locator('.studio-crosshair[visibility="visible"]').waitFor();
    await page.locator('.studio-inspection').filter({ hasText: /UTC · Price/ }).waitFor();
    await page.getByRole('button', { name: 'Buy / Long', exact: true }).click();
    assert.ok(Number(await page.getByLabel('Target price').inputValue()) > Number(await page.getByLabel('Stop price').inputValue()));
    await page.getByRole('button', { name: 'Pick stop on chart' }).click();
    await page.setViewportSize({ width: 1360, height: 960 });
    await chart.scrollIntoViewIfNeeded();
    const bounds = await chart.boundingBox();
    const mid = bounds.x + bounds.width * .35;
    await page.mouse.click(mid, bounds.y + bounds.height * .65);
    assert.ok(Number(await page.getByLabel('Stop price').inputValue()) > 0);
    await page.getByRole('button', { name: 'Pick target on chart' }).click();
    await chart.scrollIntoViewIfNeeded();
    const targetBounds = await chart.boundingBox();
    await page.mouse.click(mid, targetBounds.y + targetBounds.height * .25);
    assert.ok(Number(await page.getByLabel('Target price').inputValue()) > Number(await page.getByLabel('Stop price').inputValue()));
    await page.getByRole('button', { name: 'Play replay' }).click();
    await page.getByRole('button', { name: 'Pause replay' }).click();
    await page.getByRole('button', { name: 'Advance 24h' }).click();
    await page.getByText(/Synthetic week · Day 2 of 7/).waitFor();
    const weekDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export checkpoint' }).click();
    const weekFile = await weekDownload;
    const weekBackup = fs.readFileSync(await weekFile.path());
    await page.reload();
    await page.getByLabel('Practice market').selectOption('gold');
    await page.getByText('Restore a practice-week checkpoint', { exact: true }).click();
    await page.getByLabel('Practice-week checkpoint file').setInputFiles({ name: 'week.json', mimeType: 'application/json', buffer: weekBackup });
    await page.getByRole('button', { name: 'Restore practice week' }).click();
    await page.getByText(/Synthetic week · Day 2 of 7/).waitFor();
    if (process.env.STUDIO_DASHBOARD_SCREENSHOT) {
      await page.getByRole('button', { name: 'Buy / Long', exact: true }).click();
      await chart.scrollIntoViewIfNeeded();
      await chart.hover({ position: { x: 260, y: 120 } });
      await page.screenshot({ path: process.env.STUDIO_DASHBOARD_SCREENSHOT, fullPage: true, animations: 'disabled' });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: Stocks and ETFs and Gold replay, visible-chart isolation, next-event-only paper fills, mobile layout, checkpoint reload, separation from legacy scoring, seven-day practice, crosshair, chart picking, and week checkpoint restore.');
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
