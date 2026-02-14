const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console logs with full arguments
  page.on('console', async msg => {
    const values = [];
    for (const arg of msg.args()) {
      values.push(await arg.jsonValue().catch(() => arg.toString()));
    }
    console.log(`[BROWSER ${msg.type()}]:`, ...values);
  });

  // Capture ALL network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      console.log(`\n[REQUEST]: ${request.method()} ${url}`);
      const headers = request.headers();
      if (headers['authorization']) {
        console.log(`  Authorization: ${headers['authorization'].substring(0, 30)}...`);
      }
    }
  });

  // Capture ALL network responses
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
      console.log(`\n[RESPONSE]: ${response.status()} ${url}`);
      try {
        const body = await response.text();
        console.log(`  Body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
      } catch (e) {
        console.log(`  Body: (could not read)`);
      }
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`\n[PAGE ERROR]:`, error.message);
    console.log(error.stack);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    console.log(`\n[REQUEST FAILED]: ${request.url()}`);
    console.log(`  Error: ${request.failure().errorText}`);
  });

  console.log('Opening http://localhost:8081...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });

  console.log('\nWaiting 3 seconds for page to load...');
  await page.waitForTimeout(3000);

  // Check what the API base URL is in the browser
  console.log('\n=== Checking API Configuration ===');
  const apiConfig = await page.evaluate(() => {
    try {
      return {
        envVars: {
          EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
          API_BASE_URL: process.env.API_BASE_URL,
        },
        localStorage: JSON.stringify(localStorage),
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Environment variables in browser:', JSON.stringify(apiConfig, null, 2));

  console.log('\n=== Looking for chat input ===');
  const inputSelectors = [
    'textarea[placeholder*="message"]',
    'input[placeholder*="message"]',
    'textarea',
    'input[type="text"]',
  ];

  let input = null;
  for (const selector of inputSelectors) {
    try {
      input = await page.waitForSelector(selector, { timeout: 2000 });
      if (input) {
        console.log(`Found input with selector: ${selector}`);
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }

  if (!input) {
    console.log('\n[ERROR] Could not find chat input field');
    await page.screenshot({ path: '/tmp/chat-error.png' });
    console.log('Screenshot saved to /tmp/chat-error.png');
    await browser.close();
    return;
  }

  console.log('\n=== Typing and sending message ===');
  await input.click();
  await input.fill('what exercises can I do?');
  console.log('Message typed, pressing Enter...');
  await input.press('Enter');

  console.log('\n=== Waiting 10 seconds for API calls and response ===');
  await page.waitForTimeout(10000);

  // Check for error messages on page
  const errorText = await page.evaluate(() => {
    const body = document.body.innerText;
    if (body.includes('error') || body.includes('Error')) {
      return body;
    }
    return null;
  });

  if (errorText) {
    console.log('\n=== Error found on page ===');
    console.log(errorText.substring(0, 500));
  }

  console.log('\n=== Taking screenshot ===');
  await page.screenshot({ path: '/tmp/chat-final.png' });
  console.log('Screenshot saved to /tmp/chat-final.png');

  console.log('\n=== Keeping browser open for 20 more seconds ===');
  await page.waitForTimeout(20000);

  await browser.close();
})();
