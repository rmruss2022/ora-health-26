# Security Architecture - Shadow AI

## Overview

Shadow AI follows security best practices by separating the mobile app from sensitive credentials and cloud services.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Mobile App (React Native)                       │
│         - NO AWS credentials                            │
│         - NO OpenAI API keys                            │
│         - Only stores JWT auth token                    │
│         - Makes HTTP requests to backend                │
└──────────────────┬────────────────────────────────────┘
                   │ HTTPS
┌──────────────────▼────────────────────────────────────┐
│         Backend API (Node.js/Express)                   │
│         - Validates JWT tokens                          │
│         - Handles AWS credentials (server-side only)    │
│         - Calls OpenAI API (server-side only)           │
└──────────────────┬────────────────────────────────────┘
        ┌──────────┼──────────┐
┌───────▼────────┐   ┌───────▼─────────┐
│  AWS DynamoDB  │   │   OpenAI API    │
└────────────────┘   └─────────────────┘
```

## Two Separate Projects

### shadow-ai (Mobile App)
- React Native with Expo
- NO credentials, NO AWS SDK
- Only makes HTTP calls to backend
- Stores JWT token locally

### shadow-ai-api (Backend API)
- Node.js/Express server
- Has AWS credentials (server-side only)
- Has OpenAI API key (server-side only)
- Validates authentication
- Handles all database operations

## Why This Architecture?

### ❌ Insecure (What NOT to do)
```javascript
// Mobile app - DON'T DO THIS
const AWS_KEY = "AKIA...";  // Can be extracted!
```

### ✅ Secure (What we're doing)
```javascript
// Mobile app - Only knows API URL
const API_URL = "https://api.shadow-ai.com";

// Backend - Credentials stay on server
AWS_ACCESS_KEY_ID=xxxxx  // In .env file, never committed
```

## Security Best Practices Implemented

✅ Passwords hashed with bcrypt
✅ JWT authentication
✅ No credentials in mobile app
✅ HTTPS for all requests
✅ CORS configuration
✅ Input validation

## Production Checklist

- [ ] Use AWS Secrets Manager for credentials
- [ ] Enable HTTPS only
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerts
- [ ] Enable DynamoDB encryption at rest
- [ ] Rotate credentials regularly

---

**Remember:** Never commit `.env` files or expose credentials in your mobile app code.
