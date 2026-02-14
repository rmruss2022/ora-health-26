# Ora AI Typography System

**Status:** ✅ Configured and Ready  
**Task:** ORA-068  
**Date:** February 13, 2026

---

## Overview

The Ora AI app uses a dual-font typography system based on the Ora Brand Guidelines 2024:

- **Sentient**: Primary display and body font — brings warmth and humanity
- **Switzer**: Secondary UI and system font — provides clarity and precision

---

## Font Files

**Location:** `/assets/fonts/`

### Sentient Family (10 weights)
- Sentient-Extralight.otf
- Sentient-ExtralightItalic.otf
- Sentient-Light.otf
- Sentient-LightItalic.otf
- Sentient-Regular.otf
- Sentient-Italic.otf
- Sentient-Medium.otf
- Sentient-MediumItalic.otf
- Sentient-Bold.otf
- Sentient-BoldItalic.otf

### Switzer Family (18 weights)
- Switzer-Thin.otf → Switzer-Black.otf
- Full range from Thin (100) to Black (900)
- Italic variants for each weight

---

## Implementation

### 1. Font Loading Hook

**File:** `src/hooks/useFonts.ts`

```tsx
import { useFonts } from '../hooks/useFonts';

function App() {
  const fontsLoaded = useFonts();
  
  if (!fontsLoaded) {
    return <LoadingScreen />;
  }
  
  return <AppContent />;
}
```

### 2. Typography System

**File:** `src/theme/typography.ts`

Exports:
- `typography` — All text style definitions
- `fontFamilies` — Font name mappings
- `textVariants` — Quick access presets

### 3. Typography Components

**File:** `src/components/common/Typography.tsx`

Two usage patterns:

#### Generic Component

```tsx
<Typography variant="h1">Title</Typography>
<Typography variant="body" color="#1d473e">Body text</Typography>
<Typography preset="pageTitle">Quick preset</Typography>
```

#### Semantic Components

```tsx
<H1>Page Title</H1>
<H2>Section Title</H2>
<Body>Body text content</Body>
<Letter>Dear future self...</Letter>
<ButtonText>Click Me</ButtonText>
```

---

## Typography Variants

### Display & Headings (Sentient)

| Variant | Font | Size | Line Height | Usage |
|---------|------|------|-------------|-------|
| `hero` | Sentient-Bold | 34px | 40px | Hero headlines |
| `h1` | Sentient-Bold | 28px | 36px | Page titles |
| `h2` | Sentient-Medium | 24px | 32px | Section titles |
| `h3` | Sentient-Medium | 20px | 28px | Subsection titles |
| `h4` | Switzer-Semibold | 17px | 24px | Card/UI headings |

### Body Text (Sentient)

| Variant | Font | Size | Line Height | Usage |
|---------|------|------|-------------|-------|
| `bodyLarge` | Sentient-Regular | 17px | 26px | Intro paragraphs |
| `body` | Sentient-Regular | 15px | 24px | Default body text |
| `bodySmall` | Sentient-Light | 14px | 22px | Secondary text |

### Special Content (Sentient)

| Variant | Font | Size | Line Height | Usage |
|---------|------|------|-------------|-------|
| `letter` | Sentient-Regular | 16px | 26px | Personal letters, journals |
| `quote` | Sentient-LightItalic | 18px | 28px | Pull quotes, testimonials |
| `emphasis` | Sentient-MediumItalic | 15px | 24px | Inline emphasis |

### UI Elements (Switzer)

| Variant | Font | Size | Line Height | Usage |
|---------|------|------|-------------|-------|
| `caption` | Switzer-Regular | 13px | 20px | Metadata, timestamps |
| `label` | Switzer-Medium | 14px | 20px | Form labels, tags |
| `labelSmall` | Switzer-Medium | 12px | 18px | Badges, small labels |
| `overline` | Switzer-Semibold | 11px | 16px | Category labels (UPPERCASE) |
| `tiny` | Switzer-Regular | 11px | 16px | Ultra-small UI text |

### Buttons (Switzer)

| Variant | Font | Size | Line Height | Usage |
|---------|------|------|-------------|-------|
| `buttonLarge` | Switzer-Semibold | 17px | 24px | Primary CTAs |
| `button` | Switzer-Semibold | 15px | 22px | Default buttons |
| `buttonSmall` | Switzer-Medium | 13px | 20px | Compact buttons |

---

## Brand Colors

Use with typography for brand consistency:

