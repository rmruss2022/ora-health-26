# Ora 2 Brand Assets Audit

**Date:** February 13, 2026  
**Project:** Ora AI App Store Polish (ORA-066)  
**Source:** /Users/matthew/Desktop/Feb26/Ora 2/

---

## 🎨 Brand Colors

### Primary Colors

| Color Name | Hex Code | Usage | Notes |
|------------|----------|-------|-------|
| **Ora Green** | `#1d473e` | Primary brand color, logos, main CTAs | Deep forest green with teal undertones (from SVG) |
| **Ora Green (JPG)** | `#1B4D3E` | Same as above | Slight variation in JPG compression |

### Accent Colors

| Color Name | Hex Code | Usage | Notes |
|------------|----------|-------|-------|
| **Lavender** | `#D4B8E8` | Accent color, highlights | Light pastel purple/lavender from logomark variants |
| **White** | `#FFFFFF` | Light mode text, logo variants | |

### Notes on Colors
- The brand uses a sophisticated **forest green** as the hero color
- The accent is a **soft lavender/lilac**, NOT pink or coral
- High contrast between deep green and light lavender creates modern, wellness-oriented aesthetic
- ⚠️ **TODO:** Extract full color palette from brand bible PDF (requires manual review or PDF parsing tool)

---

## 🔤 Typography

### Font Families

#### Sentient (Primary Display/Body Font)
**Location:** `/Users/matthew/Desktop/Feb26/ora-ai/assets/fonts/Sentient-*.otf`

**Available Weights:**
- Extralight (100)
- Extralight Italic
- Light (300)
- Light Italic
- Regular (400)
- Italic
- Medium (500)
- Medium Italic
- Bold (700)
- Bold Italic

**Total Files:** 10 OTF files  
**Variable Font:** Available in TTF format (`Sentient-Variable.ttf`)

**Recommended Usage:**
- Headings: Bold (700), Medium (500)
- Body text: Regular (400), Light (300)
- Emphasis: Italic variants

---

#### Switzer (Secondary Sans-Serif)
**Location:** `/Users/matthew/Desktop/Feb26/ora-ai/assets/fonts/Switzer-*.otf`

**Available Weights:**
- Thin (100)
- Thin Italic
- Extralight (200)
- Extralight Italic
- Light (300)
- Light Italic
- Regular (400)
- Italic
- Medium (500)
- Medium Italic
- Semibold (600)
- Semibold Italic
- Bold (700)
- Bold Italic
- Extrabold (800)
- Extrabold Italic
- Black (900)
- Black Italic

**Total Files:** 18 OTF files  
**Variable Font:** Available in TTF format (`Switzer-Variable.ttf`)

**Recommended Usage:**
- UI elements: Regular (400), Medium (500)
- Button text: Semibold (600), Bold (700)
- Micro-copy: Light (300), Regular (400)
- Heavy emphasis: Black (900)

---

## 🖼️ Logo Assets

### Logomark (Icon Only)

**Location:** `/Users/matthew/Desktop/Feb26/ora-ai/assets/images/`

| File Name | Format | Color Variant | Size | Usage |
|-----------|--------|---------------|------|-------|
| `Ora-Logomark-Green.svg` | SVG | Green (#1d473e) | Vector | Dark backgrounds, primary icon |
| `Ora-Logomark-White.svg` | SVG | White (#FFFFFF) | Vector | Dark backgrounds, overlays |
| `Ora-Logomark-Green.png` | PNG | Green (#1d473e) | 350×350px | Raster fallback |
| `Ora-Logomark-White.png` | PNG | White (#FFFFFF) | 350×350px | Raster fallback |

**Also Available (not copied):**
- JPG variants: `Ora-Logomark-GreenOnWhite.jpg`, `Ora-Logomark-PinkOnGreen.jpg`

---

### Wordmark (Full Logo with Text)

**Location:** `/Users/matthew/Desktop/Feb26/ora-ai/assets/images/`

| File Name | Format | Color Variant | Size | Usage |
|-----------|--------|---------------|------|-------|
| `Ora-FullWordmark-Green.svg` | SVG | Green (#1d473e) | Vector (641.57×350.39) | Light backgrounds, app headers |
| `Ora-FullWordmark-White.svg` | SVG | White (#FFFFFF) | Vector (641.57×350.39) | Dark backgrounds |
| `Ora-FullWordmark-Green.png` | PNG | Green (#1d473e) | Raster | Fallback |
| `Ora-FullWordmark-White.png` | PNG | White (#FFFFFF) | Raster | Fallback |

**Also Available (not copied):**
- JPG variants: `Ora-FullWordmark-GreenOnWhite.jpg`, `Ora-FullWordmark-WhiteonGreen.jpg`

---

## 📐 Brand Guidelines

**Source Document:** `02-Brand Bible/Ora-Brand Guidelines-2024.pdf`

### What We Know:
- **Primary Color:** Deep forest green (#1d473e)
- **Accent Color:** Light lavender (#D4B8E8)
- **Font Families:** Sentient (primary), Switzer (secondary)
- **Logo Variants:** Full wordmark and logomark, available in green/white

### ⚠️ Requires Manual Review:
The brand bible PDF contains additional specifications that should be reviewed:
- Exact color palette (full range of tints/shades)
- Logo clear space requirements
- Minimum size specifications
- Typography hierarchy and usage rules
- Do's and don'ts
- Brand voice and tone guidelines

**Action Item:** Designer should manually review `/Users/matthew/Desktop/Feb26/Ora 2/02-Brand Bible/Ora-Brand Guidelines-2024.pdf`

---

## 📸 Stock Photography

**Location:** `/Users/matthew/Desktop/Feb26/Ora 2/03-Stock Photography/`

**Available:** 14+ stock images with Tulum architecture and nature photography themes

**Note:** These can be used for mockups, promotional materials, or app onboarding imagery.

---

## ✅ Integration Status

### Completed:
- ✅ Font files extracted and placed in `/assets/fonts/` (28 OTF files total)
- ✅ Logo files (SVG + PNG) copied to `/assets/images/` (8 files)
- ✅ Primary brand color identified: `#1d473e`
- ✅ Accent color identified: `#D4B8E8`
- ✅ Font families documented: Sentient (10 weights), Switzer (18 weights)

### Pending:
- ⏳ Full color palette extraction from brand bible
- ⏳ Theme file update with official colors
- ⏳ Font configuration in app.json
- ⏳ Typography scale alignment with brand guidelines

---

## 🔗 File Paths Reference

**Brand Assets Root:** `/Users/matthew/Desktop/Feb26/Ora 2/`
- Logos: `01-Logo/`
- Brand Bible: `02-Brand Bible/Ora-Brand Guidelines-2024.pdf`
- Stock Photos: `03-Stock Photography/`
- Fonts: `04-Fonts/`

**App Assets Root:** `/Users/matthew/Desktop/Feb26/ora-ai/assets/`
- Fonts: `assets/fonts/`
- Images: `assets/images/`
- Theme: `src/theme/index.ts`

---

**End of Audit**
