# Typography Integration Guide

Quick start guide for integrating the Ora typography system into your app.

---

## Step 1: Add Font Loading to App Root

Update your `App.tsx` or root component:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useFonts } from './src/hooks/useFonts';

export default function App() {
  const fontsLoaded = useFonts();

  if (!fontsLoaded) {
    // Show loading screen while fonts load
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Your normal app content
  return <AppNavigator />;
}
```

---

## Step 2: Import Typography Components

```tsx
import { H1, H2, Body, ButtonText } from './src/components/common/Typography';
import { colors } from './src/theme';
```

---

## Step 3: Use Typography Components

Replace standard `<Text>` components:

### Before
```tsx
<Text style={{ fontSize: 28, fontWeight: '700', color: '#1d473e' }}>
  Welcome to Ora
</Text>
```

### After
```tsx
<H1 color={colors.primary}>Welcome to Ora</H1>
```

---

## Common Patterns

### Page Header
```tsx
<View>
  <H1 color={colors.primary}>Page Title</H1>
  <Body color={colors.textSecondary}>Subtitle or description</Body>
</View>
```

### Card Content
```tsx
<View style={styles.card}>
  <H3>Card Title</H3>
  <Body>Card description text goes here.</Body>
  <Caption color={colors.textTertiary}>2 hours ago</Caption>
</View>
```

### Button
```tsx
<TouchableOpacity style={styles.button}>
  <ButtonText color={colors.white}>Continue</ButtonText>
</TouchableOpacity>
```

### Letter Content (Intimate/Personal)
```tsx
<Letter>
  Dear future self,
  This is personal content using the letter style...
</Letter>
```

---

## Testing Typography

Navigate to the demo screen to see all variants:

```tsx
import { TypographyDemoScreen } from './src/screens/TypographyDemo';

// Add to navigator
<Stack.Screen name="TypographyDemo" component={TypographyDemoScreen} />
```

---

## Quick Reference

| Component | Use Case |
|-----------|----------|
| `<H1>` | Page titles |
| `<H2>` | Section headers |
| `<H3>` | Subsection titles |
| `<H4>` | Card/UI headings |
| `<Body>` | Default text |
| `<BodySmall>` | Secondary text |
| `<Letter>` | Personal content |
| `<ButtonText>` | Button labels |
| `<Caption>` | Metadata/timestamps |
| `<Label>` | Form labels |

---

## Color Props

All components accept a `color` prop:

```tsx
<H1 color={colors.primary}>Ora Green</H1>
<Body color={colors.textSecondary}>Gray text</Body>
<ButtonText color={colors.white}>White text</ButtonText>
```

Import colors: `import { colors } from './src/theme';`

---

## Custom Styles

You can still add custom styles:

```tsx
<Body style={{ textAlign: 'center', marginTop: 20 }}>
  Centered text with spacing
</Body>
```

---

## TypeScript Support

Full autocomplete for variants:

```tsx
<Typography variant="h1" />  // autocomplete suggests: h1, h2, body, etc.
```

---

For full documentation, see `docs/TYPOGRAPHY.md`