```tsx
import { colors } from '../theme';

<H1 color={colors.primary}>Ora Green Title</H1>
<Body color={colors.textSecondary}>Secondary text</Body>
<ButtonText color={colors.white}>Button on primary bg</ButtonText>
```

### Key Colors
- **Primary (Ora Green):** `#1d473e`
- **Secondary (Lavender):** `#D4B8E8`
- **Text Primary:** `#2D2D2D`
- **Text Secondary:** `#5A5A5A`

---

## Best Practices

### 1. Font Pairing Rules

**Use Sentient for:**
- Page titles and headlines
- Body content and paragraphs
- Personal, intimate content (letters, journals)
- Anything that should feel warm and human

**Use Switzer for:**
- Navigation and UI chrome
- Buttons and interactive elements
- Labels, captions, and metadata
- System messages and timestamps

### 2. Letter-Specific Content

For user-written letters and intimate content, always use the `letter` variant:

```tsx
<Letter>
  Dear future self,
  This uses Sentient Regular with increased letter spacing...
</Letter>
```

### 3. Responsive Typography

All variants use pixel values. For responsive scaling, wrap text in appropriate containers or adjust based on screen size:

```tsx
const isSmallScreen = Dimensions.get('window').width < 375;

<Typography 
  variant={isSmallScreen ? "h2" : "h1"}
  color={colors.primary}
>
  Adaptive Title
</Typography>
```

### 4. Color Combinations

Maintain sufficient contrast ratios:

| Background | Recommended Text Color |
|------------|------------------------|
| White/Cream | `textPrimary` (#2D2D2D) |
| Primary Green | `white` (#FFFFFF) |
| Lavender | `textPrimary` or `primary` |
| Dark backgrounds | `white` (#FFFFFF) |

---

## Testing

### View All Typography Variants

**File:** `src/screens/TypographyDemo.tsx`

Import the demo screen in your navigator:

```tsx
import { TypographyDemoScreen } from './screens/TypographyDemo';

// Add to your stack/tab navigator
<Stack.Screen name="TypographyDemo" component={TypographyDemoScreen} />
```

Navigate to `/TypographyDemo` to see all variants in action.

---

## Migration Guide

### Replacing Old Text Components

**Before:**
```tsx
<Text style={{ fontSize: 28, fontWeight: '700' }}>Title</Text>
```

**After:**
```tsx
<H1>Title</H1>
// or
<Typography variant="h1">Title</Typography>
```

### Inline Styles

You can still use custom styles:

```tsx
<Body style={{ textAlign: 'center', marginTop: 20 }}>
  Centered text with margin
</Body>
```

### Accessible Text

All typography components accept standard React Native Text props:

```tsx
<H1 
  accessibilityLabel="Page title"
  accessibilityRole="header"
  numberOfLines={2}
>
  Truncated Title
</H1>
```

---

## Files Structure

```
src/
├── hooks/
│   └── useFonts.ts          # Font loading hook
├── theme/
│   ├── typography.ts         # Typography definitions
│   └── index.ts             # Main theme export
├── components/
│   └── common/
│       └── Typography.tsx   # Typography components
└── screens/
    └── TypographyDemo.tsx   # Demo/testing screen

assets/
└── fonts/
    ├── Sentient-*.otf       # 10 Sentient font files
    └── Switzer-*.otf        # 18 Switzer font files

docs/
└── TYPOGRAPHY.md            # This file
```

---

## Troubleshooting

### Fonts Not Loading

1. Verify fonts are in `/assets/fonts/`
2. Check `useFonts()` returns `true`
3. Ensure `expo-font` is installed
4. Check console for font loading errors

### Font Not Displaying

1. Confirm font family name matches exactly (case-sensitive)
2. Use Typography component instead of raw Text
3. Check if fonts are loaded before rendering

### Wrong Font Weight

Expo requires explicit font files for each weight. Use the correct variant:
- ❌ `fontWeight: '700'` (won't work)
- ✅ `fontFamily: 'Sentient-Bold'` (correct)

---

## Resources

- **Brand Guidelines:** `/Users/matthew/Desktop/Feb26/Ora 2/02-Brand Bible/`
- **Font Files:** `/Users/matthew/Desktop/Feb26/Ora 2/04-Fonts/`
- **Brand Audit:** `/docs/design/brand-audit.md`

---

**Configured by:** iOS-Dev-Agent  
**Task:** ORA-068  
**Status:** ✅ Complete
