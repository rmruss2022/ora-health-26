# Phase 2: Frontend Implementation

**CRITICAL: Use the `frontend-design` plugin for ALL UI work.**

The frontend-design plugin helps with:
- Component structure and naming
- React Native best practices
- Ora design system consistency
- Animation patterns (Reanimated, Skia)

## Prerequisites
- Backend Phase 1 complete (collective-session.service.ts, API routes, WebSocket events)
- Backend running and tested

## Tasks

### 1. CollectiveSessionScreen (New Component)

**Location:** `ora-ai/src/screens/CollectiveSessionScreen.tsx`

**Ask frontend-design plugin to scaffold:**
- Full-screen breathing animation (Reanimated or Skia)
- Live participant count (WebSocket updates)
- Session timer (synchronized across users)
- Post-session modal: "How do you feel?" with emoji picker
- Use Ora's color palette (forest green #1d473e, lavender #D4B8E8)

**Key Requirements:**
- Pulsing circle animation (expand/contract with breathing rhythm)
- Smooth color transitions (forest green → lavender → cream)
- Real-time participant count updates via WebSocket
- Clean, minimal UI (no clutter)

### 2. Enhance MeditationScreen (Modify Existing)

**Location:** `ora-ai/src/screens/MeditationScreen.tsx`

**Ask frontend-design plugin to add:**
- Top card: "Join Collective Session" when session is active
- Shows: participant count, time until start, "Join" button
- Keeps existing meditation library below (don't remove anything)

### 3. DailyReflectionScreen (New Component)

**Location:** `ora-ai/src/screens/DailyReflectionScreen.tsx`

**Ask frontend-design plugin to scaffold:**
- Full-screen prompt display (clean typography)
- Multi-line text input for response
- Toggle: "Share with community" (off by default)
- After saving: show 3 random community responses
- Use Ora typography system (Sentient font family)

### 4. Integration Testing

**Use frontend-design plugin to help with:**
- Navigation flow (MeditationScreen → CollectiveSessionScreen → DailyReflectionScreen)
- WebSocket connection management
- State management (participant counts, session status)

## Visual Guidelines (Enforce These)

**Color Palette (from Ora theme):**
- Primary: #1d473e (forest green)
- Secondary: #D4B8E8 (lavender)
- Background: #F5F1E8 (warm cream)
- Text: #2D2D2D (charcoal)

**Animations:**
- Breathing circle: 4 second cycle (2s expand, 2s contract)
- Color transitions: smooth, organic (not mechanical)
- Particle effects: subtle, slow-moving

**Typography:**
- Use `theme.typography` (Sentient family)
- Hierarchy: display1 for prompts, body1 for descriptions

## Testing Checklist

- [ ] CollectiveSessionScreen loads and shows participant count
- [ ] Breathing animation runs smoothly (60fps)
- [ ] WebSocket updates participant count in real-time
- [ ] Post-session modal appears after timer ends
- [ ] DailyReflectionScreen displays prompt correctly
- [ ] Reflection responses can be saved (private or public)
- [ ] MeditationScreen shows collective session card when active
- [ ] Navigation flows work end-to-end

## When Complete

Run:
```bash
openclaw system event --text "Collective meditation frontend complete. End-to-end flow tested." --mode now
```

---

**Remember:** Always use the `frontend-design` plugin for component scaffolding, styling, and animation patterns. It knows Ora's design system and React Native best practices.
