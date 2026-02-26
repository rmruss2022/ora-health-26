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
**Status:** Active → adjusting speed

---

### Attempt 3 — Speed up + turbo model + auto-play fix (current)
| Persona | Voice | Voice ID |
|---|---|---|
| Ora / aura | Valentyna | `eYO9Ven76ACQ8Me4zQK4` |
| Sage | Lily | `pFZP5JQG7iQjIQuC4Bku` |
| Dr. Avery | Jen | `BL7YSL1bAkmW8U0JnU8o` |

**Settings:** `stability: 0.65, similarity_boost: 0.75, speed: 1.15`
**Model:** `eleven_turbo_v2_5` (better latency, supports speed param)
**Changes:** +speed param, model upgrade, web audio blob fix, auto-play on load
**Feedback:** TBD

---

## Notes
- Browser autoplay is blocked on cold page load (no prior user gesture). Auto-play works after any navigation interaction.
- Web uses `blob URL + HTMLAudioElement` (expo-av base64 fails in browser for large audio)
- Native uses `expo-av` with base64 data URI
- Speed range: 0.7 (slow) – 1.2 (fast). Default 1.0.
