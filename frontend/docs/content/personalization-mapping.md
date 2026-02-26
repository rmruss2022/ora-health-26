# Ora AI Personalization Mapping

## Overview

This document defines how intake quiz responses map to app personalization across features, content recommendations, AI companion behavior, and notification settings.

---

## Q1: What brings you to Ora? (Goals)

### Response → Behavior Suggestions

| Selected Goal | Suggested Behaviors | Priority Weights |
|---------------|-------------------|------------------|
| **stress_anxiety** | Breathing exercises, guided meditations, anxiety CBT exercises, mood check-ins | High priority calming content |
| **personal_growth** | Self-reflection journaling, goal-setting tools, growth mindset prompts, book/podcast recs | Exploration-focused content |
| **building_habits** | Habit tracker, streak counter, routine builder, morning/evening rituals | Structure and accountability features |
| **relationships** | Communication prompts, empathy exercises, relationship journaling, boundary-setting guides | Interpersonal skills content |
| **difficult_emotions** | Emotion labeling exercises, feeling wheels, DBT-inspired activities, grounding techniques | Supportive, validating tone |
| **wellness_mindfulness** | Daily mindfulness exercises, body scans, gratitude practices, sleep hygiene | Holistic wellness content |
| **other** | General wellness mix, allow user exploration | Balanced approach |

### AI Companion Tone Adjustments

- **stress_anxiety**: More reassuring, slower pacing, validation of feelings, crisis resource awareness
- **personal_growth**: Curious and exploratory, growth-oriented questions, challenge comfort zone
- **building_habits**: Structured check-ins, accountability language, progress celebration
- **relationships**: Empathetic listening, perspective-taking prompts, communication coaching
- **difficult_emotions**: Extra validation, gentle pacing, trauma-informed language, normalizing statements
- **wellness_mindfulness**: Present-focused, body-aware language, non-judgmental observations

### Onboarding Content Priority

**High Support Needs** (stress_anxiety, difficult_emotions):
- Show crisis resources during onboarding
- Offer therapist finder link
- Front-load calming exercises
- More frequent check-in suggestions

**Growth & Exploration** (personal_growth, wellness_mindfulness):
- Emphasize discovery features
- Showcase community forum
- Highlight variety of tools
- Encourage experimentation

**Practical & Structured** (building_habits, relationships):
- Focus on routine-building
- Demonstrate tracking features
- Show progress visualization
- Template-based tools

---

## Q2: What area of your life needs attention? (Focus Area)

### Response → Content Curation

| Focus Area | Journaling Prompts | Suggested Exercises | Forum Topics | AI Check-in Topics |
|------------|-------------------|---------------------|--------------|-------------------|
| **work_career** | Work-life balance, professional boundaries, career values, burnout prevention | Stress management, time management, productivity rituals | Career transitions, workplace wellness | "How's work treating you?" "What energized you at work today?" |
| **relationships_social** | Communication patterns, needs vs. wants, quality time, conflict resolution | Active listening, boundary setting, empathy practice | Relationship advice, friendship, family dynamics | "How are your connections feeling?" "Any meaningful interactions today?" |
| **physical_health** | Movement motivation, sleep quality, body image, energy levels | Gentle movement, sleep hygiene, body scan meditations | Fitness journeys, nutrition, chronic conditions | "How's your body feeling?" "Did you move today?" |
| **personal_growth** | Values clarification, future self visualization, learning goals, curiosity | Growth mindset exercises, skill-building planning, reading habits | Books, courses, self-improvement wins | "What did you learn today?" "What sparked your curiosity?" |
| **emotional_wellbeing** | Emotional patterns, triggers, coping mechanisms, self-compassion | Emotion regulation, self-soothing techniques, reframing | Mental health journeys, therapy experiences | "What emotions showed up today?" "How are you taking care of yourself?" |
| **purpose_meaning** | Life purpose, core values, legacy, contribution, existential questions | Values exercises, visioning, gratitude practices | Philosophy, spirituality, life transitions | "What felt meaningful today?" "What are you working toward?" |

### Home Screen Widget Order

Based on focus area, prioritize widgets:

