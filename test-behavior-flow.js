const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);

  console.log('Taking screenshot of home screen...');
  await page.screenshot({ path: 'flow-1-home.png' });

  console.log('Clicking on Journal Prompts...');
  // Click on the second behavior card (Journal Prompts)
  await page.click('text=Journal Prompts');
  await page.waitForTimeout(2000);

  console.log('Taking screenshot of journal chat...');
  await page.screenshot({ path: 'flow-2-journal-chat.png' });

  console.log('Done!');
  await browser.close();
})();
