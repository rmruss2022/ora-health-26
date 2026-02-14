# Shadow AI - Project Context

## Project Overview

Shadow AI is a mental wellness mobile app that provides personalized journaling, guided exercises, and community support through an intelligent chat interface. The app uses agentic AI with multiple behavior states to guide users through different types of self-reflection and personal growth activities.

## Vision

Create a holistic mental wellness platform where users can:
- Journal and reflect with AI guidance
- Complete structured exercises for personal growth
- Track progress and receive insights
- Connect with a supportive community
- Access meditation and mindfulness resources

## Core Concept: Agentic Dynamic Behaviors

The app centers around a **single, unified chat interface** powered by agentic AI that autonomously switches between different "behaviors" based on conversational context. Unlike traditional chatbots with fixed modes, Shadow AI uses **dynamic behaviors** - runtime modifiers that fundamentally transform how the AI operates.

### What Are Dynamic Behaviors?

Dynamic behaviors are NOT separate chat modes or screens. Instead, they are:

- **Runtime problem definition changers** that reshape the optimization problem the AI is solving
- **Conversational triggers** that activate based on detected patterns in user messages, agent reasoning, and interaction context
- **Operational modifiers** that adjust constraints, tools, tone, questioning style, and success criteria
- **Fluid transitions** that naturally activate and decay based on conversational distance from triggers

### How It Works

The system uses a **multi-vector detection approach** analyzing:
1. User's messages
2. Agent's responses
3. Agent's internal reasoning
4. Combined conversation context
5. Tool usage patterns
6. External events (time of day, user history, etc.)

When patterns are detected (e.g., user expresses desire to journal, shows signs of stress, asks for planning help), the appropriate behavior activates seamlessly. The AI's operational parameters shift without jarring mode switches.

### Example Flow

**User:** "I've been feeling overwhelmed lately"
- **Detection:** Sentiment analysis + journaling patterns trigger
- **Behavior Activated:** Reflective journaling companion
- **AI Adaptation:** Asks deeper questions, validates emotions, encourages exploration

**User:** "I need to organize my week better"
- **Detection:** Planning keywords + productivity context
- **Behavior Transition:** Weekly planning assistant
- **AI Adaptation:** Focuses on goals, time management, actionable steps

**User:** "Tell me a breathing exercise"
- **Detection:** Wellness activity request
- **Behavior Transition:** Guided exercise facilitator
- **AI Adaptation:** Provides structured instructions, pacing guidance

All in **one continuous conversation**, no manual mode switching required.

## Tech Stack

### Frontend
- **React Native** with TypeScript
- **Expo** framework for cross-platform development
- **React Navigation** (to be added) for navigation
- **AsyncStorage** or similar for local data persistence

### Backend & AI
- **Anthropic Claude API** (Sonnet 4) - Powers the agentic chat interface with dynamic behaviors
- **Node.js/Express** backend API - Handles business logic and API orchestration
- **AWS DynamoDB** for data persistence:
  - User authentication (JWT)
  - Journal entries storage
  - Chat message history
  - User profiles and preferences
  - Community posts and comments
- **AWS S3** (future) - For media storage (audio meditations, images)

### Development Approach
- **Test-Driven Development (TDD)** - Write tests before implementation
- **Behavior-based architecture** - Each feature as a distinct agent/behavior
- **Context-driven development** - Use CLAUDE.md files for planning and context

## Key Features (MVP Priority Order)

### Phase 1 - Core Agentic Chat (Current Phase)
1. ✅ User authentication (JWT)
2. ✅ Single unified chat interface with Claude integration
3. ✅ Basic behavior definitions (5 behaviors configured)
4. 🔄 **Dynamic behavior detection system** (conversational triggers)
5. 🔄 **Multi-vector pattern analysis** (embeddings, sentiment, context)
6. ✅ Mock storage for development
7. ⏳ Behavior persistence with natural decay
8. ⏳ Real-time behavior switching visualization

### Phase 2 - Enhanced Intelligence
1. Advanced trigger refinement (tool usage patterns, time-based)
2. Behavior history and learning (which behaviors work best for user)
3. Progress analysis behavior with data access
4. Weekly planning with calendar integration
5. Mood tracking and pattern recognition
6. Data visualization (progress over time)

### Phase 3 - Community
1. User profiles
2. Community feed
3. Group journal prompts
4. Interest-based groups
5. Resource sharing

### Phase 4 - Meditation & Enrichment
1. Meditation library
2. Audio player
3. Guided meditations
4. Breathing exercises

## Current Status (As of Feb 2026)

### Completed
- ✅ React Native frontend with Expo + TypeScript
- ✅ Node.js/Express backend API
- ✅ Claude API integration (Sonnet 4)
- ✅ JWT authentication system
- ✅ Mock storage for development (DynamoDB service ready)
- ✅ 5 behavior definitions with system prompts
- ✅ Basic chat interface

### Current Implementation (Temporary)
⚠️ **Note:** Current implementation uses manual behavior selection as a prototype. This is NOT the final design.

The home screen with behavior cards is a temporary UI for testing different behavior prompts. The **actual goal** is a single chat screen where the AI autonomously detects and switches behaviors based on conversational context.

### Next Steps
1. Implement conversational trigger detection system
2. Build multi-vector analysis (embeddings, patterns, sentiment)
3. Create behavior switching logic with persistence
4. Remove manual behavior selection UI
5. Add behavior indicator in chat (subtle, non-intrusive)
6. Implement behavior decay mechanism

## Development Workflow

1. **Plan** - Define feature requirements in relevant .md files
2. **Test** - Write tests based on requirements (TDD)
3. **Implement** - Build the feature to pass tests
4. **Refactor** - Clean up and optimize
5. **Document** - Update context files

## Related Documentation

- [BEHAVIORS.md](./BEHAVIORS.md) - Behavior state definitions and specifications
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture and system design
- [TESTING.md](./TESTING.md) - Testing strategy and TDD guidelines
- [COMMUNITY.md](./COMMUNITY.md) - Community features specification
- [API.md](./API.md) - API integration details and patterns

## Key Design Principles

1. **Simplicity** - Single chat interface for all interactions
2. **Intelligence** - Agentic AI adapts to user needs
3. **Privacy** - User data is secure and private
4. **Community** - Foster supportive connections
5. **Growth** - Focus on personal development and insights
