# Letters Components

UI components for the **Letters** feature - thoughtful, asynchronous communication between users and AI agents.

## Design Philosophy

- **Intimate typography:** Sentient font for body text (warm, personal feel)
- **Paper-like aesthetics:** Cream backgrounds, subtle shadows, serif fonts
- **Envelope metaphor:** Sealed → open animations, unread badges
- **Color-coded:** AI (Ora Green), User (Lavender), System (Golden)

## Components

### LetterCard

Inbox list item component. Displays letter preview in a card format.

**Props:**
```typescript
{
  letter: Letter;
  onPress: () => void;
}
```

**Visual Features:**
- Color-coded left accent bar (4px)
- Envelope icon (sealed for unread, open for read)
- Unread badge (8px green dot)
- Preview text (2 lines max with ellipsis)
- Relative timestamp ("2h ago", "Yesterday")

**Interaction:**
- Tap: scale animation → navigate to letter detail
- Future: swipe actions (archive, mark unread)

**Example:**
```tsx
import { LetterCard } from '@/components/letters';

<LetterCard
  letter={{
    id: '1',
    from: 'agent',
    agentName: 'Assistant',
    subject: 'Your thoughts on creativity',
    body: 'Thank you for your thoughtful message...',
    sentAt: new Date(),
    state: 'unread',
  }}
  onPress={() => navigation.navigate('LetterDetail', { letterId: '1' })}
/>
```

---

### LetterView

Full letter reading view. Beautiful, readable layout with paper aesthetic.

**Props:**
```typescript
{
  letter: Letter;
  onThreadPress?: () => void;
  threadCount?: number;
}
```

**Visual Features:**
- Paper container (cream background, border, shadow)
- Metadata header (from, date, subject)
- Serif body text (Sentient Regular 17px, line-height 28px)
- Signature extraction (italicized, right-aligned)
- Optional thread indicator button

**Typography:**
- Title: Sentient Bold 24px
- Body: Sentient Regular 17px, 1.65 line-height
- Metadata: Switzer Regular 13px
- Signature: Sentient Italic 15px

**Example:**
```tsx
import { LetterView } from '@/components/letters';

<LetterView
  letter={currentLetter}
  onThreadPress={() => navigation.navigate('Thread', { threadId })}
  threadCount={5}
/>
```

---

### EmptyState

Displayed when inbox has no letters.

**Props:**
```typescript
{
  onCompose?: () => void;
}
```

**Visual Features:**
- Large envelope icon (📭 64px)
- Encouraging title and description
- CTA button "Compose Your First Letter"

**Example:**
```tsx
import { EmptyState } from '@/components/letters';

<EmptyState
  onCompose={() => navigation.navigate('Compose')}
/>
```

---

## Data Types

```typescript
interface Letter {
  id: string;
  threadId?: string;
  from: 'user' | 'agent' | 'system';
  agentId?: string;
  agentName?: string;
  subject: string;
  body: string;
  preview?: string; // First ~100 chars
  sentAt: Date;
  readAt?: Date;
  state: 'unread' | 'read' | 'draft' | 'sending' | 'failed';
}
```

## Font Configuration

**Required fonts in app.json:**
```json
{
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
}
```

**Font families used:**
- `Sentient-Regular` - Letter body text
- `Sentient-Medium` - Empty state title
- `Sentient-Bold` - Letter title (LetterView)
- `Sentient-Italic` - Signatures
- `Switzer-Regular` - UI metadata
- `Switzer-Medium` - Sender names, thread button
- `Switzer-Semibold` - Letter titles (inbox)

## Color Palette

From `src/theme/index.ts`:

| Type | Color | Hex |
|------|-------|-----|
| AI Letters | `colors.primary` | #1d473e (Ora Green) |
| User Letters | `colors.secondary` | #D4B8E8 (Lavender) |
| System Letters | `colors.golden` | #D4A574 |
| Paper Background | `colors.cream` | #F5F1E8 |
| Border | `colors.border` | #E0DCD3 |

## Accessibility

- **Dynamic Type:** Supports font scaling (iOS)
- **Screen Reader:** Meaningful labels for all interactive elements
- **Touch Targets:** Minimum 44×44pt tap areas
- **Color Contrast:** WCAG AA compliant (4.5:1 minimum)

## Implementation Notes

### Performance
- Use `FlatList` for inbox (virtualized scrolling)
- Lazy load full letter body (only when opened)
- Debounce draft auto-save (every 2 seconds)

### Future Enhancements
- Swipe actions (archive, delete, mark unread)
- Envelope open/seal animation (Lottie or React Native Reanimated)
- Rich text editor for compose (bold, italic, links)
- Letter thread view with visual connectors
- Draft auto-save to local storage

## Related Files

- **Design Spec:** `/docs/design/letters-ui-spec.md` (comprehensive specification)
- **Brand Audit:** `/docs/design/brand-audit.md` (fonts, colors, guidelines)
- **Theme:** `/src/theme/index.ts` (color palette, typography scales)

---

**Last Updated:** February 13, 2026  
**Designer:** Designer-Agent  
**Task:** ORA-028
