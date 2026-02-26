# Community Features - Shadow AI

## Overview

The community aspect of Shadow AI provides a supportive space for users to share their growth journey, connect with others facing similar challenges, and participate in collective reflection exercises.

## Core Principles

1. **Safety First** - Create a judgment-free, supportive environment
2. **Privacy Control** - Users choose what to share
3. **Authentic Connection** - Encourage genuine, vulnerable sharing
4. **Moderation** - Maintain healthy community standards
5. **Opt-In** - Community is optional, not required

## Feature Breakdown

### 1. User Profiles

**Public Profile Information:**
- Display name (can be pseudonymous)
- Avatar
- Bio (optional)
- Join date
- Participation stats (posts, comments, prompts completed)
- Interests/tags
- Streak information (optional)

**Privacy Settings:**
- Choose what's visible publicly
- Hide profile from search
- Anonymous posting option
- Block/mute users

### 2. Community Feed

**Feed Types:**
- **Home Feed** - Personalized based on interests
- **Global Feed** - All public posts
- **Following Feed** - People you follow
- **Interest Groups** - Filtered by topic

**Post Types:**
1. **Progress Shares** - Milestones, insights, growth moments
2. **Prompt Responses** - Answers to community-wide prompts
3. **Resources** - Helpful articles, tools, tips
4. **Support Requests** - Asking for encouragement/advice
5. **Gratitude/Celebrations** - Positive moments

**Post Structure:**
```typescript
interface CommunityPost {
  id: string;
  userId: string;
  type: PostType;
  content: string;
  promptId?: string; // If responding to group prompt
  tags: string[];
  mood?: string;
  likes: number;
  comments: Comment[];
  isAnonymous: boolean;
  createdAt: Date;
  editedAt?: Date;
}
```

### 3. Group Journal Prompts

**Concept:** Weekly or daily prompts that everyone can respond to, creating shared experiences.

**Examples:**
- "What's one thing you're grateful for this week?"
- "Describe a moment when you felt truly present today"
- "What would you tell your younger self?"
- "Share a lesson you learned recently"

**Features:**
- New prompt every week (or custom frequency)
- See others' responses after sharing your own
- Optional: Vote on next week's prompt
- Archive of past prompts

**Prompt Structure:**
```typescript
interface CommunityPrompt {
  id: string;
  question: string;
  description?: string;
  category: string; // gratitude, reflection, growth, etc.
  activeFrom: Date;
  activeTo: Date;
  responseCount: number;
  featured?: boolean;
}
```

### 4. Interest-Based Groups

**Purpose:** Connect users with similar interests, challenges, or goals

**Group Types:**
- **Topic-Based** - Anxiety, depression, career, relationships
- **Practice-Based** - Meditation, CBT, journaling techniques
- **Demographic** - Parents, students, professionals
- **Goal-Oriented** - Building habits, personal growth

**Group Features:**
- Dedicated feed for group posts
- Group-specific prompts
- Optional group chat
- Resources library
- Member directory

**Group Structure:**
```typescript
interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  tags: string[];
  rules: string[];
  moderators: string[];
  createdAt: Date;
}
```

### 5. Interactions

**Engagement Types:**
- **Likes/Hearts** - Quick appreciation
- **Comments** - Thoughtful responses
- **Encouragement** - Quick supportive reactions
- **Bookmarks** - Save posts for later

**Comment Features:**
- Nested replies (1 level deep)
- Edit/delete own comments
- Report inappropriate comments
- Reactions on comments

### 6. Moderation & Safety

**Automated Moderation:**
- AI content filtering for harmful content
- Keyword flagging
- Link/spam detection
- Rate limiting

**Community Moderation:**
- Report system
- Moderator review queue
- User blocking/muting
- Shadow banning for violations

**Guidelines:**
1. Be kind and supportive
2. No medical advice
3. Respect privacy
4. No spam or self-promotion
5. No discrimination or harassment
6. Use content warnings when needed

**Enforcement:**
- First offense: Warning
- Second offense: Temporary suspension
- Third offense: Permanent ban

### 7. Resources Section

**Purpose:** Curated and community-shared helpful resources

**Resource Types:**
- Articles and blog posts
- Book recommendations
- Apps and tools
- Therapist directories
- Crisis helplines
- Worksheets and exercises

**Features:**
- Upvote/downvote system
- Comments and reviews
- Categories and tags
- Search and filter

### 8. Notifications

**Types:**
- Someone liked your post
- New comment on your post
- Mentioned in a comment
- New group prompt available
- New post in followed group
- Milestone achievements

**Settings:**
- Granular notification preferences
- Quiet hours
- Push vs in-app
- Email digest options

## User Flows

### First-Time Community User
1. Opt-in to community during onboarding (or later)
2. Choose interests/tags
3. See suggested groups to join
4. Guided tour of community features
5. Encouraged to make first post or respond to prompt

### Posting a Progress Share
1. User has insight from journaling
2. Chat behavior offers to share with community
3. User edits/refines post
4. Choose visibility (public/group/anonymous)
5. Add tags
6. Post to feed
7. Receive encouragement from community

