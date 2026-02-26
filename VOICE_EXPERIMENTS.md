# Voice Experiments Log

Tracks every voice/settings combination tried, with user feedback.

---

## Session 1 — 2026-02-26

### Setup
- ElevenLabs API via `EXPO_PUBLIC_ELEVENLABS_API_KEY`
- Model: `eleven_monolingual_v1` → later `eleven_turbo_v2_5`
- Platform: Expo Web (localhost:8081)

---

### Attempt 1 — Default voices (Rachel / Domi / Bella)
| Persona | Voice | Voice ID |
|---|---|---|
| Ora / aura | Rachel | `21m00Tcm4TlvDq8ikWAM` |
| Sage | Domi | `AZnzlk1XvdvUeBnXmlld` |
| Dr. Avery | Bella | `EXAVITQu4vr4xnSDxMaL` |

**Settings:** `stability: 0.5, similarity_boost: 0.75`
**Model:** `eleven_monolingual_v1`
**Feedback:** User could not hear — `EXPO_PUBLIC_ELEVENLABS_API_KEY` was missing from `.env`. No audio at all.

---

### Attempt 2 — Soothing voices, key added
| Persona | Voice | Voice ID |
|---|---|---|
| Ora / aura | Valentyna ("Soft and calm") | `eYO9Ven76ACQ8Me4zQK4` |
| Sage | Lily ("Velvety Actress") | `pFZP5JQG7iQjIQuC4Bku` |
| Dr. Avery | Jen ("Soothing Gentle Thoughtful") | `BL7YSL1bAkmW8U0JnU8o` |

**Settings:** `stability: 0.65, similarity_boost: 0.75`
**Model:** `eleven_monolingual_v1`
**Feedback:** "I like it, but it talks a little bit too slow." Also not playing on load.

---

### Attempt 3 — Speed up + turbo model + auto-play fix
| Persona | Voice | Voice ID |
|---|---|---|
| Ora / aura | Valentyna | `eYO9Ven76ACQ8Me4zQK4` |
| Sage | Lily | `pFZP5JQG7iQjIQuC4Bku` |
| Dr. Avery | Jen | `BL7YSL1bAkmW8U0JnU8o` |

**Settings:** `stability: 0.65, similarity_boost: 0.75, speed: 1.15`
**Model:** `eleven_turbo_v2_5` (better latency, supports speed param)
**Changes:** +speed param, model upgrade, web audio blob fix, auto-play on load
**Feedback:** "The play on load keeps erroring... it says stop and it's about to speak and then it goes right back to listen." Root cause identified: `audio.play()` throws `NotAllowedError` on cold page load (no user gesture), `catch(done)` fired immediately, resolving the promise and snapping `isSpeaking` back to false (the flash). Also: "maybe make it slightly faster. It has a little bit too much of an accent."

---

### Attempt 4 — New voice (neutral/American) + speed 1.25 + autoplay flash fix (current)
| Persona | Voice | Voice ID |
|---|---|---|
| Ora / aura | River ("Relaxed, Neutral, Informative") | `SAz9YHcvj6GT2YYXdXww` |
| Sage | Lily | `pFZP5JQG7iQjIQuC4Bku` |
| Dr. Avery | Jen | `BL7YSL1bAkmW8U0JnU8o` |

**Settings:** `stability: 0.65, similarity_boost: 0.75, speed: 1.25`
**Model:** `eleven_turbo_v2_5`
**Changes:**
- Voice: Valentyna → River. River is a neutral-accent American voice, fine-tuned for `eleven_turbo_v2_5`.
- Speed: 1.15 → 1.25
- Auto-play flash fix: `playWeb()` now catches `NotAllowedError` specifically. Instead of calling `done()` (which resolved the promise and reset `isSpeaking`), it stays in `_isActive=true` and registers a `click`/`touchstart` listener. When user first interacts, audio plays normally. `stop()` cleans up the pending listener and resolves the promise so callers never hang.
- Added console logging throughout `speak()`, `playWeb()`, and `stop()` for debugging.
**Feedback:** TBD

---

## Notes
- Browser autoplay is blocked on cold page load (no prior user gesture). Auto-play works after any navigation interaction.
  - Fix: `playWeb()` catches `NotAllowedError`, stays pending, retries on first click/touchstart.
  - `stop()` removes the pending listener and resolves the promise to prevent useTTS from hanging.
- Web uses `blob URL + HTMLAudioElement` (expo-av base64 fails in browser for large audio)
- Native uses `expo-av` with base64 data URI
- Speed range: 0.7 (slow) – 1.2 (fast per docs, 1.25 also works in turbo). Default 1.0.
- Voice IDs to revisit:
  - `eYO9Ven76ACQ8Me4zQK4` — Valentyna: soft and calm, but Ukrainian accent
  - `SAz9YHcvj6GT2YYXdXww` — River: neutral, American, relaxed (current)
  - `XrExE9yKIg1WjnnlVkGX` — Matilda: professional, American (not fine-tuned for turbo v2.5)
  - `EXAVITQu4vr4xnSDxMaL` — Sarah: mature, reassuring (older model, no fine-tuning)
