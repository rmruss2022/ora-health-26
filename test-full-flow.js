const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to console and errors
  page.on('console', (msg) => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', (error) => console.log('[ERROR]:', error.message));

  console.log('\n=== Testing Shadow AI App ===\n');

  console.log('1. Loading home screen...');
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-step1-home.png' });

  console.log('2. Selecting "Guided Exercise" behavior...');
  await page.click('text=Guided Exercise');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-step2-chat-loaded.png' });

  console.log('3. Verifying welcome message is visible...');
  const welcomeVisible = await page.isVisible('text=Welcome! I\'m here to guide you');
  console.log(`   Welcome message visible: ${welcomeVisible ? '✓' : '✗'}`);

  console.log('4. Waiting for input field...');
  await page.waitForTimeout(1000);

  console.log('5. Checking backend health...');
  const response = await page.evaluate(async () => {
    try {
      const res = await fetch('http://localhost:3000/health');
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('   Backend status:', response);

  console.log('\n=== Test Complete ===');
  console.log('Screenshots saved:');
  console.log('  - test-step1-home.png');
  console.log('  - test-step2-chat-loaded.png');

  await page.waitForTimeout(2000);
  await browser.close();
})();
