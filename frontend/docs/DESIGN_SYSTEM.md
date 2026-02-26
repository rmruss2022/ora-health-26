# Ora AI Design System

**Version:** 1.0  
**Last Updated:** February 13, 2026  
**Based on:** Ora 2 Brand Guidelines 2024

---

## Overview

The Ora AI design system is built on principles of warmth, accessibility, and consistency. It combines the intimate, human quality of Sentient typography with the functional clarity of Switzer, all wrapped in a soothing, nature-inspired color palette centered around Ora Forest Green.

**Design Philosophy:**
- **Warm & Welcoming:** Soft colors, generous spacing, rounded corners
- **Human & Personal:** Typography that feels handwritten yet professional
- **Calm & Centered:** Nature-inspired palette that promotes tranquility
- **Accessible:** High contrast, clear hierarchy, readable sizes

---

## 🎨 Color Palette

### Primary Colors

#### Ora Forest Green (Primary Brand Color)
Deep forest green with teal undertones - the hero brand color representing growth, nature, and grounding.

```
primary         #1d473e   RGB(29, 71, 62)
primaryDark     #0f2a24   RGB(15, 42, 36)
primaryLight    #2d5e52   RGB(45, 94, 82)
primaryLightest #d4e3df   RGB(212, 227, 223)
```

**Usage:**
- Primary CTAs and important actions
- Active states and selections
- Success messages and positive feedback
- Brand moments (logo, splash screen)

---

#### Lavender Accent (Secondary Brand Color)
Soft pastel purple/lavender for accents and highlights. Brings warmth and friendliness.

```
secondary         #D4B8E8   RGB(212, 184, 232)
secondaryDark     #b894d4   RGB(184, 148, 212)
secondaryLight    #e6d9f2   RGB(230, 217, 242)
secondaryLightest #f5f0fa   RGB(245, 240, 250)
```

**Usage:**
- Meditation and mindfulness features
- Subtle highlights and decorative elements
- Secondary actions and navigation
- Background gradients

---

### Accent & Complementary Colors

#### Deep Purple Accent
```
accent         #6B5B95   RGB(107, 91, 149)
accentDark     #4F4570   RGB(79, 69, 112)
accentLight    #9B8BC4   RGB(155, 139, 196)
accentLightest #E8E3F0   RGB(232, 227, 240)
```

**Usage:**
- Community features
- Interactive elements (links, tags)
- Focus states

#### Golden Warm Tone
```
golden         #D4A574   RGB(212, 165, 116)
goldenDark     #B88C5F   RGB(184, 140, 95)
goldenLight    #E8C9A3   RGB(232, 201, 163)
goldenLightest #F5E8D8   RGB(245, 232, 216)
```

**Usage:**
- Achievements and milestones
- Premium features
- Warning states (soft)

#### Earth Tones
```
terracotta  #B8927D   RGB(184, 146, 125)
olive       #6B7A5D   RGB(107, 122, 93)
sand        #E8DFD3   RGB(232, 223, 211)
```

**Usage:**
- Variety in card backgrounds
- Iconography accents
- Decorative elements

---

### Semantic Colors

```
info         #5B8B9A   RGB(91, 139, 154)
infoLight    #E1EDF1   RGB(225, 237, 241)

warning      #D4A574   RGB(212, 165, 116)  [Golden]
warningLight #F5E8D8   RGB(245, 232, 216)

error        #C87B7B   RGB(200, 123, 123)
errorLight   #F5E8E8   RGB(245, 232, 232)

success      #2d5e52   RGB(45, 94, 82)     [Primary Light]
successLight #d4e3df   RGB(212, 227, 223)
```

**Usage:**
- Info: Informational messages, tips, help text
- Warning: Caution messages, confirmations needed
- Error: Error states, validation failures
- Success: Completion, achievements, positive feedback

---

### Neutrals

```
cream           #F5F1E8   RGB(245, 241, 232)  [Primary background]
white           #FFFFFF   RGB(255, 255, 255)
backgroundLight #FAF8F3   RGB(250, 248, 243)
backgroundWarm  #F0EDE6   RGB(240, 237, 230)
backgroundGray  #E8E4DC   RGB(232, 228, 220)
border          #E0DCD3   RGB(224, 220, 211)

charcoal    #2D2D2D   RGB(45, 45, 45)
darkGrey    #4A4A4A   RGB(74, 74, 74)
mediumGrey  #757575   RGB(117, 117, 117)
lightGrey   #B8B8B8   RGB(184, 184, 184)
```

