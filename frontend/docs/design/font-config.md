# Font Configuration Guide - Ora AI App

**Fonts:** Sentient & Switzer  
**Format:** OpenType (.otf)  
**Location:** `/Users/matthew/Desktop/Feb26/ora-ai/assets/fonts/`

---

## 📦 Step 1: Install Dependencies

```bash
npx expo install expo-font
```

---

## 📝 Step 2: Update `app.json`

Add custom fonts to your Expo configuration:

```json
{
  "expo": {
    "name": "Ora AI",
    "slug": "ora-ai",
    "plugins": [
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/Sentient-Extralight.otf",
            "./assets/fonts/Sentient-ExtralightItalic.otf",
            "./assets/fonts/Sentient-Light.otf",
            "./assets/fonts/Sentient-LightItalic.otf",
            "./assets/fonts/Sentient-Regular.otf",
            "./assets/fonts/Sentient-Italic.otf",
            "./assets/fonts/Sentient-Medium.otf",
            "./assets/fonts/Sentient-MediumItalic.otf",
            "./assets/fonts/Sentient-Bold.otf",
            "./assets/fonts/Sentient-BoldItalic.otf",
            "./assets/fonts/Switzer-Thin.otf",
            "./assets/fonts/Switzer-ThinItalic.otf",
            "./assets/fonts/Switzer-Extralight.otf",
            "./assets/fonts/Switzer-ExtralightItalic.otf",
            "./assets/fonts/Switzer-Light.otf",
            "./assets/fonts/Switzer-LightItalic.otf",
            "./assets/fonts/Switzer-Regular.otf",
            "./assets/fonts/Switzer-Italic.otf",
            "./assets/fonts/Switzer-Medium.otf",
            "./assets/fonts/Switzer-MediumItalic.otf",
            "./assets/fonts/Switzer-Semibold.otf",
            "./assets/fonts/Switzer-SemiboldItalic.otf",
            "./assets/fonts/Switzer-Bold.otf",
            "./assets/fonts/Switzer-BoldItalic.otf",
            "./assets/fonts/Switzer-Extrabold.otf",
            "./assets/fonts/Switzer-ExtraboldItalic.otf",
            "./assets/fonts/Switzer-Black.otf",
            "./assets/fonts/Switzer-BlackItalic.otf"
          ]
        }
      ]
    ]
  }
}
```

---

## 🎨 Step 3: Load Fonts in App Component

Update your `App.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Sentient Family
          'Sentient-Extralight': require('./assets/fonts/Sentient-Extralight.otf'),
          'Sentient-ExtralightItalic': require('./assets/fonts/Sentient-ExtralightItalic.otf'),
          'Sentient-Light': require('./assets/fonts/Sentient-Light.otf'),
          'Sentient-LightItalic': require('./assets/fonts/Sentient-LightItalic.otf'),
          'Sentient-Regular': require('./assets/fonts/Sentient-Regular.otf'),
          'Sentient-Italic': require('./assets/fonts/Sentient-Italic.otf'),
          'Sentient-Medium': require('./assets/fonts/Sentient-Medium.otf'),
          'Sentient-MediumItalic': require('./assets/fonts/Sentient-MediumItalic.otf'),
          'Sentient-Bold': require('./assets/fonts/Sentient-Bold.otf'),
          'Sentient-BoldItalic': require('./assets/fonts/Sentient-BoldItalic.otf'),
          
          // Switzer Family
          'Switzer-Thin': require('./assets/fonts/Switzer-Thin.otf'),
          'Switzer-ThinItalic': require('./assets/fonts/Switzer-ThinItalic.otf'),
          'Switzer-Extralight': require('./assets/fonts/Switzer-Extralight.otf'),
          'Switzer-ExtralightItalic': require('./assets/fonts/Switzer-ExtralightItalic.otf'),
          'Switzer-Light': require('./assets/fonts/Switzer-Light.otf'),
          'Switzer-LightItalic': require('./assets/fonts/Switzer-LightItalic.otf'),
          'Switzer-Regular': require('./assets/fonts/Switzer-Regular.otf'),
          'Switzer-Italic': require('./assets/fonts/Switzer-Italic.otf'),
          'Switzer-Medium': require('./assets/fonts/Switzer-Medium.otf'),
          'Switzer-MediumItalic': require('./assets/fonts/Switzer-MediumItalic.otf'),
          'Switzer-Semibold': require('./assets/fonts/Switzer-Semibold.otf'),
          'Switzer-SemiboldItalic': require('./assets/fonts/Switzer-SemiboldItalic.otf'),
          'Switzer-Bold': require('./assets/fonts/Switzer-Bold.otf'),
          'Switzer-BoldItalic': require('./assets/fonts/Switzer-BoldItalic.otf'),
          'Switzer-Extrabold': require('./assets/fonts/Switzer-Extrabold.otf'),
          'Switzer-ExtraboldItalic': require('./assets/fonts/Switzer-ExtraboldItalic.otf'),
          'Switzer-Black': require('./assets/fonts/Switzer-Black.otf'),
          'Switzer-BlackItalic': require('./assets/fonts/Switzer-BlackItalic.otf'),
        });
        
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Or a custom loading component
  }

  return (
    // Your app content
  );
}
```

