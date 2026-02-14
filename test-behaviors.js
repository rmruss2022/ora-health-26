const { chromium } = require('playwright');

async function testBehaviors() {
  console.log('🧪 Testing Dynamic Behaviors\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to app
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(2000);

    // Sign in
    const emailInput = await page.waitForSelector('input[placeholder="Email"]');
    await emailInput.fill('test@shadow-ai.com');

    const passwordInput = await page.locator('input[placeholder="Password"]');
    await passwordInput.fill('testpassword');

    const signInButton = await page.locator('text=Sign In');
    await signInButton.click();

    await page.waitForTimeout(3000);
    console.log('✓ Signed in successfully\n');

    // Test different behaviors
    const testCases = [
      {
        behavior: 'Difficult Emotion Processing',
        message: "I'm feeling really overwhelmed and can't cope with everything",
        expectedIndicators: ['validate', 'hear you', 'overwhelm'],
      },
      {
        behavior: 'Weekly Planning',
        message: 'I want to plan my week ahead',
        expectedIndicators: ['week', 'intention', 'plan'],
      },
      {
        behavior: 'Gratitude Practice',
        message: "I'm grateful for my family and friends",
        expectedIndicators: ['grateful', 'appreciate', 'matter'],
      },
      {
        behavior: 'Goal Setting',
        message: 'I want to start exercising more regularly',
        expectedIndicators: ['goal', 'specific', 'step'],
      },
      {
        behavior: 'Energy Check-in',
        message: "I'm feeling really tired and low energy today",
        expectedIndicators: ['energy', 'sleep', 'need'],
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.behavior}`);
      console.log(`   Message: "${testCase.message}"`);

      // Find input and send button
      const input = await page.locator('input[placeholder="Type your message..."]');
      await input.fill(testCase.message);

      // Click send button by coordinates (reliable method)
      await page.mouse.click(1247, 690);

      // Wait for response
      await page.waitForTimeout(8000);

      // Take screenshot
      const screenshotPath = `/Users/matthew/Desktop/Feb26/test-${testCase.behavior.toLowerCase().replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath });
      console.log(`   ✓ Screenshot saved: ${screenshotPath}`);

      await page.waitForTimeout(2000);
    }

    console.log('\n✅ All behavior tests completed!');
    console.log('\nCheck the backend logs to see which behaviors were activated.');
    console.log('Look for lines like: 🎯 Activated behavior: [Behavior Name]');

    // Keep browser open to review
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testBehaviors();
