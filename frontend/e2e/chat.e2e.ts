/**
 * E2E Test Suite: Chat Conversation Flow
 * Tests: Send message -> AI responds -> Flow completion
 */

describe('Chat Conversation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Assume user is already logged in
  });

  it('should navigate to chat from home', async () => {
    await element(by.id('focus-card-free-form-chat')).tap();
    
    await waitFor(element(by.id('chat-screen')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should send message and receive response', async () => {
    const testMessage = 'I\'m feeling overwhelmed with work today';
    
    // Type message
    await element(by.id('chat-input')).typeText(testMessage);
    await element(by.id('chat-send-button')).tap();
    
    // Wait for AI response
    await waitFor(element(by.id('message-ai-response')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Verify message appears
    await expect(element(by.text(testMessage))).toBeVisible();
  });

  it('should show behavior indicator', async () => {
    await expect(element(by.id('behavior-indicator'))).toBeVisible();
    await expect(element(by.id('behavior-text'))).toBeVisible();
  });

  it('should complete journal flow and show completion card', async () => {
    // Navigate to journal prompt
    await element(by.id('back-button')).tap();
    await element(by.id('focus-card-journal-prompt')).tap();
    
    // Complete 4 exchanges
    const responses = [
      'I had a stressful day at work',
      'My manager was very demanding',
      'I feel like I need better boundaries',
      'Yes, that\'s helpful, thank you'
    ];
    
    for (const response of responses) {
      await element(by.id('chat-input')).typeText(response);
      await element(by.id('chat-send-button')).tap();
      await waitFor(element(by.id('message-ai-response')))
        .toBeVisible()
        .withTimeout(5000);
    }
    
    // Completion card should appear
    await waitFor(element(by.id('completion-card')))
      .toBeVisible()
      .withTimeout(3000);
    
    await expect(element(by.text('Journal Entry Saved'))).toBeVisible();
  });
});
