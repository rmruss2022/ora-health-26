# Ora Agent — Agentic Functionality Implementation Plan

## Vision

Ora is not a chatbot you open when you need something. Ora is a presence that travels with you through the entire app — greeting you, noticing your patterns, knowing where you are in your wellness journey, and connecting you to a community of people doing the same work. The agent feels like a close friend who happens to be a therapist, a meditation teacher, and someone who genuinely remembers everything you've shared.

The goal: users feel held and primed throughout their day — inside the app and through notifications — so that the tools they're learning (meditation, journaling, breathwork, reflection) are top of mind, and the community around them feels alive and worth engaging with.

---

## Core Principles

- **Continuity** — Ora remembers. Every screen entry, every chat, every dismissed bubble is context. The agent's tone shifts based on time of day, the user's mood history, their current program progress, and what they last did in the app.
- **Presence without intrusion** — Ora speaks first, then waits. The agent is never in the way. When dismissed, it retreats to the orb. It never repeats itself the same way twice.
- **Warmth over polish** — Messages feel personal, not scripted. Short sentences. Gentle questions. Ora never lectures.
- **Community as connection, not metric** — Ora frames community engagement as human warmth, not gamification. "Someone wrote to you" not "You have 1 unread."

---

## Screen-by-Screen Behaviour

### Home Screen
**Trigger:** Every time user lands on Home (tab press, app open, back from sub-screen).

**Behaviour:**
- FloatingAuraAgent opens expanded with a time- and context-aware greeting.
- TTS auto-plays after 1.2s (or on first interaction on cold web load).
- Message is dynamic — not the same every visit. It cycles through:
  - Morning affirmation + suggested first action
  - Midday check-in + gentle nudge toward a tool they've been using
  - Evening reflection prompt + week-in-review if Sunday
  - Post-meditation acknowledgement ("How was that session?") if user just completed a timer
  - Post-notification-tap context ("You opened this — that's the first step.")
- After 3 visits in one day, the bubble still opens but TTS does not auto-play (prevents fatigue).
- `seenToday` gate (already implemented) controls first-daily auto-speak. Extend to track visit count per day for fatigue management.

**Message sources (priority order):**
1. Post-action context (just finished meditation, just joined a room)
2. Notification follow-through (user tapped a push notification)
3. Streak/milestone awareness ("Day 3 — you're building something real")
4. Time-of-day defaults (current implementation)

---

### Community Screen
**Trigger:** Every time user lands on Community tab.

**Behaviour:**
- FloatingAuraAgent opens with community-specific context.
- TTS auto-plays (same seen-today gate, separate key `@ora:aura-seen:community`).
- Message is aware of:
  - Unread letters or replies ("Someone replied to your letter from Tuesday")
  - Recent community activity in rooms the user has joined
  - Whether the user has posted recently ("It's been a few days since you shared anything")
  - Prompt to write a letter if they haven't in a while
- After opening, the bubble stays available — user can tap orb to re-read/re-hear at any time.

**Community-specific message examples:**
- "Three people resonated with what you shared yesterday. Your words matter here."
- "There's a new letter in The Commons — someone wrote about exactly what you mentioned last week."
- "You haven't posted in a few days. Even a sentence helps someone feel less alone."
- "The Forest Nest room has been active this morning. Five people are meditating together right now."

---

### Chat Screen
**Trigger:** Every time user opens the Chat tab.

**Behaviour:**
1. A small chat bubble animates in from the bottom (300ms slide-up, 200ms fade) showing "Ora is here..." or a persona-specific opener.
2. After 1.5s, Ora sends the first message automatically into the chat thread.
3. That first message is spoken via TTS immediately (no user action needed, or on first click if autoplay blocked).
4. The intro message is context-aware — not just "Hi, how are you?" but something specific:
   - If user has an active behaviour program: references it ("You're on Day 4 of Cleansing & Deep Breathing — how's your body feeling today?")
   - If user came from a meditation session: follows up ("You just spent 10 minutes in the Forest Nest. What came up for you?")
   - If it's morning and user hasn't journaled: gentle prompt ("Morning. What's one thing on your mind before the day starts?")
   - If the user has been away for >2 days: warm re-entry ("Welcome back. No pressure — we can start wherever feels right.")
