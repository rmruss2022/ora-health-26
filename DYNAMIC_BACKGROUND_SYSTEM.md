# Dynamic Background System - ORA-097

## Overview

The Dynamic Background System generates context-aware, personalized background images for users based on their activity patterns, behavior, mood, and wellness data. The system creates beautiful, data-driven visualizations that evolve with the user's journey.

## Architecture

### Backend Components

#### 1. **BackgroundContextService** (`ora-ai-api/src/services/backgroundContext.service.ts`)
   - Analyzes user data to build context
   - Queries journal entries, chat messages, meditation sessions
   - Calculates metrics: activity level, engagement score, wellness score
   - Determines dominant mood and recent behaviors
   - Generates visualization parameters

#### 2. **BackgroundGeneratorService** (`ora-ai-api/src/services/backgroundGenerator.service.ts`)
   - Generates actual images using Canvas API
   - Supports 5 visualization types:
     - **Wave**: Flowing sine waves modulated by user data
     - **Particle**: Dynamic particle systems with data-driven opacity
     - **Gradient**: Smooth radial gradients with noise texture
     - **Graph**: Activity trend line charts
     - **Mandala**: Geometric patterns for meditation-focused users
   - Configurable dimensions, format (PNG/JPEG), quality

#### 3. **BackgroundController** (`ora-ai-api/src/controllers/background.controller.ts`)
   - Handles API requests
   - Caches generated images (5-minute TTL)
   - Provides context inspection endpoints

#### 4. **API Routes** (`ora-ai-api/src/routes/background.routes.ts`)

### Frontend Components

#### 1. **DynamicBackground** (`ora-ai/src/components/DynamicBackground.tsx`)
   - React Native component
   - Auto-refreshes background at intervals
   - Handles loading states and errors
   - Responsive to orientation changes
   - Configurable opacity

#### 2. **withDynamicBackground** (`ora-ai/src/components/withDynamicBackground.tsx`)
   - Higher-Order Component (HOC)
   - Easy integration with existing screens

## API Endpoints

### GET `/api/background/current`
**Description**: Generate current user's dynamic background  
**Auth**: Required  
**Query Params**:
- `width` (optional): Image width in pixels (default: 1920)
- `height` (optional): Image height in pixels (default: 1080)
- `format` (optional): `png` or `jpeg` (default: png)

**Response**: Binary image data

**Example**:
```bash
curl -X GET "http://localhost:3000/api/background/current?width=1920&height=1080&format=jpeg" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output background.jpg
```

### GET `/api/background/context`
**Description**: Get user context data (for debugging)  
**Auth**: Required  

**Response**:
```json
{
  "context": {
    "userId": "user-123",
    "activityLevel": "high",
    "dominantMood": "grateful",
    "recentBehaviors": ["journal-prompt", "meditation"],
    "journalFrequency": 5,
    "meditationStreak": 7,
    "engagementScore": 85,
    "timeOfDay": "evening",
    "wellnessScore": 72
  },
  "visualization": {
    "type": "mandala",
    "colors": ["#4ECDC4", "#44E3C6", "#95E1D3", "#A29BFE"],
    "intensity": 0.8,
    "complexity": 0.85,
    "dataPoints": 30
  }
}
```

### GET `/api/background/activity-trend`
**Description**: Get activity trend data  
**Auth**: Required  
**Query Params**:
- `days` (optional): Number of days (default: 30)

**Response**:
```json
{
  "trend": [0, 3, 5, 2, 8, ...],
  "days": 30
}
```

### GET `/api/background/preview/:type`
**Description**: Preview a specific visualization type  
**Auth**: Not required  
**Path Params**:
- `type`: `wave` | `particle` | `gradient` | `graph` | `mandala`

**Query Params**: Same as `/current`

## Visualization Types

### 1. Wave Pattern
**When**: Evening/night time OR low-moderate activity
**Features**:
- Multiple layered sine waves
- Wave amplitude modulated by user data
- Smooth, calming effect
- Colors based on mood + time of day

### 2. Particle System
**When**: High activity + high engagement (>70)
**Features**:
- 50-200 particles (based on complexity)
- Opacity driven by data values
- Glow effects
- Dynamic and energetic feel

### 3. Gradient Background
**When**: Default fallback
**Features**:
- Radial gradient from center
- Multiple color stops
- Subtle noise texture
- Smooth and minimal

### 4. Activity Graph
**When**: Active journaling (4+ entries/week)
**Features**:
- Line chart of user activity
- Filled area under curve
- Gradient background
- Data-driven and analytical

### 5. Mandala Pattern
**When**: Meditation streak ≥5 days
**Features**:
- Geometric circular patterns
- 12-segment symmetry
- Multiple concentric layers
- Decorative dots
- Spiritual and centered aesthetic

## Context Mapping

### User Metrics → Visualization Parameters

