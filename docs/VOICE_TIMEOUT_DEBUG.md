# Voice Connection Timeout — Debug Trace

## Timeout Points (End-to-End)

### 1. **Start voice session**

| Layer | Timeout | Location | Notes |
|-------|---------|----------|-------|
| Frontend | 30s | `apiClient` fetch | `getConversationToken` → backend |
| Backend | 25s | `voice.controller.ts` | Fetch token from ElevenLabs API |
| ElevenLabs | — | Their API | Returns token or 5xx |

**Flow:** App → `POST /api/voice/conversation-token` → Backend → `GET https://api.elevenlabs.io/v1/convai/conversation/token` → Token → `conversation.startSession(token)` → LiveKit/WebRTC connect.

### 2. **LiveKit/WebRTC (ElevenLabs)**

| Event | Cause | Log pattern |
|-------|-------|-------------|
| **404 on connect** | ElevenLabs RTC path not found | `Received bad response code from server: 404`, `v1 RTC path not found` |
| **Ping timeout** | No pong from server for ~60s | `ping timeout triggered. last pong received at: ...` |
| **Stream end** | Server closed connection | `websocket closed`, `reason: "Stream end encountered"` |

These are controlled by ElevenLabs/LiveKit, not our code. Long sessions or network issues can trigger ping timeout.

### 3. **Tool calls (mid-conversation)**

| Layer | Timeout | Location |
|-------|---------|----------|
| Frontend | 30s | `apiClient` fetch |
| Backend | — | No explicit timeout (Express) |

**Flow:** ElevenLabs agent → `onUnhandledClientToolCall` → `voiceAgentAPI.executeToolCall` → `POST /api/voice/tool-call` → Backend.

### 4. **Backend availability**

- **EADDRINUSE** — Port 4000 already in use; backend fails to start.
- If backend is down, all API calls (token, tool-call) fail with network/timeout errors.

---

## Logs to Check

**Frontend (`.run/frontend.log`):**
```
[useElevenVoiceAgent] startSession error: ...
[useElevenVoiceAgent] Tool failed: ... Request failed
ping timeout triggered
websocket closed {"code": 1006, "reason": "Received bad response code from server: 404"}
```

**Backend (`.run/backend.log`):**
```
[VoiceController] createConversationToken fetching
[VoiceController] Token fetch timeout
Error: listen EADDRINUSE: address already in use :::4000
```

---

## Changes Made

1. **apiClient** — 30s fetch timeout so requests don’t hang indefinitely.
2. **useElevenVoiceAgent** — Clearer timeout/connection error messages.
3. **Backend** — Token fetch timeout increased to 25s and retry logic improved.
4. **Logging** — Extra logs around token fetch and errors.
5. **Tool timing** — Log duration for each tool call; 401 retry on auth race.

---

## Agent Says "Timeout" Despite Successful Tool Call

The agent responds to the *first* tool result. If the first `get_user_profile` fails (401 auth race), the agent says "can't access." Later calls may succeed but the agent already committed. **Fix:** 401 retry + start fresh session after login.

---

## If Timeouts Persist

1. **Backend** — Ensure it’s running and port 4000 is free.
2. **Network** — Test on a stable Wi‑Fi connection.
3. **ElevenLabs** — 404/504 may indicate service issues; retry later.
4. **Long sessions** — Ping timeout after ~4+ minutes is expected; user can reconnect.
