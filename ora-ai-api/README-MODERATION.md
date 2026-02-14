# Content Moderation

Ora AI implements multi-layer content moderation to keep the community safe and welcoming.

## Overview

**Moderation Layers:**
1. **Profanity filter** - Bad language detection
2. **Spam detection** - Repeated content, excessive caps/links
3. **Toxicity detection** - Hate speech, harassment patterns  
4. **PII detection** - Personal information warnings

**Fail-safe behavior**: If moderation service fails, content is allowed through (fail open).

## Quick Start

### 1. Install Dependencies

```bash
npm install bad-words
```

### 2. Enable Moderation

Add to `.env`:
```env
CONTENT_MODERATION_ENABLED=true
```

### 3. Apply to Routes

```ts
import { moderateContent } from './middleware/moderation.middleware';

// Moderate post content
router.post('/forum/posts',
  authenticateToken,
  moderateContent({ field: 'content' }),
  createPostHandler
);

// Moderate comment
router.post('/forum/posts/:id/comments',
  authenticateToken,
  moderateContent({ field: 'content', autoClean: false }),
  addCommentHandler
);

// Moderate profile
import { moderateProfile } from './middleware/moderation.middleware';

router.patch('/users/me',
  authenticateToken,
  moderateProfile,
  updateProfileHandler
);
```

## Moderation Service API

### Basic Usage

```ts
import { moderationService } from './services/moderation/moderation.service';

const result = await moderationService.moderateText('User content here');

if (!result.approved) {
  console.log('Blocked:', result.reason);
  console.log('Flags:', result.flags); // ['profanity', 'spam', etc.]
}
```

### With Options

```ts
const result = await moderationService.moderateText(userText, {
  checkProfanity: true,
  checkSpam: true,
  checkToxicity: true,
  checkPersonalInfo: true,
  autoClean: false, // Set true to replace profanity with asterisks
});
```

### Auto-Clean Mode

```ts
const result = await moderationService.moderateText('bad word here', {
  autoClean: true,
});

console.log(result.cleanedText); // "*** word here"
console.log(result.approved); // true (cleaned content allowed through)
```

## Middleware Options

### Single Field

```ts
moderateContent({
  field: 'content',      // req.body field to check
  autoClean: false,       // Auto-clean profanity?
  required: true,         // Field required?
})
```

### Multiple Fields

```ts
import { moderateMultipleFields } from './middleware/moderation.middleware';

router.post('/posts',
  moderateMultipleFields(['title', 'content', 'tags'], true),
  createPostHandler
);
```

### Strict Mode

```ts
import { strictModeration } from './middleware/moderation.middleware';

router.post('/comments',
  authenticateToken,
  strictModeration('content'), // No auto-clean, content required
  addCommentHandler
);
```

## Detection Rules

### Profanity
Uses `bad-words` library for common profanity detection across languages.

**Customize:**
```ts
import { moderationService } from './services/moderation/moderation.service';

// Add custom words
moderationService.addCustomWords('badword1', 'badword2');

// Remove false positives
moderationService.removeWords('hell', 'damn');
```

### Spam Detection

**Triggers:**
- >70% capitalization (min 20 chars)
- 5+ repeated characters (e.g., "hellooooooo")
- >20 emojis in one message
- >5 URLs in one message
- Common spam phrases ("click here now", "limited time offer", etc.)

### Toxicity Detection

**Triggers:**
- Threatening language ("hate you", "you should die")
- Multiple harassment words (≥2 of: idiot, stupid, loser, pathetic, worthless)

**Note:** This is basic pattern matching. For production, consider:
- **OpenAI Moderation API** (free, high accuracy)
- **Perspective API** (Google, toxicity scores)

### PII Detection

