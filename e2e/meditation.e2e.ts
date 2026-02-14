/**
 * E2E Test Suite: Meditation Feature
 * Tests: Start session -> Timer -> Completion -> History
 */

describe('Meditation Feature', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should navigate to meditation screen', async () => {
    await element(by.id('tab-meditation')).tap();
    
    await waitFor(element(by.id('meditation-screen')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should show session type selector', async () => {
    await expect(element(by.text('Timed'))).toBeVisible();
    await expect(element(by.text('Guided'))).toBeVisible();
    await expect(element(by.text('Breathing'))).toBeVisible();
  });

  it('should start timed meditation session', async () => {
    // Select timed mode
    await element(by.text('Timed')).tap();
    
    // Set 1 minute timer
    await element(by.id('timer-1-min')).tap();
    
    // Start session
    await element(by.id('start-meditation')).tap();
    
    // Timer should be visible and counting
    await waitFor(element(by.id('meditation-timer')))
      .toBeVisible()
      .withTimeout(1000);
    
    await expect(element(by.id('timer-progress-circle'))).toBeVisible();
  });

  it('should show ambient sound selector', async () => {
    await expect(element(by.id('ambient-sounds-selector'))).toBeVisible();
    
    // Select a sound
    await element(by.id('sound-rain')).tap();
    
    // Sound should be playing (indicated by active state)
    await expect(element(by.id('sound-rain-active'))).toBeVisible();
  });

  it('should complete session and show summary', async () => {
    // Wait for 1-minute session to complete (or fast-forward in test)
    // For testing, we'll tap stop after a few seconds
    await device.setOrientation('portrait');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await element(by.id('stop-meditation')).tap();
    
    // Completion summary should appear
    await waitFor(element(by.id('meditation-completion')))
      .toBeVisible()
      .withTimeout(2000);
    
    await expect(element(by.text('Session Complete'))).toBeVisible();
    await expect(element(by.id('session-duration'))).toBeVisible();
  });

  it('should show meditation history and streak', async () => {
    await element(by.id('done-button')).tap();
    
    // Should show session history
    await expect(element(by.id('session-history'))).toBeVisible();
    await expect(element(by.id('streak-badge'))).toBeVisible();
  });
});
