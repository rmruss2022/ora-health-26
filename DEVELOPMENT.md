# Ora — Development Guide

## Project layout

```
bwa/
├── frontend/          React Native + Expo app
├── backend/           Node/Express API
└── DEVELOPMENT.md     ← this file
```

## Starting dev

```bash
# From bwa/ — starts both backend + frontend, auto-detects LAN IP
./run         # start (skips if already running)
./reload      # stop everything, then run again

# Or individually
cd backend && npm run dev            # API on :4000
cd frontend && npx expo start -c     # App on :8081
```

Open `http://localhost:8081` in browser.

### Physical device (iPhone)

The `run` script automatically detects your Mac's LAN IP (tries `en0`, `en1`, `en2`)
and patches `frontend/.env` before starting Metro. No manual IP editing needed.

On each `./run` or `./reload`, `frontend/.env` is updated:

```
EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:4000
```

The terminal output shows the exact URLs to use:

```
API (phone): http://172.x.x.x:4000
App (phone): exp://172.x.x.x:8081
```

If your IP changes (e.g. switching from WiFi to hotspot), just run `./reload` and
it will re-detect and patch automatically.

---

## Frontend (`frontend/`)

### Key env vars (`frontend/.env`)

| Var | Purpose |
|-----|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend URL — auto-set to LAN IP by `./run`/`./reload` |
| `EXPO_PUBLIC_ELEVENLABS_API_KEY` | ElevenLabs key for TTS + STT |
| `EXPO_PUBLIC_FORCE_ONBOARDING` | Set `true` to always show onboarding regardless of stored flags (useful for testing). Requires Metro restart. |

### Navigation structure

```
AppNavigator (state-driven, not a stack)
├── LoadingScreen                when auth or onboarding state is loading
├── AuthNavigator                when !user
├── OnboardingNavigator          when user && !(onboardingComplete && isSubscribed)
└── MainTabs                     when user && onboardingComplete && isSubscribed
```

**Dev mock user** (`f08ffbd7-ccd6-4a2f-ae08-ed0e007d70fa`): always routes to MainTabs, bypassing onboarding — unless `EXPO_PUBLIC_FORCE_ONBOARDING=true`.

### Onboarding flow

```
OnboardingNavigator (Stack)
  OnboardingWelcomeScreen       Typewriter + TTS + floating Ora logo + cascade music
  OnboardingInfoScreen          3 slides, emoji + typewriter title/body, logo floats above button
  OnboardingChatScreen          5-question AI intake, mirrors main ChatScreen layout
  OnboardingSubscriptionScreen  Comparison cards, typewriter headline, logo above CTA
```

Completion flags stored in `SecureStore` (native) / `localStorage` (web) via `OnboardingContext`.

### Key services

| File | What it does |
|------|-------------|
| `src/context/OnboardingContext.tsx` | Persists `onboarding_completed` + `subscription_granted` |
| `src/context/AuthContext.tsx` | Auth state; falls back to dev mock user when backend unreachable |
| `src/hooks/useChat.ts` | Streaming chat with SSE; handles `onSegment` callbacks for TTS |
| `src/hooks/useTTS.ts` | ElevenLabs TTS via `speak()`, `queueSpeak()`, `stop()` |
| `src/hooks/usePTT.ts` | Push-to-talk via ElevenLabs STT |
| `src/services/BackgroundMusicService.ts` | Ambient music with `duckForTTS()` / `restoreFromDuck()` |
| `src/services/SubscriptionService.ts` | RevenueCat on native; `.web.ts` shim grants instantly on web |
| `src/services/api/onboardingAPI.ts` | Submits intake chat transcript to backend |

### Web gotchas

- **`expo-secure-store` crashes on web** — always use the `storage` wrapper in `OnboardingContext`, never call `SecureStore` directly. See `src/services/secureStorage.web.ts`.
- **Stack Navigator scroll on web** — `cardStyle: { flex: 1 }` is required in `OnboardingNavigator` screenOptions. Without it the screen wrapper uses `flex: 0 0 auto` and expands to content height, breaking `ScrollView`.
- **`react-native-purchases` on web** — dynamic import (`await import('react-native-purchases')`) prevents bundling crash. The `.web.ts` shim handles this automatically.

---

## Backend (`backend/`)

### Key env vars (`backend/.env`)

| Var | Purpose |
|-----|---------|
| `PORT` | API port (default `4000`) |
| `AI_PROVIDER` | `anthropic` or `nvidia` — controls which AI is used for streaming chat |
| `ANTHROPIC_API_KEY` | Claude API key |
| `ANTHROPIC_MODEL` | Model ID (currently `claude-sonnet-4-5`) |
| `NVIDIA_API_KEY` | NVIDIA NIM key (fallback; uses Kimi K2.5) |
| `KIMI_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `KIMI_MODEL` | `moonshotai/kimi-k2.5` |
| `JWT_SECRET` | Auth token signing secret |
| `DB_*` | PostgreSQL connection (host/port/name/user/password) |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |

**Current**: `AI_PROVIDER=anthropic`, model `claude-sonnet-4-5`.

### AI routing (`backend/src/controllers/chat.controller.ts`)

```
AI_PROVIDER=anthropic  →  streamMessageWithAnthropic (SSE streaming)
AI_PROVIDER=nvidia     →  sendMessageWithKimi via sendMessage (non-streaming, single chunk)
```

### Behaviors (`backend/src/config/behaviors.ts`)

Each behavior has an `id` and `systemPrompt`. Key ones:

| ID | Purpose |
|----|---------|
| `free-form-chat` | Default open conversation |
| `onboarding-intake` | 5-question intake during onboarding chat |
| `weekly-planning` | Weekly planning assistant |
| `weekly-review` | Journal/reflection |
| `self-compassion-exercise` | Guided exercises |

Behavior is auto-detected from message content unless explicitly passed.

### Auth

JWT-based. Dev mock user ID `f08ffbd7-ccd6-4a2f-ae08-ed0e007d70fa` is hardcoded in the frontend `AuthContext` as a fallback when the backend is unreachable in dev.
