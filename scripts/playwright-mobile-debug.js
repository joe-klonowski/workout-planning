const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('@playwright/test');

function parseDotEnv(contents) {
  const out = {};
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  });
  return out;
}

function loadCredentialsFromFiles(root) {
  const candidates = [
    path.join(root, 'test-credentials.json'),
    path.join(root, '.env.local'),
    path.join(root, '.env'),
    path.join(root, '.env.test')
  ];
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const txt = fs.readFileSync(p, 'utf8');
      if (p.endsWith('.json')) {
        const parsed = JSON.parse(txt);
        if (parsed.username && parsed.password) return { username: parsed.username, password: parsed.password };
      } else {
        const parsed = parseDotEnv(txt);
        if (parsed.PLAYWRIGHT_USERNAME && parsed.PLAYWRIGHT_PASSWORD) return { username: parsed.PLAYWRIGHT_USERNAME, password: parsed.PLAYWRIGHT_PASSWORD };
        if (parsed.TEST_USERNAME && parsed.TEST_PASSWORD) return { username: parsed.TEST_USERNAME, password: parsed.TEST_PASSWORD };
        if (parsed.LOGIN_USERNAME && parsed.LOGIN_PASSWORD) return { username: parsed.LOGIN_USERNAME, password: parsed.LOGIN_PASSWORD };
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

(async () => {
  const outDir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Resolve credentials: 1) env vars 2) test-credentials.json 3) .env* files
  const envCreds = (process.env.PLAYWRIGHT_USERNAME && process.env.PLAYWRIGHT_PASSWORD) ?
    { username: process.env.PLAYWRIGHT_USERNAME, password: process.env.PLAYWRIGHT_PASSWORD } :
    (process.env.TEST_USERNAME && process.env.TEST_PASSWORD) ? { username: process.env.TEST_USERNAME, password: process.env.TEST_PASSWORD } : null;
  const fileCreds = loadCredentialsFromFiles(path.join(__dirname, '..'));
  const creds = envCreds || fileCreds || null;

  console.log('Launching browser (headed) with mobile viewport...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 402, height: 800 },
    isMobile: true,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  // Capture console + network
  const consoleMessages = [];
  page.on('console', (m) => {
    const text = `[console:${m.type()}] ${m.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });
  const requests = [];
  page.on('request', (r) => requests.push({ type: 'request', url: r.url(), method: r.method() }));
  page.on('response', (r) => requests.push({ type: 'response', url: r.url(), status: r.status() }));

  await page.goto('http://localhost:3000/');
  // Wait for either the main calendar or the login form (some dev setups show login)
  const visible = await Promise.race([
    page.waitForSelector('.calendar-grid', { timeout: 10000 }).then(() => 'calendar'),
    page.waitForSelector('#username', { timeout: 10000 }).then(() => 'login'),
    page.waitForSelector('.error', { timeout: 10000 }).then(() => 'error')
  ]).catch(() => null);

  if (!visible) {
    console.log('Neither calendar nor login appeared within timeout — saving debug snapshot.');
    const fallbackShot = path.join(outDir, 'mobile-calendar-debug-fallback.png');
    await page.screenshot({ path: fallbackShot, fullPage: true });
    const htmlPath = path.join(outDir, 'mobile-calendar-debug-fallback.html');
    await fs.promises.writeFile(htmlPath, await page.content(), 'utf8');
    console.log('Saved fallback screenshot and HTML to', fallbackShot, htmlPath);
    throw new Error('App did not render expected entry points within timeout');
  }

  console.log('First visible area:', visible);
  if (visible === 'login') {
    if (!creds) {
      console.error('Login page detected but no credentials were found.');
      console.error('Provide credentials via one of these options:');
      console.error('  1) set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD env vars and re-run');
      console.error('  2) create a workspace-level test-credentials.json {"username":"...","password":"..."}');
      console.error('  3) create .env.local with PLAYWRIGHT_USERNAME / PLAYWRIGHT_PASSWORD');
      const fallbackShot = path.join(outDir, 'mobile-login-no-creds.png');
      await page.screenshot({ path: fallbackShot, fullPage: true });
      console.log('Saved login screenshot to', fallbackShot);
      await browser.close();
      process.exit(2);
    }

    console.log('Logging in using credentials from', envCreds ? 'env' : 'file');
    await page.fill('#username', creds.username);
    await page.fill('#password', creds.password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForSelector('.calendar-grid', { timeout: 10000 })
    ]).catch(async (err) => {
      console.error('Login attempt did not reach calendar within timeout:', err.message);
      const shot = path.join(outDir, 'mobile-login-failed.png');
      await page.screenshot({ path: shot, fullPage: true });
      console.log('Saved failed-login screenshot to', shot);
      await browser.close();
      process.exit(3);
    });

    console.log('Calendar visible after login.');
  }

  // Wait for at least one day-number to render
  await page.waitForSelector('.day-number');
  // 1) Screenshot of the viewport and full page
  const viewportShot = path.join(outDir, 'mobile-calendar-viewport.png');
  const fullShot = path.join(outDir, 'mobile-calendar-full.png');
  await page.screenshot({ path: viewportShot, fullPage: false });
  await page.screenshot({ path: fullShot, fullPage: true });
  console.log('Saved screenshots:', viewportShot, fullShot);

  // 2) Check for horizontal overflow (elements wider than viewport)
  const overflowElements = await page.evaluate(() => {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const els = Array.from(document.querySelectorAll('body *'));
    return els
      .map(e => ({
        tag: e.tagName.toLowerCase(),
        cls: e.className || null,
        w: Math.round(e.getBoundingClientRect().width),
        vw
      }))
      .filter(x => x.w > vw + 4)
      .slice(0, 10);
  });

  console.log('Overflow elements (width > viewport):', overflowElements.length);
  overflowElements.forEach((e) => console.log(e));

  // 3) Check calendar specific behaviors
  const calendarChecks = await page.evaluate(() => {
    const grid = document.querySelector('.calendar-grid');
    const headers = document.querySelector('.day-of-week-headers');
    const firstDay = document.querySelector('.calendar-day');
    const weekStyles = window.getComputedStyle(grid || document.body);

    return {
      gridExists: !!grid,
      headersDisplay: headers ? window.getComputedStyle(headers).display : null,
      gridOverflowX: grid ? (grid.scrollWidth > grid.clientWidth) : null,
      gridClientWidth: grid ? grid.clientWidth : null,
      gridScrollWidth: grid ? grid.scrollWidth : null,
      firstDayWidth: firstDay ? Math.round(firstDay.getBoundingClientRect().width) : null,
      bodyClientWidth: document.documentElement.clientWidth,
      anyTightOverlap: !!document.querySelector('.calendar-day .workout-badge.overlap-debug')
    };
  });

  console.log('Calendar checks:', calendarChecks);

  // 4) If week view, attempt horizontal scroll and verify content remains visible
  const weekView = await page.$('.calendar-grid.week');
  if (weekView) {
    const beforeScroll = await weekView.evaluate((el) => ({ scrollLeft: el.scrollLeft, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    await weekView.evaluate((el) => el.scrollBy({ left: 200, behavior: 'auto' }));
    const afterScroll = await weekView.evaluate((el) => ({ scrollLeft: el.scrollLeft, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    console.log('Week view scroll — before:', beforeScroll, 'after:', afterScroll);
  }

  // 5) Try to open the first workout modal (if any workout badges exist)
  const workoutBadge = await page.$('.workout-badge');
  if (workoutBadge) {
    await workoutBadge.click();
    // modal should appear
    const modalVisible = await page.waitForSelector('.workout-detail-modal, .modal', { timeout: 3000 }).then(() => true).catch(() => false);
    console.log('Workout modal opened:', modalVisible);
    if (modalVisible) {
      const modalShot = path.join(outDir, 'mobile-workout-modal.png');
      await page.screenshot({ path: modalShot, fullPage: false });
      console.log('Saved modal screenshot:', modalShot);
    }
  } else {
    console.log('No workout badges found to open.');
  }

  // 6) Summarize network endpoints of interest that were called
  const apiCalls = requests.filter(r => /\/api\//.test(r.url)).slice(0, 20);
  console.log('Sample API calls:', apiCalls.length);
  apiCalls.forEach((r) => console.log(r));

  // 7) Final output: brief pass/fail heuristics
  const issues = [];
  if (overflowElements.length > 0) issues.push('Horizontal overflow detected');
  if (calendarChecks.gridExists && calendarChecks.gridClientWidth && calendarChecks.gridClientWidth < 240) issues.push('Calendar grid appears very narrow for mobile');
  if (calendarChecks.gridExists && calendarChecks.gridOverflowX === false && document.querySelector('.calendar-grid.week')) issues.push('Week view is not horizontally scrollable on mobile');

  console.log('Automated findings:', issues.length ? issues : ['no obvious layout-blocking issues detected']);

  // Save logs
  const logPath = path.join(outDir, `playwright-mobile-log-${Date.now()}.json`);
  fs.writeFileSync(logPath, JSON.stringify({ calendarChecks, overflowElements, apiCalls, consoleMessages }, null, 2));
  console.log('Saved log to', logPath);

  // Leave browser open for manual inspection for 45s
  console.log('Leaving browser open for manual inspection for 45s...');
  await page.waitForTimeout(45000);

  await browser.close();
  console.log('Done.');
})();
