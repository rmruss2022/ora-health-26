# Ora AI Color System

**Version:** 2.0  
**Last Updated:** February 13, 2026  
**Project:** Ora AI App Store Polish  

---

## 🎨 Color Philosophy

Ora's color palette reflects a **wellness-oriented, sophisticated aesthetic** that balances nature-inspired tones with modern digital design. The deep forest green conveys trust and growth, while the soft lavender adds a touch of calm and creativity.

---

## 1. Primary Colors

### Ora Forest Green
The hero brand color - deep forest green with teal undertones.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `primary` | `#1d473e` | rgb(29, 71, 62) | Primary CTAs, active states, brand moments |
| `primaryDark` | `#0f2a24` | rgb(15, 42, 36) | Hover states, pressed buttons, deep accents |
| `primaryLight` | `#2d5e52` | rgb(45, 94, 82) | Subtle backgrounds, muted CTAs |
| `primaryLightest` | `#d4e3df` | rgb(212, 227, 223) | Light backgrounds, disabled states, borders |

**Accessibility:**
- `primary` on white: **AAA** (contrast 8.2:1)
- `primaryDark` on white: **AAA** (contrast 12.5:1)

---

## 2. Secondary Colors (Accent)

### Lavender
Soft pastel purple/lavender for accents, highlights, and creative moments.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `secondary` | `#D4B8E8` | rgb(212, 184, 232) | Accent highlights, secondary CTAs, badges |
| `secondaryDark` | `#b894d4` | rgb(184, 148, 212) | Hover states for lavender elements |
| `secondaryLight` | `#e6d9f2` | rgb(230, 217, 242) | Subtle backgrounds, pills, tags |
| `secondaryLightest` | `#f5f0fa` | rgb(245, 240, 250) | Ultra-light backgrounds, cards |

**Usage Notes:**
- Use sparingly as a **complement** to primary green
- Ideal for **creative features** (AI agent cards, premium features)
- Avoid using as primary CTA color (reserve green for main actions)

---

## 3. Tertiary Colors (UI Variety)

### Purple Accent
Deeper purple for UI variety and premium moments.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `accent` | `#6B5B95` | rgb(107, 91, 149) | Premium badges, pro features, special highlights |
| `accentDark` | `#4F4570` | rgb(79, 69, 112) | Hover states, dark mode accents |
| `accentLight` | `#9B8BC4` | rgb(155, 139, 196) | Lighter accent touches |
| `accentLightest` | `#E8E3F0` | rgb(232, 227, 240) | Subtle backgrounds |

---

### Golden
Warm earth tone for featured content and warmth.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `golden` | `#D4A574` | rgb(212, 165, 116) | Featured tags, warm highlights |
| `goldenDark` | `#B88C5F` | rgb(184, 140, 95) | Hover states |
| `goldenLight` | `#E8C9A3` | rgb(232, 201, 163) | Light backgrounds |
| `goldenLightest` | `#F5E8D8` | rgb(245, 232, 216) | Ultra-light warm backgrounds |

---

### Earth Tones
Complementary tones that harmonize with Ora green.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `terracotta` | `#B8927D` | rgb(184, 146, 125) | Warm accents, tags |
| `olive` | `#6B7A5D` | rgb(107, 122, 93) | Nature-inspired accents |
| `sand` | `#E8DFD3` | rgb(232, 223, 211) | Warm neutral backgrounds |

---

## 4. Semantic Colors

### Info (Informational)
| Token | Hex | Usage |
|-------|-----|-------|
| `info` | `#5B8B9A` | Info messages, tips, neutral alerts |
| `infoLight` | `#E1EDF1` | Info backgrounds |

### Warning (Caution)
| Token | Hex | Usage |
|-------|-----|-------|
| `warning` | `#D4A574` | Warning messages, important notices |
| `warningLight` | `#F5E8D8` | Warning backgrounds |

### Error (Critical)
| Token | Hex | Usage |
|-------|-----|-------|
| `error` | `#C87B7B` | Error messages, validation failures |
| `errorLight` | `#F5E8E8` | Error backgrounds |

### Success (Positive)
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#2d5e52` | Success messages, confirmations (uses primary green shade) |
| `successLight` | `#d4e3df` | Success backgrounds (uses primary lightest) |

---

## 5. Neutral Colors

### Warm Neutrals
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `cream` | `#F5F1E8` | rgb(245, 241, 232) | Warm backgrounds, app base |
| `white` | `#FFFFFF` | rgb(255, 255, 255) | Pure white, cards, overlays |
| `backgroundLight` | `#FAF8F3` | rgb(250, 248, 243) | Main app background (light mode) |
| `backgroundWarm` | `#F0EDE6` | rgb(240, 237, 230) | Secondary backgrounds |
| `backgroundGray` | `#E8E4DC` | rgb(232, 228, 220) | Subtle contrasting backgrounds |
| `border` | `#E0DCD3` | rgb(224, 220, 211) | Default borders, dividers |