---

## 🖋️ Step 4: Use Fonts in Components

### Option A: Direct Font Family Names

```typescript
import { Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  heading: {
    fontFamily: 'Sentient-Bold',
    fontSize: 28,
  },
  body: {
    fontFamily: 'Sentient-Regular',
    fontSize: 15,
  },
  button: {
    fontFamily: 'Switzer-Semibold',
    fontSize: 16,
  },
});

export const MyComponent = () => (
  <>
    <Text style={styles.heading}>Heading Text</Text>
    <Text style={styles.body}>Body text goes here</Text>
  </>
);
```

### Option B: Typography Theme Helper

Create `src/theme/typography-helper.ts`:

```typescript
export const getFontFamily = (
  family: 'sentient' | 'switzer',
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 = 400,
  italic: boolean = false
): string => {
  if (family === 'sentient') {
    const weights = {
      100: 'Extralight',
      200: 'Extralight', // Sentient doesn't have 200
      300: 'Light',
      400: 'Regular',
      500: 'Medium',
      600: 'Medium', // Sentient doesn't have 600
      700: 'Bold',
      800: 'Bold', // Sentient doesn't have 800/900
      900: 'Bold',
    };
    const weightName = weights[weight];
    return `Sentient-${weightName}${italic ? 'Italic' : ''}`;
  } else {
    const weights = {
      100: 'Thin',
      200: 'Extralight',
      300: 'Light',
      400: 'Regular',
      500: 'Medium',
      600: 'Semibold',
      700: 'Bold',
      800: 'Extrabold',
      900: 'Black',
    };
    const weightName = weights[weight];
    return `Switzer-${weightName}${italic ? 'Italic' : ''}`;
  }
};
```

**Usage:**

```typescript
import { getFontFamily } from './src/theme/typography-helper';

const styles = StyleSheet.create({
  heading: {
    fontFamily: getFontFamily('sentient', 700), // Sentient-Bold
  },
  body: {
    fontFamily: getFontFamily('sentient', 400), // Sentient-Regular
  },
  buttonText: {
    fontFamily: getFontFamily('switzer', 600), // Switzer-Semibold
  },
});
```

---

## 📋 Font Weight Reference

### Sentient Available Weights
- **100-200:** Extralight
- **300:** Light
- **400:** Regular *(default body text)*
- **500:** Medium *(sub-headings)*
- **600-700:** Bold *(headings)*
- **800-900:** Bold

### Switzer Available Weights
- **100:** Thin
- **200:** Extralight
- **300:** Light
- **400:** Regular *(default UI text)*
- **500:** Medium
- **600:** Semibold *(buttons)*
- **700:** Bold
- **800:** Extrabold
- **900:** Black *(impact headings)*

---

## ✅ Recommended Usage

| Element | Font | Weight | Example |
|---------|------|--------|---------|
| **Hero Title** | Sentient | Bold (700) | App name, splash screen |
| **H1 Headings** | Sentient | Bold (700) | Page titles |
| **H2 Headings** | Sentient | Medium (500) | Section headers |
| **H3 Headings** | Sentient | Medium (500) | Card titles |
| **Body Text** | Sentient | Regular (400) | Paragraphs, descriptions |
| **Small Text** | Sentient | Light (300) | Captions, helper text |
| **Button Text** | Switzer | Semibold (600) | Primary actions |
| **Tab Labels** | Switzer | Medium (500) | Navigation |
| **Input Labels** | Switzer | Regular (400) | Form fields |
| **Micro-copy** | Switzer | Light (300) | Timestamps, metadata |

---

## 🚨 Common Issues

### Issue: Fonts not loading on iOS
**Solution:** Make sure `.otf` files are included in your Xcode project. Run:
```bash
npx expo prebuild --clean
```

### Issue: Fonts not loading on Android
**Solution:** Verify font files are in `assets/fonts/` and rebuild:
```bash
npx expo run:android
```

### Issue: Font names don't match
**Solution:** Use the exact font family names as listed above. Font names are case-sensitive.

### Issue: Fonts look different on iOS vs Android
**Solution:** This is expected. OTF rendering varies slightly. Test on both platforms during design QA.

---

## 🔗 Next Steps

1. ✅ Verify fonts are in `/assets/fonts/`
2. ⏳ Install `expo-font` dependency
3. ⏳ Update `app.json` with font paths
4. ⏳ Load fonts in `App.tsx`
5. ⏳ Update theme file with font family references
6. ⏳ Test on iOS and Android devices
7. ⏳ Update all Text components to use new fonts

---

**Reference:** [Expo Font Documentation](https://docs.expo.dev/versions/latest/sdk/font/)
