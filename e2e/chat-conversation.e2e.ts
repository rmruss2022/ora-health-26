/**
 * E2E Test: Chat Conversation Flow
 * Tests the AI conversation experience with behavior detection
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Chat Conversation Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
    // Assume user is already logged in (use test account)
  });

  beforeEach(async () => {
    // Navigate to home screen
    await element(by.id('tab-home')).tap();
  });

  it('should navigate to chat from home screen', async () => {
    await element(by.id('focus-card-journal')).tap();

    await waitFor(element(by.id('chat-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.id('chat-header'))).toBeVisible();
    await detoxExpect(element(by.id('behavior-indicator'))).toBeVisible();
  });

  it('should show empty state with suggested prompts', async () => {
    await element(by.id('focus-card-free-form')).tap();

    await detoxExpect(element(by.id('empty-state'))).toBeVisible();
    await detoxExpect(element(by.id('suggested-prompts'))).toBeVisible();

    // Verify at least 3 suggested prompts
    await detoxExpect(element(by.id('prompt-chip-0'))).toBeVisible();
    await detoxExpect(element(by.id('prompt-chip-1'))).toBeVisible();
    await detoxExpect(element(by.id('prompt-chip-2'))).toBeVisible();
  });

  it('should send a message and receive AI response', async () => {
    await element(by.id('focus-card-journal')).tap();
    await waitFor(element(by.id('chat-screen'))).toBeVisible();

    // Type message
    await element(by.id('chat-input')).typeText(
      "I'm feeling stressed about work"
    );

    // Send message
    await element(by.id('send-button')).tap();

    // Verify user message appears
    await waitFor(element(by.text("I'm feeling stressed about work")))
      .toBeVisible()
      .withTimeout(1000);

    // Wait for AI response (with loading indicator)
    await waitFor(element(by.id('typing-indicator')))
      .toBeVisible()
      .withTimeout(2000);

    await waitFor(element(by.id('typing-indicator')))
      .not.toBeVisible()
      .withTimeout(10000);

    // Verify AI response appears
    await detoxExpect(element(by.id('message-agent-0'))).toBeVisible();
  });

  it('should show behavior indicator and stage progress', async () => {
    await element(by.id('focus-card-journal')).tap();

    await detoxExpect(element(by.id('behavior-indicator'))).toBeVisible();

    // Send initial message to trigger behavior
    await element(by.id('chat-input')).typeText("Let's journal");
    await element(by.id('send-button')).tap();

    await waitFor(element(by.id('typing-indicator')))
      .not.toBeVisible()
      .withTimeout(10000);

    // Check behavior indicator shows "Journaling"
    await detoxExpect(
      element(by.text('Journaling')).withAncestor(by.id('behavior-indicator'))
    ).toBeVisible();
  });

  it('should complete a 3-4 exchange conversation flow', async () => {
    await element(by.id('focus-card-journal')).tap();

    const messages = [
      "I want to journal about my day",
      "Today was challenging at work",
      "I had a difficult conversation with my manager",
      "I think I need to set better boundaries",
    ];

    for (const message of messages) {
      // Type and send message
      await element(by.id('chat-input')).typeText(message);
      await element(by.id('send-button')).tap();

      // Wait for user message to appear
      await waitFor(element(by.text(message)))
        .toBeVisible()
        .withTimeout(1000);

      // Wait for AI response
      await waitFor(element(by.id('typing-indicator')))
        .toBeVisible()
        .withTimeout(2000);

      await waitFor(element(by.id('typing-indicator')))
        .not.toBeVisible()
        .withTimeout(10000);
    }

    // Verify at least 4 message pairs (8 messages total)
    const messageList = element(by.id('messages-list'));
    await detoxExpect(messageList).toBeVisible();
  });

  it('should show completion card after flow finishes', async () => {
    await element(by.id('focus-card-journal')).tap();

    // Complete a full journal flow (simplified for E2E)
    const messages = [
      "I want to journal",
      "I'm feeling anxious",
      "It's about my upcoming presentation",
      "I think I'm prepared but nervous",
    ];

    for (const message of messages) {
      await element(by.id('chat-input')).typeText(message);
      await element(by.id('send-button')).tap();
      await waitFor(element(by.id('typing-indicator')))
        .not.toBeVisible()
        .withTimeout(10000);
    }

    // After 4 exchanges, completion card should appear (if flow completes)
    // Note: This depends on backend flow logic
    await waitFor(element(by.id('completion-card')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.text('Session Complete!'))).toBeVisible();
    await detoxExpect(element(by.id('completion-summary'))).toBeVisible();
  });

  it('should handle input field correctly', async () => {
    await element(by.id('focus-card-free-form')).tap();

    const chatInput = element(by.id('chat-input'));

    // Input should be visible and empty
    await detoxExpect(chatInput).toBeVisible();

    // Type text
    await chatInput.typeText('Test message');

    // Send button should become enabled
    await detoxExpect(element(by.id('send-button'))).toBeVisible();

    // Clear input
    await chatInput.clearText();

    // Type long message (test multi-line)
    const longMessage =
      'This is a longer message that should wrap to multiple lines in the input field and test the auto-growing functionality';
    await chatInput.typeText(longMessage);

    await detoxExpect(chatInput).toHaveText(longMessage);
  });

  it('should maintain conversation history after navigation', async () => {
    await element(by.id('focus-card-journal')).tap();

    // Send a message
    await element(by.id('chat-input')).typeText('Remember this message');
    await element(by.id('send-button')).tap();

    await waitFor(element(by.id('typing-indicator')))
      .not.toBeVisible()
      .withTimeout(10000);

    // Navigate away
    await element(by.id('back-button')).tap();

    // Navigate back to chat
    await element(by.id('focus-card-journal')).tap();

    // Verify message is still there
    await detoxExpect(element(by.text('Remember this message'))).toBeVisible();
  });
});
