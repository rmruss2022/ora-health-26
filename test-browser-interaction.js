const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to all console logs and errors
  page.on('console', (msg) => {
    const text = msg.text();
    if (!text.includes('Download the React DevTools') &&
        !text.includes('shadow*') &&
        !text.includes('pointerEvents')) {
      console.log(`[BROWSER ${msg.type()}]:`, text);
    }
  });

  page.on('pageerror', (error) => {
    console.log('[PAGE ERROR]:', error.message);
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/auth/') || url.includes('/chat/')) {
      console.log(`[API] ${response.request().method()} ${url} - Status: ${response.status()}`);
      try {
        const body = await response.text();
        if (body) {
          console.log(`[API RESPONSE]:`, body.substring(0, 200));
        }
      } catch (e) {
        // Ignore
      }
    }
  });

  console.log('1. Navigating to chat...');
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(3000);

  console.log('2. Taking screenshot of initial state...');
  await page.screenshot({ path: 'browser-test-1-initial.png' });

  console.log('3. Looking for input field...');
  const input = await page.$('textarea, input[type="text"]');
  if (!input) {
    console.log('❌ No input field found!');
    await browser.close();
    return;
  }
  console.log('✓ Input field found');

  console.log('4. Clicking and typing message...');
  await input.click();
  await page.keyboard.type('What have I been journaling about?');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'browser-test-2-typed.png' });

  console.log('5. Clicking send button...');
  // Click on the blue circle button (positioned at bottom right)
  await page.click('[role="button"]', { position: { x: 20, y: 20 } });

  console.log('6. Waiting for response (15 seconds)...');
  await page.waitForTimeout(15000);

  await page.screenshot({ path: 'browser-test-3-after-send.png' });

  console.log('\n✅ Test complete! Check screenshots:');
  console.log('  - browser-test-1-initial.png');
  console.log('  - browser-test-2-typed.png');
  console.log('  - browser-test-3-after-send.png');

  // Keep browser open for inspection
  console.log('\nBrowser will stay open for 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
