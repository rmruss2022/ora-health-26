# Home Screen Redesign - Room-Based Meditation

## 🎨 Vision
Transform the Home screen into a social meditation hub where users can join themed rooms, see who's meditating, and access their meditation library - all in one place.

## 🏗️ New Structure

```
HomeScreen (ScrollView)
├─ Header
│  ├─ Time display
│  ├─ "Hi Matthew"
│  └─ Badges (trophies, streak counter)
│
├─ Streak Calendar (Mon-Sun grid with circles)
│
├─ Affirmation Card
│  ├─ Mindset: "Self Compassion"
│  ├─ Day counter (0/7)
│  └─ Today's affirmation
│
├─ Recommendations Section
│  ├─ "Here's your recommendations"
│  └─ Featured room card (personalized)
│
├─ Meditation Rooms Section
│  ├─ "Meditation Rooms" heading
│  ├─ Grid of 4 themed rooms
│  │  ├─ The Commons (main hangout)
│  │  ├─ Tide Pool (mindfulness & grounding)
│  │  ├─ Starlit Clearing (evening meditation)
│  │  └─ Forest Nest (nature & renewal)
│  └─ Solo Sanctuary card (always available)
│
└─ Your Meditations Section
   ├─ "Your Meditations" heading
   ├─ Filter button (top-right)
   └─ Meditation list (scrollable cards)
```

## 🏠 Room Details

### The Commons
- **Theme**: General meditation hangout
- **Tags**: Community, Open, Welcoming
- **Icon**: 🏛️ or ☀️
- **Description**: "Join others in the main meditation space"
- **Always open**: Yes

### Tide Pool
- **Theme**: Ocean/water meditation
- **Tags**: Mindfulness, Grounding, Calm
- **Icon**: 🌊
- **Description**: "Find calm in the gentle rhythm of waves"
- **Gradient**: Blue to teal

### Starlit Clearing
- **Theme**: Evening/night meditation
- **Tags**: Evening, Peace, Reflection
- **Icon**: ⭐
- **Description**: "Meditate under the stars"
- **Gradient**: Deep purple to midnight blue

### Forest Nest
- **Theme**: Nature meditation
- **Tags**: Nature, Renewal, Growth
- **Icon**: 🌲
- **Description**: "Ground yourself in nature's embrace"
- **Gradient**: Forest green to sage

### Solo Sanctuary
- **Theme**: Private meditation
- **Tags**: Solo, Focus, Privacy
- **Icon**: 🕯️
- **Description**: "Your personal meditation space"
- **Special**: Always shows 1 participant (you)

## 📊 Data Structures

### Room Model (Backend)
```typescript
interface MeditationRoom {
  id: string;
  name: string;
  description: string;
  theme: string; // 'commons' | 'tide-pool' | 'starlit' | 'forest' | 'solo'
  icon: string;
  tags: string[];
  gradientColors: string[]; // [start, end]
  currentParticipants: number;
  participants: Participant[];
  isActive: boolean;
  createdAt: Date;
}

interface Participant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: Date;
}
```

### Filter Options
```typescript
interface MeditationFilters {
  duration?: number[]; // [5, 10, 15, 20]
  category?: string[]; // ['breathwork', 'body-scan', 'loving-kindness']
  mood?: string[]; // ['calm', 'energize', 'focus', 'ground']
  difficulty?: string; // 'beginner' | 'intermediate' | 'advanced'
}
```

## 🎨 Design Specs

### Colors (Existing Ora Palette)
- Forest Green: `#1d473e`
- Lavender: `#D4B8E8`
- Warm Cream: `#F8F7F3`
- Charcoal: `#2C2C2C`

