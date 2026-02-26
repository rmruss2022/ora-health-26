# Ora — Project State (Feb 26, 2026)

## What This Is

**Ora** is a React Native / Expo mental wellness app (iOS, Android, Web) with:
- AI chat companions (Ora, Sage, Dr. Avery) powered by Anthropic Claude
- Meditation rooms, guided exercises, breathing tools
- Community posts, reactions, letters
- Voice conversation (ElevenLabs TTS + STT)
- Floating aura agent with context-aware AI messages

---

## Repository

**Main repo:** `/Users/matthew/Desktop/Feb26`
**Git remote:** `https://github.com/rmruss2022/ora-health-26.git`

### Branches

| Branch | Location | Purpose |
|---|---|---|
| `main` | remote + local | stable baseline |
| `feat/mainline-next` | `/Users/matthew/Desktop/Feb26` | current main working branch |
| `feat/agent-functionality` | `/Users/matthew/.cursor/worktrees/Feb26/bwa` | voice + agent features (most advanced) |
| `feat/meditation-collective-implementation` | merged into main | meditation rooms — merged |

**Active development happens in the `feat/agent-functionality` worktree.**
The `feat/mainline-next` branch in the main checkout is one step behind.

---

## Directory Layout

```
/Users/matthew/Desktop/Feb26/          ← main repo (feat/mainline-next)
├── src/                               ← React Native app source
│   ├── screens/                       ← 45 screens
│   ├── components/                    ← UI components
│   ├── hooks/                         ← React hooks (useChat, useTTS, usePTT, etc.)
│   ├── services/                      ← service layer + API clients
│   │   ├── ElevenLabsService.ts       ← TTS/voice (eleven_v3 model)
│   │   ├── SpeechService.ts           ← STT / push-to-talk
│   │   └── api/chatAPI.ts             ← chat + streaming SSE client
│   └── navigation/                    ← nav config
├── ora-ai/                            ← git submodule (separate UI repo)
├── ora-ai-api/                        ← backend API (Node/Express/PostgreSQL)
│   └── src/
│       ├── controllers/               ← HTTP handlers
│       ├── routes/                    ← Express routes
│       └── services/                  ← business logic (47 services)
├── shadow-ai-api/                     ← DEAD — only contains init-db.sql, no code
├── App.tsx                            ← Expo root
├── app.json                           ← Expo config (app: "ora-ai")
├── package.json
└── STATE.md                           ← this file

/Users/matthew/.cursor/worktrees/Feb26/bwa/   ← worktree (feat/agent-functionality)
└── [same structure, contains latest voice/agent code]
```

---

## Running the App

### Scripts (from the `bwa` worktree root)

```bash
./run      # starts backend (port 4000) + Expo web (port 8081) in background
./reload   # stops both, restarts via ./run
```

Log/PID files land in `.run/`.

### Manually

```bash
# Backend
cd ora-ai-api && npm run dev        # starts on :4000

# Frontend
npx expo start --web                # starts on :8081
```

### Env files