- **work_career**: Stress meter, quick breathing exercise, work-life balance tip
- **relationships_social**: Communication prompt, gratitude for people, empathy exercise
- **physical_health**: Body check-in, movement reminder, sleep tracker
- **personal_growth**: Daily learning prompt, book/article recommendation, skill progress
- **emotional_wellbeing**: Mood tracker, emotion labeling, self-compassion reminder
- **purpose_meaning**: Values reminder, gratitude practice, big-picture reflection

---

## Q3: How do you prefer to reflect and process? (Reflection Style)

### Response → Feature Prioritization

| Preference | Home Screen Order | Notification Content | Suggested Workflows |
|------------|------------------|---------------------|-------------------|
| **writing_journaling** | 1. Journaling prompts, 2. Free-form entry, 3. Templates | Text-based prompts | Morning pages, evening reflection, weekly reviews |
| **talking_through** | 1. AI chat, 2. Voice notes, 3. Conversation starters | Conversational check-ins | Daily chat sessions, talk-to-think prompts |
| **guided_exercises** | 1. Exercise library, 2. Structured programs, 3. Worksheets | Step-by-step activities | CBT exercises, DBT skills, thought records |
| **meditation_mindfulness** | 1. Meditation timer, 2. Breathing exercises, 3. Body scans | Calming notifications | Morning meditation, midday pause, evening wind-down |
| **physical_activity** | 1. Movement prompts, 2. Walk & reflect, 3. Energy check-ins | Activity-based suggestions | Walking meditations, movement breaks, embodiment practices |
| **creative_expression** | 1. Creative prompts, 2. Mood art, 3. Photo journal | Imagination-based activities | Art journaling, poetry prompts, visual reflections |

### AI Companion Communication Style

**High on "talking_through"**: 
- More conversational, asks follow-up questions
- Longer back-and-forth exchanges
- "Tell me more about..." prompts
- Voice message suggestions

**High on "writing_journaling"**:
- Written prompt focus
- Encourages longer written responses
- "Take your time writing this out..."
- Template and structure offers

**High on "guided_exercises"**:
- Step-by-step instructions
- Structured frameworks
- "Let's walk through this together..."
- Worksheet-style interactions

**High on "meditation_mindfulness"**:
- Present-moment language
- Shorter, more focused exchanges
- Breathing reminders
- Body awareness cues

---

## Q4: What's your biggest challenge right now? (Open-Ended Context)

### Response Handling

**NLP Analysis (Privacy-Preserving)**:
- Extract keywords (work, relationship, health, family, etc.)
- Sentiment analysis (distress level)
- Topic categorization
- Flag high-risk language (suicidal ideation, crisis)

**Personalization Applications**:

1. **AI Companion Context**: Seed first conversation with relevant understanding
   - Example: User mentions "new job stress" → AI: "I see you mentioned starting a new job. That's a big transition. How are you navigating it?"

2. **Content Recommendations**: Surface relevant articles/exercises
   - Example: "insomnia" → sleep hygiene content
   - Example: "relationship conflict" → communication exercises

3. **Safety Protocols**: 
   - Crisis language detected → immediate crisis resource offer
   - High distress → prioritize calming content
   - Trauma mentions → trauma-informed care mode

4. **Progress Tracking**: Store as baseline narrative for later reflection
   - "3 months ago you wrote..." comparisons

**Data Handling**:
- Encrypted at rest
- Optional human review only with user consent
- Can be deleted by user anytime
- Not used for marketing/analytics

---

## Q5: How often would you like to check in? (Frequency Preference)

### Response → Notification Cadence

| Selection | Daily Notifications | Weekly Summary | Streak Tracking | Reminder Tone |
|-----------|-------------------|----------------|-----------------|---------------|
| **daily** | 1-2 per day (customizable time) | Sent every Monday | Enabled with emphasis | "Your daily check-in" |
| **few_times_week** | 3-4 per week (M/W/F/Sat) | Sent every Monday | Enabled | "Time for a check-in" |
| **weekly** | 1 per week (user-selected day) | Bi-weekly | Disabled | "Your weekly reflection" |
| **when_i_want** | None (user-initiated only) | Monthly highlights | Disabled | N/A |

### AI Companion Check-in Behavior

- **daily**: Greets user proactively when app opens, references "yesterday" frequently
- **few_times_week**: Gentle "It's been a few days" acknowledgments
- **weekly**: "Welcome back" tone, focuses on broader patterns
- **when_i_want**: Never initiates, purely responsive, celebrates user taking initiative