**Usage:**
- Background: cream for main app background, white for cards
- Borders: subtle separation between elements
- Dark tones: for text, icons, dark mode (future)

---

### Text Colors

```
textPrimary    #2D2D2D   [Charcoal - main body text]
textSecondary  #5A5A5A   [Darker grey - secondary text]
textTertiary   #8A8A8A   [Medium grey - metadata, timestamps]
textLight      #FFFFFF   [White - text on dark backgrounds]
```

**Contrast Guidelines:**
- Primary text on cream background: 10.8:1 (AAA)
- Secondary text on cream background: 6.2:1 (AA)
- White text on primary green: 4.8:1 (AA)

---

## 📐 Spacing Scale

Consistent spacing creates visual rhythm and hierarchy.

```typescript
xxs:   4px    // Tight spacing (icon padding, inline elements)
xs:    8px    // Minimal spacing (list items, inline gaps)
sm:    12px   // Small spacing (between related elements)
md:    16px   // Default spacing (between components)
lg:    20px   // Large spacing (section padding)
xl:    24px   // Extra large (major sections)
xxl:   32px   // Double extra large (screen padding)
xxxl:  40px   // Triple extra large (hero sections)
xxxxl: 48px   // Quadruple extra large (max spacing)
```

**Usage Guidelines:**
- Use `md` (16px) as default between components
- Use `lg` (20px) for horizontal screen padding
- Use `xxl` (32px) for vertical screen padding (top/bottom)
- Use `xs` or `sm` for tight, related content (form fields, list items)

---

## 🔤 Typography

### Font Families

**Sentient** - Primary font for warmth and personality
- Used for: Headings, body text, letters, journal entries
- Weights: Extralight, Light, Regular, Medium, Bold
- Conveys: Humanity, intimacy, personal connection

**Switzer** - Secondary font for UI clarity
- Used for: Buttons, labels, metadata, system text
- Weights: Thin, Extralight, Light, Regular, Medium, Semibold, Bold, Extrabold, Black
- Conveys: Precision, functionality, modern design

---

### Type Scale

```typescript
// HEADINGS (Sentient)
hero:  34px / 40px line-height   [Sentient Bold]      // Impact headlines
h1:    28px / 36px line-height   [Sentient Bold]      // Page titles
h2:    24px / 32px line-height   [Sentient Medium]    // Section titles
h3:    20px / 28px line-height   [Sentient Medium]    // Subsection titles
h4:    17px / 24px line-height   [Switzer Semibold]   // Card titles, UI headings

// BODY TEXT (Sentient)
bodyLarge: 17px / 26px line-height  [Sentient Regular]  // Emphasized body text
body:      15px / 24px line-height  [Sentient Regular]  // Default body text
bodySmall: 14px / 22px line-height  [Sentient Light]    // Secondary body text

// SPECIAL (Sentient)
letter:    16px / 26px line-height  [Sentient Regular]  // Letters, journals
quote:     18px / 28px line-height  [Sentient Light Italic]  // Pull quotes
emphasis:  15px / 24px line-height  [Sentient Medium Italic] // Inline emphasis

// UI TEXT (Switzer)
label:       14px / 20px line-height  [Switzer Medium]     // Form labels, tags
labelSmall:  12px / 18px line-height  [Switzer Medium]     // Small labels, badges
caption:     13px / 20px line-height  [Switzer Regular]    // Metadata, timestamps
overline:    11px / 16px line-height  [Switzer Semibold]   // Category labels (UPPERCASE)
tiny:        11px / 16px line-height  [Switzer Regular]    // Ultra-small UI text

// BUTTONS (Switzer)
buttonLarge: 17px / 24px line-height  [Switzer Semibold]  // Primary CTAs
button:      15px / 22px line-height  [Switzer Semibold]  // Default buttons
buttonSmall: 13px / 20px line-height  [Switzer Medium]    // Compact buttons
```

---

### Typography Guidelines

**When to use Sentient:**
- All headings (h1-h3)
- All body copy and reading content
- Letters, journals, personal messages
- Quotes and testimonials
- Anything intimate or personal

**When to use Switzer:**
- Buttons and CTAs
- Form labels and input text
- Navigation and tabs
- Metadata (timestamps, counts, badges)
- System messages and alerts

**Accessibility:**
- Minimum body text size: 15px
- Minimum touch target: 44×44px
- Minimum contrast: 4.5:1 (AA standard)

