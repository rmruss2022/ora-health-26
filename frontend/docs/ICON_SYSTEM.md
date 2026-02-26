# Behavior Icon System

## Overview
Consistent, accessible icon set for behavior cards using @expo/vector-icons.

## Icon Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `chat` | chatbubble (Ionicons) | #4A90E2 (Blue) | Free-form conversation |
| `journal` | book (Ionicons) | #6B7A5D (Sage) | Journaling prompts |
| `exercise` | yoga (MaterialCommunityIcons) | #9B59B6 (Purple) | Guided exercises |
| `progress` | bar-chart (Ionicons) | #E67E22 (Orange) | Progress analysis |
| `planning` | calendar (Ionicons) | #3498DB (Blue) | Weekly planning |
| `meditation` | meditation (MaterialCommunityIcons) | #8E44AD (Purple) | Meditation |
| `community` | people (Ionicons) | #16A085 (Teal) | Community features |

## Usage

### Basic Usage
```tsx
import { BehaviorIcon } from '../components/icons/BehaviorIcons';

<BehaviorIcon 
  type="chat" 
  size={48} 
  backgroundColor="#4A90E2" 
/>
```

### With BehaviorCard
```tsx
<BehaviorCard
  iconType="meditation"
  iconBg="#6B7A5D"
  title="Guided Meditation"
  subtitle="Breathing and mindfulness practices"
  onPress={() => navigate('Meditation')}
/>
```

### Get Icon Configuration
```tsx
import { getIconConfig } from '../components/icons/BehaviorIcons';

const config = getIconConfig('journal');
// Returns: { backgroundColor, iconColor, description }
```

## Design Principles

1. **Consistency:** All icons from professional icon libraries
2. **Clarity:** Recognizable at small sizes (24-48px)
3. **Accessibility:** High contrast, works with screen readers
4. **Scalability:** Vector-based, looks crisp at any size
5. **Brand Alignment:** Colors match Ora AI brand palette

## Icon Libraries Used
- **Ionicons:** Primary icon set (chat, calendar, progress)
- **MaterialCommunityIcons:** Specialized wellness icons (meditation, yoga)
- **FontAwesome5:** Fallback for specific needs

## Accessibility
- All icons have semantic meaning in context
- Used within buttons with proper accessibilityLabels
- Color not the only indicator (paired with text)
- Sufficient color contrast (WCAG AA compliant)

## Future Additions
When adding new behavior types, update:
1. `BehaviorIconType` in BehaviorIcons.tsx
2. Switch case in `renderIcon()`
3. `BehaviorIconConfig` object
4. This documentation

## Technical Details
- **File:** `src/components/icons/BehaviorIcons.tsx`
- **Dependencies:** `@expo/vector-icons`
- **Size:** Configurable (default 40x40)
- **Format:** React component (TSX)