### Goal & Habit Timeframes

- **daily**: 24-hour goals, daily habits, day-to-day tracking
- **few_times_week**: 3-day goals, weekly habits, trend tracking
- **weekly**: 7-day goals, monthly habits, pattern analysis
- **when_i_want**: Flexible goals, no time pressure messaging

---

## Q6: What time works best for your wellness practice? (Time Preference)

### Response → Notification Scheduling

| Time | Default Notification Time | Content Tone | Suggested Activities |
|------|-------------------------|--------------|---------------------|
| **morning** | 8:00 AM (user timezone) | Energizing, intention-setting, fresh start | Morning pages, goal setting, gratitude, energizing meditation |
| **afternoon** | 2:00 PM (user timezone) | Midday reset, re-centering, energy check | Breathing break, quick reflection, productivity check-in |
| **evening** | 8:00 PM (user timezone) | Calming, reflective, wind-down | Evening journal, day review, gratitude, sleep preparation |
| **varies** | Rotating schedule (morning/afternoon/evening) | Adaptive | Offer all activity types |

### Content Recommendations

**Morning users**:
- Front-load planning and goal-setting tools
- Energizing meditations (breath of fire, visualization)
- "What's your intention today?" prompts
- Morning routine templates

**Afternoon users**:
- Stress management and reset tools
- Short 5-minute breaks
- Energy management content
- Work-life boundary reminders

**Evening users**:
- Reflection and gratitude tools
- Calming meditations (body scan, sleep stories)
- "What did you learn today?" prompts
- Evening wind-down routines

**Varies users**:
- Time-agnostic content
- Let user self-select activity intensity
- No time-based assumptions

---

## Q7: Have you worked with a therapist or counselor? (Therapy Background)

### Response → App Positioning & Boundaries

| Response | App Framing | Educational Content Depth | Resource Suggestions | AI Companion Disclaimers |
|----------|------------|--------------------------|---------------------|------------------------|
| **yes_currently** | "Companion to your therapy work" | High (assumes familiarity with concepts) | Therapy journaling prompts, session prep tools | "Remember to discuss this with your therapist" |
| **yes_past** | "Continued support for your journey" | High | Alumni resources, maintenance strategies | "This isn't therapy, but it can support your ongoing work" |
| **no_interested** | "A great first step" | Medium (educational) | Therapist finder, therapy explainers, insurance guides | "Consider speaking with a professional about this" |
| **no_prefer_selfguided** | "Your self-directed wellness toolkit" | Medium (practical) | Self-help books, evidence-based techniques | Minimal disclaimers (respects autonomy) |
| **prefer_not_say** | Neutral positioning | Medium | All resources available, none pushed | Standard disclaimers |

### Terminology Adjustments

**Therapy-familiar users (yes_currently, yes_past)**:
- Can reference CBT, DBT, ACT by name
- Use terms like "cognitive distortion," "core beliefs," "grounding"
- Frame exercises as "homework" or "between-session practice"

**Non-therapy users (no_interested, no_prefer_selfguided)**:
- Plain language only ("worry thought" not "cognitive distortion")
- Avoid therapy jargon
- Frame as "exercises" or "tools" not "interventions"

---

## Q8: How would you rate your current stress level? (Stress Baseline)

### Response → Content Intensity & Support Level

| Stress Level | Content Strategy | AI Companion Tone | Feature Prioritization | Intervention Threshold |
|--------------|-----------------|-------------------|----------------------|----------------------|
| **1-3 (Low)** | Growth and exploration content | Curious, exploratory, challenging | Learning, community, creativity | None |
| **4-6 (Moderate)** | Balanced approach | Supportive but not worried | Mix of calming and growth | Watch for increase |
| **7-8 (High)** | Prioritize stress management | Calm, reassuring, validating | Breathing, grounding, simplification | Suggest professional resources |
| **9-10 (Critical)** | Crisis-aware content | Extra gentle, slower pacing | Only calming/grounding tools | Immediate crisis resources, frequent check-ins |

### Progress Tracking Baseline

Store as:
```json
{
  "baseline_stress": 7,
  "baseline_date": "2026-02-11",
  "measurement_frequency": "weekly"
}
```

Future stress ratings compared to this baseline:
- Show trends over time
- Celebrate decreases
- Prompt reflection on increases
- Annual re-baseline

