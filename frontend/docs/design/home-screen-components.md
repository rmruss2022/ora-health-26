# Home Screen Component Structure

**Project:** Ora AI App Store Polish  
**Task:** ORA-001  
**Date:** February 13, 2026

---

## Component Hierarchy

```
HomeScreen (Screen Component)
├── HeaderGradient (Presentational)
│   ├── AppName (Text)
│   └── Tagline (Text)
├── ContentSection (Container)
│   ├── SectionTitle (Text)
│   └── BehaviorCardList (FlatList)
│       └── BehaviorCard × 5 (Interactive Component)
│           ├── IconContainer (View)
│           │   └── Icon (Vector Icon)
│           ├── TextContent (View)
│           │   ├── CardTitle (Text)
│           │   └── CardSubtitle (Text)
│           └── ChevronIcon (Vector Icon)
```

---

## 1. HomeScreen Component

### Responsibility
- Root container for the home screen
- Manages navigation to detail screens
- Handles scroll behavior and safe areas

### File Location
```
src/screens/HomeScreen/index.tsx
src/screens/HomeScreen/styles.ts
```

### Props Interface
```typescript
interface HomeScreenProps {
  navigation: NavigationProp<any, any>;
}
```

### State Management
```typescript
interface HomeScreenState {
  // Optional: track scroll position for header collapse
  scrollY?: Animated.Value;
  
  // Optional: loading state for dynamic content
  isLoading?: boolean;
}
```

### Example Structure
```typescript
import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderGradient } from './components/HeaderGradient';
import { BehaviorCardList } from './components/BehaviorCardList';
import { styles } from './styles';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handleCardPress = (cardId: string) => {
    // Navigate to specific behavior screen
    navigation.navigate(cardId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderGradient />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BehaviorCardList onCardPress={handleCardPress} />
      </ScrollView>
    </SafeAreaView>
  );
};
```

---

## 2. HeaderGradient Component

### Responsibility
- Display app branding (name + tagline)
- Render gradient background
- Handle safe area padding

### File Location
```
src/screens/HomeScreen/components/HeaderGradient.tsx
```

### Props Interface
```typescript
interface HeaderGradientProps {
  // Optional: for future customization
  title?: string;
  subtitle?: string;
}
```

### Dependencies
```typescript
import LinearGradient from 'react-native-linear-gradient';
// OR
import { LinearGradient } from 'expo-linear-gradient';
```

### Example Implementation
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../../../theme';

