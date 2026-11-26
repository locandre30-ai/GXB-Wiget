const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.ARENA_URL || 'http://127.0.0.1:8766/arena.html';

async function run() {
  const browser = await chromium.launch(process.env.ARENA_BROWSER ? { executablePath: process.env.ARENA_BROWSER } : {});
  try {
    const context = await browser.newContext({ ...devices['iPhone 13'], defaultBrowserType: undefined, reducedMotion: 'reduce' });
    await context.addInitScript(() => Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }));
    let page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.getByRole('button', { name: 'Guest practice', exact: true }).tap();
    await page.goto(base + '#academy/lounge');
    await page.getByText(/Guest study stays in this tab/).waitFor();
    await page.getByRole('button', { name: 'Add educational video' }).tap();
    await page.getByLabel('Video title').fill('iPhone persistence fixture');
    await page.getByLabel('Educator or channel').fill('Fixture educator');
    await page.getByLabel('YouTube video URL').fill('<iframe\n src="https://www.youtube-nocookie.com/embed/Abcd_ef-123"></iframe>');
    await page.getByRole('button', { name: 'Save resource' }).tap();
    await page.getByText('Resource saved.', { exact: true }).waitFor();
    await page.getByRole('link', { name: 'Create or switch profile' }).tap();
    await page.getByLabel('Local profile name').fill('iPhone Learner');
    await page.getByRole('button', { name: 'Create profile and enter' }).tap();
    await page.getByRole('heading', { name: 'Welcome back, iPhone Learner.' }).waitFor();
    await page.close();
    page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.getByRole('heading', { name: 'Welcome back, iPhone Learner.' }).waitFor();
    await page.goto(base + '#academy/lounge');
    await page.getByText('iPhone persistence fixture', { exact: true }).tap();
    assert.equal(await page.getByRole('link', { name: 'Open on YouTube' }).getAttribute('href'), 'https://www.youtube.com/watch?v=Abcd_ef-123');
    for (const track of ['gold', 'bitcoin']) {
      await page.goto(base + '#academy/' + track + '/0');
      const frame = page.frameLocator('iframe[title="Academy lesson workspace"]');
      await frame.getByRole('button', { name: 'Show me the chart →' }).tap();
      assert.equal(await frame.locator('figure:has(svg.missionChart)').count(), 1);
    }
    await page.getByRole('link', { name: 'Back up progress', exact: true }).tap();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export backup' }).tap();
    const download = await pending;
    const backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    const [profile] = Object.values(backup.book.profiles);
    assert.equal(profile.name, 'iPhone Learner');
    assert.equal(profile.study.videos[0].title, 'iPhone persistence fixture');
    assert.deepEqual(errors, []);
    console.log('PASS: no duplicate chart, YouTube embed accepted, guest work moved into new profile, profile and video survived closing the tab, backup contains both with Web Locks unavailable.');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