---

## 🔲 Border Radius

Rounded corners create a softer, friendlier aesthetic.

```typescript
xs:   4px    // Subtle rounding (badges, small chips)
sm:   8px    // Small rounding (inputs, small buttons)
md:   12px   // Medium rounding (default cards)
lg:   16px   // Large rounding (prominent cards)
xl:   24px   // Extra large (hero cards, modals)
full: 999px  // Fully rounded (pills, avatars, circular buttons)
```

**Usage:**
- Cards: `md` (12px) or `lg` (16px)
- Buttons: `sm` (8px) for rectangular, `full` for pills
- Inputs: `sm` (8px)
- Badges/Tags: `full` (pill shape)
- Avatars: `full` (circular)

---

## 🌫️ Shadows

Subtle shadows create depth without heaviness.

```typescript
sm: {
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 2,
  elevation: 1,  // Android
}

md: {
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
}

lg: {
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 4,
}

xl: {
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.09,
  shadowRadius: 20,
  elevation: 6,
}
```

**Usage:**
- `sm`: Subtle lift for UI elements (tabs, chips)
- `md`: Default for cards and buttons
- `lg`: Prominent cards (featured content)
- `xl`: Modals, popovers, floating elements

---

## 🧱 Components

### Buttons

#### Primary Button
- Background: `colors.primary`
- Text: `colors.textLight` (white)
- Typography: `typography.button`
- Border Radius: `borderRadius.sm` (8px)
- Padding: Vertical `spacing.sm` (12px), Horizontal `spacing.lg` (20px)
- Shadow: `shadows.md`
- Min Width: 120px
- Min Height: 44px (iOS touch target)

**States:**
- Hover: Background `colors.primaryDark`
- Active: Background `colors.primaryDark` + scale 0.98
- Disabled: Background `colors.lightGrey`, text `colors.mediumGrey`

---

#### Secondary Button
- Background: `transparent`
- Border: 1.5px solid `colors.primary`
- Text: `colors.primary`
- Typography: `typography.button`
- Border Radius: `borderRadius.sm`
- Padding: Same as primary
- Shadow: None
- Min Height: 44px

**States:**
- Hover: Background `colors.primaryLightest`
- Active: Background `colors.primaryLightest` + scale 0.98
- Disabled: Border `colors.lightGrey`, text `colors.mediumGrey`

---

#### Tertiary Button (Text Only)
- Background: `transparent`
- Text: `colors.accent`
- Typography: `typography.button`
- Padding: Vertical `spacing.xs` (8px), Horizontal `spacing.md` (16px)
- Underline on hover
- Min Height: 44px

---

### Cards

#### Standard Card
- Background: `colors.white`
- Border Radius: `borderRadius.md` (12px)
- Padding: `spacing.lg` (20px)
- Shadow: `shadows.md`
- Border: None (shadow provides separation)

**Variants:**
- **Elevated Card:** Use `shadows.lg` for prominence
- **Flat Card:** Use `border: 1px solid colors.border` instead of shadow
- **Colored Card:** Background `colors.cream` or tinted backgrounds

---

#### Behavior Card (Home Screen)
- Background: `colors.white`
- Border Radius: `borderRadius.lg` (16px)
- Padding: `spacing.lg` (20px)
- Shadow: `shadows.md`
- Icon: Circular background with emoji/icon
- Title: `typography.h4`
- Subtitle: `typography.caption` in `colors.textSecondary`

**Layout:**
```
[Icon (44px circle)]  [Title]
                      [Subtitle]
                      [Arrow →]
```

---

### Input Fields

#### Text Input
- Background: `colors.white`
- Border: 1px solid `colors.border`
- Border Radius: `borderRadius.sm` (8px)
- Padding: Vertical `spacing.sm` (12px), Horizontal `spacing.md` (16px)
- Typography: `typography.body`
- Min Height: 48px

**States:**
- Focus: Border `colors.primary`, shadow `shadows.sm`
- Error: Border `colors.error`
- Disabled: Background `colors.backgroundLight`, text `colors.mediumGrey`

**Label:**
- Typography: `typography.label`
- Color: `colors.textSecondary`
- Margin Bottom: `spacing.xs` (8px)

---

### Badges

#### Pill Badge
- Background: `colors.secondaryLight` or semantic color
- Typography: `typography.labelSmall`
- Border Radius: `borderRadius.full`
- Padding: Vertical `spacing.xxs` (4px), Horizontal `spacing.sm` (12px)
- Text Transform: Capitalize

