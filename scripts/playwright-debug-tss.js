const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

(async () => {
  const credsPath = path.join(__dirname, '..', 'test-credentials.json');
  const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

  console.log('Launching browser (headed)...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    const text = `[console:${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Collect network requests/responses
  const requests = [];
  page.on('request', (req) => {
    requests.push({ type: 'request', url: req.url(), method: req.method(), postData: req.postData() });
    console.log(`[request] ${req.method()} ${req.url()}`);
  });
  page.on('response', async (res) => {
    let body = null;
    try { body = await res.text(); } catch (e) { /* ignore */ }
    requests.push({ type: 'response', url: res.url(), status: res.status(), body });
    console.log(`[response] ${res.status()} ${res.url()}`);
  });

  // Go to the app
  await page.goto('http://localhost:3000/');

  // Wait for login form
  await page.waitForSelector('#username');

  // Fill credentials and login
  await page.fill('#username', creds.username);
  await page.fill('#password', creds.password);

  // Click submit and wait for the workouts summary to appear (avoid deprecated waitForNavigation)
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForSelector('.workout-count', { timeout: 10000 })
  ]);

  console.log('Logged in, waiting for workouts to load...');
  await page.waitForSelector('.workout-count');

  // Try to find a workout on Jan 17 with NO TSS
  // Look for day-number 17, then search inside for a .tss-badge with text 'NO TSS'
  const dayNumberLocator = page.locator('.day-number', { hasText: '17' });
  const dayElem = await dayNumberLocator.first().elementHandle();
  if (!dayElem) {
    console.error('Could not find day number 17 on the page. Aborting.');
    await browser.close();
    process.exit(1);
  }

  // Find parent calendar-day element
  const calendarDay = await dayElem.evaluateHandle((el) => el.closest('.calendar-day'));
  if (!calendarDay) {
    console.error('Could not find ancestor .calendar-day for day 17. Aborting.');
    await browser.close();
    process.exit(1);
  }

  // Try to find a TSS badge in this day (could be NO TSS or a numeric TSS)
  let badgeHandle = await calendarDay.$('.tss-badge');

  if (!badgeHandle) {
    // List workout titles for debugging to see what is present on that day
    const titles = await calendarDay.$$eval('.workout-title', els => els.map(e => e.textContent.trim()));
    console.log('Workouts on day 17:', titles);

    // Fallback: search entire page for a NO TSS badge specifically
    console.log('No .tss-badge found inside day 17; searching entire page for a NO TSS badge...');
    const anyBadge = await page.$('.tss-badge:has-text("NO TSS")');
    if (!anyBadge) {
      console.error('No "NO TSS" badge found on the page. Aborting.');
      await browser.close();
      process.exit(1);
    }
    badgeHandle = anyBadge;
  }

  // Get a description of the workout (title)
  const badgeParent = await badgeHandle.evaluateHandle((el) => el.closest('.workout-badge'));
  const title = await badgeParent.$eval('.workout-title', el => el.textContent.trim()).catch(() => '<no title>');
  console.log(`Found NO TSS badge for workout titled: "${title}"`);

  // Click the badge to activate editing
  await badgeHandle.click();

  // Wait for input to appear
  const input = await badgeParent.$('input.tss-input');
  if (!input) {
    console.error('TSS input did not appear after click. Aborting.');
    await browser.close();
    process.exit(1);
  }

  // Type a new TSS and press Enter
  await input.fill('90');
  await Promise.all([
    page.waitForTimeout(1000), // give time for any request to fire
    input.press('Enter')
  ]);

  // Wait a short while to capture logs and network
  await page.waitForTimeout(2000);

  // Collect any PUT requests to /api/workouts/
  const puts = requests.filter(r => r.type === 'request' && r.method === 'PUT' && /\/api\/workouts\//.test(r.url));

  console.log('PUT requests to /api/workouts/:', puts.length);
  puts.forEach((p, i) => {
    console.log(`${i}: ${p.method} ${p.url} ${p.postData ? p.postData : ''}`);
  });

  // Save a screenshot for context
  const screenshotPath = path.join(__dirname, '..', 'tmp', `tss-debug-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to', screenshotPath);

  console.log('Console messages captured:');
  consoleMessages.forEach((m) => console.log(m));

  await browser.close();
})();