export const HeaderGradient: React.FC<HeaderGradientProps> = ({ 
  title = 'Ora',
  subtitle = 'Your personal companion for growth and reflection'
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <LinearGradient
      colors={['#1E90FF', '#0066CC']}
      style={[styles.container, { paddingTop: insets.top + 24 }]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#E8F4FF',
    lineHeight: 24,
    marginTop: 8,
    maxWidth: 280,
  },
});
```

---

## 3. BehaviorCardList Component

### Responsibility
- Render list of behavior cards
- Manage card data
- Handle card press events

### File Location
```
src/screens/HomeScreen/components/BehaviorCardList.tsx
```

### Props Interface
```typescript
interface BehaviorCardListProps {
  onCardPress: (cardId: string) => void;
}
```

### Card Data Type
```typescript
interface BehaviorCardData {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconBackgroundColor: string;
  iconBackgroundGradient?: [string, string]; // Optional gradient
  screen: string; // Navigation destination
}
```

### Card Data Array
```typescript
const BEHAVIOR_CARDS: BehaviorCardData[] = [
  {
    id: 'free-form-chat',
    title: 'Free-Form Chat',
    subtitle: 'Open conversation and emotional support',
    iconName: 'chatbubbles',
    iconBackgroundColor: '#6B5B95',
    iconBackgroundGradient: ['#6B5B95', '#9B8BC4'],
    screen: 'ChatScreen',
  },
  {
    id: 'journal-prompts',
    title: 'Journal Prompts',
    subtitle: 'Guided journaling with thoughtful questions',
    iconName: 'create-outline',
    iconBackgroundColor: '#D4A574',
    iconBackgroundGradient: ['#D4A574', '#E8C9A3'],
    screen: 'JournalScreen',
  },
  {
    id: 'guided-exercise',
    title: 'Guided Exercise',
    subtitle: 'Structured personal growth activities',
    iconName: 'body',
    iconBackgroundColor: '#6B8E6F',
    iconBackgroundGradient: ['#6B8E6F', '#8AA88E'],
    screen: 'ExerciseScreen',
  },
  {
    id: 'progress-analysis',
    title: 'Progress Analysis',
    subtitle: 'Insights on your personal growth journey',
    iconName: 'bar-chart',
    iconBackgroundColor: '#7B92A8',
    iconBackgroundGradient: ['#7B92A8', '#9BAEBB'],
    screen: 'AnalyticsScreen',
  },
  {
    id: 'weekly-planning',
    title: 'Weekly Planning',
    subtitle: 'Set intentions and plan your week',
    iconName: 'calendar-outline',
    iconBackgroundColor: '#B8927D',
    iconBackgroundGradient: ['#B8927D', '#D4BFB0'],
    screen: 'PlanningScreen',
  },
];
```

### Example Implementation
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BehaviorCard } from './BehaviorCard';
import { colors, spacing } from '../../../theme';

export const BehaviorCardList: React.FC<BehaviorCardListProps> = ({ onCardPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Choose Your Focus</Text>
      <View style={styles.cardList}>
        {BEHAVIOR_CARDS.map((card) => (
          <BehaviorCard
            key={card.id}
            {...card}
            onPress={() => onCardPress(card.screen)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.charcoal,
    lineHeight: 32,
    letterSpacing: -0.3,
    marginTop: 32,
    marginBottom: 20,
  },
  cardList: {
    gap: 16, // React Native 0.71+ supports gap
    // For older versions, use marginBottom on cards instead
    paddingBottom: 32,
  },
});
```

---

## 4. BehaviorCard Component

### Responsibility
- Render individual behavior card
- Handle press interactions
- Display icon, text content, and chevron

### File Location
```
src/screens/HomeScreen/components/BehaviorCard.tsx
```

### Props Interface
```typescript
interface BehaviorCardProps {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconBackgroundColor: string;
  iconBackgroundGradient?: [string, string];
  onPress: () => void;
}
```

### Example Implementation
```typescript
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows } from '../../../theme';

export const BehaviorCard: React.FC<BehaviorCardProps> = React.memo(({
  title,
  subtitle,
  iconName,
  iconBackgroundColor,
  iconBackgroundGradient,
  onPress,
}) => {
  const IconWrapper = iconBackgroundGradient ? LinearGradient : View;
  const iconContainerProps = iconBackgroundGradient
    ? { colors: iconBackgroundGradient }
    : { style: { backgroundColor: iconBackgroundColor } };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconWrapper {...iconContainerProps} style={styles.iconContainer}>
        <Ionicons name={iconName} size={24} color={colors.white} />
      </IconWrapper>

      <View style={styles.textContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={colors.lightGrey} 
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    height: 96,
    padding: 20,
    ...shadows.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.mediumGrey,
    lineHeight: 20,
  },
  chevron: {
    marginLeft: 12,
  },
});
```

---

## 5. Animation Enhancements (Optional)

### Press Animation with Reanimated
```typescript
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

export const BehaviorCard: React.FC<BehaviorCardProps> = ({ ... }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={1}
        style={styles.card}
      >
        {/* Card content */}
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### Staggered List Entry Animation
```typescript
import { FadeInDown } from 'react-native-reanimated';

{BEHAVIOR_CARDS.map((card, index) => (
  <Animated.View
    key={card.id}
    entering={FadeInDown.delay(index * 50).springify()}
  >
    <BehaviorCard {...card} onPress={() => onCardPress(card.screen)} />
  </Animated.View>
))}
```

---

## 6. Testing Considerations

### Unit Tests
```typescript
// BehaviorCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { BehaviorCard } from './BehaviorCard';