**Variants:**
- **Info:** Background `colors.infoLight`, text `colors.info`
- **Success:** Background `colors.successLight`, text `colors.success`
- **Warning:** Background `colors.warningLight`, text `colors.warning`
- **Error:** Background `colors.errorLight`, text `colors.error`

---

### Icons

#### Icon Style
- Rounded, friendly aesthetic (no harsh corners)
- Consistent stroke width (1.5-2px)
- Simple, recognizable shapes
- Use emoji where appropriate for warmth (💜, 🧘, 💌)

#### Icon Sizes
```typescript
xs:   16px
sm:   20px
md:   24px  // Default
lg:   32px
xl:   48px
xxl:  64px
```

---

### Loading States

#### Skeleton Loader
- Background: Linear gradient animation
- Colors: `colors.backgroundGray` → `colors.backgroundLight` → `colors.backgroundGray`
- Border Radius: Match component being loaded
- Animation Duration: 1.5s infinite

#### Spinner
- Color: `colors.primary` or `colors.white` (on dark backgrounds)
- Size: `md` (24px) default, `lg` (32px) for full-page loading

---

## ✨ Animation Principles

### Timing
- **Fast (200ms):** Micro-interactions (button press, toggle)
- **Medium (300ms):** Standard transitions (modal open, page transition)
- **Slow (500ms):** Dramatic entrances (splash screen, celebration)

### Easing
- **Ease-out:** Default for most animations (natural deceleration)
- **Ease-in-out:** For smooth two-way transitions
- **Spring:** For playful, bouncy effects (celebration, success states)

### Motion Guidelines
- Fade in elements rather than popping them in
- Slide modals from bottom on mobile
- Scale buttons slightly on press (0.98)
- Use subtle spring animations for delightful moments

---

## 📱 Layout Guidelines

### Screen Padding
- Horizontal: `spacing.lg` (20px)
- Vertical (top): `spacing.xxl` (32px) + safe area insets
- Vertical (bottom): `spacing.xxl` (32px) + safe area insets

### Component Spacing
- Between cards: `spacing.md` (16px)
- Between sections: `spacing.xl` (24px)
- Between form fields: `spacing.md` (16px)
- Inside cards: `spacing.lg` (20px)

### Maximum Widths
- Content: 640px (for readability on tablets)
- Forms: 480px (comfortable input width)
- Full-width: Use on mobile, constrain on tablet/desktop

---

## ♿ Accessibility

### Color Contrast
- Body text on background: Minimum 4.5:1 (AA)
- Large text on background: Minimum 3:1 (AA)
- UI controls: Minimum 3:1 (AA)

### Touch Targets
- Minimum size: 44×44px (iOS)
- Minimum size: 48×48px (Android)
- Spacing between targets: Minimum 8px

### Typography
- Minimum body text: 15px
- Support Dynamic Type (iOS)
- Respect user font size preferences

### Focus States
- Always visible focus indicators
- High contrast focus rings (2px solid `colors.primary`)
- Keyboard navigation support

---

## 🎨 Usage Examples

### Importing the Theme

```typescript
import { theme, colors, typography, spacing, borderRadius, shadows } from '../theme';

// Use theme object
<View style={{ backgroundColor: theme.colors.primary }} />

// Or use individual exports
<Text style={{ ...typography.h1, color: colors.textPrimary }}>Title</Text>
```

### Building a Custom Button

```typescript
const buttonStyle = {
  backgroundColor: colors.primary,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  borderRadius: borderRadius.sm,
  minHeight: 44,
  ...shadows.md,
};

const buttonTextStyle = {
  ...typography.button,
  color: colors.textLight,
};
```

### Creating a Card

```typescript
const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  marginBottom: spacing.md,
  ...shadows.md,
};
```

---

## 📚 Design Resources

**Figma Files:**
- Design System Master: [Link to Figma]
- Component Library: [Link to Figma]
- Brand Guidelines: `/Ora 2/02-Brand Bible/`

**Font Files:**
- Sentient: `/Ora 2/01-Fonts/Sentient/`
- Switzer: `/Ora 2/01-Fonts/Switzer/`

**Assets:**
- Brand Assets: `/Ora 2/`
- Stock Photography: `/Ora 2/05-Stock-Photography/`

---

**Document Status:** Ready for Development  
**Last Review:** February 13, 2026  
**Maintained By:** Design & Engineering Teams
