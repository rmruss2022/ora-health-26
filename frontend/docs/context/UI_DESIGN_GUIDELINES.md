# Ora Health - UI Design Guidelines

## Design Philosophy

**Warm, Alive, Achievable Growth**

The UI should feel like a safe, nurturing space—not cold and clinical, not overly playful. It should inspire hope while feeling grounded and real.

---

## Color Palette

### Primary Colors

**Healing Purple** - Primary brand color
- `#7C3AED` - Primary
- `#6D28D9` - Primary Dark
- `#8B5CF6` - Primary Light
- `#EDE9FE` - Primary Lightest

*Usage:* Main actions, active states, emphasis
*Psychology:* Wisdom, transformation, spiritual growth

**Warm Sage** - Secondary/Nature
- `#84A98C` - Secondary
- `#52796F` - Secondary Dark
- `#CAD2C5` - Secondary Light
- `#F0F4F0` - Secondary Lightest

*Usage:* Success states, nature themes, grounding elements
*Psychology:* Growth, balance, natural healing

**Soft Coral** - Community/Connection
- `#FF6B6B` - Coral
- `#EE5A6F` - Coral Dark
- `#FF8787` - Coral Light
- `#FFE5E5` - Coral Lightest

*Usage:* Community features, warm accents, hearts/likes
*Psychology:* Connection, compassion, warmth

**Golden Hour** - Achievement/Insight
- `#F59E0B` - Amber
- `#D97706` - Amber Dark
- `#FCD34D` - Amber Light
- `#FEF3C7` - Amber Lightest

*Usage:* Achievements, insights, prompts, highlights
*Psychology:* Clarity, breakthrough moments, celebration

### Neutral Colors

**Warmth-Infused Grays**
- `#1F2937` - Text Primary (warm black)
- `#4B5563` - Text Secondary
- `#9CA3AF` - Text Tertiary
- `#E5E7EB` - Border/Divider
- `#F9FAFB` - Background Light
- `#FFFFFF` - Pure White

*Note:* Use warm grays, never pure gray (add slight warmth)

### Semantic Colors

**Support/Calm**
- `#3B82F6` - Info Blue
- `#DBEAFE` - Info Light

**Caution/Awareness**
- `#F59E0B` - Warning
- `#FEF3C7` - Warning Light

**Error/Alert**
- `#EF4444` - Error
- `#FEE2E2` - Error Light

**Success/Growth**
- `#10B981` - Success
- `#D1FAE5` - Success Light

---

## Typography

### Font Family

**Primary Font: Inter**
- Clean, modern, highly readable
- Warm feel with rounded terminals
- Excellent for both headers and body

**Alternative: SF Pro (iOS) / Roboto (Android)**
- System fonts for platform consistency when needed

### Type Scale

```
Hero: 34px / Bold / Line Height 1.2
H1:   28px / Bold / Line Height 1.3
H2:   24px / Semibold / Line Height 1.3
H3:   20px / Semibold / Line Height 1.4
H4:   17px / Semibold / Line Height 1.4
Body: 15px / Regular / Line Height 1.6
Small: 13px / Regular / Line Height 1.5
Tiny: 11px / Medium / Line Height 1.4
```

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Usage Guidelines

**Headers:**
- Use Bold for H1 and Hero
- Use Semibold for H2-H4
- Add warmth with letter spacing: -0.02em

**Body Text:**
- Default: Regular 15px
- Comfortable line height: 1.6
- Max width: 680px for readability

**Labels & Tags:**
- Use Medium weight for emphasis
- Slightly reduced line height
- Uppercase sparingly (only for tiny labels)

---

## Spacing System

### Base Unit: 4px

```
Space 1:  4px   (xxs)
Space 2:  8px   (xs)
Space 3:  12px  (sm)
Space 4:  16px  (md) - Base
Space 5:  20px  (lg)
Space 6:  24px  (xl)
Space 8:  32px  (2xl)
Space 10: 40px  (3xl)
Space 12: 48px  (4xl)
Space 16: 64px  (5xl)
Space 20: 80px  (6xl)
```

### Component Spacing

**Cards:**
- Padding: 16px (mobile), 20px (tablet+)
- Margin between: 12px
- Border radius: 16px

**Lists:**
- Item padding: 16px vertical, 16px horizontal
- Gap between items: 8px

**Sections:**
- Section padding: 20px horizontal
- Section margin: 24px vertical

**Touch Targets:**
- Minimum: 44x44px
- Comfortable: 48x48px
- Preferred: 56x56px for primary actions

---

## Border Radius

### Rounded Scale

```
xs:   4px  - Tags, tiny pills
sm:   8px  - Small buttons, inputs
md:   12px - Cards, most components
lg:   16px - Large cards, modals
xl:   24px - Feature cards
full: 999px - Pills, avatars, icon buttons
```

