# Authentication Implementation - ORA-051

## Overview
Secure token-based authentication system with automatic token refresh, secure storage, and protected routes.

## Architecture

### Core Components

1. **SecureStorage Service** (`src/services/secureStorage.ts`)
   - Uses `expo-secure-store` for sensitive tokens (JWT access & refresh)
   - Falls back to `AsyncStorage` for non-sensitive user data
   - Provides atomic operations for token management

2. **API Service** (`src/services/api.ts`)
   - Centralized Axios instance with auth interceptors
   - Automatic token injection on authenticated requests
   - Auto-retry with token refresh on 401 errors
   - Prevents multiple simultaneous refresh calls
   - Event-driven logout on refresh failure

3. **Auth Context** (`src/context/AuthContext.tsx`)
   - React Context for global auth state
   - Manages user session, login, register, logout
   - Auto-initializes on app launch
   - Provides `useAuth()` hook for components

4. **Navigation** (`src/navigation/AppNavigator.tsx`)
   - Conditional rendering based on auth state
   - Separate stacks for authenticated/unauthenticated flows
   - Loading screen during auth initialization

5. **Auth Screens**
   - `LoginScreen.tsx` - Email/password login
   - `RegisterScreen.tsx` - New user registration

## Backend API Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/auth/register` | POST | No | Create new account |
| `/auth/login` | POST | No | Login existing user |
| `/auth/refresh` | POST | No | Refresh access token |
| `/auth/me` | GET | Yes | Get current user profile |
| `/auth/logout` | POST | Yes | Revoke refresh token |

### Request/Response Format

**Register/Login Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token-string"
}
```

**Token Refresh Response:**
```json
{
  "success": true,
  "accessToken": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

## Token Management

### Storage
- **Access Token**: Stored in `expo-secure-store` (encrypted)
- **Refresh Token**: Stored in `expo-secure-store` (encrypted)
- **User Data**: Stored in `AsyncStorage` (non-sensitive)

### Lifecycle
1. User logs in → Tokens stored securely
2. API requests → Access token automatically injected in `Authorization` header
3. Token expires (401) → Automatic refresh using refresh token
4. Refresh succeeds → New tokens stored, request retried
5. Refresh fails → Tokens cleared, user logged out

### Token Rotation
Backend implements token rotation on refresh:
- Old refresh token is revoked
- New refresh token is issued
- Prevents replay attacks

## Security Features

### Client-Side
- ✅ Secure token storage (expo-secure-store)
- ✅ Automatic token refresh
- ✅ HTTPS-only communication (production)
- ✅ No tokens in component state
- ✅ Clean logout (tokens cleared)
- ✅ Event-driven logout on refresh failure

### Backend
- ✅ JWT with expiration (15 minutes)
- ✅ Refresh tokens with expiration (7 days)
- ✅ Token rotation on refresh
- ✅ Rate limiting on auth endpoints
- ✅ Password hashing (bcrypt)
- ✅ Email validation
- ✅ Password strength requirements (8+ chars)

## Usage Examples

### Using Auth in Components

```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <View>
      <Text>Welcome, {user?.name}!</Text>
      <Button onPress={logout}>Logout</Button>
    </View>
  );
}
```

### Making Authenticated API Calls

```tsx
import { api } from '../services/api';

// Token is automatically injected
async function getUserProfile() {
  const response = await api.get('/auth/me');
  return response.data;
}

// Custom endpoint
async function getUserData() {
  const response = await api.get('/api/user/data');
  return response.data;
}
```

### Manual Token Management (Advanced)

```tsx
import { secureStorage } from '../services/secureStorage';

// Check if user has valid session
const hasSession = await secureStorage.hasValidSession();

// Get tokens
const { accessToken, refreshToken } = await secureStorage.getTokens();

// Clear all auth data
await secureStorage.clearAll();
```

## Configuration

### API Base URL
Set in `src/config/api.ts`:
```typescript
baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000'
```

Environment variables:
- Development: `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000`
- Production: `EXPO_PUBLIC_API_BASE_URL=https://api.ora-ai.com`

### Token Expiry
Backend configuration in `ora-ai-api/src/config/auth.config.ts`:
- Access Token: `15m` (15 minutes)
- Refresh Token: `7d` (7 days)

## Testing

### Manual Testing Flow

1. **Registration**
   - Open app → Register screen shows
   - Enter email, password, name
   - Submit → Should login automatically

2. **Login**
   - Logout if authenticated
   - Enter credentials
   - Submit → Should navigate to main app

3. **Token Refresh**
   - Wait 15 minutes (or modify backend to 1 minute for testing)
   - Make API call
   - Should auto-refresh and succeed

4. **Logout**
   - Click logout
   - Should clear tokens and return to login

### Testing Token Refresh
To test token refresh without waiting 15 minutes:

1. Temporarily change backend token expiry to `10s`
2. Login
3. Wait 11 seconds
4. Make any API call
5. Should auto-refresh

## Troubleshooting

### "Invalid or expired token" on every request
- Check API base URL matches backend
- Verify backend is running
- Check network connectivity
- Inspect token in secure store: `secureStorage.getAccessToken()`

### Token refresh loops infinitely
- Check backend `/auth/refresh` endpoint works
- Verify refresh token is being stored correctly
- Check backend token rotation logic

### Logout doesn't work
- Check if `secureStorage.clearAll()` is called
- Verify auth state updates in AuthContext
- Check navigation resets to login screen

### App stuck on loading screen
- Check `initializeAuth()` in AuthContext
- Verify API endpoint is reachable
- Add console logs to debug auth initialization

## Dependencies

```json
{
  "expo-secure-store": "^13.0.x",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "axios": "^1.13.4",
  "@react-navigation/native": "^7.1.28",
  "@react-navigation/stack": "^7.7.1"
}
```

## Next Steps

- [ ] Add "Remember Me" functionality
- [ ] Implement biometric authentication (Face ID / Touch ID)
- [ ] Add password reset flow (forgot password)
- [ ] Implement social auth (Google, Apple)
- [ ] Add session timeout warnings
- [ ] Implement multi-device session management
- [ ] Add email verification flow

## Files Created/Modified

### Created
- `src/services/secureStorage.ts` - Token storage service
- `src/context/AuthContext.tsx` - Auth state management
- `src/screens/LoginScreen.tsx` - Login UI
- `src/screens/RegisterScreen.tsx` - Registration UI
- `src/services/index.ts` - Service exports

### Modified
- `src/services/api.ts` - Added auth interceptors
- `src/navigation/AppNavigator.tsx` - Added auth routing
- `App.tsx` - Wrapped in AuthProvider

## Task Completion

**Task**: ORA-051 - Implement secure token storage and auth context  
**Status**: ✅ COMPLETE  
**Priority**: P0 (Critical)  
**Estimated**: 5 hours  
**Actual**: ~4 hours

All deliverables complete:
- ✅ AuthContext with login/register/logout/refresh
- ✅ Secure token storage (expo-secure-store)
- ✅ API service with auto-refresh
- ✅ Navigation with auth state handling
- ✅ Auto-refresh on app launch
- ✅ Loading states
- ✅ Login/Register screens

Ready for QA and integration testing.
