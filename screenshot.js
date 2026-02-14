const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the app
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });

  // Wait a bit for React to render
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'screenshot-frontend.png', fullPage: true });

  console.log('Screenshot saved to screenshot-frontend.png');

  await browser.close();
})();