### Usage

**Soft & Approachable:**
- Use 12-16px for main cards
- Never use sharp corners (0px) except dividers
- Pills and avatars use full rounding

**Hierarchy:**
- Larger radius = more important/featured
- Smaller radius = supporting elements

---

## Shadows & Elevation

### Shadow Levels

```css
/* Level 1: Subtle lift */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)

/* Level 2: Card default */
shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08)

/* Level 3: Hover state */
shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12)

/* Level 4: Modal/Dialog */
shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.15)

/* Level 5: Floating action */
shadow-2xl: 0 12px 32px rgba(0, 0, 0, 0.18)
```

### Usage Guidelines

- Use shadows sparingly, only for depth hierarchy
- Prefer subtle shadows (level 1-2) for most cards
- Reserve heavy shadows for modals and floating actions
- Consider warm shadow tints: `rgba(124, 58, 237, 0.1)` for purple elements

---

## Iconography

### Style
- **Outline style** for most icons (friendly, approachable)
- **Filled style** for active states
- Rounded corners on icon strokes
- 2px stroke weight

### Size Scale
```
xs:  16px
sm:  20px
md:  24px - Default
lg:  32px
xl:  40px
2xl: 48px
```

### Emoji Usage

**Yes, Use Emojis For:**
- Meditation categories (🧘 🫁 🌅 🌙)
- User avatars (as option)
- Post types in community
- Quick reactions
- Celebration moments

**No, Don't Use Emojis For:**
- Navigation icons
- Critical actions
- System UI elements
- Professional settings

### Icon Sources
- Heroicons (primary)
- Lucide Icons (alternative)
- Custom therapeutic icons (inner child, compassion, etc.)

---

## Component Patterns

### Buttons

**Primary Button**
```
Background: #7C3AED (Healing Purple)
Text: White, Semibold 15px
Padding: 16px 24px
Border Radius: 12px
Shadow: shadow-sm
Min Height: 48px

Hover: Background #6D28D9
Active: Background #6D28D9 + shadow-md
Disabled: Opacity 0.5
```

**Secondary Button**
```
Background: Transparent
Text: #7C3AED, Semibold 15px
Border: 2px solid #7C3AED
Padding: 14px 24px (account for border)
Border Radius: 12px
Min Height: 48px

Hover: Background #EDE9FE
Active: Background #E0D5FC
```

**Tertiary/Ghost Button**
```
Background: Transparent
Text: #4B5563, Semibold 15px
Padding: 12px 16px
Border Radius: 8px

Hover: Background #F9FAFB
Active: Background #F3F4F6
```

**Icon Button**
```
Size: 44x44px (touch target)
Border Radius: 999px
Background: Transparent or #F9FAFB
Icon: 24px

Hover: Background #F3F4F6
Active: Background #E5E7EB + scale(0.95)
```

### Cards

**Standard Card**
```
Background: White
Padding: 16px
Border Radius: 16px
Shadow: shadow-md
Border: none (shadow provides depth)

Hover: shadow-lg + translate(0, -2px)
Active: shadow-md + translate(0, 0)
```

**Feature Card**
```
Background: White
Padding: 20px
Border Radius: 20px
Shadow: shadow-lg
Border: 1px solid #E5E7EB (subtle)

Hover: shadow-xl + translate(0, -4px)
```

**Inline Card** (less emphasis)
```
Background: #F9FAFB
Padding: 12px
Border Radius: 12px
Border: 1px solid #E5E7EB
Shadow: none
```

### Inputs

**Text Input**
```
Background: White
Border: 2px solid #E5E7EB
Border Radius: 12px
Padding: 14px 16px
Font: Regular 15px
Min Height: 48px

Focus: Border #7C3AED, Shadow 0 0 0 3px #EDE9FE
Error: Border #EF4444, Shadow 0 0 0 3px #FEE2E2
```

**Textarea**
```
Same as text input
Min Height: 120px
Resize: Vertical only
```

**Search Input**
```
Same as text input
Icon: Left-aligned search icon (20px)
Padding Left: 44px (for icon)
```

### Tags & Pills

**Tag**
```
Background: #F3F4F6
Text: #4B5563, Medium 13px
Padding: 6px 12px
Border Radius: 8px
Gap between: 6px

Active: Background #7C3AED, Text White
```

**Pill (user badge, status)**
```
Background: Color-specific light shade
Text: Color-specific dark shade
Padding: 4px 10px
Border Radius: 999px
Font: Medium 12px
```

### Avatar

**Sizes**
```
xs:  24px
sm:  32px
md:  40px - Default
lg:  56px
xl:  80px
2xl: 120px
```

