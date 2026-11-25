const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function run() {
  const browser = await chromium.launch(process.env.ARENA_BROWSER ? { executablePath: process.env.ARENA_BROWSER } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 2400, height: 1060 } });
    page.setDefaultTimeout(8000);
    await page.goto('http://127.0.0.1:8766/arena.html');
    await page.getByLabel('Local profile name').fill('King');
    await page.getByRole('button', { name: 'Create profile and enter' }).click();
    await page.getByRole('heading', { name: 'Market watchlist' }).waitFor();
    assert.equal(await page.locator('nav').evaluate(nav => nav.getBoundingClientRect().left), 0);
    assert.ok(await page.locator('.dashboard-rail').evaluate(rail => rail.offsetLeft > 1400));
    const order = () => page.locator('.nav-row a').allTextContents();
    const grip = page.locator('.nav-row').filter({ hasText: 'Market Studio' }).locator('.nav-grip');
    const source = await grip.boundingBox();
    const target = await page.locator('.nav-row').first().boundingBox();
    await page.mouse.move(source.x + 5, source.y + 5);
    await page.mouse.down();
    await page.locator('.nav-grip.dragging').waitFor();
    await page.mouse.move(target.x + 15, target.y + 15);
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('.nav-row a').textContent === 'Market Studio');
    await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('gxb_arena_v2_r1')).profiles)[0].navOrder[0] === 'studio');
    await page.reload();
    await page.getByRole('heading', { name: 'Market watchlist' }).waitFor();
    assert.equal((await order())[0], 'Market Studio');
    await page.getByRole('button', { name: 'Reorder navigation' }).click();
    await page.getByRole('button', { name: 'Move Academy earlier' }).click();
    assert.deepEqual(await order(), ['Market Studio', 'Academy', 'Command Center', 'Free Practice']);
    await page.getByRole('button', { name: 'Reorder navigation' }).click();

    await page.getByRole('button', { name: /Stocks and ETFs/ }).click();
    await page.getByRole('link', { name: 'AMEX:SPY chart on TradingView' }).waitFor();
    await page.getByLabel('Watchlist symbol').fill('NASDAQ:MSFT');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('link', { name: 'NASDAQ:MSFT chart on TradingView' }).waitFor();
    await page.getByRole('button', { name: 'Build market review brief' }).click();
    assert.match(await page.getByLabel('Market review brief').inputValue(), /NASDAQ:MSFT/);
    assert.equal(await page.locator('.quote-widget').count(), 0);
    await page.getByRole('button', { name: 'Load TradingView quotes' }).click();
    const iframe = page.locator('.quote-widget');
    assert.match(await iframe.getAttribute('srcdoc'), /NASDAQ:MSFT/);
    assert.equal((await iframe.getAttribute('sandbox')).includes('allow-same-origin'), false);
    if (process.env.WATCH_PROVIDER_CHECK) {
      const widget = await (await iframe.elementHandle()).contentFrame();
      try {
        await widget.waitForFunction(() => Boolean(customElements.get('tv-ticker-tape')), null, { timeout: 12000 });
        console.log('TradingView widget registered. Exchange entitlements and freshness are provider-controlled.');
      } catch {
        console.log('TradingView network unavailable or widget blocked. Local links and watchlist remain available.');
      }
    }
    await page.getByRole('button', { name: 'Hide TradingView quotes' }).click();
    await page.reload();
    await page.getByRole('link', { name: 'NASDAQ:MSFT chart on TradingView' }).waitFor();
    if (process.env.WORKSPACE_SCREENSHOT) await page.screenshot({ path: process.env.WORKSPACE_SCREENSHOT, fullPage: true });
    await page.getByRole('button', { name: 'Remove NASDAQ:MSFT' }).click();
    await page.getByRole('link', { name: 'NASDAQ:MSFT chart on TradingView' }).waitFor({ state: 'detached' });
    await page.getByRole('button', { name: /^Gold/ }).click();
    await page.getByRole('link', { name: 'OANDA:XAUUSD chart on TradingView' }).waitFor();
    for (const width of [1280, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth ? [] :
        [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 15).map(node => [node.tagName, node.className, node.getBoundingClientRect().right]));
      assert.deepEqual(overflow, [], 'Horizontal overflow at ' + width);
    }
    console.log('PASS: full-width desktop, hold-and-drag, keyboard reorder, saved watchlists, AI brief, opt-in quote frame, responsive widths.');
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
