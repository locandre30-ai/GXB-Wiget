const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function run() {
  const browser = await chromium.launch(process.env.ARENA_BROWSER ? { executablePath: process.env.ARENA_BROWSER } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 960 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8766/arena.html');
    await page.getByLabel('Local profile name').fill('Learning Tester');
    await page.getByRole('button', { name: 'Create profile and enter' }).click();
    await page.getByRole('link', { name: 'Academy', exact: true }).click();
    await page.getByRole('link', { name: /^Bitcoin/ }).click();
    const frame = page.frameLocator('iframe[title="Academy lesson workspace"]');
    await frame.getByText('Take a short learning assessment', { exact: true }).click();
    await frame.getByLabel('What are you here to learn?', { exact: true }).selectOption({ label: 'Study longer-term entries' });
    await frame.getByLabel('How much chart practice do you have?', { exact: true }).selectOption({ label: 'Some chart practice' });
    await frame.getByLabel('What should we focus on?', { exact: true }).selectOption({ label: 'Risk' });
    await frame.getByRole('button', { name: 'Save learning assessment' }).click();
    await frame.getByRole('button', { name: 'Build an AI tutoring prompt' }).click();
    const prompt = await frame.getByLabel('Academy tutoring prompt').inputValue();
    assert.match(prompt, /one question at a time/);
    assert.match(prompt, /Study longer-term entries/);
    await frame.getByRole('button', { name: 'Recommended: Define risk' }).click();
    await frame.getByRole('heading', { name: /practice BTC long/ }).waitFor();
    await frame.getByRole('button', { name: '$50', exact: true }).click();
    await frame.getByRole('heading', { name: 'Quick follow-up' }).waitFor();
    await frame.getByRole('button', { name: 'The stop distance and the position size' }).click();
    await frame.getByText(/Use that idea to try/).waitFor();
    await frame.getByRole('button', { name: '$500', exact: true }).click();
    await frame.getByText('Apply this to a longer holding period').waitFor();
    await frame.getByRole('button', { name: 'Next checkpoint →' }).click();
    await frame.getByRole('button', { name: '0.05 BTC', exact: true }).click();
    await page.waitForFunction(() => {
      const book = JSON.parse(localStorage.getItem('gxb_arena_v2_r1'));
      return book.profiles[book.active].state.learning.evidence.bitcoin[3]?.attempts === 2;
    });
    await page.reload();
    await frame.getByText('Your first answers on this track suggest revisiting this skill.').waitFor();
    await page.getByRole('link', { name: /^Gold/ }).click();
    await frame.getByRole('button', { name: 'Recommended: Define risk' }).click();
    await frame.getByRole('heading', { name: /simulated long entry is \$100/ }).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: editable assessment, distinct BTC/Gold exercises, answer-specific remediation, goal-specific follow-up, and evidence persistence.');
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