### Room Card Gradients
- **The Commons**: Warm cream to soft yellow
- **Tide Pool**: Ocean blue (#4A90E2) to teal (#50E3C2)
- **Starlit Clearing**: Deep purple (#6B5B95) to midnight blue (#2C3E50)
- **Forest Nest**: Forest green (#1d473e) to sage (#8BA888)
- **Solo Sanctuary**: Charcoal to warm gray

### Typography
- Section headings: 20px, bold
- Room names: 18px, semibold
- Descriptions: 14px, regular
- Tags: 12px, medium

### Spacing
- Section gaps: 24px
- Card margins: 12px
- Internal padding: 16px

## 🔄 User Flows

### Join Room Flow
1. User taps room card
2. Navigate to `RoomScreen`
3. Show room details + current participants (avatars)
4. "Start Meditation" button
5. Launches meditation timer
6. User joins room participant list (WebSocket broadcast)
7. Other users see participant count update

### Filter Meditations Flow
1. User taps filter icon
2. Modal slides up from bottom
3. Select filters (checkboxes/toggles)
4. Tap "Apply"
5. Meditation list updates
6. Filter count badge shows on icon

### Leave Room Flow
1. User finishes meditation or taps "Leave"
2. Remove from participant list
3. WebSocket broadcast to other participants
4. Navigate back to Home

## 📱 Component Breakdown

### New Components

**`RoomCard.tsx`**
- Props: room (Room), onPress
- Shows: name, icon, description, tags, participant avatars (max 5 visible)
- Gradient background
- Participant count: "12 people meditating"

**`RoomGrid.tsx`**
- Props: rooms (Room[])
- Layout: 2x2 grid for main rooms, full-width for Solo Sanctuary
- Handles tap → navigate to RoomScreen

**`ParticipantAvatars.tsx`**
- Props: participants (Participant[]), max (default 5)
- Shows: circular avatars, overlapping
- "+7 more" indicator if over max

**`MeditationFilterModal.tsx`**
- Props: visible, onClose, filters, onApply
- Sections: Duration, Category, Mood, Difficulty
- Chip selection UI
- Apply/Reset buttons

**`MeditationList.tsx`**
- Props: meditations (Meditation[]), filters (optional)
- Scrollable list of meditation cards
- Shows: title, duration, category badge, description

**`RecommendationSection.tsx`**
- Props: recommendedRoom (Room)
- Highlighted room card
- "Why we recommend" text based on time/mood

### Modified Components

**`HomeScreen.tsx`**
- Complete rebuild (keep existing header elements)
- Add all new sections
- Remove old meditation library structure

**`AppNavigator.tsx`**
- Remove "Meditate" tab
- Keep 4 tabs: Home, Chat, Community, Profile

### New Screens

**`RoomScreen.tsx`**
- Full-screen room view
- Props: route.params.roomId
- Shows: room theme, participant list (full), Start Meditation button
- WebSocket connection for live updates

## 🔌 Backend Implementation

### Database Schema

```sql
CREATE TABLE meditation_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  theme VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  tags TEXT[],
  gradient_start VARCHAR(7),
  gradient_end VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES meditation_rooms(id),
  user_id UUID NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  UNIQUE(room_id, user_id, joined_at)
);

CREATE INDEX idx_room_participants_active 
  ON room_participants(room_id, user_id) 
  WHERE left_at IS NULL;
```

### API Routes

**GET /api/rooms**
- Returns: All active rooms with current participant counts

**GET /api/rooms/:id**
- Returns: Room details + full participant list

**POST /api/rooms/:id/join**
- Body: { userId }
- Action: Add user to room_participants
- Returns: Updated room + participant list
- WebSocket: Broadcast `room:user-joined`

**POST /api/rooms/:id/leave**
- Body: { userId }
- Action: Set left_at timestamp
- WebSocket: Broadcast `room:user-left`

**GET /api/rooms/recommendation**
- Query: ?userId, ?time
- Returns: Personalized room suggestion

### WebSocket Events

**`room:user-joined`**
```typescript
{
  roomId: string;
  participant: Participant;
  totalParticipants: number;
}
```

**`room:user-left`**
```typescript
{
  roomId: string;
  userId: string;
  totalParticipants: number;
}
```

**`room:meditation-started`**
```typescript
{
  roomId: string;
  meditation: Meditation;
  participants: number;
}
```

## ✅ Implementation Phases

### Phase 1: Backend (30 min)
- [ ] Database migration (rooms + participants tables)
- [ ] Room service (CRUD, join/leave logic)
- [ ] Room routes (5 endpoints)
- [ ] Seed data (5 default rooms)
- [ ] WebSocket event handlers

### Phase 2: Core Components (45 min)
- [ ] RoomCard.tsx
- [ ] RoomGrid.tsx
- [ ] ParticipantAvatars.tsx
- [ ] MeditationFilterModal.tsx
- [ ] MeditationList.tsx

### Phase 3: Home Screen Rebuild (60 min)
- [ ] Move existing elements (header, affirmation, streak)
- [ ] Add RecommendationSection
- [ ] Add RoomGrid section
- [ ] Add MeditationList section
- [ ] Wire up all data fetching

### Phase 4: Room Screen (30 min)
- [ ] Create RoomScreen.tsx
- [ ] Participant list with avatars
- [ ] Start Meditation button
- [ ] WebSocket connection
- [ ] Leave room functionality

### Phase 5: Navigation (15 min)
- [ ] Remove Meditate tab from AppNavigator
- [ ] Add RoomScreen route
- [ ] Update deep linking

### Phase 6: Polish (30 min)
- [ ] Loading states
- [ ] Empty states
- [ ] Animations (card press, modal slide)
- [ ] Error handling
- [ ] Test all flows

## 🎯 Success Criteria

- [x] Home screen shows all sections
- [x] Can see all 5 rooms with participant counts
- [x] Tap room → navigate to RoomScreen
- [x] See participant avatars in room
- [x] Can join room (WebSocket updates others)
- [x] Can leave room
- [x] Filter modal works
- [x] Meditation list filters correctly
- [x] No Meditate tab in navigation
- [x] Streak calendar at top
- [x] All existing features still work

## 📝 Notes

- **Avatars**: Use initials in colored circles if no avatar image
- **Capacity**: Unlimited, but show "+X more" after 5 avatars
- **Chat**: Not included in this version
- **Room persistence**: Rooms are always available (not destroyed when empty)
- **Solo Sanctuary**: Special case - always shows 1 participant (the user)

---

**Estimated Total Time**: 3-4 hours for full implementation
**Risk Areas**: WebSocket real-time sync, room participant state management
**Testing Priority**: Room join/leave flow, participant count updates
