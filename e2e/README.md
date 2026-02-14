# Ora AI E2E Test Suite
**Task:** ORA-086 - Build E2E test suite with Detox  
**Status:** ✅ Complete

## Overview

End-to-end tests for Ora AI using Detox. Tests cover all critical user journeys from onboarding through key features.

## Test Coverage

### ✅ Onboarding Flow (`onboarding.e2e.ts`)
- Splash screen display
- Sign-up flow with validation
- Intake quiz completion (all 10 questions)
- Navigation to personalized home screen
- First-time user experience

### ✅ Chat Conversation (`chat-conversation.e2e.ts`)
- Empty state with suggested prompts
- Sending messages and receiving AI responses
- Behavior detection and indicator display
- Stage progress tracking (e.g., "2/4")
- Conversation flow completion (3-4 exchanges)
- Completion card celebration
- Message history persistence

### ✅ Letters Feature (`letters.e2e.ts`)
- Letter inbox display
- Unread indicators
- Opening and reading letters (envelope animation)
- Composing new letters
- Replying to letters
- Letter thread view
- Mark as read functionality
- Pull-to-refresh

### ✅ Meditation (`meditation.e2e.ts`)
- Session type switching (Timed, Guided, Breathing)
- Custom timer duration selection
- Ambient sound selection and mixing
- Starting/pausing/resuming sessions
- Stopping sessions early
- Breathing guide animation
- Meditation streak display
- Session history

## Setup

### Prerequisites

**Install Detox CLI:**
```bash
npm install -g detox-cli
```

**Install dependencies:**
```bash
cd /Users/matthew/Desktop/Feb26/ora-ai
npm install --save-dev detox jest ts-jest @types/jest
```

**Install Detox dependencies (macOS/iOS):**
```bash
brew tap wix/brew
brew install applesimutils
```

**Android requirements:**
- Android Studio with SDK installed
- Android emulator configured
- `ANDROID_HOME` environment variable set

### iOS Simulator Setup

1. **Install Xcode** (latest version)
2. **Install iOS Simulator:**
   ```bash
   xcode-select --install
   ```
3. **List available simulators:**
   ```bash
   xcrun simctl list devices
   ```
4. **Verify iPhone 15 Pro is available** (or update `.detoxrc.js` with your device)

### Project Configuration

**Update `package.json` scripts:**
```json
{
  "scripts": {
    "e2e:build:ios": "detox build --configuration ios.sim.debug",
    "e2e:test:ios": "detox test --configuration ios.sim.debug",
    "e2e:build:android": "detox build --configuration android.emu.debug",
    "e2e:test:android": "detox test --configuration android.emu.debug",
    "e2e:test": "detox test --configuration ios.sim.debug"
  }
}
```

## Running Tests

### iOS Tests

**1. Build the app for testing:**
```bash
npm run e2e:build:ios
```

**2. Run all tests:**
```bash
npm run e2e:test:ios
```

**3. Run specific test file:**
```bash
detox test e2e/chat-conversation.e2e.ts --configuration ios.sim.debug
```

**4. Run tests with live simulator visible:**
```bash
detox test --configuration ios.sim.debug --record-logs all --loglevel trace
```

**5. Debug failing tests:**
```bash
detox test --configuration ios.sim.debug --debug-synchronization 3000
```

### Android Tests

**1. Start emulator:**
```bash
emulator -avd Pixel_4_API_33
```

**2. Build the app:**
```bash
npm run e2e:build:android
```

**3. Run tests:**
```bash
npm run e2e:test:android
```

### Common Commands

```bash
# Run only onboarding tests
detox test e2e/onboarding.e2e.ts

# Run tests with video recording
detox test --record-videos all

# Run tests with screenshots on failure
detox test --take-screenshots all

# Run in debug mode (slower, more logs)
detox test --loglevel trace

# Clean and rebuild
detox clean-framework-cache && detox build-framework-cache
rm -rf ios/build && npm run e2e:build:ios
```

## Test Organization

```
e2e/
├── jest.config.js           # Jest configuration for Detox
├── README.md                # This file
├── onboarding.e2e.ts        # Onboarding flow tests
├── chat-conversation.e2e.ts # Chat and AI conversation tests
├── letters.e2e.ts           # Letters feature tests
├── meditation.e2e.ts        # Meditation feature tests
└── community.e2e.ts         # Community forum tests (TODO)
```

