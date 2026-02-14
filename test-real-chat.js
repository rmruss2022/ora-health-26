const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('Taking initial screenshot...');
  await page.screenshot({ path: 'chat-1-initial.png', fullPage: true });

  console.log('Typing message...');
  // Find and type in the input
  await page.keyboard.type('I want to journal about my day');
  await page.waitForTimeout(1000);

  console.log('Taking screenshot with typed message...');
  await page.screenshot({ path: 'chat-2-typed.png', fullPage: true });

  console.log('Clicking send (pressing Enter)...');
  await page.keyboard.press('Enter');

  console.log('Waiting for response...');
  await page.waitForTimeout(8000); // Wait for real AI response

  console.log('Taking screenshot with AI response...');
  await page.screenshot({ path: 'chat-3-response.png', fullPage: true });

  console.log('All screenshots saved!');
  await browser.close();
})();
