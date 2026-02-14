/**
 * E2E Test Suite: Community Forum
 * Tests: Browse posts -> Create post -> Comment -> React
 */

describe('Community Forum', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should navigate to community tab', async () => {
    await element(by.id('tab-community')).tap();
    
    await waitFor(element(by.id('community-screen')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should display forum posts', async () => {
    // Should show post cards
    await expect(element(by.id('post-card-0'))).toBeVisible();
    await expect(element(by.id('post-card-1'))).toBeVisible();
  });

  it('should filter posts by category', async () => {
    await element(by.id('category-filter')).tap();
    await element(by.text('Gratitude')).tap();
    
    // Should show only gratitude posts
    await waitFor(element(by.id('gratitude-badge')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should create a new post', async () => {
    // Open create post
    await element(by.id('create-post-button')).tap();
    
    await waitFor(element(by.id('create-post-screen')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Fill in post
    await element(by.id('post-content-input')).typeText('What are you grateful for today? I\'m grateful for this community.');
    
    // Select category
    await element(by.id('category-selector')).tap();
    await element(by.text('Gratitude')).tap();
    
    // Optional: Toggle anonymous
    await element(by.id('anonymous-toggle')).tap();
    
    // Submit
    await element(by.id('submit-post')).tap();
    
    // Should return to feed
    await waitFor(element(by.id('community-screen')))
      .toBeVisible()
      .withTimeout(3000);
    
    // New post should be visible
    await expect(element(by.text('What are you grateful for today?'))).toBeVisible();
  });

  it('should open post and view comments', async () => {
    // Tap first post
    await element(by.id('post-card-0')).tap();
    
    await waitFor(element(by.id('full-post-screen')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Should show post content and comments
    await expect(element(by.id('post-content'))).toBeVisible();
    await expect(element(by.id('comments-section'))).toBeVisible();
  });

  it('should add a comment', async () => {
    const testComment = 'Great post! I appreciate this perspective.';
    
    await element(by.id('comment-input')).typeText(testComment);
    await element(by.id('submit-comment')).tap();
    
    // Comment should appear
    await waitFor(element(by.text(testComment)))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should react to post with emoji', async () => {
    // Tap reaction button
    await element(by.id('react-button')).tap();
    
    // Select heart emoji
    await element(by.id('reaction-heart')).tap();
    
    // Reaction count should increase
    await expect(element(by.id('reaction-count'))).toBeVisible();
  });

  it('should reply to a comment (threaded)', async () => {
    // Tap reply on first comment
    await element(by.id('comment-reply-0')).tap();
    
    await element(by.id('reply-input')).typeText('I agree with you!');
    await element(by.id('submit-reply')).tap();
    
    // Reply should appear nested
    await waitFor(element(by.text('I agree with you!')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
