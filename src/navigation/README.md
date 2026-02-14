# Navigation Configuration

Custom transition animations for Ora AI wellness app.

## Available Transitions

### 1. Horizontal Slide (Default)
**Usage**: Standard forward navigation (e.g., list → detail)

```tsx
import { horizontalSlideConfig } from './navigationConfig';

<Stack.Screen 
  name="Details" 
  component={DetailsScreen}
  options={horizontalSlideConfig}
/>
```

**Effect**: iOS-style horizontal slide with spring animation

---

### 2. Fade Transition
**Usage**: Tab switches, non-directional transitions

```tsx
import { fadeConfig } from './navigationConfig';

<Stack.Screen 
  name="Profile" 
  component={ProfileScreen}
  options={fadeConfig}
/>
```

**Effect**: Smooth opacity fade (no slide)

---

### 3. Modal Slide-Up
**Usage**: Compose screens, create actions, forms

```tsx
import { modalSlideConfig } from './navigationConfig';

<Stack.Screen 
  name="Compose" 
  component={ComposeScreen}
  options={modalSlideConfig}
/>
```

**Effect**: Vertical slide from bottom, modal presentation

---

### 4. Reveal from Bottom
**Usage**: Sheets, panels, selectors

```tsx
import { revealFromBottomConfig } from './navigationConfig';

<Stack.Screen 
  name="Settings" 
  component={SettingsSheet}
  options={revealFromBottomConfig}
/>
```

**Effect**: Transparent backdrop with bottom sheet

---

### 5. Scale from Center
**Usage**: Detail views, media viewers

```tsx
import { scaleFromCenterConfig } from './navigationConfig';

<Stack.Screen 
  name="ImageDetail" 
  component={ImageDetailScreen}
  options={scaleFromCenterConfig}
/>
```

**Effect**: Scales up from center point

---

## Quick Setup

Use the `getScreenOptions` helper:

```tsx
import { getScreenOptions } from './navigationConfig';

// For modals
<Stack.Screen 
  name="Compose" 
  component={ComposeScreen}
  options={getScreenOptions('modal')}
/>

// For tab switches
<Tab.Screen 
  name="Home" 
  component={HomeScreen}
  options={getScreenOptions('tab')}
/>

// For detail views
<Stack.Screen 
  name="Details" 
  component={DetailsScreen}
  options={getScreenOptions('detail')}
/>

// For default navigation
<Stack.Screen 
  name="Screen" 
  component={ScreenComponent}
  options={getScreenOptions('default')}
/>
```

---

## Animation Timing

| Transition | Open Duration | Close Duration | Spring/Timing |
|------------|--------------|----------------|---------------|
| Horizontal Slide | ~300ms | ~250ms | Spring |
| Fade | 250ms | 200ms | Timing |
| Modal Slide | ~300ms | ~250ms | Spring |
| Reveal Bottom | 300ms | 250ms | Timing |
| Scale Center | 300ms | 250ms | Timing |

---

## Customization

### Adjust Spring Animations

```tsx
export const customSlideConfig = {
  ...horizontalSlideConfig,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 800,    // Lower = slower
        damping: 400,       // Higher = less bounce
        mass: 2,            // Higher = heavier feeling
      },
    },
    // ... close config
  },
};
```

### Adjust Timing Animations

```tsx
export const customFadeConfig = {
  ...fadeConfig,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 350,    // Milliseconds
      },
    },
    // ... close config
  },
};
```

---

## Best Practices

1. **Horizontal Slide**: Use for hierarchical navigation (list → detail, parent → child)
2. **Fade**: Use for same-level transitions (tab switches, profile → settings)
3. **Modal Slide**: Use for create/compose actions, temporary flows
4. **Reveal Bottom**: Use for sheets, pickers, non-critical actions
5. **Scale Center**: Use for media zoom, detail emphasis

---

## Platform Differences

iOS and Android have different native feels. The config auto-adapts:
- iOS: Prefers spring animations, horizontal gestures
- Android: Prefers timing animations, fade transitions

Platform-specific presets available via `platformPreset`.

---

## Integration Points

Apply these configs in:
- `AppNavigator.tsx` (main stack navigator)
- `TabNavigator.tsx` (bottom tabs)
- `AuthNavigator.tsx` (auth flow)
- Modal screens (compose, settings, etc.)

---

## Performance Tips

1. **Reduce animation duration** for faster navigation
2. **Disable gestures** on high-frequency transitions
3. **Use `cardOverlayEnabled: false`** when overlay not needed
4. **Prefer timing over spring** for complex screens

---

## Accessibility

All transition configs respect:
- Reduced motion preferences (`AccessibilityInfo.isReduceMotionEnabled`)
- Screen reader navigation
- Keyboard/voice control

When reduced motion is enabled, transitions automatically simplify to fades.