describe('BehaviorCard', () => {
  const mockProps = {
    id: 'test-card',
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    iconName: 'chatbubbles',
    iconBackgroundColor: '#6B5B95',
    onPress: jest.fn(),
  };

  it('renders title and subtitle correctly', () => {
    const { getByText } = render(<BehaviorCard {...mockProps} />);
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Subtitle')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(<BehaviorCard {...mockProps} />);
    fireEvent.press(getByText('Test Title'));
    expect(mockProps.onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Accessibility Tests
```typescript
it('has correct accessibility labels', () => {
  const { getByLabelText } = render(<BehaviorCard {...mockProps} />);
  expect(getByLabelText(/Test Title.*Test Subtitle.*Button/)).toBeTruthy();
});
```

---

## 7. Performance Optimizations

### Memoization
- Use `React.memo()` for `BehaviorCard` component
- Memoize `onPress` handlers with `useCallback()`
- Avoid inline styles and functions

### FlatList Alternative (for large lists)
```typescript
<FlatList
  data={BEHAVIOR_CARDS}
  renderItem={({ item }) => <BehaviorCard {...item} onPress={() => onCardPress(item.screen)} />}
  keyExtractor={(item) => item.id}
  ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
  getItemLayout={(data, index) => ({
    length: 96,
    offset: (96 + 16) * index,
    index,
  })}
/>
```

### Image/Gradient Optimization
- Consider caching gradient images for older devices
- Use `shouldRasterizeIOS={true}` for complex views
- Limit shadow usage on low-end devices

---

## 8. Navigation Integration

### React Navigation Setup
```typescript
// navigation/types.ts
export type RootStackParamList = {
  Home: undefined;
  ChatScreen: undefined;
  JournalScreen: undefined;
  ExerciseScreen: undefined;
  AnalyticsScreen: undefined;
  PlanningScreen: undefined;
};

// HomeScreen.tsx
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}
```

---

## 9. File Structure Summary

```
src/screens/HomeScreen/
├── index.tsx                     # Main screen component
├── styles.ts                     # Screen-level styles
├── components/
│   ├── HeaderGradient.tsx        # Header with gradient
│   ├── BehaviorCardList.tsx      # Card list container
│   ├── BehaviorCard.tsx          # Individual card component
│   └── index.ts                  # Component exports
├── data/
│   └── behaviorCards.ts          # Card data constant
└── __tests__/
    ├── HomeScreen.test.tsx
    ├── BehaviorCard.test.tsx
    └── BehaviorCardList.test.tsx
```

---

## 10. Dependencies Required

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.73.0",
    "react-native-safe-area-context": "^4.8.0",
    "react-native-linear-gradient": "^2.8.0",
    "react-native-vector-icons": "^10.0.0",
    "@expo/vector-icons": "^14.0.0",
    "react-native-reanimated": "^3.6.0"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.4.0",
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0"
  }
}
```

---

## Implementation Checklist

- [ ] Create `HomeScreen/index.tsx` with base structure
- [ ] Implement `HeaderGradient` component
- [ ] Create `behaviorCards.ts` data file
- [ ] Implement `BehaviorCard` component
- [ ] Implement `BehaviorCardList` component
- [ ] Add safe area handling
- [ ] Integrate with navigation
- [ ] Add press animations
- [ ] Write unit tests
- [ ] Test accessibility (VoiceOver/TalkBack)
- [ ] Test on multiple screen sizes
- [ ] Optimize performance (memoization, FlatList)
- [ ] Update navigation types
- [ ] Document component usage

---

## Questions for Product/Design Review

1. Should the header collapse on scroll, or remain fixed?
2. Do we want haptic feedback on card press?
3. Should cards have a subtle entrance animation on mount?
4. Is the blue gradient final, or should we use theme colors?
5. Do we need skeleton loaders for async data loading?

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Feb 13, 2026 | Initial component structure | Designer-Agent |

---

**Status:** Ready for iOS-Dev Agent ✅  
**Estimated Implementation Time:** 4-6 hours  
**Complexity:** Medium  
**Blocks:** ORA-002 (Build BehaviorCard component)
