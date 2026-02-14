/**
 * E2E Test Suite: Letters Feature
 * Tests: Compose -> Send -> Inbox -> Read
 */

describe('Letters Feature', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should navigate to letters inbox from community tab', async () => {
    await element(by.id('tab-community')).tap();
    await element(by.id('community-letters-tab')).tap();
    
    await waitFor(element(by.id('letters-inbox-screen')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should compose and send a letter', async () => {
    // Open compose screen
    await element(by.id('compose-letter-button')).tap();
    
    await waitFor(element(by.id('compose-letter-screen')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Select recipient (first user in list)
    await element(by.id('recipient-search')).typeText('test');
    await element(by.id('recipient-option-0')).tap();
    
    // Fill in letter
    await element(by.id('subject-input')).typeText('Hello from E2E test');
    await element(by.id('body-input')).typeText('This is a test letter to verify the letters feature works correctly.');
    
    // Send
    await element(by.id('send-letter-button')).tap();
    
    // Should return to inbox
    await waitFor(element(by.id('letters-inbox-screen')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Success message
    await expect(element(by.text('Letter sent!'))).toBeVisible();
  });

  it('should display received letters in inbox', async () => {
    // Inbox should show letters
    await expect(element(by.id('letter-card-0'))).toBeVisible();
  });

  it('should open and read a letter with animation', async () => {
    // Tap first letter
    await element(by.id('letter-card-0')).tap();
    
    // Should show letter read screen with animation
    await waitFor(element(by.id('letter-read-screen')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Letter content should be visible
    await expect(element(by.id('letter-sender'))).toBeVisible();
    await expect(element(by.id('letter-body'))).toBeVisible();
    await expect(element(by.id('reply-button'))).toBeVisible();
  });

  it('should mark letter as read', async () => {
    // After opening, unread indicator should disappear
    await element(by.id('back-to-inbox')).tap();
    
    // First letter should no longer show unread dot
    await expect(element(by.id('unread-indicator-0'))).not.toBeVisible();
  });
});