**Style**
```
Border Radius: 999px
Border: 2px solid White (when overlapping)
Background: Gradient or emoji
Shadow: shadow-sm (for depth)
```

### Progress Indicators

**Progress Bar**
```
Height: 8px
Border Radius: 999px
Background: #E5E7EB
Fill: Gradient (#7C3AED to #8B5CF6)
Animation: Smooth width transition 0.3s
```

**Circular Progress**
```
Size: 40px default
Stroke Width: 4px
Background Circle: #E5E7EB
Progress Circle: #7C3AED
```

**Loading Spinner**
```
Size: 24px default
Color: #7C3AED
Animation: Smooth rotation
```

### Notifications/Toasts

**Success**
```
Background: #D1FAE5
Border Left: 4px solid #10B981
Text: #065F46
Icon: Check circle (green)
Padding: 16px
Border Radius: 12px
```

**Info**
```
Background: #DBEAFE
Border Left: 4px solid #3B82F6
Text: #1E40AF
Icon: Info circle (blue)
```

**Warning**
```
Background: #FEF3C7
Border Left: 4px solid #F59E0B
Text: #92400E
Icon: Exclamation triangle (amber)
```

**Error**
```
Background: #FEE2E2
Border Left: 4px solid #EF4444
Text: #991B1B
Icon: X circle (red)
```

---

## Animation & Motion

### Timing Functions

```css
/* Default: Smooth and natural */
ease-out: cubic-bezier(0.33, 1, 0.68, 1)

/* Playful: Slight bounce */
ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)

/* Snappy: Quick response */
ease-snappy: cubic-bezier(0.4, 0, 0.2, 1)

/* Gentle: Slow and calming */
ease-gentle: cubic-bezier(0.25, 0.1, 0.25, 1)
```

### Duration Scale

```
instant: 0ms     - Color changes
fast:    150ms   - Micro-interactions
normal:  250ms   - Default (buttons, cards)
slow:    350ms   - Page transitions
slower:  500ms   - Complex transitions
```

### Motion Principles

**Responsive:**
- Actions should feel immediate (150-250ms)
- Use fast timing for interactive elements
- Delay should never feel sluggish

**Natural:**
- Prefer ease-out for most transitions
- Use ease-bounce sparingly for delightful moments
- Avoid linear timing (feels robotic)

**Purposeful:**
- Don't animate for animation's sake
- Motion should guide attention
- Reduce motion for accessibility (`prefers-reduced-motion`)

### Common Animations

**Button Press**
```css
transform: scale(0.95);
transition: transform 150ms ease-out;
```

**Card Hover**
```css
transform: translateY(-4px);
box-shadow: shadow-lg;
transition: all 250ms ease-out;
```

**Fade In**
```css
opacity: 0 → 1;
transform: translateY(8px) → translateY(0);
transition: opacity 250ms, transform 250ms ease-out;
```

**Modal Open**
```css
opacity: 0 → 1;
transform: scale(0.95) → scale(1);
transition: opacity 250ms, transform 250ms ease-bounce;
```

**Loading Pulse**
```css
opacity: 0.6 → 1 → 0.6;
animation: pulse 2s ease-in-out infinite;
```

---

## Layout Patterns

### Screen Structure

**Standard Screen**
```
┌─────────────────────────────┐
│ Header (Fixed/Sticky)       │
│ - Title, Actions            │ 60-80px
├─────────────────────────────┤
│                             │
│ Content (Scrollable)        │
│ - Cards, Lists, etc.        │ Flex: 1
│                             │
├─────────────────────────────┤
│ Tab Bar (Optional)          │ 60px
└─────────────────────────────┘
```

**Chat Screen**
```
┌─────────────────────────────┐
│ Header                      │ 60px
├─────────────────────────────┤
│                             │
│ Messages (Scrollable)       │ Flex: 1
│ - Align from bottom         │
│                             │
├─────────────────────────────┤
│ Input Bar (Fixed)           │ 60-80px
└─────────────────────────────┘
```

### Safe Areas & Padding

**Mobile:**
- Screen padding: 16px
- Safe area insets: Auto (iOS notch, Android nav)
- Content max-width: 100%

**Tablet:**
- Screen padding: 24px
- Content max-width: 680px (centered)

**Desktop:**
- Screen padding: 32px
- Content max-width: 800px (centered)

### Grid System

**Column Layouts:**
- 1 column: Default mobile
- 2 columns: Tablet landscape, Desktop
- 3 columns: Large desktop (rare)

**Gap:**
- Mobile: 12px
- Tablet: 16px
- Desktop: 20px

---

## Accessibility

### Color Contrast

