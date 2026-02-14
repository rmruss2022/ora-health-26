# ORA-033 Integration Guide

## Quick Start - Add Animation to CommunityScreen

To enable the envelope open animation in the Letters tab:

### Option 1: Use the Demo Component (Quickest)

In `src/screens/CommunityScreen.tsx`, replace the Letters tab empty state:

**Before:**
```tsx
{/* Letters Tab */}
{activeTab === 'letters' && (
  <ScrollView
    style={styles.scrollView}
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
  >
    <View style={styles.lettersContainer}>
      <Text style={styles.lettersTitle}>Your Letters</Text>
      <Text style={styles.lettersSubtitle}>
        Thoughtful messages from your past self and the community
      </Text>

      {/* Coming Soon State (replace with actual letters later) */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>💌</Text>
        <Text style={styles.emptyTitle}>No letters yet</Text>
        <Text style={styles.emptyText}>
          Letters will appear here when you receive them from your journey or the community
        </Text>
      </View>
    </View>
  </ScrollView>
)}
```

**After:**
```tsx
// Add import at top:
import { LettersTabContent } from '../components/letters/LettersTabContent';

// Replace the Letters tab section:
{/* Letters Tab */}
{activeTab === 'letters' && (
  <LettersTabContent navigation={navigation} />
)}
```

### Option 2: Custom Implementation

If you want to load letters from an API:

```tsx
// Import components
import { EnvelopeCard } from '../components/EnvelopeCard';
import { Letter } from '../components/letters/LetterCard';

// In your component:
const [letters, setLetters] = useState<Letter[]>([]);

// Load letters from API
useEffect(() => {
  loadLetters();
}, []);

const loadLetters = async () => {
  // Your API call here
  const data = await lettersAPI.getLetters();
  setLetters(data);
};

const handleLetterPress = (letter: Letter) => {
  navigation.navigate('LetterDetail', { letter });
};

// Render with FlatList
<FlatList
  data={letters}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <EnvelopeCard
      letter={item}
      onPress={() => handleLetterPress(item)}
    />
  )}
/>
```

## Testing the Animation

1. **Run the app:**
   ```bash
   npm start
   # or
   expo start
   ```

2. **Navigate to Community tab**

3. **Tap "Letters" tab**

4. **Tap on any envelope card** - You should see:
   - Quick scale down (100ms)
   - Smooth flip/open animation (300ms)
   - Fade out transition
   - Navigation to letter detail screen
   - Detail screen fades in with slide-up

## Animation Timing Breakdown

Total: **400ms**
- 0-100ms: Scale down (0.95)
- 100-400ms: Flip + scale up + fade (parallel)
  - Flip: 0° → 180°
  - Scale: 0.95 → 1.05
  - Opacity: 1.0 → 0.0

## Customization Options

### Adjust Animation Speed

In `src/components/EnvelopeCard.tsx`:

```tsx
// Faster (300ms total)
duration: 75,  // scale down
duration: 225, // flip/open

// Slower (500ms total)
duration: 125, // scale down
duration: 375, // flip/open
```

### Change Animation Style

```tsx
// More dramatic flip
outputRange: ['0deg', '270deg'], // instead of 180deg

// Bigger scale effect
toValue: 1.1, // instead of 1.05

// Slower fade
duration: 400, // instead of 300
```

### Add Haptic Feedback

```tsx
import * as Haptics from 'expo-haptics';

// In handlePress, before animation:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// After animation completes:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

## Component API

### EnvelopeCard Props

```tsx
interface EnvelopeCardProps {
  letter: Letter;              // Letter data
  onPress: () => void;         // Called after animation
  onAnimationComplete?: () => void; // Optional callback
}
```

### Letter Type

```tsx
interface Letter {
  id: string;
  threadId?: string;
  from: 'user' | 'agent' | 'system';
  agentId?: string;
  agentName?: string;
  subject: string;
  body: string;
  preview?: string;
  sentAt: Date;
  readAt?: Date;
  state: 'unread' | 'read' | 'draft' | 'sending' | 'failed';
}
```

## Troubleshooting

### Animation doesn't play
- Check console for warnings
- Verify `useNativeDriver: true` is set
- Ensure no conflicting animations

### Navigation doesn't work
- Verify LetterDetailScreen is registered in AppNavigator
- Check navigation prop is passed correctly
- Ensure letter object has all required fields

### Performance issues
- Check if too many cards rendering at once
- Use FlatList instead of ScrollView for large lists
- Verify native driver is enabled

## Files Reference

- **Animation Component**: `src/components/EnvelopeCard.tsx`
- **Detail Screen**: `src/screens/LetterDetailScreen.tsx`
- **Demo Component**: `src/components/letters/LettersTabContent.tsx`
- **Navigation**: `src/navigation/AppNavigator.tsx`

## Next Steps

1. Replace demo letters with real data from API
2. Add letter creation/sending functionality
3. Implement thread support
4. Add swipe actions (archive, delete)
5. Consider haptic feedback
6. Optional: Add sound effect

---

**Implementation Status**: ✅ Complete and tested
**Animation Duration**: 400ms (as specified)
**Performance**: Optimized with native driver
**Compatibility**: Works with existing Letter types
