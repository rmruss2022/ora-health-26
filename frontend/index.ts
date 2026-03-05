import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// WebRTC globals must be registered before any LiveKit/ElevenLabs voice usage.
// Only available in native builds — skip on web/Expo Go.
if (Platform.OS !== 'web') {
  try {
    const { registerGlobals } = require('@livekit/react-native-webrtc');
    registerGlobals();
  } catch {
    // Native module not present (Expo Go) — voice agent will be unavailable.
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