| Location | Key vars |
|---|---|
| `/Users/matthew/Desktop/Feb26/.env` | `API_BASE_URL=http://localhost:4000`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000` |
| `/Users/matthew/Desktop/Feb26/ora-ai-api/.env` | DB (postgres/shadowai), AI providers, JWT secret |
| `EXPO_PUBLIC_ELEVENLABS_API_KEY` | set in `.env` to enable TTS/voice features |

---

## Backend (ora-ai-api)

- **Runtime:** Node.js + Express + TypeScript
- **Port:** 4000
- **Database:** PostgreSQL on `localhost:5432`, database: `shadowai`
- **Cache:** Redis
- **WebSockets:** Socket.io
- **AI Providers:** Anthropic Claude (primary), NVIDIA Kimi K2.5, Gemini (configured, selectable via `AI_PROVIDER` env var)

### Key Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | single-turn chat (non-streaming) |
| `POST` | `/api/chat/stream` | streaming SSE chat (chunks → `data: {"text":"..."}`) |
| `POST` | `/api/agent/message` | floating aura agent messages |
| `GET/POST` | `/api/rooms/*` | meditation room CRUD |
| `GET/POST` | `/api/community/*` | posts, reactions, comments |
| `GET/POST` | `/api/letters/*` | daily letters, inbox |
| `GET/POST` | `/api/exercises/*` | guided exercises |
| `GET/POST` | `/api/quiz/*` | daily quiz |
| `GET/POST` | `/api/auth/*` | login / register / refresh |

---

## Frontend (React Native / Expo)

- **Framework:** React Native 0.81.5 + Expo + TypeScript
- **Web:** runs via Expo web (react-native-web) at `localhost:8081`
- **Navigation:** React Navigation (native-stack + bottom tabs)

### Core Screens

| Screen | File | Notes |
|---|---|---|
| Home | `src/screens/HomeScreen.tsx` | floating aura agent, daily context |
| Chat | `src/screens/ChatScreen.tsx` | 3 personas, 5 modes, voice, streaming |
| Meditation | `src/screens/MeditationScreen.tsx` | meditation list |
| Meditation Timer | `src/screens/MeditationTimerScreen.tsx` | timer + ambient sound |
| Room | `src/screens/RoomScreen.tsx` | collective session rooms |
| Community | `src/screens/CommunityScreen.tsx` | posts + reactions |
| Letter Inbox | `src/screens/LetterInboxScreen.tsx` | AI-generated daily letters |
| Exercise Library | `src/screens/ExerciseLibraryScreen.tsx` | guided exercises |

### Voice / TTS Stack (feat/agent-functionality)

| File | Role |
|---|---|
| `src/services/ElevenLabsService.ts` | TTS via ElevenLabs `eleven_v3`; MediaSource streaming on web; native expo-av playback; sentence queue |
| `src/hooks/useTTS.ts` | React hook wrapper around ElevenLabsService |
| `src/hooks/usePTT.ts` | Push-to-talk → transcription |
| `src/hooks/useVoiceConversation.ts` | full voice convo state machine |
| `src/components/voice/VoiceConversationModal.tsx` | modal UI for voice mode |

### Chat Streaming

- Text streams via SSE from `/api/chat/stream`
- `useChat.ts` receives chunks, renders live with blinking cursor
- TTS fires alongside text, chunked at paragraph boundaries (`\n\n`) to avoid inter-chunk gaps
- `ElevenLabsService.drainGeneration` counter prevents stale queue races

### AI Personas (Chat)

| ID | Name | Voice (ElevenLabs) | Style |
|---|---|---|---|
| `persona-ora` | Ora | River (`SAz9YHcvj6GT2YYXdXww`) | Mindful, reflective |
| `persona-genz` | Sage | Lily (`pFZP5JQG7iQjIQuC4Bku`) | Casual, no-judgment |
| `persona-psychotherapist` | Dr. Avery | Jen (`BL7YSL1bAkmW8U0JnU8o`) | Clinical, grounded |

---

## Submodule: ora-ai

`/Users/matthew/Desktop/Feb26/ora-ai` is a git submodule pointing to a separate UI repo.
It contains a parallel copy of the app (screens, hooks, services). Currently tracked but its relationship to the main `src/` is unclear — flagged for audit.

---

## Morning Audit — Dead Code Candidates

These should be reviewed and removed after confirming their features are already live in the main codebase:

| Target | Location | Why it's suspect |
|---|---|---|
| `shadow-ai-api/` | `/Users/matthew/Desktop/Feb26/shadow-ai-api/` | Contains only `init-db.sql`, zero active code |
| `ora-ai/` submodule | `/Users/matthew/Desktop/Feb26/ora-ai/` | Parallel app copy — unclear if it diverges from `src/` or is just redundant |
| `src/screens/_old/` | `src/screens/_old/` | Deprecated screens folder |
| Stale API services | `src/services/` root | Several service files that may duplicate `ora-ai-api` logic (check `meditation.ts`, `exercise.service.ts`, `quiz.service.ts`, etc.) |
| Duplicate hooks | `src/hooks/` | Main repo has only 5 hooks; worktree has 10+ — after merge, remove any that aren't imported |
| `debug-*.png`, `home-*.png`, `test-*.png` | repo root | Build-time screenshot artifacts, safe to delete |
| Stale test scripts | `test-*.js`, `debug-*.js` in repo root | One-off debug scripts |
| Worktree itself | `/Users/matthew/.cursor/worktrees/Feb26/bwa/` | Once `feat/agent-functionality` is merged into `feat/mainline-next`, the worktree can be removed |

### Audit Plan

1. Confirm `shadow-ai-api/` has no live dependencies → delete
2. Diff `ora-ai/src/` vs `src/` to find anything that hasn't been ported → port or discard
3. Merge `feat/agent-functionality` → `feat/mainline-next` → resolve any conflicts
4. Delete the `bwa` worktree after merge
5. Clean up root-level `*.png` and `test-*.js` files
6. Review `src/screens/_old/` for anything worth keeping, then delete

---

*Updated: 2026-02-26*
