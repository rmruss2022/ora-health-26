// Direct API test for dynamic behaviors
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
let authToken = '';

async function signIn() {
  const response = await fetch(`${API_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@shadow-ai.com',
      password: 'testpassword',
    }),
  });
  const data = await response.json();
  authToken = data.token;
  console.log('✓ Signed in successfully\n');
}

async function sendMessage(message, description) {
  console.log(`\n📨 ${description}`);
  console.log(`   Message: "${message}"`);
  console.log('   Expected behavior activation (check backend logs above)');

  const response = await fetch(`${API_URL}/chat/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      content: message, // Use 'content' not 'message'
      behaviorId: 'free-form-chat', // This will be overridden by detection
    }),
  });

  const data = await response.json();

  if (data.error) {
    console.log(`   ❌ Error: ${data.error}`);
    return;
  }

  if (data.content) {
    console.log(`   ✓ Response received (${data.content.length} chars)`);
  }

  if (data.activeBehavior) {
    console.log(`   🎯 Activated: ${data.activeBehavior}`);
  } else {
    console.log(`   ⚠️  No behavior info in response`);
  }

  // Small delay between tests
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function runTests() {
  console.log('🧪 Testing Dynamic Behavior Detection\n');
  console.log('=' .repeat(60));

  try {
    await signIn();

    await sendMessage(
      "I'm feeling really overwhelmed and can't cope with everything going on",
      'Testing: Difficult Emotion Processing'
    );

    await sendMessage(
      'I want to plan my upcoming week and set some intentions',
      'Testing: Weekly Planning'
    );

    await sendMessage(
      "I'm so grateful for my supportive friends who helped me this week",
      'Testing: Gratitude Practice'
    );

    await sendMessage(
      'I want to start exercising more. That is my goal.',
      'Testing: Goal Setting'
    );

    await sendMessage(
      "I'm feeling really tired and low energy today",
      'Testing: Energy Check-in'
    );

    await sendMessage(
      'I always fail at everything and nothing ever works out',
      'Testing: Cognitive Reframing'
    );

    await sendMessage(
      'How was my week? I want to reflect on what happened',
      'Testing: Weekly Review'
    );

    await sendMessage(
      "What's really important to me in life? What do I value most?",
      'Testing: Values Clarification'
    );

    await sendMessage(
      'Just wanted to chat and share some thoughts',
      'Testing: Free-form Chat (fallback)'
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ All behavior detection tests completed!\n');
    console.log('Check the backend logs above for the 🎯 Activated behavior lines');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
