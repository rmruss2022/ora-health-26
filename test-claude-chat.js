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

  console.log('Navigating to chat...');
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(3000);

  console.log('Taking screenshot of initial state...');
  await page.screenshot({ path: 'test-1-initial.png' });

  console.log('Clicking on input field...');
  await page.click('input[placeholder="Type a message..."]');
  await page.waitForTimeout(500);

  console.log('Typing message...');
  const testMessage = 'I want to journal about my day';
  await page.fill('input[placeholder="Type a message..."]', testMessage);
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'test-2-typed.png' });

  console.log('Pressing Enter to send...');
  await page.keyboard.press('Enter');

  console.log('Waiting for AI response...');
  await page.waitForTimeout(8000);

  await page.screenshot({ path: 'test-3-response.png' });

  console.log('Test complete! Check the screenshots.');
  await browser.close();
})();