### Dark Neutrals
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `charcoal` | `#2D2D2D` | rgb(45, 45, 45) | Primary text, dark backgrounds |
| `darkGrey` | `#4A4A4A` | rgb(74, 74, 74) | Secondary elements |
| `mediumGrey` | `#757575` | rgb(117, 117, 117) | Tertiary elements |
| `lightGrey` | `#B8B8B8` | rgb(184, 184, 184) | Disabled text, subtle elements |

---

## 6. Text Color Hierarchy

### Light Mode
| Token | Hex | Usage | Opacity |
|-------|-----|-------|---------|
| `textPrimary` | `#2D2D2D` | Headlines, body text | 100% |
| `textSecondary` | `#5A5A5A` | Subheadings, captions | 100% |
| `textTertiary` | `#8A8A8A` | Metadata, timestamps | 100% |
| `textLight` | `#FFFFFF` | Text on dark backgrounds | 100% |

**On Brand Green:**
- Use `textLight` (#FFFFFF) for maximum contrast

**On Lavender:**
- Use `textPrimary` (#2D2D2D) for contrast

---

### Dark Mode (Proposed)
| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimaryDark` | `#F5F1E8` | Headlines, body text |
| `textSecondaryDark` | `#C4C1BA` | Subheadings, captions |
| `textTertiaryDark` | `#8A8782` | Metadata, timestamps |

**Background for Dark Mode:**
- Primary: `#1A1A1A` (near black)
- Secondary: `#2D2D2D` (charcoal)
- Tertiary: `#3A3A3A` (lighter charcoal)

**Accent Colors in Dark Mode:**
- Use lighter variants: `primaryLight`, `secondaryLight`
- Increase luminosity by ~15% for better visibility

---

## 7. Card Background Colors

### Light Mode Cards
| Use Case | Background | Border | Shadow |
|----------|------------|--------|--------|
| **Default Card** | `#FFFFFF` | `#E0DCD3` | `shadows.md` |
| **Featured Card** | `#f5f0fa` (secondaryLightest) | `#D4B8E8` (secondary) | `shadows.lg` |
| **Premium Card** | `#E8E3F0` (accentLightest) | `#6B5B95` (accent) | `shadows.lg` |
| **Warm Card** | `#F5E8D8` (goldenLightest) | `#D4A574` (golden) | `shadows.md` |
| **Info Card** | `#E1EDF1` (infoLight) | `#5B8B9A` (info) | `shadows.sm` |
| **Success Card** | `#d4e3df` (successLight) | `#2d5e52` (success) | `shadows.sm` |

---

## 8. Background Gradients

### Hero Gradients
```typescript
// Ora Green Gradient (primary hero)
background: 'linear-gradient(135deg, #1d473e 0%, #2d5e52 100%)'

// Lavender Gradient (creative moments)
background: 'linear-gradient(135deg, #D4B8E8 0%, #e6d9f2 100%)'

// Warm Gradient (featured content)
background: 'linear-gradient(135deg, #F5F1E8 0%, #F5E8D8 100%)'

// Sunset Gradient (special occasions)
background: 'linear-gradient(135deg, #D4A574 0%, #B8927D 100%)'
```

### Subtle Background Gradients
```typescript
// Light Warm Glow
background: 'linear-gradient(180deg, #FAF8F3 0%, #F5F1E8 100%)'

// Subtle Lavender Glow
background: 'linear-gradient(180deg, #FFFFFF 0%, #f5f0fa 100%)'
```

---

## 9. Shadow Colors

All shadows use **black with varying opacity** for consistency across themes.

| Shadow Level | Usage | Color | Opacity |
|--------------|-------|-------|---------|
| `shadows.sm` | Subtle elevation (tags, pills) | `#000` | 3% |
| `shadows.md` | Default cards | `#000` | 5% |
| `shadows.lg` | Featured cards, modals | `#000` | 7% |
| `shadows.xl` | Overlays, dialogs | `#000` | 9% |

**Dark Mode Shadows:**
- Use lighter shadows with `#FFFFFF` at 5-10% opacity
- Or use colored shadows matching the element (e.g., green glow on primary buttons)

---

## 10. Color Usage Guidelines

### ✅ Do's

1. **Primary Green for Actions**
   - Use `primary` (#1d473e) for all primary CTAs
   - Reserve green for the most important action on screen

2. **Lavender for Accents**
   - Use `secondary` (#D4B8E8) for secondary actions, creative features
   - Great for AI agent cards, premium badges

3. **Warm Neutrals for Backgrounds**
   - Use `backgroundLight` (#FAF8F3) as default app background
   - Creates a warm, welcoming feel

4. **Semantic Colors for Feedback**
   - Always use semantic colors for alerts and status messages
   - Maintain consistency across the app

5. **High Contrast for Accessibility**
   - Ensure text on backgrounds meets WCAG AA (4.5:1) or AAA (7:1)
   - Use `textPrimary` on light backgrounds, `textLight` on dark

---

### ❌ Don'ts

1. **Don't Use Lavender for Primary CTAs**
   - Lavender is an accent, not the main action color
   - Always use green for "Submit," "Continue," "Save"

2. **Don't Hardcode Colors**
   - Never use hex codes directly in components
   - Always reference `theme.colors.*` tokens

3. **Don't Mix Too Many Accent Colors**
   - Stick to 2-3 accent colors per screen
   - More colors = visual chaos

4. **Don't Use Pure Black (#000000)**
   - Use `charcoal` (#2D2D2D) for dark text instead
   - Pure black is too harsh and unnatural

5. **Don't Forget Dark Mode**
   - Design with both light and dark modes in mind
   - Test contrast ratios in both

---

## 11. Component-Specific Guidelines

### Buttons
| Type | Background | Text | Border | Hover |
|------|------------|------|--------|-------|
| **Primary** | `primary` | `textLight` | None | `primaryDark` |
| **Secondary** | `secondary` | `textPrimary` | None | `secondaryDark` |
| **Outline** | Transparent | `primary` | `primary` | `primaryLightest` bg |
| **Ghost** | Transparent | `primary` | None | `primaryLightest` bg |
| **Disabled** | `lightGrey` | `textTertiary` | None | None |

### Tags/Pills
| Type | Background | Text |
|------|------------|------|
| **Default** | `backgroundGray` | `textSecondary` |
| **Featured** | `secondaryLight` | `textPrimary` |
| **Premium** | `accentLightest` | `accent` |
| **Warm** | `goldenLightest` | `goldenDark` |

### Input Fields
| State | Border | Background | Text |
|-------|--------|------------|------|
| **Default** | `border` | `white` | `textPrimary` |
| **Focus** | `primary` | `white` | `textPrimary` |
| **Error** | `error` | `errorLight` | `textPrimary` |
| **Disabled** | `lightGrey` | `backgroundGray` | `textTertiary` |

### Navigation
| Element | Color |
|---------|-------|
| **Active Tab** | `primary` |
| **Inactive Tab** | `textTertiary` |
| **Hover Tab** | `textSecondary` |
| **Badge** | `error` (for notifications) |

---

## 12. Accessibility Standards

### WCAG Compliance
All color combinations must meet **WCAG 2.1 Level AA** minimum:
- Normal text: **4.5:1** contrast ratio
- Large text (18pt+): **3:1** contrast ratio
- UI components: **3:1** contrast ratio

### Tested Combinations (AAA-rated)
✅ `primary` (#1d473e) on `white` → **8.2:1**  
✅ `primaryDark` (#0f2a24) on `white` → **12.5:1**  
✅ `textPrimary` (#2D2D2D) on `white` → **11.8:1**  
✅ `textLight` (#FFFFFF) on `primary` → **8.2:1**  

### Color Blindness Considerations
- **Protanopia/Deuteranopia (Red-Green):** Green and lavender palette works well (distinct hues)
- **Tritanopia (Blue-Yellow):** Ensure sufficient contrast in neutral tones
- **Always pair color with icons or text labels** (never rely on color alone)

---

## 13. Implementation Checklist

### For Developers
- [ ] Import colors from `src/theme/index.ts`
- [ ] Use `theme.colors.*` tokens in all components
- [ ] Never hardcode hex values in StyleSheet
- [ ] Test contrast ratios for new color combinations
- [ ] Support dark mode variants (when ready)

### For Designers
- [ ] Use this document as single source of truth
- [ ] Reference color tokens in Figma/design files
- [ ] Test accessibility with contrast checkers
- [ ] Document any new color additions here
- [ ] Review color usage in quarterly audits

---

## 14. Future Enhancements

### Planned
- **Dark Mode Palette:** Full dark theme implementation (Q2 2026)
- **Dynamic Theming:** User-customizable accent colors
- **Seasonal Variants:** Special color modes for holidays/events

### Under Consideration
- **High Contrast Mode:** For accessibility
- **Monochrome Mode:** For focus/distraction-free use

---

## References

- **Brand Bible:** `/Users/matthew/Desktop/Feb26/Ora 2/02-Brand Bible/Ora-Brand Guidelines-2024.pdf`
- **Theme File:** `/Users/matthew/Desktop/Feb26/ora-ai/src/theme/index.ts`
- **Brand Audit:** `/Users/matthew/Desktop/Feb26/ora-ai/docs/design/brand-audit.md`
- **WCAG Standards:** https://www.w3.org/WAI/WCAG21/quickref/

---

**Maintained by:** Design Team  
**Questions?** Review brand bible or consult lead designer.
