# Ora — AI Agent Context

## What this project is

Ora is a React Native / Expo wellness app. Users meditate together in rooms, chat with an AI companion (Ora), journal, and get personalized guidance. The app has a full onboarding flow before the main experience.

**Working directory**: `/Users/matthew/.cursor/worktrees/Feb26/bwa/`
**Frontend**: `frontend/` (Expo, runs on `http://localhost:8081`)
**Backend**: `backend/` (Node/Express, runs on `http://localhost:4000`)

See `DEVELOPMENT.md` at the project root for full setup, env vars, and architecture details.

## Navigation

```
AppNavigator
├── AuthNavigator         (login / register)
├── OnboardingNavigator   (welcome → info slides → chat → subscription)
└── MainTabs              (Home, Chat, Rooms, Profile)
```

Routing is state-driven off `AuthContext` + `OnboardingContext`. Dev mock user bypasses onboarding unless `EXPO_PUBLIC_FORCE_ONBOARDING=true`.

## AI / Voice stack

- **Chat**: `useChat(behaviorId, personaId, { onSegment })` → POST `/api/chat/stream` → SSE
- **TTS**: `useTTS(personaId)` → ElevenLabs `speak()` / `queueSpeak()` / `stop()`
- **STT**: `usePTT({ onTranscript })` → ElevenLabs transcription
- **Music**: `backgroundMusicService.play('cascade')` / `duckForTTS()` / `restoreFromDuck()`
- **Provider**: Anthropic Claude (`claude-sonnet-4-5`) via `AI_PROVIDER=anthropic` in `backend/.env`

## Onboarding screens

| Screen | File |
|--------|------|
| Welcome | `src/screens/onboarding/OnboardingWelcomeScreen.tsx` |
| Info slides | `src/screens/onboarding/OnboardingInfoScreen.tsx` |
| Intake chat | `src/screens/onboarding/OnboardingChatScreen.tsx` |
| Subscription | `src/screens/onboarding/OnboardingSubscriptionScreen.tsx` |

All screens: gradient `['#D4B8E8', '#F8C8DC']`, plum buttons `rgba(60,20,80,0.75)`, floating Ora logo animates while TTS is active.

## Critical gotchas

1. **`expo-secure-store` crashes on web** — use the `storage` wrapper in `OnboardingContext`, never call SecureStore directly.
2. **Stack navigator scroll on web** — `OnboardingNavigator` must have `cardStyle: { flex: 1 }` in screenOptions or ScrollView won't scroll (screen wrapper defaults to `flex: 0 0 auto`).
3. **Same-screen slide navigation** — `OnboardingInfoScreen` navigates to itself with new `slideIndex` param; doesn't remount, so effects key off `useEffect([slideIndex])`.
4. **`grantSubscription()` auto-switches tabs** — sets context state → `AppNavigator` re-renders to `MainTabs`. No `navigation.reset()` needed.
5. **`useEffect([user])` causes infinite loop** — always use `user?.id` as the dependency, not `user`.
6. **`react-native-purchases` web** — use dynamic import or the `.web.ts` shim; never import directly at the module level.

## Design tokens

```
Background gradient:  ['#D4B8E8', '#F8C8DC']  (lavender → blush)
Primary button:       rgba(60,20,80,0.75)       (deep plum)
Button text:          rgba(255,255,255,0.95)
Headline:             rgba(60,20,80,0.9)
Body:                 rgba(60,20,80,0.65)
App bg (chat):        #FAF8F3
```

Ora logomark: `assets/images/Ora-Logomark-Green.png`
