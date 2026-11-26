const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = 'http://127.0.0.1:8766/arena.html';
const screenshotDir = process.env.ACADEMY_STUDY_SCREENSHOTS;
const KEY = 'gxb_arena_v2_r1';

async function run() {
  const browser = await chromium.launch(process.env.ARENA_BROWSER ? { executablePath: process.env.ARENA_BROWSER } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ body: '<p>Test player</p>' }));
    const capture = async name => {
      if (!screenshotDir) return;
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ path: path.join(screenshotDir, name + '.png'), fullPage: true, animations: 'disabled' });
    };
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    await page.goto(new URL('index.html', base).href);
    await page.evaluate(() => {
      localStorage.removeItem('gxb_arena_v2_r1');
      localStorage.setItem('gxb_arena_profiles_v1', JSON.stringify({
        active: 'learner', profiles: { learner: { name: 'Learner', onboarded: true, state: {
          journey: { market: 'gold', completed: { gold: { version: 1 }, bitcoin: { version: 1 } }, skills: { gold: [1] } }
        } } }
      }));
    });
    await page.clock.install();
    await page.goto(base + '#academy');
    const gold = page.getByRole('link', { name: /^Gold/ });
    const crypto = page.getByRole('link', { name: /^Cryptocurrency/ });
    await gold.getByText('2 of 7 lessons complete').waitFor();
    await crypto.getByText('1 of 7 lessons complete').waitFor();
    assert.equal(await page.getByRole('link', { name: /^Stocks & ETFs/ }).count(), 0);
    await page.getByText('Structured curriculum in development').waitFor();
    assert.equal(await page.locator('.academy-track-art').evaluateAll(items => items.every(item => getComputedStyle(item).backgroundImage.startsWith('url("data:image/webp'))), true);
    assert.equal(await page.getByRole('link', { name: /The Disciplined Trader/ }).count(), 0);
    const quote = page.locator('.academy-quote blockquote');
    await quote.getByText('I do not chase the market.', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Next quote' }).click();
    await quote.getByText('My capital is a resource.', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Resume quote rotation' }).click();
    await page.locator('#workspace').focus();
    await page.clock.runFor(14100);
    await quote.getByText('I observe before I act.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Pause quote rotation' }).click();
    await page.locator('#workspace').focus();
    await page.clock.runFor(14100);
    await quote.getByText('I observe before I act.', { exact: true }).waitFor();
    await capture('10-academy-landing');
    const frame = page.frameLocator('iframe[title="Academy lesson workspace"]');
    await gold.click();
    await frame.getByRole('heading', { name: /Gold journey/ }).waitFor();
    await frame.getByRole('region', { name: 'GxB Academy Guide' }).waitFor();
    assert.equal(await frame.locator('body').evaluate(body => body.scrollWidth <= innerWidth), true);
    await capture('11-gold-journey');
    await page.getByRole('link', { name: 'Cryptocurrency', exact: true }).click();
    await frame.getByRole('heading', { name: /Bitcoin journey/ }).waitFor();
    await capture('12-cryptocurrency-journey');
    await page.getByRole('link', { name: '← Academy', exact: true }).click();
    await page.getByRole('link', { name: /Learning Lounge/ }).click();
    await page.getByText('No videos in this view yet.', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Add educational video' }).click();
    await page.getByLabel('Video title').fill('Educational fixture');
    await page.getByLabel('Educator or channel').fill('Fixture educator');
    await page.getByLabel('YouTube video URL').fill('https://youtube.com.invalid/watch?v=Abcd_ef-123');
    await page.getByRole('button', { name: 'Save resource' }).click();
    await page.getByText(/valid HTTPS YouTube video link/).waitFor();
    await page.getByLabel('YouTube video URL').fill('https://youtu.be/Abcd_ef-123');
    await page.getByLabel('Category', { exact: true }).selectOption('Risk management');
    await page.getByLabel('Market', { exact: true }).selectOption('Cryptocurrency');
    await page.getByLabel('Related lesson', { exact: true }).selectOption('Define risk');
    await page.getByRole('button', { name: 'Save resource' }).click();
    await page.getByText('Educational fixture', { exact: true }).click();
    await page.getByRole('button', { name: 'Save to study library' }).click();
    await page.getByText('Saved to My Study Library.').waitFor();
    await page.getByRole('button', { name: 'Mark watched' }).click();
    await page.getByRole('button', { name: 'Mark unwatched' }).waitFor();
    await page.getByText('Add a personal study note', { exact: true }).click();
    await page.getByLabel('Personal study note').fill('Review planned risk per unit.');
    await page.getByRole('button', { name: 'Save note' }).click();
    await page.getByText('Study note saved.').waitFor();
    assert.equal(await page.getByRole('link', { name: 'Open on YouTube' }).getAttribute('href'), 'https://www.youtube.com/watch?v=Abcd_ef-123');
    await page.getByRole('button', { name: 'Play embedded video' }).click();
    assert.equal(await page.locator('iframe[title="Educational fixture"]').getAttribute('src'), 'https://www.youtube-nocookie.com/embed/Abcd_ef-123');
    await page.getByRole('link', { name: /Related lesson · Define risk/ }).click();
    await frame.getByRole('heading', { name: 'Define risk', exact: true }).waitFor();
    await page.goto(base + '#academy/lounge');
    await page.getByText('Educational fixture', { exact: true }).click();
    await page.getByRole('button', { name: 'Edit resource' }).click();
    await page.getByLabel('Video title').fill('Updated fixture');
    await page.getByRole('button', { name: 'Save resource' }).click();
    await page.getByText('Updated fixture', { exact: true }).waitFor();

    await page.goto(base + '#academy/archives');
    await page.getByText('1929 Wall Street Crash', { exact: true }).click();
    await page.getByRole('link', { name: /Stock Market Crash of 1929/ }).waitFor();
    await page.getByRole('button', { name: 'Save to study library' }).click();
    await page.getByText('Saved to My Study Library.').waitFor();
    await page.goto(base + '#academy/knowledge');
    await page.getByText('Support and resistance', { exact: true }).click();
    await page.getByRole('button', { name: 'Save to study library' }).click();
    await page.getByText('Saved to My Study Library.').waitFor();
    await page.goto(base + '#academy/library');
    await page.getByRole('link', { name: 'Manage reflections' }).click();
    await page.getByRole('button', { name: 'Next reflection' }).click();
    await page.getByText('My capital is a resource. I allocate it with intention.').waitFor();
    await page.getByRole('button', { name: 'Save to study library' }).click();
    await page.getByText('Saved to My Study Library.').waitFor();
    await page.goto(base + '#academy/library');
    await page.getByText('Review planned risk per unit.').waitFor();
    await page.reload();
    await page.getByText('Review planned risk per unit.').waitFor();
    assert.ok(await page.getByRole('link', { name: 'Updated fixture', exact: true }).count() >= 2);
    await page.getByRole('link', { name: '1929 Wall Street Crash', exact: true }).first().waitFor();
    for (const width of [1280, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '#academy');
      await page.getByRole('heading', { name: 'Market Journeys' }).waitFor();
      assert.equal(await overflow(), true);
      await crypto.click();
      await frame.getByRole('heading', { name: /Bitcoin journey/ }).waitFor();
      assert.equal(await overflow(), true);
      assert.equal(await frame.locator('body').evaluate(body => body.scrollWidth <= innerWidth), true);
    }

    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('link', { name: 'Switch profile' }).click();
    await page.getByRole('button', { name: 'Create local profile', exact: true }).click();
    await page.getByLabel('Local profile name').fill('Separate Learner');
    await page.getByRole('button', { name: 'Create profile and enter' }).click();
    await page.getByRole('heading', { name: 'Welcome back, Separate Learner.' }).waitFor();
    await page.goto(base + '#academy/library');
    assert.equal(await page.getByText('Review planned risk per unit.').count(), 0);
    const book = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    assert.equal(book.profiles[book.active].study.videos.length, 0);
    assert.equal(book.profiles.learner.state.journey.completed.bitcoin.version, 1);
    assert.deepEqual(book.profiles.learner.state.journey.skills.gold, [1]);
    const removal = book.profiles.learner.study.videos[0];
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('link', { name: 'Switch profile' }).click();
    await page.getByLabel('Existing local trader profile').selectOption('learner');
    await page.getByRole('button', { name: 'Continue to Command Center' }).click();
    await page.getByRole('heading', { name: 'Welcome back, Learner.' }).waitFor();
    await page.goto(base + '#academy/lounge/' + removal.id);
    await page.getByRole('button', { name: 'Remove resource' }).click();
    await page.getByRole('button', { name: 'Confirm removal' }).click();
    await page.getByText('Resource removed.').waitFor();
    assert.equal(await page.getByText('Updated fixture', { exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: preserved legacy progress, accessible journeys, resource CRUD, embed handoff, notes, watch status, archives, knowledge, reflections, refresh, profile isolation, and responsive widths.');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
