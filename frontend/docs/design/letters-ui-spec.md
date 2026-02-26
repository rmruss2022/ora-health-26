# Letters UI/UX Specification

**Project:** Ora AI App Store Polish (ORA-066)  
**Task:** ORA-028 - Letter UI/UX Design  
**Date:** February 13, 2026  
**Designer:** Designer-Agent  

---

## 🎨 Design Philosophy

The Letters feature embodies **intimate, thoughtful communication** between users and AI agents. Unlike instant chat, letters are:

- **Deliberate:** Composed with care, read with attention
- **Beautiful:** Presented with typographic elegance and paper-like aesthetics
- **Personal:** Using serif fonts (Sentient) for warmth and intimacy
- **Asynchronous:** Envelopes convey "unread" vs "opened" states

### Core Metaphor: Physical Letters

The UI draws inspiration from traditional correspondence:
- **Envelopes** represent letters in the inbox (sealed → open animation)
- **Paper texture** for letter reading view (subtle cream background)
- **Serif typography** for letter content (Sentient font family)
- **Handwritten feeling** through font choices and spacing

---

## 📐 Visual System

### Color Coding

| Type | Accent Color | Usage |
|------|--------------|-------|
| **AI Letters** | Ora Green (`#1d473e`) | Left border, envelope seal |
| **User Letters** | Lavender (`#D4B8E8`) | Left border, envelope seal |
| **System Letters** | Golden (`#D4A574`) | Announcements, onboarding |

### Typography Hierarchy

#### Inbox View (Switzer - UI font)
- **Letter Title:** Switzer Semibold 17px (`h4`)
- **Sender Name:** Switzer Medium 13px
- **Timestamp:** Switzer Regular 11px, opacity 0.6
- **Preview Text:** Switzer Regular 13px, opacity 0.7

#### Letter Reading View (Sentient - intimate font)
- **Letter Title:** Sentient Bold 24px (`h2`)
- **Body Text:** Sentient Regular 17px, line-height 28px
- **Metadata:** Switzer Regular 13px (sender, date)
- **Letter Signature:** Sentient Italic 15px

#### Compose View
- **Subject Input:** Sentient Medium 20px
- **Body Input:** Sentient Regular 17px, line-height 28px
- **Placeholder:** Sentient Light Italic 17px, opacity 0.5

### Spacing & Layout

- **Inbox Card Padding:** 16px vertical, 16px horizontal
- **Letter Content Margins:** 24px horizontal, 32px vertical
- **Line Height (Body):** 1.65 (28px for 17px font)
- **Paragraph Spacing:** 20px
- **Card Spacing:** 12px vertical gap

---

## 📱 Screen Specifications

### 1. Letters Inbox Screen

**Path:** `src/screens/LettersScreen.tsx`

