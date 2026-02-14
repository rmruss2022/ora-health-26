# Letters API Documentation

## Overview

The Letters system provides a daily inbox feature where users receive and send personal letters. It's designed as a private, intimate messaging system with an "envelope" metaphor.

## Database Schema

### Tables Created

1. **letters** - Main letters table
   - Core fields: id, sender_id, recipient_id, subject, body
   - Metadata: is_ai_generated, ai_category, metadata (JSONB)
   - Timestamps: sent_at, read_at, archived_at
   - Flags: is_archived, is_starred
   - Threading: parent_letter_id for replies

2. **letter_threads** - Thread organization
   - Manages conversation threading
   - Fields: letter_id, thread_root_id, thread_position

3. **letter_templates** - AI letter templates
   - Pre-configured templates for AI-generated letters
   - Categories: motivation, encouragement, celebration, mindfulness, gratitude, connection, insight
   - Variable substitution support

4. **user_letter_preferences** - User preferences
   - Control daily letter delivery
   - Preferred delivery time and categories
   - Max daily letters setting

## API Endpoints

Base path: `/api/letters`

All endpoints require authentication via Bearer token in Authorization header.

### 1. Get Inbox (Received Letters)

```http
GET /api/letters/inbox
```

**Query Parameters:**
- `unreadOnly` (boolean, optional) - Filter to unread letters only
- `starredOnly` (boolean, optional) - Filter to starred letters only
- `limit` (number, optional, default: 20) - Number of letters to return
- `offset` (number, optional, default: 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "letters": [
    {
      "id": "uuid",
      "senderId": "uuid or null",
      "recipientId": "uuid",
      "subject": "string",
      "body": "string",
      "isAiGenerated": boolean,
      "aiCategory": "string or null",
      "metadata": {},
      "sentAt": "ISO-8601 timestamp",
      "readAt": "ISO-8601 timestamp or null",
      "isArchived": boolean,
      "isStarred": boolean,
      "parentLetterId": "uuid or null",
      "senderName": "string or null",
      "isReply": boolean,
      "timestamp": "2h ago"
    }
  ],
  "unreadCount": 5,
  "totalCount": 42
}
```

### 2. Get Sent Letters

```http
GET /api/letters/sent
```

**Query Parameters:**
- `limit` (number, optional, default: 20)
- `offset` (number, optional, default: 0)

**Response:**
```json
{
  "success": true,
  "letters": [...],
  "totalCount": 15
}
```

### 3. Get Specific Letter

```http
GET /api/letters/:id
```

**Auto-marks as read** when recipient opens the letter.

**Response:**
```json
{
  "success": true,
  "letter": {
    "id": "uuid",
    ...
  }
}
```

### 4. Send New Letter

```http
POST /api/letters
```

**Request Body:**
```json
{
  "recipientId": "uuid",
  "subject": "Hello!",
  "body": "This is my letter content...",
  "metadata": {
    "custom": "data"
  }
}
```

**Response:**
```json
{
  "success": true,
  "letter": {...}
}
```

### 5. Reply to Letter

```http
POST /api/letters/:id/reply
```

Automatically determines recipient and adds "Re: " prefix if needed.

**Request Body:**
```json
{
  "subject": "Re: Hello!",
  "body": "Thanks for your letter..."
}
```

**Response:**
```json
{
  "success": true,
  "letter": {...}
}
```

### 6. Mark as Read/Unread

```http
PATCH /api/letters/:id/read
```

**Request Body:**
```json
{
  "read": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Letter marked as read"
}
```

### 7. Archive/Unarchive Letter

```http
PATCH /api/letters/:id/archive
```

**Request Body:**
```json
{
  "archived": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Letter archived"
}
```

### 8. Star/Unstar Letter

```http
PATCH /api/letters/:id/star
```

**Request Body:**
```json
{
  "starred": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Letter starred"
}
```

### 9. Get Unread Count

```http
GET /api/letters/unread-count
```

**Response:**
```json
{
  "success": true,
  "count": 5
}
```

### 10. Generate AI Daily Letter

```http
POST /api/letters/generate-daily
```

Generates a personalized AI letter based on templates. Can be triggered manually or via cron job.

**Response:**
```json
{
  "success": true,
  "letter": {
    "id": "uuid",
    "isAiGenerated": true,
    "aiCategory": "motivation",
    ...
  }
}
```

### 11. Get User Preferences

```http
GET /api/letters/preferences
```

**Response:**
```json
{
  "success": true,
  "preferences": {
    "id": "uuid",
    "userId": "uuid",
    "dailyLetterEnabled": true,
    "preferredDeliveryTime": "08:00:00",
    "preferredCategories": ["motivation", "mindfulness"],
    "maxDailyLetters": 1
  }
}
```

### 12. Update User Preferences

```http
PATCH /api/letters/preferences
```

**Request Body:**
```json
{
  "dailyLetterEnabled": true,
  "preferredDeliveryTime": "09:00:00",
  "preferredCategories": ["motivation", "gratitude"],
  "maxDailyLetters": 2
}
```

**Response:**
```json
{
  "success": true,
  "preferences": {...}
}
```

## AI Letter Categories

The system includes 8 pre-seeded letter templates:

1. **motivation/morning** - Morning encouragement (☀️)
2. **motivation/evening** - Evening reflection (🌙)
3. **encouragement/tough_day** - Support for difficult days (💪)
4. **celebration/milestone** - Celebrating achievements (🎉)
5. **mindfulness/reminder** - Mindful moments (🧘)
6. **gratitude/daily** - Gratitude prompts (💛)
7. **connection/community** - Community connection (🤝)
8. **insight/personal_growth** - Growth insights (🌱)

Each template supports variable substitution:
- `{{user_name}}` - User's name
- `{{personalized_insight}}` - Dynamic insight
- `{{personalized_reflection}}` - Dynamic reflection
- `{{supportive_message}}` - Supportive content
- And more...

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth token)
- `403` - Forbidden (token expired)
- `404` - Not Found (letter doesn't exist or no access)
- `500` - Internal Server Error

## Testing with cURL

### Get inbox:
```bash
curl -X GET http://localhost:4000/api/letters/inbox \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send a letter:
```bash
curl -X POST http://localhost:4000/api/letters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "RECIPIENT_UUID",
    "subject": "Hello!",
    "body": "This is a test letter."
  }'
```

