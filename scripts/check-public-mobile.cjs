const { chromium } = require('@playwright/test');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
  const context = await browser.newContext();
  const page = await context.newPage();
  const base = process.env.MOBILE_AUDIT_URL || 'http://localhost:3000';
  const routes = ['/', '/writing', '/blog', '/documentary', '/archive', '/reference', '/series', '/authors', '/about', '/contact', '/privacy', '/letter', '/bookmarks', '/search', '/reference/rights', '/resource/bangla-sahityer-timeline', '/missing-mobile-audit-page'];
  const prerendered = JSON.parse(fs.readFileSync('.next/prerender-manifest.json', 'utf8'));
  for (const route of Object.keys(prerendered.routes)) {
    if (/^\/(writing|blog|documentary|authors|series)\//.test(route) && !routes.includes(route)) routes.push(route);
  }
  const report = [];
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.locator('footer').waitFor({ timeout: 15000 });
      const result = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        overflow: document.documentElement.scrollWidth > innerWidth,
        offscreenControls: [...document.querySelectorAll('header a, header button')].filter(el => {
          const r = el.getBoundingClientRect();
          return r.width && r.height && (r.left < -1 || r.right > innerWidth + 1);
        }).map(el => el.getAttribute('aria-label') || el.textContent.trim()),
      }));
      report.push({ width, route, status: response.status(), ...result });
    }
  }
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(base + '/contact');
  const toggle = page.locator('button[aria-controls="mobile-navigation"]');
  await toggle.click();
  await page.locator('#mobile-navigation').waitFor();
  await page.keyboard.press('Escape');
  if (await toggle.getAttribute('aria-expanded') !== 'false') throw new Error('Menu did not close on Escape');
  if (!await toggle.evaluate(el => el === document.activeElement)) throw new Error('Menu did not restore focus');
  await toggle.click();
  await page.locator('#mobile-navigation a[href="/about"]').click();
  await page.waitForURL('**/about');
  if (await page.locator('#mobile-navigation').count()) throw new Error('Menu did not close on navigation');
  await page.route('**/api/subscribe', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'saveFailed' }) }));
  const form = page.locator('footer form');
  await form.locator('input[type="email"]').fill('mobile-audit@example.com');
  await form.locator('button[type="submit"]').click();
  await form.locator('[role="alert"]').waitFor();
  await page.unroute('**/api/subscribe');
  await page.route('**/api/subscribe', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, code: 'checkInbox' }) }));
  await form.locator('button[type="submit"]').click();
  await page.locator('footer [role="status"]').waitFor();
  await page.unroute('**/api/subscribe');
  await page.route('**/api/search-index', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto(base + '/search');
  await page.locator('main [role="alert"]').waitFor();
  await page.unroute('**/api/search-index');
  await page.route('**/api/search-index', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.locator('main [role="alert"]').waitFor({ state: 'detached' });
  fs.mkdirSync('docs/qa', { recursive: true });
  await page.goto(base + '/contact');
  await page.setViewportSize({ width: 375, height: 850 });
  await page.screenshot({ path: 'docs/qa/contact-mobile.png', fullPage: true });
  await page.goto(base + '/');
  await page.setViewportSize({ width: 768, height: 850 });
  await page.screenshot({ path: 'docs/qa/home-tablet.png', fullPage: false });
  await context.close();
  await browser.close();
  const failures = report.filter(r => r.overflow || r.offscreenControls.length || !r.title || !r.description || (r.route.includes('missing-mobile') ? r.status !== 404 : r.status !== 200));
  fs.mkdirSync('docs/qa', { recursive: true });
  fs.writeFileSync('docs/qa/mobile-audit.json', JSON.stringify({ checks: report.length, failures, report }, null, 2));
  console.log(JSON.stringify({ checks: report.length, failures, menu: 'passed', newsletterFeedback: 'passed', searchRecovery: 'passed' }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
