const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = 'http://127.0.0.1:8766';
const key = 'gxb_arena_v2_r1';
const oldKey = 'gxb_arena_profiles_v1';
const date = '2026-10-18T12:00:00.000Z';
const fixture = { active: 'king', profiles: { king: { name: 'King', icon: '👑', onboarded: true, state: {
  xp: 130, rounds: 10, correct: 7, sessions: 1,
  history: [{ date, focus: 'Entries', grade: 'B', correct: 7, rounds: 10, r: 2, scoringVersion: 2 }],
  skills: { Entries: { rounds: 10, correct: 7, rCount: 5, rSum: 2 } },
  journey: { market: 'gold', completed: { gold: { date, version: 1 } } }
} } } };
const screenshotDir = process.env.ARENA_SCREENSHOTS;

async function run() {
  const browser = await chromium.launch({
    ...(process.env.ARENA_BROWSER ? { executablePath: process.env.ARENA_BROWSER } : {})
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1360, height: 960 }, reducedMotion: 'reduce' });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)));
    page.on('pageerror', error => errors.push(error.message));
    const screenshot = async name => {
      if (!screenshotDir) return;
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ path: path.join(screenshotDir, name + '.png'), fullPage: true, animations: 'disabled' });
    };
    assert.equal((await (await context.request.get(base + '/health')).json()).version, 2);
    assert.equal((await context.request.get(base + '/index.html')).status(), 200);
    await page.goto(base + '/index.html');
    await page.evaluate(({ oldKey, fixture }) => localStorage.setItem(oldKey, JSON.stringify(fixture)), { oldKey, fixture });
    await page.goto(base + '/arena.html#entrance');
    await page.getByRole('heading', { name: 'Enter the Arena' }).waitFor();
    await screenshot('01-entrance');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to workspace');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'workspace');
    await page.getByRole('button', { name: 'Continue to Command Center' }).click();
    await page.getByRole('heading', { name: 'Welcome back, King.' }).waitFor();
    await page.getByText('70%', { exact: true }).waitFor();
    await screenshot('02-command-center');
    await page.getByRole('button', { name: /Stocks and ETFs/ }).click();
    await page.getByText('Focus: Stocks and ETFs', { exact: false }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: /Stocks and ETFs/, pressed: true }).waitFor();
    await page.getByRole('link', { name: /^Academy ·/ }).click();
    const lesson = page.frameLocator('iframe[title="Academy lesson workspace"]');
    await lesson.getByRole('heading', { name: /Gold journey/ }).waitFor();
    await screenshot('03-academy');
    await lesson.getByRole('button', { name: 'Read the trend · Begin' }).click();
    await lesson.getByRole('heading', { name: 'Read the trend' }).waitFor();
    await lesson.getByRole('button', { name: 'Uptrend', exact: true }).click();
    await lesson.getByRole('button', { name: 'Next checkpoint →' }).click();
    await lesson.getByRole('button', { name: /the marked swing low still holds/ }).click();
    await lesson.getByRole('button', { name: 'Next checkpoint →' }).click();
    await lesson.getByRole('button', { name: 'Consolidation', exact: true }).click();
    await lesson.getByRole('button', { name: 'Finish skill →' }).click();
    await page.getByRole('link', { name: 'Command Center', exact: true }).click();
    await page.getByText('2 / 7', { exact: true }).waitFor();
    await page.getByRole('link', { name: 'Open Free Practice' }).click();
    const drill = page.frameLocator('iframe[title="Free Practice training"]');
    await drill.locator('#answers button').first().waitFor();
    assert.equal(await drill.locator('canvas#chart').evaluate(canvas => canvas.width > 0), true);
    await screenshot('04-practice-handoff');
    const glossary = drill.getByRole('button', { name: 'dotted word' });
    await glossary.focus();
    await glossary.press('Enter');
    await drill.getByRole('dialog', { name: 'Term explanation' }).waitFor();
    await drill.getByRole('button', { name: 'Got It' }).press('Escape');
    assert.equal(await glossary.evaluate(button => button === document.activeElement), true);
    await page.waitForFunction(key => Boolean(JSON.parse(localStorage.getItem(key)).profiles.king.state.draft), key);
    const pendingChart = await drill.locator('canvas#chart').evaluate(canvas => canvas.toDataURL());
    await page.reload();
    await drill.locator('#answers button').first().waitFor();
    await drill.locator('canvas#chart').evaluate(canvas => new Promise(resolve => requestAnimationFrame(() => resolve(canvas.width))));
    assert.equal(await drill.locator('canvas#chart').evaluate(canvas => canvas.toDataURL()), pendingChart);
    for (let round = 1; round <= 10; round++) {
      await drill.getByText('Round ' + round + ' / 10', { exact: true }).waitFor();
      await drill.locator('#answers button').first().click();
      if (round === 1) {
        await page.getByRole('link', { name: 'Command Center', exact: true }).click();
        await page.getByText('1 of 10 decisions saved', { exact: false }).waitFor();
        await page.getByRole('link', { name: 'Resume practice draft' }).click();
      } else if (round < 10) {
        await drill.getByRole('button', { name: 'Next Chart →' }).click();
      }
    }
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).profiles.king.state.draft.session.results.length === 10, key);
    await page.reload();
    await drill.getByRole('button', { name: 'See Session Results' }).click();
    await drill.getByRole('button', { name: 'Copy Session Log' }).click();
    const sessionLog = await drill.locator('#logBox').inputValue();
    assert.match(sessionLog, /Status: Completed/);
    await page.waitForFunction(expected => navigator.clipboard.readText().then(text => text === expected), sessionLog);
    assert.ok((await drill.locator('#kLine').textContent()).trim());
    await page.getByRole('link', { name: 'Performance', exact: true }).click();
    const snapshot = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    assert.equal(snapshot.profiles.king.state.history.length, 2);
    assert.equal(snapshot.profiles.king.state.rounds, 20);
    assert.equal(snapshot.profiles.king.state.draft, undefined);
    assert.equal(snapshot.profiles.king.state.history[1].scoringVersion, 2);
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.getByLabel('Candle palette').selectOption('mono');
    await page.getByRole('button', { name: 'Save preferences' }).click();
    await page.getByText('Preferences saved.').waitFor();
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export backup' }).click();
    const backup = await downloaded;
    const fileBuffer = fs.readFileSync(await backup.path());
    await page.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: fileBuffer });
    await page.getByRole('button', { name: 'Import backup' }).click();
    await page.getByText('This backup is already present.', { exact: false }).waitFor();
    await page.getByRole('link', { name: 'Switch profile' }).click();
    await page.getByRole('button', { name: 'Create local profile', exact: true }).click();
    await page.getByLabel('Local profile name').fill('Trader Two');
    await page.getByRole('radio', { name: /Experienced/ }).check();
    await page.getByRole('button', { name: 'Create profile and enter' }).click();
    await page.getByRole('heading', { name: 'Welcome back, Trader Two.' }).waitFor();
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    assert.equal(await page.getByLabel('Drill mode').inputValue(), 'pro');
    assert.equal(await page.getByLabel('Candle palette').inputValue(), 'classic');
    await page.getByRole('link', { name: 'Switch profile' }).click();
    await page.getByLabel('Existing local trader profile').selectOption('king');
    await page.getByRole('button', { name: 'Continue to Command Center' }).click();
    await page.getByRole('heading', { name: 'Welcome back, King.' }).waitFor();
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    assert.equal(await page.getByLabel('Candle palette').inputValue(), 'mono');

    const legacy = await context.newPage();
    await legacy.goto(base + '/practice.html');
    await legacy.getByRole('heading', { name: 'Welcome back, King.' }).waitFor();
    await legacy.getByRole('button', { name: 'Enter the Arena →' }).click();
    await legacy.locator('#modeGuided').click();
    await legacy.waitForFunction(key => JSON.parse(localStorage.getItem(key)).profiles.king.state.mode === 'guided', key);
    await page.reload();
    assert.equal(await page.getByLabel('Drill mode').inputValue(), 'guided');
    const beforeGuest = await page.evaluate(key => localStorage.getItem(key), key);
    await page.getByRole('link', { name: 'Switch profile' }).click();
    await page.getByRole('button', { name: 'Guest practice' }).click();
    await drill.locator('#answers button').first().click();
    await drill.getByRole('button', { name: 'Next Chart →' }).waitFor();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), beforeGuest);
    assert.deepEqual(await page.evaluate(oldKey => JSON.parse(localStorage.getItem(oldKey)), oldKey), fixture);
    console.log('PASS: loopback launcher, keyboard skip, fixture migration, Academy completion, draft reload/resume, 10 rounds, copy log, duplicate backup, profiles, guest isolation and legacy write-through.');

    await page.getByRole('link', { name: 'Switch profile' }).click();
    for (const width of [768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.getByRole('button', { name: 'Continue to Command Center' }).click();
      await page.getByRole('heading', { name: 'Command Center' }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (width === 390) await screenshot('05-mobile-command-center');
      await page.getByRole('link', { name: 'Academy', exact: true }).click();
      await page.getByRole('link', { name: /^Cryptocurrency/ }).click();
      await lesson.getByRole('heading', { name: /Bitcoin journey/ }).waitFor();
      assert.equal(await lesson.locator('body').evaluate(body => body.scrollWidth <= innerWidth), true);
      await page.getByRole('link', { name: 'Free Practice' }).click();
      await drill.locator('#answers button').first().waitFor();
      assert.equal(await drill.locator('body').evaluate(body => body.scrollWidth <= innerWidth), true);
      await page.getByRole('link', { name: 'Switch profile' }).click();
    }

    const clean = await browser.newContext({ reducedMotion: 'reduce' });
    const restore = await clean.newPage();
    await restore.goto(base + '/arena.html');
    await restore.getByRole('link', { name: 'Restore a backup' }).click();
    await restore.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: fileBuffer });
    await restore.getByRole('button', { name: 'Import backup' }).click();
    await restore.getByText('Backup imported.', { exact: true }).waitFor();
    await restore.getByRole('link', { name: 'Command Center' }).click();
    await restore.getByRole('heading', { name: 'Welcome back, King.' }).waitFor();
    const stale = await clean.newPage();
    await stale.goto(base + '/arena.html#settings');
    await stale.getByLabel('Candle palette').waitFor();
    await restore.getByRole('link', { name: 'Settings', exact: true }).click();
    await restore.getByLabel('Candle palette').selectOption('ocean');
    await restore.getByRole('button', { name: 'Save preferences' }).click();
    await restore.getByText('Preferences saved.').waitFor();
    await stale.getByLabel('Candle palette').selectOption('classic');
    await stale.getByRole('button', { name: 'Save preferences' }).click();
    await stale.getByText(/Arena data changed in another tab/).waitFor();
    assert.equal(await stale.evaluate(key => JSON.parse(localStorage.getItem(key)).profiles.king.state.candleTheme, key), 'ocean');
    await restore.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: fileBuffer });
    await restore.getByLabel(/Restore matching profiles/).check();
    const archive = restore.waitForEvent('download');
    await restore.getByRole('button', { name: 'Import backup' }).click();
    assert.equal((await archive).suggestedFilename(), 'gxb-arena-before-restore.json');
    await restore.getByText('Backup imported.', { exact: true }).waitFor();
    assert.equal(await restore.getByLabel('Candle palette').inputValue(), 'mono');
    await clean.close();

    const unavailable = await browser.newContext({ reducedMotion: 'reduce' });
    await unavailable.addInitScript(key => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('test quota exhausted', 'QuotaExceededError');
        return original.call(this, name, value);
      };
    }, key);
    const blocked = await unavailable.newPage();
    await blocked.goto(base + '/arena.html');
    await blocked.getByText(/Storage unavailable:.*test quota exhausted/).waitFor();
    assert.equal(await blocked.getByRole('button', { name: 'Create profile and enter' }).isDisabled(), true);
    await blocked.getByRole('button', { name: 'Guest practice' }).click();
    const guestDrills = blocked.frameLocator('iframe');
    await guestDrills.locator('#answers button').first().waitFor();
    for (const name of ['Trend Confirmation', 'Continuation Recognition', 'Entries', 'Exits', 'No-Chase Filter']) {
      await guestDrills.getByRole('button', { name, exact: true }).click();
      const drillName = name === 'No-Chase Filter' ? 'Avoiding Chase Trades' : name;
      await guestDrills.locator('#prompt').getByText(drillName + ':', { exact: true }).waitFor();
    }
    assert.deepEqual(errors, []);
    console.log('PASS: desktop, tablet (768px), mobile (390px), fresh restore, explicit restore with pre-restore backup, stale tab rejection, and all five guest drills during a storage failure.');
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