**Detects (warns, doesn't block):**
- Email addresses
- Phone numbers
- Credit card numbers
- Social Security Numbers
- Street addresses

## Response Format

### Success (approved)

```json
{
  "approved": true,
  "flags": [],
  "confidence": 1
}
```

### Blocked

```json
{
  "approved": false,
  "reason": "Content contains inappropriate language",
  "flags": ["profanity"],
  "confidence": 0.9
}
```

### Auto-Cleaned

```json
{
  "approved": true,
  "flags": ["profanity"],
  "confidence": 0.9,
  "cleanedText": "This is *** content"
}
```

## Error Responses

When content is blocked:

```json
{
  "error": "ModerationError",
  "message": "Content did not pass moderation",
  "flags": ["profanity", "spam"]
}
```

## Integration Examples

### Forum Posts

```ts
router.post('/forum/posts', 
  authenticateToken,
  moderateMultipleFields(['title', 'content']),
  async (req, res) => {
    const post = await createPost(req.body);
    res.json(post);
  }
);
```

### Comments

```ts
router.post('/posts/:id/comments',
  authenticateToken,
  strictModeration('content'),
  async (req, res) => {
    const comment = await addComment(req.params.id, req.body.content);
    res.json(comment);
  }
);
```

### Profile Updates

```ts
router.patch('/users/me',
  authenticateToken,
  moderateProfile,
  async (req, res) => {
    const user = await updateUser(req.user.id, req.body);
    res.json(user);
  }
);
```

### Chat Messages

```ts
router.post('/chat/messages',
  authenticateToken,
  moderateContent({ field: 'content', autoClean: true }),
  async (req, res) => {
    const message = await sendChatMessage(req.user.id, req.body.content);
    res.json(message);
  }
);
```

## Advanced: External APIs

### OpenAI Moderation API

```ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function moderateWithOpenAI(text: string) {
  const result = await openai.moderations.create({ input: text });
  const flagged = result.results[0].flagged;
  const categories = result.results[0].categories;
  
  return {
    approved: !flagged,
    categories,
  };
}
```

### Perspective API

```ts
import { google } from 'googleapis';

const perspectiveApi = google.commentanalyzer('v1alpha1');

async function moderateWithPerspective(text: string) {
  const response = await perspectiveApi.comments.analyze({
    key: process.env.PERSPECTIVE_API_KEY,
    requestBody: {
      comment: { text },
      requestedAttributes: { TOXICITY: {}, SEVERE_TOXICITY: {} },
    },
  });
  
  const toxicity = response.data.attributeScores.TOXICITY.summaryScore.value;
  return {
    approved: toxicity < 0.7,
    toxicity,
  };
}
```

## Monitoring

### Log Blocked Content

```ts
const result = await moderationService.moderateText(content);

if (!result.approved) {
  console.log({
    userId: req.user.id,
    content: content.slice(0, 100),
    reason: result.reason,
    flags: result.flags,
    timestamp: new Date(),
  });
}
```

### Track Moderation Stats

Create a moderation log table to track:
- User ID
- Content type (post, comment, profile)
- Flags triggered
- Action taken (blocked, cleaned, allowed)
- Timestamp

## Testing

### Unit Tests

```ts
import { moderationService } from './moderation.service';

describe('Moderation Service', () => {
  it('should block profanity', async () => {
    const result = await moderationService.moderateText('bad word here');
    expect(result.approved).toBe(false);
    expect(result.flags).toContain('profanity');
  });

  it('should detect spam', async () => {
    const result = await moderationService.moderateText('CLICK HERE NOW!!!');
    expect(result.approved).toBe(false);
    expect(result.flags).toContain('spam');
  });

  it('should auto-clean when enabled', async () => {
    const result = await moderationService.moderateText('bad word', {
      autoClean: true,
    });
    expect(result.approved).toBe(true);
    expect(result.cleanedText).toContain('***');
  });
});
```

## Configuration

### Disable Moderation

```env
CONTENT_MODERATION_ENABLED=false
```

### Custom Word Lists

```ts
// config/moderation.config.ts
export const customBadWords = ['word1', 'word2'];
export const allowedWords = ['hell', 'damn']; // Remove from filter
```

## Best Practices

1. **Use auto-clean for chat** - Less disruptive
2. **Strict mode for public posts** - Higher standards
3. **Log all blocks** - Review false positives
4. **Allow appeals** - Users should be able to contest blocks
5. **Combine with rate limiting** - Prevent spam abuse
6. **Review patterns monthly** - Update rules based on real abuse
7. **Consider context** - Mental health app = different thresholds

## Roadmap

- [ ] Machine learning-based toxicity scoring
- [ ] User-reported content queue
- [ ] Moderator dashboard
- [ ] Appeal system
- [ ] Shadow banning for repeat offenders
- [ ] Community-driven moderation (upvote/downvote to flag)

## Support

- **False positive?** Contact support@ora-ai.com
- **Add custom rules?** See `moderation.service.ts`
- **Need help?** Check Discord #moderation channel
