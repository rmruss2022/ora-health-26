const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Opening chat...');
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(3000);

  console.log('Typing message...');
  await page.fill('textarea', 'What have I been journaling about?');
  await page.waitForTimeout(500);

  console.log('Taking screenshot before click...');
  await page.screenshot({ path: 'before-click.png' });

  console.log('Clicking send button by coordinates...');
  // Click the blue button in the bottom right
  await page.click('body', { position: { x: 1247, y: 690 } });

  console.log('Waiting for response...');
  await page.waitForTimeout(15000);

  console.log('Taking final screenshot...');
  await page.screenshot({ path: 'after-send.png' });

  console.log('Done! Check screenshots.');
  await browser.close();
})();
