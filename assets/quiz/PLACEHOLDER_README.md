# Quiz Assets Placeholders

The Gemini Imagen API endpoint needs to be updated. For now, use placeholder images or create custom graphics.

## Recommended Approach

### Option 1: Create Simple Gradients Programmatically
Use React Native's `LinearGradient` from `expo-linear-gradient` for backgrounds.

### Option 2: Use Existing Emoji/Icons
Use Unicode emojis or icon libraries like `@expo/vector-icons`.

### Option 3: Custom Design
Use Figma or Canva to create custom graphics and export as PNG.

## Required Assets

### Backgrounds (use LinearGradient instead):
- Mood: Coral to Soft Blue (#FF6B6B → #4ECDC4)
- Energy: Orange to Yellow (#FFA500 → #FFD700)
- Sleep: Deep Blue to Purple (#1E3A8A → #7C3AED)
- Stress: Teal to Mint Green (#14B8A6 → #6EE7B7)
- Intention: Peach to Lavender (#FBBF24 → #C084FC)

### Celebrations (use Lottie animations or emojis):
- Quiz Complete: 🎉
- Streak Milestone: 🏆
- First Quiz: ⭐

### Badges (programmatic circular designs):
- 7-day: 🔥
- 30-day: 💎
- 100-day: 👑

### Category Icons (Unicode emojis work great):
- Peace: 🕊️
- Productivity: ✅
- Connection: 💛
- Growth: 🌱
- Rest: 🌙
- Joy: ✨

## Implementation

The screens will work without the images - they'll just use colors and emojis instead.
