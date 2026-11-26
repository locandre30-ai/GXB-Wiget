const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function run() {
  const browser = await chromium.launch(process.env.ARENA_BROWSER ? { executablePath: process.env.ARENA_BROWSER } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 960 } });
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8766/arena.html');
    await page.getByLabel('Local profile name').fill('Portfolio Tester');
    await page.getByRole('button', { name: 'Create profile and enter' }).click();
    const openLab = async () => {
      await page.getByRole('link', { name: 'Portfolio Lab', exact: true }).click();
      await page.getByRole('heading', { name: 'Portfolio Lab', exact: true }).waitFor();
    };
    await openLab();
    const stocks = page.locator('.portfolio-grid section').filter({ has: page.getByRole('heading', { name: 'Stocks & ETFs' }) });
    const gold = page.locator('.portfolio-grid section').filter({ has: page.getByRole('heading', { name: 'Gold · XAU/USD' }) });
    await stocks.getByLabel('Starting paper balance for Stocks & ETFs').fill('1000');
    await stocks.getByRole('button', { name: 'Create paper account' }).click();
    await stocks.getByText('$1,000.00', { exact: true }).first().waitFor();
    await gold.getByLabel('Starting paper balance for Gold · XAU/USD').fill('3000');
    await gold.getByRole('button', { name: 'Create paper account' }).click();
    await gold.getByText('$3,000.00', { exact: true }).first().waitFor();
    await stocks.getByRole('link', { name: 'Open Market Studio' }).click();
    await page.getByRole('button', { name: 'Start linked practice week' }).click();
    await page.getByText(/Portfolio Lab linked/).waitFor();
    await page.getByLabel('Units', { exact: true }).fill('5');
    await page.getByLabel('Stop price').fill('430');
    await page.getByLabel('Target price').fill('530');
    await page.getByLabel('Fee per fill').fill('1');
    await page.getByRole('button', { name: 'Queue paper entry' }).click();
    await page.getByText(/exceeds the account’s available paper cash/).waitFor();
    await page.getByLabel('Units', { exact: true }).fill('1');
    await page.getByRole('button', { name: 'Queue paper entry' }).click();
    await page.getByText(/Paper entry queued/).waitFor();
    await page.getByRole('button', { name: 'Reveal next candle' }).click();
    await page.getByText(/Paper entry filled/).waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Resume linked practice week' }).click();
    await page.getByText(/long · 1 units at/).waitFor();
    await openLab();
    await stocks.getByText(/LONG · 1 units · Entry/).waitFor();
    assert.equal(await stocks.getByRole('button', { name: 'Add paper funds' }).count(), 0);
    await stocks.getByRole('link', { name: 'Resume linked practice week' }).click();
    await page.getByRole('button', { name: 'Resume linked practice week' }).click();
    for (let i = 3; i <= 30; i++) {
      await page.getByRole('button', { name: 'Reveal next candle' }).click();
      await page.locator('.studio-clock').filter({ hasText: new RegExp('· ' + i + ' revealed') }).waitFor();
    }
    await page.getByRole('button', { name: 'Settle paper week' }).click();
    await page.getByText(/Paper week settled/).waitFor();
    await openLab();
    await stocks.getByText('Activity ledger').click();
    await stocks.getByText('long · Week-end settlement').waitFor();
    await stocks.getByLabel('Add paper funds for Stocks & ETFs').fill('200');
    await stocks.getByRole('button', { name: 'Add paper funds' }).click();
    await stocks.getByText('Activity ledger').click();
    await stocks.getByText('Paper deposit').waitFor();
    await page.reload();
    await stocks.getByText('Activity ledger').click();
    assert.equal(await stocks.getByText('long · Week-end settlement').count(), 1);
    await gold.getByText('$3,000.00', { exact: true }).first().waitFor();
    await page.setViewportSize({ width: 390, height: 850 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log('PASS: separate market accounts, cash limits, open position after refresh, settlement, single ledger post, paper deposit, and mobile layout.');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