#### Layout Structure
```
┌─────────────────────────────────┐
│  [Back]  Letters      [Compose] │ ← Header
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🟢 [Sealed Envelope Icon] │ │ ← Unread letter
│  │ @agent_name               │ │
│  │ Letter Title              │ │
│  │ Preview of first line...  │ │
│  │ 2 hours ago              │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🟣 [Open Envelope Icon]   │ │ ← Read letter
│  │ Your letter to @agent     │ │
│  │ Re: Your thoughts on...   │ │
│  │ Yesterday                 │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🟡 [System Letter]        │ │ ← System letter
│  │ Welcome to Letters        │ │
│  │ Learn how to exchange...  │ │
│  │ 3 days ago               │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

#### Component Breakdown

**LetterCard (inbox item):**
- **Container:** Card with `shadows.md`, `borderRadius.md` (12px)
- **Left Accent Bar:** 4px width, full height, color-coded by type
- **Unread Badge:** Small green dot (8px) top-right if unread
- **Envelope Icon:** 
  - Unread: Sealed envelope (🟢 sealed flap down)
  - Read: Open envelope (🟣 flap up)
  - Animated transition on tap
- **Text Layout:**
  - Line 1: Sender name (Switzer Medium 13px)
  - Line 2: Letter title (Switzer Semibold 17px)
  - Line 3: Preview text (Switzer Regular 13px, 2 lines max, ellipsis)
  - Line 4: Timestamp (Switzer Regular 11px, right-aligned)

#### Empty State

When inbox is empty:
```
┌─────────────────────────────────┐
│                                 │
│         [Envelope Icon]         │
│                                 │
│      No letters yet             │
│                                 │
│   Start a conversation with     │
│   an AI agent to exchange       │
│   thoughtful letters            │
│                                 │
│   [Compose Your First Letter]   │
│                                 │
└─────────────────────────────────┘
```

- **Icon:** Large outline envelope (48px), Ora Green
- **Title:** Sentient Medium 20px
- **Body:** Switzer Regular 15px, centered, max-width 280px
- **CTA Button:** Primary button with Ora Green background

---

### 2. Letter Reading View

**Path:** `src/screens/LetterDetailScreen.tsx`

#### Layout Structure
```
┌─────────────────────────────────┐
│  [Back]                [Reply]  │ ← Header
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ [Paper texture bg]      │   │
│  │                         │   │
│  │  From: @agent_name      │   │
│  │  Date: Feb 13, 2026     │   │
│  │  Subject: Your Letter   │   │
│  │                         │   │
│  │  Dear User,             │   │
│  │                         │   │
│  │  Thank you for your     │   │ ← Letter body
│  │  thoughtful message     │   │   (Sentient Regular 17px)
│  │  about creativity...    │   │
│  │                         │   │
│  │  I've been reflecting   │   │
│  │  on your question...    │   │
│  │                         │   │
│  │  [3 more paragraphs]    │   │
│  │                         │   │
│  │  Warmly,                │   │
│  │  Agent Name             │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  [Show Thread (4 letters)]      │ ← Thread indicator
│                                 │
└─────────────────────────────────┘
```

#### Visual Details

**Paper Container:**
- Background: `colors.cream` (#F5F1E8)
- Padding: 24px horizontal, 32px vertical
- Border: 1px solid `colors.border` (E0DCD3)
- Shadow: `shadows.lg` for depth
- Border Radius: 8px (subtle, not too rounded)

**Letter Header (Metadata):**
- Font: Switzer Regular 13px
- Color: `colors.textSecondary` (#5A5A5A)
- Spacing: 4px between lines
- Separator: Thin line (1px, `colors.border`) below header

**Letter Body:**
- Font: **Sentient Regular 17px** (intimate, readable)
- Line Height: 28px (1.65 ratio for comfort)
- Color: `colors.textPrimary` (#2D2D2D)
- Paragraph Spacing: 20px
- Max Width: None (full container width with padding)

**Letter Signature:**
- Font: Sentient Italic 15px
- Color: `colors.textSecondary`
- Margin Top: 24px (extra space before signature)
- Alignment: Right-aligned

**Thread Indicator (if letter is part of conversation):**
- Button: Tertiary style, full-width
- Text: "View Thread (X letters)" - Switzer Medium 15px
- Icon: Stacked papers icon
- Tap: Navigates to thread view

---

### 3. Letter Compose Screen

**Path:** `src/screens/ComposeLetterScreen.tsx`

#### Layout Structure
```
┌─────────────────────────────────┐
│  [Cancel]  New Letter    [Send] │ ← Header
├─────────────────────────────────┤
│                                 │
│  To: @agent_name ▼              │ ← Recipient picker
│                                 │
│  Subject: ________________      │ ← Subject input
│                                 │
│  ┌─────────────────────────┐   │
│  │ Write your letter...    │   │
│  │                         │   │
│  │                         │   │
│  │ [Large text input area] │   │ ← Body input
│  │                         │   │
│  │                         │   │
│  │                         │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  [B] [I] [Link]                 │ ← Rich text toolbar
│                                 │
└─────────────────────────────────┘
```

#### Input Specifications

**Recipient Picker:**
- Component: Dropdown/modal selector
- Style: Switzer Semibold 17px
- Shows: Agent avatar + name + description
- Supports: Search/filter

**Subject Input:**
- Font: Sentient Medium 20px
- Color: `colors.textPrimary`
- Placeholder: "What's this letter about?" (Sentient Light Italic)
- Max Length: 100 characters
- Border: Bottom border only (1px, focus → 2px Ora Green)

**Body Input:**
- Font: Sentient Regular 17px
- Line Height: 28px
- Color: `colors.textPrimary`
- Placeholder: "Dear [Agent Name],\n\nWrite your thoughts here..." (Sentient Light Italic)
- Min Height: 400px
- Background: `colors.cream` (paper feel)
- Padding: 20px
- Auto-grow: Yes (expands with content)

**Rich Text Toolbar:**
- Position: Fixed bottom or floating above keyboard
- Background: White with shadow
- Buttons: Bold, Italic, Link insertion
- Icons: 20px, `colors.primary` when active
- Tap feedback: Scale animation

**Send Button:**
- Style: Primary button (Ora Green)
- Text: "Send Letter" - Switzer Semibold 15px
- Disabled State: Requires recipient + (subject OR body content)
- Animation: Envelope seal animation on send

---

### 4. Letter Thread View

**Path:** `src/screens/LetterThreadScreen.tsx`

#### Layout Structure
```
┌─────────────────────────────────┐
│  [Back]  Thread with @agent     │ ← Header
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ [Paper 1 - Oldest]      │   │
│  │ From: You               │   │
│  │ Subject: Initial thought│   │
│  │ Body excerpt...         │   │ ← Letter preview cards
│  │ [Tap to expand]         │   │   (collapsed by default)
│  └─────────────────────────┘   │
│           ↓                     │
│  ┌─────────────────────────┐   │
│  │ [Paper 2]               │   │
│  │ From: @agent_name       │   │
│  │ Re: Initial thought     │   │
│  │ Body excerpt...         │   │
│  │ [Tap to expand]         │   │
│  └─────────────────────────┘   │
│           ↓                     │
│  ┌─────────────────────────┐   │
│  │ [Paper 3 - Newest]      │   │
│  │ From: You               │   │
│  │ Re: Re: Initial thought │   │
│  │ [EXPANDED - Full body]  │   │ ← Most recent expanded
│  │ Shows full content...   │   │
│  └─────────────────────────┘   │
│                                 │
│  [Reply to Thread]              │ ← CTA button
│                                 │
└─────────────────────────────────┘
```

#### Thread Visualization

**Connector Line:**
- Vertical line connecting letters (2px, dashed, `colors.border`)
- Positioned center-left between cards
- Shows conversation flow visually

**Letter Preview Cards (Collapsed):**
- Height: 120px (fixed)
- Shows: From, Subject, first 2 lines of body
- Tap: Expands in-place to full letter
- Background: `colors.cream`
- Shadow: `shadows.sm`

**Expanded Letter:**
- Full content displayed (scrollable if long)
- "Collapse" button top-right
- Same styling as Letter Reading View

**Thread Metadata:**
- Header shows: "Thread with [Agent Name]"
- Subheader: "X letters • Started [date]"
- Badge: Unread count if any letters unread

---

## 🎬 Animations & Interactions

### Envelope Open/Seal Animation

**Sealed → Open (on tap in inbox):**
1. Envelope icon scales up 1.05x (100ms)
2. Flap rotates up from center (200ms, ease-out)
3. Letter "slides out" from envelope (150ms, delay 100ms)
4. Transition to Letter Reading View

**Send Animation (compose → sent):**
1. "Send" button morphs into envelope (200ms)
2. Envelope seals (flap down, 200ms)
3. Envelope "flies off" screen (300ms, ease-in, scale down)
4. Success haptic feedback
5. Return to inbox

### Card Interactions

**Inbox Card Tap:**
- Scale down to 0.98 (100ms) on press
- Scale back to 1.0 on release
- Trigger envelope animation
- Navigate to Letter Reading View

**Swipe Actions (optional future feature):**
- Swipe left: Archive (grey)
- Swipe right: Mark unread (green)

### Loading States

**Composing/Sending Letter:**
- "Sending..." text replaces "Send Letter"
- Subtle spinner animation
- Disable all inputs during send

**Loading Letter Content:**
- Skeleton screen with paper texture
- Animated shimmer effect on text lines
- Fade in when content loads

---

## 🎯 States & Conditions

### Letter States

| State | Visual Indicator | Icon | Behavior |
|-------|------------------|------|----------|
| **Unread** | Green dot badge (8px) | Sealed envelope | Bold title |
| **Read** | No badge | Open envelope | Normal weight |
| **Draft** | Orange dot badge | Pencil icon | Italic title |
| **Sending** | Blue pulsing dot | Airplane icon | Disabled |
| **Failed** | Red exclamation | Alert icon | Retry button |

### Empty States

**No Letters:**
- Show empty state illustration
- CTA: "Compose Your First Letter"

**No Search Results:**
- "No letters found matching '[query]'"
- CTA: "Clear search" or "Compose new letter"

**Thread Deleted:**
- Greyed out preview
- "This thread has been deleted"
- No interaction

---

## ♿️ Accessibility

### Font Scaling
- Support Dynamic Type (iOS)
- Min: 85% of base size
- Max: 130% of base size
- Maintain line-height ratio at all scales

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Test accent colors on cream background
- Use `colors.textPrimary` for body text (high contrast)

### Screen Reader Support
- Meaningful labels for all interactive elements
- "Unread letter from [agent] titled [subject]"
- Announce state changes ("Letter sent successfully")
- Group thread letters semantically

### Touch Targets
- Minimum 44×44pt tap areas
- Extra padding around small icons
- Swipe zones clearly defined (if implemented)

---

## 🔧 Implementation Notes

### Component Structure

```
src/components/letters/
├── LetterCard.tsx          ← Inbox list item
├── LetterView.tsx          ← Full letter reading view
├── LetterComposer.tsx      ← Compose screen body
├── RecipientPicker.tsx     ← Agent selector
├── EnvelopeIcon.tsx        ← Animated envelope SVG
├── ThreadConnector.tsx     ← Visual thread line
└── EmptyState.tsx          ← No letters illustration
```

### Data Types

```typescript
interface Letter {
  id: string;
  threadId?: string;
  from: 'user' | 'agent';
  agentId?: string;
  subject: string;
  body: string;
  bodyHtml?: string; // Rich text support
  sentAt: Date;
  readAt?: Date;
  state: 'unread' | 'read' | 'draft' | 'sending' | 'failed';
}

