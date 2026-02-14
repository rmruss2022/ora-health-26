const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the app
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Type a message - try finding the textarea
  const input = await page.locator('textarea, input').first();
  await input.fill('I want to journal about my day');
  await page.waitForTimeout(500);

  // Take screenshot before sending
  await page.screenshot({ path: 'screenshot-before-send.png', fullPage: true });
  console.log('Screenshot before send saved!');

  // Click send button - look for the blue circle
  await page.click('div[role="button"], button', { force: true });

  // Wait for response
  await page.waitForTimeout(2000);

  // Take screenshot after response
  await page.screenshot({ path: 'screenshot-after-response.png', fullPage: true });
  console.log('Screenshot after response saved!');

  await browser.close();
})();
