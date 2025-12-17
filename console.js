const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  try {
    await page.goto('https://eduskillbridge.net/tutorials/72da5bff-d18b-4cc9-8097-41e826d5a30b', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(5000);
  } catch (err) {
    console.error('NAVIGATION ERROR', err);
  }
  await browser.close();
})();
