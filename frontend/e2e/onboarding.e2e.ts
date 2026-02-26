/**
 * E2E Test Suite: Onboarding Flow
 * Tests: Splash -> Auth -> Intake Quiz -> Home
 */

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show splash screen then navigate to auth', async () => {
    // Splash screen should appear
    await expect(element(by.text('Ora AI'))).toBeVisible();
    
    // Wait for splash to transition to auth
    await waitFor(element(by.id('sign-up-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should complete sign-up flow', async () => {
    // Navigate to sign-up if needed
    await element(by.id('sign-up-button')).tap();
    
    // Fill in registration form
    await element(by.id('name-input')).typeText('Test User');
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('confirm-password-input')).typeText('Password123!');
    
    // Submit
    await element(by.id('submit-sign-up')).tap();
    
    // Should navigate to intake quiz
    await waitFor(element(by.id('intake-quiz-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should complete intake quiz flow', async () => {
    // Complete 10 quiz questions
    for (let i = 1; i <= 10; i++) {
      await waitFor(element(by.id(`quiz-question-${i}`)))
        .toBeVisible()
        .withTimeout(2000);
      
      // Answer question (select first option)
      await element(by.id(`quiz-option-1`)).tap();
      
      // Go to next
      if (i < 10) {
        await element(by.id('quiz-next-button')).tap();
      } else {
        await element(by.id('quiz-finish-button')).tap();
      }
    }
    
    // Should navigate to home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should show home screen with Choose Your Focus cards', async () => {
    await expect(element(by.text('Choose Your Focus'))).toBeVisible();
    await expect(element(by.id('focus-card-free-form-chat'))).toBeVisible();
    await expect(element(by.id('focus-card-journal-prompt'))).toBeVisible();
    await expect(element(by.id('focus-card-guided-exercise'))).toBeVisible();
  });
});
