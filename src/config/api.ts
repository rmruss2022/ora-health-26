export const API_CONFIG = {
  api: {
    // Mobile app only needs to know the backend API URL
    // Backend handles all AWS credentials and services
    // Note: Expo web requires EXPO_PUBLIC_ prefix for env vars
    baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000',
    timeout: 30000, // 30 seconds
  },
  app: {
    env: process.env.APP_ENV || 'development',
  },
};