**WCAG AA Compliance (Minimum)**
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Our Standards (Exceed AA)**
- Body text on white: ≥ 7:1
- Secondary text: ≥ 4.5:1
- Disabled text: ≥ 3:1

### Touch Targets
- Minimum: 44x44px (WCAG 2.1 AAA)
- Preferred: 48x48px or larger
- Spacing between: ≥ 8px

### Focus States
```css
outline: 3px solid #7C3AED;
outline-offset: 2px;
border-radius: inherit;
```

### Screen Readers
- All interactive elements have labels
- Icons have aria-labels
- Loading states announced
- Error messages associated with inputs

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Voice & Tone in UI

### Microcopy Guidelines

**Empty States**
✅ "Your journey starts here. What's on your mind?"
❌ "No messages yet"

**Buttons**
✅ "Start healing"
✅ "Share your progress"
❌ "Submit"
❌ "Click here"

**Errors**
✅ "We couldn't save that. Want to try again?"
❌ "Error 500: Internal server error"

**Success**
✅ "Beautiful! Your entry is saved."
❌ "Successfully saved."

**Loading**
✅ "Finding the right words..."
✅ "Connecting with your community..."
❌ "Loading..."

### Tone Principles

**Be Human:**
- Conversational, not robotic
- Warm, not cold
- Personal, not corporate

**Be Encouraging:**
- Celebrate progress
- Normalize struggle
- Inspire hope

**Be Clear:**
- Simple language
- No jargon
- Direct communication

**Be Respectful:**
- Never patronizing
- Honor user autonomy
- Validate emotions

---

## Dark Mode (Future)

### Color Adjustments

**Backgrounds:**
- Pure Black: #000000
- Surface: #1F2937
- Elevated: #374151

**Text:**
- Primary: #F9FAFB
- Secondary: #D1D5DB
- Tertiary: #9CA3AF

**Colors:**
- Slightly desaturate all colors
- Increase contrast for readability
- Adjust shadows to glows

**Principle:**
Maintain warmth even in dark mode. Never pure gray—always warm tones.

---

## Implementation Notes

### React Native Styling

**Use StyleSheet.create()**
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // ...
});
```

**Design Tokens**
Create a `theme.ts` file:
```typescript
export const colors = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  // ...
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  // ...
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  // ...
};
```

**Responsive Design**
```typescript
import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
```

---

## Component Library Checklist

### Core Components
- [ ] Button (Primary, Secondary, Tertiary, Icon)
- [ ] Card (Standard, Feature, Inline)
- [ ] Input (Text, Textarea, Search)
- [ ] Tag/Pill
- [ ] Avatar
- [ ] Progress (Bar, Circle, Spinner)
- [ ] Toast/Notification
- [ ] Modal/Dialog
- [ ] Bottom Sheet
- [ ] Tab Bar
- [ ] Header
- [ ] Badge
- [ ] Divider
- [ ] Icon wrapper

### Complex Components
- [ ] Chat Message Bubble
- [ ] Community Post Card
- [ ] Meditation Card
- [ ] Exercise Card
- [ ] Progress Chart
- [ ] Calendar/Streak View
- [ ] Mood Selector
- [ ] Onboarding Stepper

---

## Quality Checklist

Before shipping any screen:

**Visual:**
- [ ] Follows color palette
- [ ] Typography scale consistent
- [ ] Spacing uses 4px system
- [ ] Border radius appropriate
- [ ] Shadows used correctly
- [ ] Alignment perfect

**Interaction:**
- [ ] Touch targets ≥ 44px
- [ ] Animations smooth (60fps)
- [ ] Feedback for all interactions
- [ ] Loading states handled
- [ ] Error states designed

**Accessibility:**
- [ ] Color contrast passes WCAG AA
- [ ] Focus states visible
- [ ] Screen reader friendly
- [ ] Reduced motion support
- [ ] Keyboard navigable (web)

**Content:**
- [ ] Microcopy warm and human
- [ ] Empty states helpful
- [ ] Error messages actionable
- [ ] Success messages celebratory

**Polish:**
- [ ] Platform-specific details (iOS/Android)
- [ ] Safe area insets handled
- [ ] Status bar styled
- [ ] Keyboard behavior correct
- [ ] Scroll performance optimized

---

## Resources

### Design Tools
- **Figma:** [Link to design files]
- **Color Palette:** [Link to palette file]
- **Icon Library:** Heroicons, Lucide Icons

### Development
- **React Native Paper:** Consider for base components
- **React Native Reanimated:** For complex animations
- **React Native SVG:** For custom icons

### Inspiration
- Headspace (calm, approachable)
- Notion (clean, functional)
- Instagram (community feel)
- Balance (therapeutic warmth)

---

**Remember:** Every pixel should serve the mission of helping someone heal and grow. Design with compassion. 💜
