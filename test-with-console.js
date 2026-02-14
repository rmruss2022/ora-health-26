const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to console logs
  page.on('console', (msg) => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', (error) => {
    console.log('[PAGE ERROR]:', error.message);
  });

  console.log('Navigating...');
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(5000);

  console.log('Clicking on input...');
  await page.click('text=Type a message');
  await page.waitForTimeout(500);

  console.log('Typing...');
  await page.keyboard.type('Hello, I want to journal');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'debug-before-click.png' });

  console.log('Looking for send button...');
  // Try multiple ways to click the send button
  try {
    await page.click('[style*="backgroundColor: rgb(0, 122, 255)"]', { timeout: 5000 });
    console.log('Clicked send button!');
  } catch (e) {
    console.log('Button click failed:', e.message);
  }

  await page.waitForTimeout(10000);

  await page.screenshot({ path: 'debug-after-send.png' });

  console.log('Done! Check screenshots');
  await browser.close();
})();
