# Ora AI API Integration Guide

Quick start guide for integrating with the Ora AI backend API.

## Base URL

**Development**: `http://localhost:4000/api`  
**Production**: `https://api.ora-ai.com/api`

## Authentication

All protected endpoints require a JWT Bearer token in the Authorization header.

### Get Access Token

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Use Access Token

```bash
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Refresh Token

Access tokens expire after 15 minutes. Use the refresh token to get a new one:

```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Common Workflows

### 1. User Registration & Login

```bash
# Register
POST /auth/register
{
  "email": "user@example.com",
  "password": "securepass123",
  "name": "Jane Doe"
}

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "securepass123"
}

# Get profile
GET /users/me
Authorization: Bearer {accessToken}
```

### 2. Chat with AI

```bash
POST /chat/messages
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "content": "I'm feeling anxious today",
  "behaviorId": "empathetic-listener"
}
```

**Response**:
```json
{
  "id": "msg-123",
  "content": "I hear you. It's okay to feel anxious...",
  "sender": "ora",
  "timestamp": "2026-02-14T07:00:00Z"
}
```

### 3. Get Letters

```bash
# Get inbox
GET /letters?folder=inbox
Authorization: Bearer {accessToken}

# Get specific letter
GET /letters/letter-456
Authorization: Bearer {accessToken}

# Mark as read
POST /letters/letter-456/read
Authorization: Bearer {accessToken}
```

### 4. Community Posts

```bash
# Get posts
GET /forum/posts?limit=20&offset=0
Authorization: Bearer {accessToken}

# Create post
POST /forum/posts
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Meditation helped me today",
  "content": "I wanted to share my experience...",
  "category": "meditation"
}

# Add comment
POST /forum/posts/post-789/comments
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "content": "Thank you for sharing this!"
}
```

### 5. Meditation

```bash
# Get meditation library
GET /meditation/scripts
Authorization: Bearer {accessToken}

# Get specific script
GET /meditation/scripts/body-scan
Authorization: Bearer {accessToken}

# Start session
POST /meditation/sessions
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "scriptId": "body-scan",
  "duration": 300
}

# Complete session
POST /meditation/sessions/session-999/complete
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "completed": true,
  "durationSeconds": 305
}
```

## Error Handling

All errors follow this format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit) |
| 500 | Server Error |

### Example Error Response

```json
{
  "error": "ValidationError",
  "message": "Invalid email format",
  "details": {
    "field": "email",
    "value": "notanemail"
  }
}
```

## Rate Limiting

Authentication endpoints have rate limits:
- **Login**: 5 attempts per minute
- **Register**: 3 attempts per minute
- **Forgot Password**: 3 attempts per hour

Other endpoints: 100 requests per minute per user.

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1708000000
```

## Pagination

List endpoints support pagination via `limit` and `offset`:

```bash
GET /forum/posts?limit=20&offset=40
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "total": 245,
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```

## Caching

Responses may include cache headers:
```
X-Cache-Status: HIT
Cache-Control: max-age=60
```

- **HIT**: Served from cache
- **MISS**: Fetched fresh

## Webhooks

_(Future feature)_ Subscribe to events:
- `letter.received`
- `post.replied`
- `meditation.completed`

## SDKs

### JavaScript/TypeScript

```bash
npm install @ora-ai/client
```

```ts
import { OraClient } from '@ora-ai/client';

const ora = new OraClient({
  baseUrl: 'https://api.ora-ai.com',
  apiKey: 'your-api-key'
});

// Login
const { accessToken } = await ora.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Get letters
const letters = await ora.letters.list();

// Send chat message
const response = await ora.chat.send({
  content: 'Hello!',
  behaviorId: 'empathetic-listener'
});
```

### Python

```bash
pip install ora-ai-client
```

```python
from ora_ai import OraClient

ora = OraClient(base_url='https://api.ora-ai.com', api_key='your-api-key')

# Login
token = ora.auth.login(email='user@example.com', password='password123')

# Get letters
letters = ora.letters.list()

# Send chat message
response = ora.chat.send(content='Hello!', behavior_id='empathetic-listener')
```

## Testing

### Postman Collection

Import our Postman collection:
```
https://api.ora-ai.com/docs/postman-collection.json
```

### Sample cURL Requests

```bash
# Health check
curl https://api.ora-ai.com/health

# Login
curl -X POST https://api.ora-ai.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Get profile
curl https://api.ora-ai.com/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

- **Documentation**: https://docs.ora-ai.com
- **API Status**: https://status.ora-ai.com
- **Support**: support@ora-ai.com
- **Discord**: https://discord.gg/ora-ai

## Changelog

### v1.0.0 (2026-02-14)
- Initial API release
- Auth, chat, letters, community, meditation endpoints
- JWT authentication
- Redis caching
- Rate limiting

## Next Steps

1. Register for an API key
2. Review OpenAPI spec: `/docs/openapi.yaml`
3. Try example requests
4. Integrate SDK
5. Build your integration

Happy coding! 🦞