| User Metric | Affects | How |
|-------------|---------|-----|
| Activity Level | Visualization Type | High → particle, Low → wave/gradient |
| Dominant Mood | Color Palette | happy→warm, calm→cool, grateful→teal |
| Time of Day | Color Palette | morning→yellow, night→blue/dark |
| Engagement Score | Complexity | Higher score = more complex patterns |
| Meditation Streak | Type Selection | ≥5 days → mandala |
| Journal Frequency | Type Selection | ≥4/week → graph |
| Wellness Score | Overall Intensity | Higher = brighter, more vibrant |

### Mood Color Palettes

```javascript
happy:      ['#FFD700', '#FFA500', '#FF6B6B']
grateful:   ['#4ECDC4', '#44E3C6', '#95E1D3']
calm:       ['#6C5CE7', '#A29BFE', '#74B9FF']
energetic:  ['#FF7675', '#FD79A8', '#FDCB6E']
reflective: ['#A29BFE', '#74B9FF', '#81ECEC']
neutral:    ['#B2BEC3', '#74B9FF', '#A29BFE']
```

### Time of Day Palettes

```javascript
morning:   ['#FEF5E7', '#FAD7A0', '#F8C471']
afternoon: ['#AED6F1', '#85C1E2', '#5DADE2']
evening:   ['#D7BDE2', '#BB8FCE', '#A569BD']
night:     ['#5D6D7E', '#34495E', '#2C3E50']
```

## Frontend Usage

### Basic Component Usage

```tsx
import { DynamicBackground } from '../components/DynamicBackground';

function MyScreen() {
  return (
    <DynamicBackground
      refreshInterval={300000}  // 5 minutes
      opacity={0.3}
    >
      <View>
        {/* Your content here */}
      </View>
    </DynamicBackground>
  );
}
```

### HOC Usage

```tsx
import { withDynamicBackground } from '../components/withDynamicBackground';

function HomeScreen() {
  return (
    <View>
      <Text>Home Screen Content</Text>
    </View>
  );
}

export default withDynamicBackground(HomeScreen, {
  opacity: 0.2,
  refreshInterval: 300000,
});
```

## Performance Considerations

### Caching
- Backend responses cached for 5 minutes
- Frontend refreshes every 5 minutes (configurable)
- Images compressed as JPEG for faster transfer

### Image Generation
- Canvas rendering is CPU-intensive
- Consider implementing Redis caching for repeated requests
- Pre-generate common patterns during off-peak hours

### Network
- JPEG format recommended for mobile (smaller size)
- Dimensions should match device screen
- Consider progressive image loading

## Installation

### Backend Dependencies
```bash
cd ora-ai-api
npm install canvas
```

### Database Tables Used
- `journal_entries` - For activity and mood data
- `chat_messages` - For behavior patterns
- `meditation_sessions` - For meditation tracking

## Testing

### Preview All Visualization Types
```bash
# Wave
curl "http://localhost:3000/api/background/preview/wave?width=800&height=600" -o wave.png

# Particle
curl "http://localhost:3000/api/background/preview/particle?width=800&height=600" -o particle.png

# Gradient
curl "http://localhost:3000/api/background/preview/gradient?width=800&height=600" -o gradient.png

# Graph
curl "http://localhost:3000/api/background/preview/graph?width=800&height=600" -o graph.png

# Mandala
curl "http://localhost:3000/api/background/preview/mandala?width=800&height=600" -o mandala.png
```

### Test User Context
```bash
curl -X GET "http://localhost:3000/api/background/context" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

## Future Enhancements

1. **Animation Support**
   - Animated GIF or video backgrounds
   - Smooth transitions between states

2. **User Preferences**
   - Allow users to favorite visualization types
   - Manual color scheme selection
   - Saved presets

3. **Advanced Patterns**
   - Fractals (Mandelbrot, Julia sets)
   - Voronoi diagrams
   - Perlin noise landscapes

4. **Performance**
   - WebWorker for client-side generation
   - Progressive rendering
   - Image caching service (CloudFront)

5. **Social Features**
   - Share backgrounds with community
   - Background of the day
   - Achievement-based unlocks

## Files Created

### Backend
- `src/services/backgroundContext.service.ts` (271 lines)
- `src/services/backgroundGenerator.service.ts` (344 lines)
- `src/controllers/background.controller.ts` (161 lines)
- `src/routes/background.routes.ts` (57 lines)

### Frontend
- `src/components/DynamicBackground.tsx` (127 lines)
- `src/components/withDynamicBackground.tsx` (38 lines)

### Documentation
- `DYNAMIC_BACKGROUND_SYSTEM.md` (this file)

**Total Lines of Code**: ~1,000 LOC

## Completion Status

✅ Backend API with context analysis  
✅ Image generation service (5 visualization types)  
✅ RESTful endpoints with caching  
✅ React Native component  
✅ HOC for easy integration  
✅ Comprehensive documentation  
✅ Preview endpoints for testing  

**Task ORA-097: Complete**
