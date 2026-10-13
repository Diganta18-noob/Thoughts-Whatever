const { chromium } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.MOBILE_AUDIT_URL || 'http://localhost:3002';
    const results = [];
    const pendingSources = new Set();
    page.on('request', request => {
      if (request.url().endsWith('/api/translate')) {
        for (const text of request.postDataJSON().texts) pendingSources.add(text);
      }
    });
    for (const route of ['/bookmarks', '/privacy', '/contact', '/about', '/resource/bangla-sahityer-timeline']) {
      await page.goto(base + route);
      await page.waitForTimeout(800);
      const untranslated = await page.locator('#main-content').evaluate(root => {
        const found = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const text = walker.currentNode;
          const parent = text.parentElement;
          if (parent && !parent.closest('script,style,code,pre') && parent.getClientRects().length && /[\u0980-\u09ff]/.test(text.textContent)) found.push(text.textContent.trim());
        }
        return found;
      });
      results.push({ route, untranslated, title: await page.title(), unavailable: await page.getByText('English translation not available yet', { exact: true }).count() });
    }
    await page.getByRole('button', { name: 'Choose language' }).click();
    await page.locator('[role="menuitemradio"]').nth(1).click();
    if (!/[\u0980-\u09ff]/.test(await page.locator('#main-content h1').innerText())) throw Error('Bengali source not restored');
    await page.getByRole('button', { name: 'ভাষা নির্বাচন করুন' }).click();
    await page.locator('[role="menuitemradio"]').nth(0).click();
    await page.waitForTimeout(300);
    if (/[\u0980-\u09ff]/.test(await page.locator('#main-content h1').innerText())) throw Error('English not restored');
    await page.goto(base + '/writing/' + encodeURIComponent('কপালকুণ্ডলা'));
    await page.getByRole('button', { name: 'Read the Bengali original' }).click();
    await page.locator('.prose-bengali p').first().waitFor();
    if (!/[\u0980-\u09ff]/.test(await page.locator('.prose-bengali').innerText())) throw Error('Original Markdown article failed to render');
    await page.getByRole('button', { name: 'ভাষা নির্বাচন করুন' }).click();
    await page.locator('[role="menuitemradio"]').nth(0).click();
    await page.getByRole('button', { name: 'Read the Bengali original' }).waitFor();
    await page.setViewportSize({ width: 375, height: 850 });
    await page.goto(base + '/privacy');
    await page.screenshot({ path: 'docs/qa/privacy-english-mobile.png', fullPage: true });
    for (const route of ['/reference', '/reference/kalika-puran-ed-1', '/reference/debabrata-biswas-rabindrasangeet-1974']) {
      await page.goto(base + route);
      await page.waitForTimeout(300);
      if (await page.locator('a[download]').count()) throw Error('Reference download control remains: ' + route);
      if (await page.getByText('Public Domain', { exact: true }).count()) throw Error('Public domain label remains: ' + route);
    }
    const failures = results.filter(result => result.untranslated.length || result.unavailable);
    const report = { results, failures, errors, pendingSources: [...pendingSources], languageSwitch: 'passed', articleMarkdown: 'passed', referenceControls: 'passed' };
    fs.writeFileSync('docs/qa/english-content-audit.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (failures.length || errors.length || pendingSources.size) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
