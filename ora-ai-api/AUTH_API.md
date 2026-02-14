# Authentication API Documentation

## Overview

Complete JWT-based authentication system with refresh token rotation, password reset functionality, and rate limiting.

## Base URL

Development: `http://localhost:4000`

## Authentication

Protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Register New User

**POST** `/auth/register`

Create a new user account.

**Rate Limit:** 3 requests per minute

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Validation:**
- Email: Valid email format
- Password: Minimum 8 characters
- Name: Required

**Success Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "is_active": true
  },
  "accessToken": "jwt_token...",
  "refreshToken": "refresh_token..."
}
```

**Error Responses:**
- `400` - Missing required fields or validation error
- `409` - User already exists
- `429` - Too many registration attempts

---

### 2. Login

**POST** `/auth/login`

Authenticate a user and receive access/refresh tokens.

**Rate Limit:** 5 requests per minute

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "last_login": "2024-01-01T00:00:00.000Z",
    ...
  },
  "accessToken": "jwt_token...",
  "refreshToken": "refresh_token..."
}
```

**Error Responses:**
- `400` - Missing required fields
- `401` - Invalid credentials
- `429` - Too many login attempts

---

### 3. Refresh Token

**POST** `/auth/refresh`

Refresh an expired access token using a refresh token. Implements token rotation - old refresh token is invalidated.

**Request Body:**
```json
{
  "refreshToken": "refresh_token..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "accessToken": "new_jwt_token...",
  "refreshToken": "new_refresh_token..."
}
```

**Error Responses:**
- `400` - Missing refresh token
- `401` - Invalid or expired refresh token

---

### 4. Forgot Password

**POST** `/auth/forgot-password`

Request a password reset token. Always returns success to prevent email enumeration.

**Rate Limit:** 3 requests per hour

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent",
  "resetToken": "token...",  // Only in development mode
  "devNote": "Token included for development only. In production, this would be sent via email."
}
```

**Note:** In production, the `resetToken` should be sent via email and not returned in the response.

---

### 5. Reset Password

**POST** `/auth/reset-password`

Reset password using a valid reset token.

**Request Body:**
```json
{
  "token": "reset_token...",
  "newPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password."
}
```

**Error Responses:**
- `400` - Missing required fields, invalid token, or password validation error

**Side Effects:**
- All existing refresh tokens for the user are revoked
- User must login again with the new password

---

### 6. Get Current User Profile (Protected)

**GET** `/auth/me`

Get the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": null,
    "bio": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-01T00:00:00.000Z",
    "is_active": true,
    "quiz_data": null
  }
}
```

**Error Responses:**
- `401` - No token provided or authentication required
- `403` - Invalid or expired token
- `404` - User not found

---

### 7. Logout (Protected)

**POST** `/auth/logout`

Logout the current user and optionally revoke a refresh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (Optional):**
```json
{
  "refreshToken": "refresh_token..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** In a stateless JWT system, logout is primarily handled client-side by discarding the tokens. The server can revoke the provided refresh token if included.

---

## Legacy Endpoints (Backward Compatibility)

The following endpoints are aliases for the main endpoints:

- `POST /auth/signup` → `/auth/register`
- `POST /auth/signin` → `/auth/login`
- `POST /auth/signout` → `/auth/logout`
- `POST /auth/refreshToken` → `/auth/refresh`

---

## Security Features

### 1. Password Hashing
- Passwords are hashed using bcrypt with cost factor 10
- Password hashes are never returned in API responses

### 2. JWT Tokens
- Access tokens are valid for 7 days
- Signed using HS256 algorithm
- Contains: userId, email, name (no sensitive data)

### 3. Refresh Tokens
- Valid for 30 days
- Stored in database with metadata (IP, user agent)
- Implements token rotation (old token invalidated on refresh)
- Can be revoked individually or all at once (e.g., on password reset)

### 4. Rate Limiting
- Login: 5 attempts per minute
- Registration: 3 attempts per minute
- Forgot Password: 3 attempts per hour
- Prevents brute force attacks

### 5. Password Reset Tokens
- Valid for 1 hour
- Single-use tokens (marked as used after successful reset)
- All refresh tokens revoked after password reset

### 6. Email Enumeration Prevention
- Forgot password always returns success (doesn't reveal if email exists)
- Consistent response times for existing/non-existing users

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  quiz_data JSONB
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_reason VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

### Password Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45)
);
```

---

## Environment Variables

Required environment variables (`.env`):

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shadowai
DB_USER=shadowai
DB_PASSWORD=your-db-password

# Server Configuration
PORT=4000
NODE_ENV=development
```

---

## Testing

Example test script:

```bash
# Register a new user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Get user profile (use access token from login response)
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer <access_token>"

# Refresh token (use refresh token from login response)
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh_token>"}'

# Forgot password
curl -X POST http://localhost:4000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Reset password (use token from forgot password response)
curl -X POST http://localhost:4000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "<reset_token>", "newPassword": "newpassword123"}'
```

---

## Files Structure

```
src/
├── config/
│   └── auth.config.ts         # JWT settings, rate limits, password rules
├── models/
│   └── user.model.ts          # User database operations
├── services/
│   └── auth.service.ts        # Business logic for auth operations
├── middleware/
│   └── auth.middleware.ts     # JWT verification & rate limiting
├── controllers/
│   └── auth.controller.ts     # Request handlers
├── routes/
│   └── auth.routes.ts         # Route definitions
└── db/
    └── migrations/
        ├── 001_create_users.sql
        └── 002_create_refresh_tokens.sql
```

---

## Implementation Notes

1. **Token Storage**: Access and refresh tokens should be stored securely on the client (e.g., secure HTTP-only cookies or encrypted storage).

2. **Production Deployment**: 
   - Set strong `JWT_SECRET` in environment
   - Implement email service for password reset
   - Remove `resetToken` from forgot-password response
   - Configure CORS for allowed origins
   - Set `NODE_ENV=production`

3. **Future Enhancements**:
   - Token blacklisting for immediate logout
   - Multi-factor authentication (MFA)
   - OAuth integration (Google, Facebook, etc.)
   - Email verification on registration
   - Account lockout after repeated failed attempts
   - Audit logging for security events

---

## Support

For issues or questions, please contact the development team or refer to the main project documentation.
