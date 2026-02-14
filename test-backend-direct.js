// Test backend API directly
const testBackend = async () => {
  console.log('Testing backend API...\n');

  // Step 1: Create test user
  console.log('1. Creating/signing in test user...');
  const authResponse = await fetch('http://localhost:3000/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@shadow-ai.com',
      password: 'test123',
    }),
  });

  let authData;
  if (authResponse.ok) {
    authData = await authResponse.json();
    console.log('✅ Signed in successfully');
    console.log('Token:', authData.token.substring(0, 20) + '...');
  } else {
    // Try signup
    const signupResponse = await fetch('http://localhost:3000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@shadow-ai.com',
        password: 'test123',
      }),
    });
    authData = await signupResponse.json();
    console.log('✅ Signed up successfully');
  }

  // Step 2: Send a chat message
  console.log('\n2. Sending chat message...');
  const chatResponse = await fetch('http://localhost:3000/chat/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`,
    },
    body: JSON.stringify({
      content: 'I want to journal about my day',
      behaviorId: 'free-form-chat',
    }),
  });

  if (chatResponse.ok) {
    const chatData = await chatResponse.json();
    console.log('✅ Chat response received!');
    console.log('AI Response:', chatData.content);
  } else {
    const error = await chatResponse.text();
    console.log('❌ Chat failed:', error);
  }
};

testBackend().catch(console.error);
