const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000';

export const API_CONFIG = {
  api: {
    // Mobile app only needs to know the backend API URL
    // Backend handles all AWS credentials and services
    // Note: Expo web requires EXPO_PUBLIC_ prefix for env vars
    // Use your Mac's LAN IP in .env when running on a physical device (localhost = phone itself)
    baseURL,
    timeout: 30000, // 30 seconds
  },
  app: {
    env: process.env.APP_ENV || 'development',
  },
};

// Export API_URL for convenience
export const API_URL = API_CONFIG.api.baseURL;

/** WebSocket URL derived from API base (http -> ws, same host/port) */
export const getWebSocketURL = (): string =>
  baseURL.replace(/^http/, 'ws');