### Generate AI letter:
```bash
curl -X POST http://localhost:4000/api/letters/generate-daily \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get unread count:
```bash
curl -X GET http://localhost:4000/api/letters/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Implementation Notes

### Service Layer (`letter.service.ts`)
- Handles all database operations
- Implements threading logic
- AI letter generation with template variables
- Helper functions for timestamp formatting
- Preference management

### Controller Layer (`letter.controller.ts`)
- Request validation
- Error handling
- Response formatting
- Auto-mark as read on letter open

### Routes Layer (`letter.routes.ts`)
- All routes protected with `authenticateToken` middleware
- RESTful endpoint structure
- Clear separation of inbox/sent/preferences

### Migration (`004_create_letters_system.sql`)
- Creates all tables with proper indexes
- Seeds 8 letter templates
- Creates default preferences for existing users
- Supports threading and AI generation

## Future Enhancements

Potential features for future development:
1. Bulk actions (mark all as read, archive multiple)
2. Search functionality
3. Letter drafts
4. Scheduled sending
5. Rich text/markdown support
6. Attachments
7. Letter reactions (like, heart, etc.)
8. Read receipts
9. AI letter personalization based on user history
10. Daily digest emails
11. Push notifications for new letters
12. Letter analytics (most read, engagement)

## Cron Job Integration

To send daily AI letters automatically, set up a cron job:

```javascript
// Example cron job (pseudo-code)
schedule.every('8:00 AM', async () => {
  const users = await getUsersWithLettersEnabled();
  
  for (const user of users) {
    if (shouldSendDailyLetter(user)) {
      await letterService.generateDailyLetter(user.id);
    }
  }
});
```

## Database Indexes

Optimized indexes for performance:
- `idx_letters_recipient` - Fast inbox queries
- `idx_letters_sender` - Fast sent letters queries
- `idx_letters_unread` - Quick unread count
- `idx_letters_starred` - Starred letters filter
- `idx_letters_parent` - Thread navigation
- `idx_letter_threads_root` - Thread assembly

## Security Considerations

1. All endpoints require authentication
2. Users can only:
   - Read letters they sent or received
   - Mark as read/star/archive letters they received
   - Reply to letters where they're sender or recipient
3. Recipient validation on send
4. SQL injection protection via parameterized queries
5. Input validation on all endpoints