### Responding to Group Prompt
1. Notification of new weekly prompt
2. User writes response in chat
3. Response automatically formatted as post
4. After posting, see others' responses
5. Option to comment/engage with others

### Discovering New Groups
1. Browse groups by category
2. See "suggested for you" based on interests
3. Preview group content
4. Join/leave groups
5. Get notifications for group activity

## Technical Implementation

### Database Schema

**Posts Table:**
- id, userId, type, content, promptId, tags, mood
- likes, commentCount, isAnonymous, createdAt, updatedAt

**Comments Table:**
- id, postId, userId, content, parentCommentId
- likes, createdAt, updatedAt

**Groups Table:**
- id, name, description, category, memberCount
- isPrivate, rules, moderators, createdAt

**GroupMembers Table:**
- userId, groupId, joinedAt, role

**Prompts Table:**
- id, question, description, category
- activeFrom, activeTo, responseCount

### API Endpoints

```
GET    /community/feed
GET    /community/feed/:groupId
GET    /community/posts/:postId
POST   /community/posts
PUT    /community/posts/:postId
DELETE /community/posts/:postId

GET    /community/prompts/active
GET    /community/prompts/:promptId/responses
POST   /community/prompts/:promptId/respond

GET    /community/groups
GET    /community/groups/:groupId
POST   /community/groups/:groupId/join
POST   /community/groups/:groupId/leave

POST   /community/posts/:postId/like
POST   /community/posts/:postId/comment
PUT    /community/comments/:commentId
DELETE /community/comments/:commentId

POST   /community/report
GET    /community/user/:userId/profile
PUT    /community/user/profile
```

### State Management

**CommunityContext:**
```typescript
interface CommunityState {
  feed: Post[];
  activePrompt: CommunityPrompt | null;
  userGroups: Group[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}
```

## Privacy Considerations

1. **What's Shareable:**
   - Journal entries (opt-in per entry)
   - Progress insights
   - Exercises completion
   - General posts

2. **What's Never Shared:**
   - Raw AI chat transcripts (unless user excerpts)
   - Detailed personal information
   - Location data
   - Contact information

3. **Anonymity:**
   - Option to post anonymously
   - Anonymous posts can't be traced back to profile
   - Moderators can see anonymous posters (for moderation)

## Growth Metrics

**Community Health Indicators:**
- Daily/Weekly Active Users (DAU/WAU)
- Post engagement rate
- Comment-to-post ratio
- User retention in community
- New member onboarding completion
- Report-to-post ratio (lower is better)

**User Engagement:**
- Posts per user
- Comments per user
- Groups joined
- Prompt response rate
- Time spent in community

## Future Enhancements

### Phase 1 (Launch)
- Basic feed and posting
- Group prompts
- Simple groups
- Likes and comments

### Phase 2
- Interest-based groups
- Advanced moderation tools
- Resources section
- User mentions

### Phase 3
- Direct messaging (if appropriate)
- Voice posts (optional)
- Live group sessions
- Achievements and badges

### Phase 4
- AI-powered connection matching
- Mentor/buddy system
- Custom group prompts
- Community challenges

## Testing Focus

**Community TDD Checklist:**
- [ ] Create and publish post
- [ ] Like and comment on posts
- [ ] Report inappropriate content
- [ ] Join and leave groups
- [ ] Respond to prompts
- [ ] Privacy controls work correctly
- [ ] Anonymous posting maintains privacy
- [ ] Moderation workflow
- [ ] Notification delivery
- [ ] Feed pagination and filtering

## Community Behavior Integration

**New AI Behavior:** Community Sharing Assistant

**Purpose:** Help users craft posts for community

**Capabilities:**
- Suggest when content might be valuable to share
- Help refine posts for clarity
- Remind about privacy settings
- Suggest appropriate groups/tags
- Encourage authentic sharing

**Example Flow:**
```
User: "I had a breakthrough in therapy today"
AI: "That sounds like a meaningful moment. Would you like to share
     this insight with the community? I can help you write a post
     that captures what you learned."
User: "Sure"
AI: "Great! What specifically did you realize?"
[User shares]
AI: "Here's a draft post. Would you like to share this publicly,
     in a specific group, or anonymously?"
```

## Moderation AI Behavior

**Purpose:** Assist moderators with content review

**Capabilities:**
- Flag potentially harmful content
- Suggest appropriate actions
- Identify patterns in reports
- Generate moderation summaries

## Success Criteria

A successful community feature will:
1. Increase user retention (30%+ increase)
2. Create supportive interactions (high positive sentiment)
3. Low moderation incidents (<1% of posts)
4. High engagement (50%+ of users engage weekly)
5. Positive user feedback (4+ star ratings on feature)

## Risks & Mitigation

**Risk:** Negative interactions harm users
**Mitigation:** Strong moderation, clear guidelines, easy blocking

**Risk:** Privacy breaches
**Mitigation:** Careful data handling, anonymization options, clear controls

**Risk:** Low engagement
**Mitigation:** Prompt gamification, notifications, quality content

**Risk:** Echo chambers
**Mitigation:** Diverse content, suggested groups, varied prompts

**Risk:** Competition with journaling focus
**Mitigation:** Keep community optional, emphasize personal growth first