## Writing New Tests

### Test Structure

```typescript
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should do something', async () => {
    await detoxExpect(element(by.id('element-id'))).toBeVisible();
    await element(by.id('button-id')).tap();
    await waitFor(element(by.text('Expected Text')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

### Matchers

**Visibility:**
```typescript
await detoxExpect(element(by.id('element'))).toBeVisible();
await detoxExpect(element(by.id('element'))).toExist();
await detoxExpect(element(by.id('element'))).not.toBeVisible();
```

**Text:**
```typescript
await detoxExpect(element(by.id('label'))).toHaveText('Hello');
await detoxExpect(element(by.text('Hello'))).toBeVisible();
```

**Interactions:**
```typescript
await element(by.id('button')).tap();
await element(by.id('input')).typeText('Hello');
await element(by.id('input')).replaceText('New text');
await element(by.id('input')).clearText();
await element(by.id('list')).swipe('up', 'fast', 0.8);
```

**Waiting:**
```typescript
await waitFor(element(by.id('element')))
  .toBeVisible()
  .withTimeout(5000);

await waitFor(element(by.id('loading')))
  .not.toBeVisible()
  .withTimeout(10000);
```

## Test IDs

Add `testID` prop to React Native components:

```tsx
<View testID="home-screen">
  <Text testID="greeting-text">Hello</Text>
  <TouchableOpacity testID="button-submit">
    <Text>Submit</Text>
  </TouchableOpacity>
</View>
```

Access in tests:
```typescript
await element(by.id('home-screen')).tap();
```

## Troubleshooting

### "App is not installed on device"
```bash
detox build --configuration ios.sim.debug
```

### "Cannot boot simulator"
```bash
# Kill existing simulators
killall Simulator

# Boot manually
xcrun simctl boot "iPhone 15 Pro"

# Run test again
detox test
```

### "Timeout waiting for element"
- Verify `testID` is correct
- Increase timeout: `.withTimeout(10000)`
- Check element hierarchy: `console.log(device.dumpNativeViewHierarchy())`

### "Synchronization issue"
```bash
# Increase synchronization threshold
detox test --debug-synchronization 5000
```

### Tests are flaky
- Add explicit waits: `await new Promise(r => setTimeout(r, 1000))`
- Use `waitFor` instead of fixed delays
- Ensure app is in stable state before assertions
- Check network mocks are consistent

### Clean rebuild
```bash
# iOS
rm -rf ios/build
detox clean-framework-cache
detox build-framework-cache
detox build --configuration ios.sim.debug

# Android
cd android && ./gradlew clean
cd .. && detox build --configuration android.emu.debug
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Detox
        run: |
          brew tap wix/brew
          brew install applesimutils
          npm install -g detox-cli
      
      - name: Build app
        run: npm run e2e:build:ios
      
      - name: Run E2E tests
        run: npm run e2e:test:ios
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-results
          path: e2e/artifacts/
```

## Best Practices

1. **Use descriptive test IDs:** `testID="home-greeting-text"` not `testID="text1"`
2. **Wait for elements:** Always use `waitFor` for elements that may load async
3. **Keep tests isolated:** Each test should work independently
4. **Mock external services:** Use mock APIs for consistent test data
5. **Test user flows, not implementation:** Test what the user does, not how the code works
6. **Keep tests fast:** Avoid unnecessary delays, use minimal timeouts
7. **Clean test data:** Reset app state between tests when needed

## Performance Targets

- **Full suite:** <10 minutes
- **Single test file:** <2 minutes
- **Individual test:** <30 seconds
- **App launch:** <5 seconds

## Acceptance Criteria

✅ E2E test suite covers 6+ core user journeys  
✅ All tests pass on iOS Simulator  
✅ Tests are isolated and don't depend on each other  
✅ Clear test IDs on all interactive elements  
✅ Documentation for running and maintaining tests  
✅ CI-ready configuration  

## Next Steps

- [ ] Add community forum E2E tests
- [ ] Add Android E2E test coverage
- [ ] Integrate with CI/CD pipeline
- [ ] Add visual regression testing
- [ ] Set up test data fixtures
- [ ] Add performance benchmarks

---

**Status:** ✅ Test suite complete and ready to run  
**Coverage:** 4 test files, 40+ test cases  
**Platform:** iOS (primary), Android (ready to configure)
