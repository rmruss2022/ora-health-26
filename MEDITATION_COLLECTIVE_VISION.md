# Meditation Collective - Ora Health Enhancement

**Last Updated:** 2026-02-24  
**Status:** Ready for Implementation  
**Target:** Enhance existing Ora Health meditation features

---

## Core Concept

Transform Ora's meditation experience into **collective practice** - synchronized sessions where people meditate together, creating community momentum without guilt or performance metrics.

Think Open's "everyone gets prompted at once" vibe, but for meditation. Not replacing what Ora has - enhancing it with real-time community presence.

---

## Visual Aesthetic (Ora-Aligned)

### Ora's Existing Design System
**Current Palette (maintain consistency):**
- **Primary:** Ora Forest Green (#1d473e) - deep, grounding
- **Secondary:** Lavender (#D4B8E8) - soft, spiritual
- **Backgrounds:** Warm creams (#F5F1E8, #FAF8F3)
- **Text:** Charcoal (#2D2D2D)

### New Meditation Collective Aesthetic
**Enhance, don't replace:**
- **Background:** Ora's warm cream backgrounds
- **Accents:** Deeper lavender (#b894d4) for meditation-specific UI
- **Visual Effects:** 
  - Pulsing gradients (forest green → lavender) during sessions
  - Subtle particle effects (floating, breathing)
  - Organic shapes that breathe with timer
- **Typography:** Use Ora's existing system (Sentient family)

### Touch Designer-Inspired Elements
- **Breathing circles:** Expand/contract with meditation timer
- **Particle fields:** Gentle, slow-moving (like dust in sunlight)
- **Color transitions:** Forest green → lavender → cream (breathing rhythm)
- **Noise overlays:** Subtle grain for warmth, not harsh

**Vibe:** Warm forest temple, not cold wireframe. Grounded, not brutalist.

---

## Architecture: Enhance Existing Ora Screens

### Current State (What Exists)
**Frontend (`ora-ai/src/screens/`):**
- ✅ `MeditationScreen.tsx` - meditation library with categories
- ✅ `MeditationTimerScreen.tsx` - solo meditation timer
- ✅ `CommunityScreen.tsx` - community feed

**Backend (`ora-ai-api/src/services/`):**
- ✅ `meditation.service.ts` - sessions tracking
- ✅ `websocket.service.ts` - real-time updates
- ✅ `push-notification.service.ts` - notifications
- ✅ `community.service.ts` - community posts

### New Components to Build

**1. CollectiveSessionScreen** (New)
- Shows live participant count
- Breathing visual synchronized across all users
- Post-session check-in (emoji + optional text)
- Transition to daily reflection prompt

**2. Enhance MeditationScreen** (Modify Existing)
- Add "Join Collective Session" card at top when active
- Show "Next session starts in: 14 min"
- Keep existing solo meditation library below

**3. DailyReflectionScreen** (New)
- Daily prompt (same for everyone)
- Answer privately or share to community
- See random community responses (3-5)
- Part of meditation flow, not separate feature

**4. Meditation Community Feed** (Enhance Existing)
- Add meditation-specific posts to existing CommunityScreen
- Filter: "Meditation check-ins"
- Simple reactions: ✨ 🙏 🌊 (no counts displayed)

---

## Core Features (Implementation Spec)

### 1. Collective Sessions (Real-Time)

**Backend:**
```typescript
// Add to meditation.service.ts
class CollectiveSession {
  id: string;
  scheduledTime: Date;
  durationMinutes: number;
  activeParticipants: Set<string>; // userId set
  startedAt?: Date;
  endedAt?: Date;
}

// WebSocket events (via websocket.service.ts)
- 'collective:session-starting' (5 min warning)
- 'collective:session-started' (begin now)
- 'collective:user-joined' (someone joined)
- 'collective:user-left' (someone left)
- 'collective:session-ended' (session complete)
```

**Frontend:**
```typescript
// CollectiveSessionScreen.tsx
- Display participant count (live updates via WebSocket)
- Breathing animation (React Native Skia or Reanimated)
- Session timer (synchronized)
- Post-session modal: "How do you feel?" (emoji picker)
```

**Push Notifications:**
- "🌅 200 people meditating in 5 minutes. Join?"
- Scheduled sessions: 7:00 AM, 12:00 PM, 6:00 PM, 9:00 PM (user timezone)
- User can customize times or disable

### 2. Daily Reflection Prompts

**Backend:**
```typescript
// Add to ora-ai-api/src/services/reflection.service.ts
interface DailyPrompt {
  id: string;
  date: Date;
  question: string;
  category: 'introspection' | 'gratitude' | 'intention';
}

interface ReflectionResponse {
  id: string;
  userId: string;
  promptId: string;
  response: string;
  isPublic: boolean;
  createdAt: Date;
}
```

**Frontend:**
```typescript
// DailyReflectionScreen.tsx
- Show today's prompt (full screen, clean)
- Text input (multi-line)
- Toggle: "Share with community" (off by default)
- Button: "Save" (saves private) / "Save & Share" (public)
- After saving: show 3 random community responses
```

**Prompt Examples:**
- "What are you carrying today that isn't yours?"
- "Where did you feel most alive this week?"
- "What would you do if you weren't afraid?"
- "What made you smile today?"
- "What do you need to forgive yourself for?"

### 3. Community Integration

**Enhance Existing CommunityScreen:**
- Add "Meditation" filter tab
- Show posts: "Sarah meditated 10 min. First time in a month. ✨"
- Show reflection responses (if user made them public)
- Simple reactions (no like counts)

**Post Types:**
```typescript
type MeditationPost = {
  type: 'meditation-session' | 'reflection-response';
  userId: string;
  content: string;
  emoji?: string; // post-session feeling
  meditationDuration?: number;
  createdAt: Date;
}
```

### 4. Enhanced MeditationScreen

**Top Section (New):**
```
┌─────────────────────────────────────┐
│  🌅 Next Collective Session         │
│  Starts in: 14 minutes              │
│  87 people joining                  │
│                                     │
│  [Join Session] [Set Reminder]      │
└─────────────────────────────────────┘
```

**Below:** Keep existing categories and meditation library (unchanged)

---

## User Flow (Complete Journey)

### Onboarding (First Time)
1. User opens Meditation tab → sees "Join Collective Meditation" card
2. Tap → Explainer: "Meditate with others, no pressure, just presence"
3. "Choose your notification times" → picks 2-3 slots (or skip)
4. First collective session starts immediately (5 min intro)

### Daily Experience

**Morning (7:00 AM):**
1. Push notification: "🌅 147 people meditating in 5 minutes. Join?"
2. User taps → CollectiveSessionScreen opens
3. Countdown: "Starting in 2 min... 93 people here"
4. Session begins: breathing animation, participant count updates live
5. 10 minutes later: "How do you feel?" → tap emoji: 🌊 calm
6. Optional: "Share your session?" → creates post in community
7. Transition: "Today's reflection: What are you grateful for?"
8. User types response → chooses "Keep Private" → Done

**Evening (6:00 PM):**
1. Notification: "🌙 Next session in 5 minutes"
2. User doesn't join this time → no guilt, no streak broken
3. Later: Opens Meditation tab → sees "248 people meditated at 6pm"
4. Option: "Start solo session instead" → uses existing MeditationTimerScreen

**Night (Before Bed):**
1. Opens app → sees daily reflection prompt unanswered
2. "What made you smile today?" → types answer
3. "Share with community" toggle → turns ON
4. Saves → sees 3 community responses instantly
5. Reads responses, reacts with ✨ on one, scrolls on

---

## Technical Implementation

### Database Schema (PostgreSQL via ora-ai-api)

```sql
-- Collective sessions
CREATE TABLE collective_sessions (
  id UUID PRIMARY KEY,
  scheduled_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  participant_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session participants
CREATE TABLE collective_participants (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES collective_sessions(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  post_session_emoji TEXT
);

-- Daily prompts
CREATE TABLE daily_prompts (
  id UUID PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  question TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reflection responses
CREATE TABLE reflection_responses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  prompt_id UUID REFERENCES daily_prompts(id),
  response TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);
```

### Frontend Stack
- **React Native** (existing)
- **React Native Reanimated** (for breathing animations)
- **React Native Skia** (for particle effects, generative visuals)
- **WebSocket** (via existing websocket.service.ts)
- **Push Notifications** (via existing push-notification.service.ts)

### Backend Services to Create
1. `collective-session.service.ts` - manage sessions, participants
2. `reflection.service.ts` - daily prompts, responses
3. WebSocket event handlers for real-time session updates

### Testing Plan
1. **Start backend:** `cd ora-ai-api && npm run dev`
2. **Start frontend:** `cd ora-ai && npm start`
3. **Test flows:**
   - Create collective session via API
   - Join session via app
   - See live participant count update
   - Complete session → post-session check-in
   - Answer daily reflection
   - Share reflection → appears in community feed
4. **Visual validation:** Breathing animations feel alive, not mechanical

---

## Why This Works for Ora

### Alignment with Ora's Mission
- **Community wellness:** Not just tracking, but connecting
- **Authentic presence:** Anti-performative, no metrics theater
- **Daily practice:** Meditation + reflection = holistic mental health
- **Gentle accountability:** Show up because others are, not because you "should"

### Differentiation
- **Calm/Headspace:** Solo, transactional, no community momentum
- **Insight Timer:** Social but performative (streaks, badges, leaderboards)
- **Ora + Collective:** Real-time community, zero judgment, organic motivation

### Retention Mechanics
- **Pull, not push:** Notifications show how many people are joining (FOMO that's healthy)
- **No guilt:** Miss a session? Next one is in 4 hours
- **Variable reward:** Daily prompts keep it fresh
- **Social proof:** "Sarah meditated at 3am" → I'm not the only night owl

---

## Development Phases

### Phase 1: Core Collective Sessions (Week 1)
- [ ] Backend: collective-session.service.ts, WebSocket events
- [ ] Frontend: CollectiveSessionScreen with live count
- [ ] Simple breathing animation (circle pulse)
- [ ] Post-session emoji check-in
- [ ] Push notifications for session starts

### Phase 2: Daily Reflections (Week 1-2)
- [ ] Backend: reflection.service.ts, daily prompt seeding
- [ ] Frontend: DailyReflectionScreen
- [ ] Integration: show prompt after collective session
- [ ] Community feed: display public reflections

### Phase 3: Visual Polish (Week 2)
- [ ] Touch Designer-style breathing visuals (Skia)
- [ ] Particle effects during meditation
- [ ] Color transitions (forest green → lavender)
- [ ] Smooth animations throughout

### Phase 4: Integration & Testing (Week 2-3)
- [ ] Enhance MeditationScreen with collective session card
- [ ] Integrate reflection feed into CommunityScreen
- [ ] End-to-end testing with real users
- [ ] Push notification fine-tuning
- [ ] Performance optimization

### Phase 5: Launch Prep (Week 3)
- [ ] Onboarding flow for first-time users
- [ ] App Store screenshots + copy
- [ ] Beta test with 20-30 users
- [ ] Iterate based on feedback
- [ ] Production deployment

---

## Success Metrics (Non-Performative)

**Don't track:**
- Streaks (creates guilt)
- Total minutes (performative)
- Leaderboards (competitive, not communal)

**Do track (internal analytics only):**
- Collective session participation rate
- Daily reflection response rate
- Community feed engagement (reads, not just reactions)
- Notification open rate (optimize timing)
- Retention: Do people come back after missing days?

**Qualitative signals:**
- User testimonials: "I actually showed up because I saw others were"
- Support messages: "This feels different from other meditation apps"
- Community vibe: Are reflections thoughtful, not performative?

---

## Open Questions (Resolve During Build)

1. **Session scheduling:**
   - Fixed times (7am, 12pm, 6pm, 9pm) or dynamic?
   - User-customizable or app-wide?

2. **Guided vs. Silent:**
   - Collective sessions: silent timer only?
   - Or optional ambient soundscapes (rain, forest sounds)?
   - Decision: Start with silence, add soundscapes later

3. **Anonymity:**
   - Community reflections: show username or anonymous?
   - Decision: Username by default, toggle for anonymous responses

4. **Moderation:**
   - Daily reflections can get heavy/dark
   - Auto-flag keywords? Human review? Community flags?
   - Decision: Start with community flags, add AI moderation if needed

5. **Onboarding:**
   - 5-min intro session for first-timers?
   - Or just throw them into the next collective session?
   - Decision: Quick explainer (30 sec) → immediate first session

---

## Why This Matters

Meditation apps are lonely. Even the "social" ones feel transactional.

Ora has the foundation: community, wellness, authentic connection.

Adding collective meditation transforms practice from **solo obligation** into **shared presence**.

You're not meditating because you should.  
You're meditating because 200 other people are sitting down *right now*.

That's the difference between an app you delete and a habit you keep.

---

**Next Steps for Agent:**
1. Read existing Ora codebase (especially meditation screens, services, theme)
2. Create backend services (collective-session.service.ts, reflection.service.ts)
3. Build CollectiveSessionScreen with live WebSocket updates
4. Implement breathing animations (React Native Skia)
5. Create DailyReflectionScreen
6. Integrate with existing CommunityScreen
7. Add push notifications
8. Test end-to-end flow repeatedly
9. Polish visuals until they feel *alive*
10. Notify when complete: `openclaw system event --text "Meditation Collective: Implementation complete. Features live and tested." --mode now`