5. The intro is NOT sent if there are already messages in the current session (don't interrupt an active conversation).

**Implementation notes:**
- Track `chatIntroSent` per-session (in-memory, reset on app restart) so it only fires once per chat session.
- Persona intro messages are different per persona (Ora, Sage, Dr. Avery).
- The auto-first-message goes through the normal chat pipeline so it appears in history and the user can respond naturally.

---

## User Profile & Memory

The agent's power comes from what it remembers. This requires a structured user profile that grows over time.

### Data to Track (stored in backend + cached locally)

```
UserAgentProfile {
  // Wellness state
  currentProgram: string           // e.g. "Cleansing & Deep Breathing"
  programDay: number               // Day 4 of 7
  lastMeditationAt: timestamp
  lastMeditationRoom: string
  meditationStreakDays: number
  totalSessionsCompleted: number

  // Emotional/mental signals
  lastMoodCheckin: { score: 1-5, note: string, timestamp }
  recentJournalThemes: string[]    // extracted keywords from journal entries
  frequentConcerns: string[]       // ["anxiety", "sleep", "self-criticism"]

  // App engagement
  lastAppOpen: timestamp
  daysSinceLastVisit: number
  screenVisitCounts: { home, chat, community }  // per day
  notificationsEngaged: number     // how many push notifications led to app opens

  // Community
  lastLetterWrittenAt: timestamp
  lastLetterReceivedAt: timestamp
  roomsJoined: string[]
  communityPostCount: number

  // Preferences
  preferredMeditationTime: 'morning' | 'midday' | 'evening'
  ttsEnabled: boolean
  notificationsEnabled: boolean
}
```

### How the Agent Uses This

The agent prompt (sent to Claude/AI backend) is prefixed with a compact context block built from this profile:

```
[Agent Context]
User: Matthew | Day 4 streak | Last session: Forest Nest (yesterday 9pm)
Program: Cleansing & Deep Breathing, Day 4/7
Recent themes: sleep quality, work stress
Community: 2 unread letters, last post 5 days ago
Time: Wednesday morning, 7:42am
Screen: Home

Generate a warm, personal greeting (2 sentences max). Reference something specific. Ask one gentle question or suggest one action.
```

---

## Push Notifications

Notifications are the agent reaching out proactively — not pinging for engagement but genuinely checking in.

### Notification Types

#### 1. Daily Morning Prime (8–9am, user's local time)
Reminds the user of their intention for the day. References their program or streak.

Examples:
- "Day 5. Box breathing takes 4 minutes. You've done harder things."
- "Good morning, Matthew. Your affirmation today: 'I am kind to myself.'"
- "The Forest Nest is quiet this morning. A good time for 5 minutes."

#### 2. Midday Tool Reminder (12–1pm)
A micro-prompt to use a skill they've been learning — without requiring them to open the app.

Examples:
- "Quick reset: 4 counts in, hold 4, out 4, hold 4. That's it."
- "One minute of slow breathing right now will change the rest of your afternoon."
- "How's your nervous system? A body scan takes 2 minutes."

#### 3. Community Nudge (when triggered by activity)
Sent when something relevant happens in the community — not on a fixed schedule.

Examples:
- "Someone resonated with your letter from Tuesday."
- "Three people are meditating in The Commons right now."
- "A new letter arrived that you might connect with."

#### 4. Evening Reflection (8–9pm)
Closes the loop on the day. References what the user did (or didn't do).

Examples:
- "You meditated this morning. Tonight: one sentence about how the day felt."
- "You skipped today — that's okay. Tomorrow starts fresh. Rest well."
- "Sunday reflection: three things that went well this week?"

#### 5. Re-engagement (after 2+ days away)
Gentle, no guilt. Just warmth.

Examples:
- "Hey. No pressure. Just checking in."
- "It's been a few days. Your space here is exactly as you left it."
- "Whenever you're ready. We're here."

### Notification Infrastructure
- Use `expo-notifications` (already installed) for scheduling and delivery.
- Generate notification copy dynamically using the AI backend so messages never feel templated.
- Store notification history to avoid repetition — never send the same message twice.
- Respect quiet hours (10pm–7am by default, user-configurable).
- Cap at 2 notifications per day to prevent fatigue.
- Track tap-through rate to learn which messages resonate.

---

## Agent Personality & Voice

### Core Traits
- **Present** — Speaks about right now, not abstract future outcomes.
- **Specific** — References real details from the user's life in the app.
- **Brief** — 1–3 sentences max for orb/notification messages. Never a wall of text.
- **Non-prescriptive** — Suggests, never commands. "You might want to..." not "You should..."
- **Emotionally attuned** — Matches energy to time of day and user's recent emotional signals.

### Persona Variants
Each chat persona has a slightly different voice, but all share the above traits:

| Persona | Voice Style | When It Shines |
|---|---|---|
| **Ora** (floating agent) | Warm, poetic, observational | Greetings, orb messages, notifications |
| **Sage** | Curious, direct, a little playful | Active chat, journaling prompts |
| **Dr. Avery** | Calm, grounded, clinical warmth | Deep emotional work, anxiety, sleep |

---

## Implementation Phases

### Phase 1 — Context-Aware Greetings (immediate)
- [ ] Extend `getContextualMessage()` to pull from `UserAgentProfile` instead of just time-of-day
- [ ] Build `useAgentContext` hook that assembles the context block from local storage + API
- [ ] Home and Community FloatingAuraAgent use dynamic AI-generated messages (one API call on focus, cached for the session)
- [ ] Track visit count per day to manage TTS fatigue (>3 visits = no auto-play)

### Phase 2 — Chat Screen Auto-Opener
- [ ] `ChatScreen` detects first mount of session and triggers Ora's opening message
- [ ] Opening message generated by AI backend using agent context block
- [ ] Auto-TTS on first message (already wired — just needs the trigger)
- [ ] `chatIntroSent` session flag prevents re-trigger within same session

### Phase 3 — User Profile & Memory
- [ ] `UserAgentProfile` schema defined and added to backend user model
- [ ] Events tracked: meditation complete, room join/leave, letter sent/received, chat message, app open
- [ ] `GET /api/agent/context` endpoint returns compiled context block for the authenticated user
- [ ] Local AsyncStorage cache of profile — updated on each app open, stale after 5 minutes

### Phase 4 — Push Notifications
- [ ] Notification scheduling service (`NotificationService.ts`) using `expo-notifications`
- [ ] 5 notification types implemented (morning prime, midday tool, community nudge, evening reflection, re-engagement)
- [ ] Copy generated by AI backend at schedule time (not hardcoded)
- [ ] Notification preference screen (quiet hours, frequency, type toggles)
- [ ] Tap-through routing — notification taps deep-link to the relevant screen with context passed as params

### Phase 5 — Community Integration
- [ ] Community activity feed drives real-time agent messages ("someone resonated with your post")
- [ ] Ora surfaces relevant letters and community moments on the Community screen
- [ ] Room presence awareness — agent knows who's meditating right now and mentions it
- [ ] Letter prompts — if user hasn't written in 5+ days, agent gently suggests it

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                      │
│  useAgentContext()  ←──── AsyncStorage cache         │
│         │                                            │
│         ▼                                            │
│  FloatingAuraAgent  ChatScreen  NotificationService  │
│         │                │              │            │
└─────────┼────────────────┼──────────────┼────────────┘
          │                │              │
          ▼                ▼              ▼
┌─────────────────────────────────────────────────────┐
│                    Backend API                       │
│                                                      │
│  GET /api/agent/context   ← UserAgentProfile        │
│  POST /api/agent/message  ← generates AI response   │
│  POST /api/agent/notify   ← schedules notification  │
│                                                      │
│  Events tracked:                                     │
│    POST /api/agent/events  { type, metadata }        │
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│   Claude API        │
│   (Anthropic)       │
│                     │
│  Context block →    │
│  Warm, specific,    │
│  brief message      │
└─────────────────────┘
```

---

## Success Metrics

- **TTS engagement rate** — % of sessions where user lets Ora finish speaking (vs. stopping immediately)
- **Return rate from notifications** — % of push notifications that lead to a 2+ minute session
- **Chat session depth** — average messages per chat session (target: Ora's opener leads to real conversation)
- **Community post frequency** — does agent nudging increase letter writing and room joins?
- **7-day retention** — do users who engage with the agent return more consistently?
- **Qualitative** — does it feel like a companion, or does it feel like a feature?

---

## Open Questions

1. **Message freshness** — AI-generated messages per visit vs. a curated library rotated by algorithm? AI is more personal but adds latency. Hybrid: generate async on previous visit and cache for next.
2. **Opt-out granularity** — Should users be able to disable orb messages, TTS, and notifications independently? Probably yes.
3. **Emotional safety** — If a user signals distress (in chat or journal), how does Ora respond? Need a clear escalation path and "Dr. Avery mode" for sensitive conversations.
4. **Agent identity** — Is Ora a single entity or does the persona (Sage/Dr. Avery/Ora) carry through all agent touchpoints? Recommend: Ora is the persistent presence (orb/notifications), other personas are chat-only.
5. **Privacy** — All profile data stays on-device and on the user's account. No sharing. Be explicit in onboarding about what Ora remembers and why.
