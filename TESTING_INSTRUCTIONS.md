# Testing Instructions - MANDATORY

**CRITICAL: All testing MUST use browser automation for end-to-end validation.**

## Phase 1: Backend Testing (Current Phase)

### API Testing via Browser
After backend implementation is complete, DO NOT just use curl. Instead:

1. **Start the backend:**
   ```bash
   cd ora-ai-api && npm run dev
   ```

2. **Use browser to test API endpoints:**
   - Open browser to http://localhost:3000/api/collective/sessions/active
   - Verify JSON response
   - Test POST endpoints using browser dev tools console:
     ```javascript
     fetch('http://localhost:3000/api/collective/sessions', {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({scheduledTime: new Date(), duration: 10})
     }).then(r => r.json()).then(console.log)
     ```

3. **Verify database writes:**
   - Check PostgreSQL database for inserted records
   - Confirm WebSocket events are firing

## Phase 2: Frontend Testing (After Frontend is Built)

### MANDATORY Browser-Based E2E Testing

**DO NOT rely on React Native simulator screenshots or console logs.**

Instead, use browser automation to:

### 1. Start the App
```bash
# Terminal 1: Backend
cd ora-ai-api && npm run dev

# Terminal 2: Frontend  
cd ora-ai && npm start
```

### 2. Use Browser Tool for E2E Flow

**Test Scenario 1: Join Collective Session**
```
browser action:open targetUrl:"http://localhost:19006"
browser action:snapshot  # Capture initial state
browser action:act request:{"kind":"click","ref":"join-session-button"}
browser action:snapshot  # Verify session screen loaded
# Verify participant count updates
# Verify breathing animation is running
```

**Test Scenario 2: Complete Meditation Session**
```
# Wait for timer to complete (or fast-forward if possible)
browser action:act request:{"kind":"wait","timeMs":10000}
browser action:snapshot  # Check for post-session modal
browser action:act request:{"kind":"click","ref":"calm-emoji"}  # Select feeling
browser action:snapshot  # Verify response saved
```

**Test Scenario 3: Daily Reflection**
```
browser action:act request:{"kind":"click","ref":"daily-reflection"}
browser action:snapshot  # Verify prompt displayed
browser action:act request:{"kind":"type","ref":"reflection-input","text":"Test reflection response"}
browser action:act request:{"kind":"click","ref":"save-button"}
browser action:snapshot  # Verify saved, show community responses
```

**Test Scenario 4: Community Feed Integration**
```
browser action:act request:{"kind":"click","ref":"community-tab"}
browser action:snapshot  # Verify meditation posts appear
# Check for meditation check-ins
# Verify reactions work
```

### 3. Visual Validation

Use browser snapshots to verify:
- [ ] Colors match Ora palette (forest green #1d473e, lavender #D4B8E8)
- [ ] Breathing animation is smooth and visible
- [ ] Participant count updates in real-time
- [ ] Typography uses Sentient font family
- [ ] Layouts are clean and uncluttered

### 4. WebSocket Testing

Use browser console to verify WebSocket events:
```javascript
// In browser dev tools
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (msg) => console.log('WS Event:', msg.data);
// Join session and verify events fire:
// - collective:user-joined
// - collective:participant-count
```

## Testing Checklist (Use Browser for ALL)

### Backend Phase
- [ ] Browser test: GET /api/collective/sessions/active returns empty/session
- [ ] Browser test: POST /api/collective/sessions creates session
- [ ] Browser test: POST /api/collective/sessions/:id/join adds participant
- [ ] Browser test: WebSocket events fire on join/leave
- [ ] Database inspection: Records exist in collective_sessions table

### Frontend Phase  
- [ ] Browser E2E: Open app, see collective session card
- [ ] Browser E2E: Click "Join Session", breathing animation starts
- [ ] Browser E2E: Participant count updates when others join (simulate with multiple tabs)
- [ ] Browser E2E: Timer completes, post-session modal appears
- [ ] Browser E2E: Select emoji, verify response saved
- [ ] Browser E2E: Open daily reflection, type answer, save
- [ ] Browser E2E: See community responses after saving
- [ ] Browser E2E: Navigate to community feed, see meditation posts
- [ ] Browser visual: Screenshot breathing animation (verify colors/smoothness)
- [ ] Browser visual: Screenshot all new screens for design review

## Automation Script Template

When testing, create a script like this:

```bash
#!/bin/bash
# test-collective-meditation.sh

echo "Starting backend..."
cd ora-ai-api && npm run dev &
BACKEND_PID=$!

echo "Starting frontend..."
cd ora-ai && npm start &
FRONTEND_PID=$!

sleep 10  # Wait for startup

echo "Running browser tests..."
# Use browser tool commands here
browser action:open targetUrl:"http://localhost:19006"
browser action:snapshot
# ... more test steps

echo "Tests complete. Killing processes..."
kill $BACKEND_PID $FRONTEND_PID
```

## Success Criteria

**DO NOT mark testing complete until:**
1. Browser automation has validated all flows end-to-end
2. Screenshots prove UI matches design spec
3. WebSocket events verified in browser console
4. Participant counts update live (tested with multiple browser tabs)
5. All animations are smooth and visible in browser
6. Community feed shows meditation posts correctly

**No shortcuts. No "it should work." Browser proof required.**