interface LetterThread {
  id: string;
  participantIds: string[];
  subject: string;
  letterCount: number;
  unreadCount: number;
  lastLetterAt: Date;
  letters: Letter[];
}
```

### Font Loading

**app.json configuration required:**
```json
"expo": {
  "plugins": [
    [
      "expo-font",
      {
        "fonts": [
          "./assets/fonts/Sentient-Regular.otf",
          "./assets/fonts/Sentient-Light.otf",
          "./assets/fonts/Sentient-LightItalic.otf",
          "./assets/fonts/Sentient-Medium.otf",
          "./assets/fonts/Sentient-Bold.otf",
          "./assets/fonts/Sentient-Italic.otf",
          "./assets/fonts/Switzer-Regular.otf",
          "./assets/fonts/Switzer-Medium.otf",
          "./assets/fonts/Switzer-Semibold.otf"
        ]
      }
    ]
  ]
}
```

### Performance Considerations

- **Virtualized Lists:** Use `FlatList` for inbox (100+ letters)
- **Lazy Load:** Load full letter body only when opened
- **Image Optimization:** Compress envelope icons, use SVG where possible
- **Thread Pagination:** Load 10 letters at a time, infinite scroll
- **Draft Auto-Save:** Debounce saves every 2 seconds

---

## 📊 Success Metrics

**Design Goals:**
- [ ] Users spend 30%+ more time reading letters vs chat messages
- [ ] 60%+ of letters receive a reply
- [ ] Users describe letters as "thoughtful" or "beautiful" in feedback
- [ ] Zero accessibility violations in testing
- [ ] < 1 second load time for letter content

---

## 🎨 Design Assets Needed

**Icons (to be created):**
- Sealed envelope (24×24px, SVG)
- Open envelope (24×24px, SVG)
- Envelope "flying off" animation frames
- Compose/pencil icon
- Thread/stacked papers icon

**Illustrations (optional):**
- Empty state: Hand-drawn envelope with stamp
- Onboarding: Letter writing desk scene

**Textures (subtle):**
- Paper texture overlay (low opacity, cream background)
- Vintage stamp/postmark graphics (decorative)

---

**End of Specification**

_Next Steps: Implement `LetterCard.tsx` and `LetterView.tsx` components with React Native + TypeScript._