### Notification Sensitivity

- **High stress (7-10)**: Avoid "challenging" notifications, focus on support
- **Moderate stress (4-6)**: Standard notifications
- **Low stress (1-3)**: Can include growth-stretching prompts

---

## Q9: What motivates you most? (Motivation Drivers)

### Response → Engagement Strategy

#### If "accountability_tracking" is selected:

**Features to emphasize**:
- Streak counters on home screen
- Daily check-in reminders
- Progress charts and graphs
- Completion badges
- Habit tracking dashboard

**AI Companion behavior**:
- "You've checked in 5 days in a row!" celebrations
- "I noticed you haven't journaled today" gentle nudges
- Progress recaps in check-ins

**Notification style**:
- "Don't break your streak!"
- "Quick check-in to keep your momentum"

---

#### If "encouragement" is selected:

**Features to emphasize**:
- Celebration moments
- Positive affirmations
- Milestone acknowledgments
- Encouraging quotes

**AI Companion behavior**:
- Frequent validation and praise
- "I'm proud of you for showing up"
- Highlight small wins
- Warm, supportive language

**Notification style**:
- "You're doing great 💙"
- "Every step counts"

---

#### If "data_insights" is selected:

**Features to emphasize**:
- Weekly analytics reports
- Mood pattern visualization
- Progress charts
- Correlation insights (sleep vs. mood, etc.)
- Export data functionality

**AI Companion behavior**:
- "I've noticed a pattern..."
- Share observations from user's data
- Analytical framing

**Notification style**:
- "Your weekly insights are ready"
- "You've completed 12 hours of practice this month"

---

#### If "structure_routine" is selected:

**Features to emphasize**:
- Scheduled check-ins
- Morning/evening routines
- Templated workflows
- Calendar integration
- Repeated practices

**AI Companion behavior**:
- Consistent timing and format
- Predictable flow
- "Let's do your evening routine"

**Notification style**:
- "Time for your morning practice"
- "Your 8 PM reflection is ready"

---

#### If "freedom_explore" is selected:

**Features to emphasize**:
- Free-form journaling
- Exploration mode
- Variety in suggestions
- "Surprise me" options
- Minimal structure

**AI Companion behavior**:
- Open-ended questions
- "What feels right today?"
- Follow user's lead
- Low pressure

**Notification style**:
- "Whenever you're ready..."
- "Something to explore when you have time"

---

#### If "connection_others" is selected:

**Features to emphasize**:
- Community forum prominence
- Shared experiences section
- Anonymous letters feature
- "Others have felt this too" insights
- Group activities

**AI Companion behavior**:
- "You're not alone in this"
- Share anonymized community themes
- Suggest forum engagement

**Notification style**:
- "Someone in the community shared..."
- "Your letter received 12 hearts"

---

## Q10: Anything else you'd like Ora to know? (Additional Context)

### Response Handling

Similar to Q4 but with longer form and optional framing.

**Common themes to watch for**:

1. **Accessibility needs**: "I'm visually impaired," "I use a screen reader"
   - Flag for accessibility team
   - Enable high-contrast mode
   - Prioritize audio features

2. **Time constraints**: "I only have 5 minutes a day," "Very busy schedule"
   - Surface quick exercises (1-5 minutes)
   - Reduce notification frequency suggestions
   - Emphasize micro-practices

3. **Privacy concerns**: "I'm worried about data," "Who sees this?"
   - Provide extra privacy education
   - Highlight encryption and controls
   - Offer to use pseudonym

4. **Past negative experiences**: "I've tried apps before and quit," "Therapy didn't work for me"
   - AI companion acknowledges: "Thanks for giving this a try"
   - Low-pressure approach
   - Emphasize user control

5. **Specific goals**: "I want to stop panic attacks," "Need help sleeping"
   - Surface highly relevant content immediately
   - Customize onboarding to specific goal

6. **Neurodivergence**: "I have ADHD," "I'm autistic"
   - Adjust for executive function support
   - Clear, direct language
   - Extra structure or extra flexibility based on preference

**Data Handling**: Same privacy protections as Q4

---

## Combined Personalization Logic

### Example User Profile

