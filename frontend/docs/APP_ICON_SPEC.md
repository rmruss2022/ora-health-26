# Ora AI App Icon Design Specification
**Task:** ORA-091 - Design app icon (light and dark variants)  
**Due:** Pre-submission  
**Status:** Ready for design

## Design Requirements

### Icon Concept
The Ora AI app icon should be:
- **Simple & Memorable:** Recognizable at all sizes (from 20x20 to 1024x1024)
- **Brand-Aligned:** Uses Ora 2 brand colors and aesthetic
- **Symbolic:** Represents wellness, growth, and AI companion
- **Clean:** No text, pure visual symbol
- **Versatile:** Works in both light and dark mode

### Visual Direction Options

#### Option 1: Abstract Bloom
- Central circular gradient (sage → olive → cream)
- Radiating soft petals or rays suggesting growth/opening
- Minimalist, organic, calming

#### Option 2: Ora Logomark
- Stylized "O" with gradient fill
- Inner glow or subtle sparkle suggesting AI intelligence
- Bold, recognizable, brand-forward

#### Option 3: Wellness Symbol
- Abstract human figure in meditation pose
- Enclosed in circular frame
- Sage/olive color palette
- Represents inner peace and personal growth

### Color Specifications

**Light Mode Icon:**
- Background: Gradient from `#8B9D83` (sage) to `#6B7F5C` (olive)
- Accent: `#F5F1E8` (cream) for highlights/details
- Optional: Subtle `#C97B63` (terracotta) accent

**Dark Mode Icon:**
- Background: Deeper gradient `#5C6B4E` to `#4A5940`
- Accent: Brighter cream `#FFFFFF` for contrast
- Maintains brand recognition in dark environments

### Technical Requirements

**Master Size:** 1024x1024 pixels (required for App Store)

**Export Sizes:**
- 1024x1024 @ 1x (App Store)
- 180x180 @ 3x (iPhone Pro Max home screen)
- 167x167 @ 2x (iPad Pro home screen)
- 152x152 @ 2x (iPad home screen)
- 120x120 @ 3x (iPhone home screen)
- 87x87 @ 3x (Settings)
- 80x80 @ 2x (iPad Settings)
- 76x76 @ 2x (iPad App)
- 60x60 @ 3x (Spotlight)
- 58x58 @ 2x (Settings)
- 40x40 @ 3x (Spotlight)
- 29x29 @ 3x (Settings)
- 20x20 @ 2x (Notifications)

**File Format:**
- PNG with transparency support
- sRGB color space
- No alpha channel compression

### Apple HIG Guidelines Compliance

✅ **No Text:** Icon contains no text or words  
✅ **No UI Elements:** No buttons, badges, or UI chrome  
✅ **Unique:** Distinct from other wellness apps  
✅ **Recognizable:** Clear at all sizes  
✅ **Focused:** Single clear concept  
✅ **Consistent:** Matches app aesthetic  

### Design Process

1. **Sketch Concepts:** Create 3-5 rough concepts
2. **Select Direction:** Choose strongest concept
3. **Refine in Vector:** Create master icon in Illustrator/Figma
4. **Test at Scale:** View at 60x60, 40x40, 20x20 to ensure clarity
5. **Create Variants:** Light and dark mode versions
6. **Export All Sizes:** Use iOS icon generator tool
7. **Review in Context:** Preview on actual device

### Tools

**Design:**
- Figma (recommended) - iOS icon template available
- Adobe Illustrator
- Sketch

**Export:**
- [App Icon Generator](https://appicon.co/) - Batch export all sizes
- Xcode Asset Catalog - For final integration

### Inspiration References

**Wellness Apps with Great Icons:**
- Calm: Simple gradient circle with white outline
- Headspace: Orange circle with simple facial feature
- Insight Timer: Bell silhouette on gradient
- Balance: Abstract geometric shapes

**Our Differentiator:**
- More organic, natural aesthetic
- Brand-aligned color palette (sage/olive/cream)
- Suggests growth and inner wisdom

## Deliverables

- [ ] 1024x1024 master icon (light mode)
- [ ] 1024x1024 master icon (dark mode)
- [ ] All required iOS sizes exported
- [ ] AppIcon.appiconset folder for Xcode
- [ ] Preview mockups showing icon on device

## Acceptance Criteria

- Icon is recognizable at 20x20 pixels
- Works well on both light and dark backgrounds
- Aligns with Ora brand guidelines
- Passes App Store submission review
- Designer and stakeholder approve final design

## Next Steps

1. Review Ora brand assets: `/Users/matthew/Desktop/Feb26/Ora 2/`
2. Create 3 concept sketches
3. Get feedback and select direction
4. Create final icon in vector format
5. Export all sizes
6. Add to Xcode project

---

**File Location:** `assets/icon/ora-icon-master.png`  
**Xcode Location:** `ios/OraAI/Images.xcassets/AppIcon.appiconset/`
