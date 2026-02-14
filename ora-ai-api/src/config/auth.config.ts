// Auth Configuration
// JWT settings and security parameters

export const authConfig = {
  // JWT Settings
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessTokenExpiry: '7d', // Access token valid for 7 days
    refreshTokenExpiry: '30d', // Refresh token valid for 30 days
    algorithm: 'HS256' as const,
  },

  // Password Settings
  password: {
    minLength: 8,
    bcryptRounds: 10, // Cost factor for bcrypt
  },

  // Password Reset Settings
  passwordReset: {
    tokenExpiry: 60 * 60 * 1000, // 1 hour in milliseconds
  },

  // Rate Limiting
  rateLimit: {
    login: {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 5, // 5 attempts per minute
    },
    register: {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 3, // 3 attempts per minute
    },
    forgotPassword: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3, // 3 attempts per hour
    },
  },
} as const;

export default authConfig;