**Quiz Responses**:
- Q1: stress_anxiety, building_habits
- Q2: work_career
- Q3: writing_journaling, meditation_mindfulness
- Q4: "Overwhelmed with new management role, not sleeping well"
- Q5: daily
- Q6: morning
- Q7: no_interested
- Q8: 8 (high stress)
- Q9: structure_routine, data_insights, encouragement
- Q10: [skipped]

**Resulting Personalization**:

1. **AI Companion**:
   - Tone: Calm, reassuring, structured
   - First message: "I see you're navigating a new management role and dealing with sleep challenges. That's a lot. How about we start with something simple?"
   - Check-ins: Daily at 8 AM, focus on work stress and sleep
   - Language: Plain (not therapy-literate), validating

2. **Home Screen**:
   - Widget 1: Morning journaling prompt (work-life balance theme)
   - Widget 2: Quick breathing exercise
   - Widget 3: Sleep quality tracker
   - Widget 4: Streak counter (daily check-ins)

3. **Notifications**:
   - 8:00 AM: "Good morning! Your daily check-in is ready 💙"
   - 9:00 PM: "Before bed: quick reflection to help you wind down"
   - Weekly: Detailed insights report (stress trends, sleep correlation)

4. **Content Priority**:
   - Stress management for work
   - Sleep hygiene content
   - Leadership/management resources
   - Structured morning and evening routines
   - Therapist finder (gentle suggestion)

5. **Onboarding Flow**:
   - Immediate: "Let's set up your morning routine"
   - Day 1: Stress baseline check-in
   - Day 3: Sleep tracking explanation
   - Day 7: Progress report (encouragement + data)
   - Week 2: Gentle therapist suggestion with insurance guide

---

## Technical Implementation Notes

### Personalization Engine

**Storage**:
```json
{
  "user_id": "user_123",
  "personalization_profile": {
    "goals": ["stress_anxiety", "building_habits"],
    "focus_area": "work_career",
    "reflection_styles": ["writing_journaling", "meditation_mindfulness"],
    "challenge_context": "Overwhelmed with new management role, not sleeping well",
    "checkin_frequency": "daily",
    "preferred_time": "morning",
    "therapy_background": "no_interested",
    "stress_baseline": 8,
    "motivation_drivers": ["structure_routine", "data_insights", "encouragement"],
    "additional_context": null,
    "computed_at": "2026-02-11T10:30:00Z"
  },
  "personalization_config": {
    "ai_tone": "calm_structured",
    "support_level": "high",
    "notification_times": ["08:00", "21:00"],
    "home_widgets": ["journal_prompt", "breathing", "sleep_tracker", "streak"],
    "content_priorities": ["stress_management", "sleep", "leadership", "routines"],
    "intervention_threshold": "monitor_closely",
    "feature_emphasis": ["structure", "data_visualization", "encouragement"]
  }
}
```

### Re-computation Triggers

Recompute personalization when:
- User updates quiz answers (Settings → Preferences)
- Stress level changes significantly (±3 points over 2 weeks)
- Engagement patterns change (daily user becomes weekly, etc.)
- User explicitly requests "reset recommendations"

### A/B Testing Considerations

Personalization can be tested:
- Control group: Standard onboarding (no quiz)
- Treatment group: Quiz-based personalization
- Metrics: Engagement rate, retention, user satisfaction

**Analytics to track**:
- Which quiz questions correlate most with retention?
- Do certain motivation driver combinations predict success?
- Does stress baseline predict dropout risk?

---

## Future Enhancements

### V2 Considerations

1. **Adaptive Quiz**: Questions adapt based on previous answers
   - If user selects "stress_anxiety" in Q1, Q4 becomes "What does stress feel like for you?" instead of generic challenge

2. **Quiz Retake Prompts**: 
   - After 3 months: "Your life may have changed. Want to update your preferences?"
   - On behavior change: "I notice you're not journaling much anymore. Would you like to adjust your preferences?"

3. **Dynamic Personalization**:
   - Adjust in real-time based on usage patterns (not just quiz)
   - If user stops using journaling features, de-prioritize even if they selected it

4. **Micro-Personalizations**:
   - Time-of-day patterns (user actually active at 10 PM, not 8 PM)
   - Session length preferences
   - Depth of interaction (quick check-ins vs. long conversations)

---

**Document Version:** 1.0  
**Created:** February 2026  
**Owner:** Content-Agent  
**Last Updated:** February 2026  
**Status:** Ready for Engineering Review
