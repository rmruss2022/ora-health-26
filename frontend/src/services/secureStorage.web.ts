/**
 * Secure Storage Service — web implementation
 * Uses localStorage since expo-secure-store doesn't work on web.
 */

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER_DATA: 'auth_user_data',
} as const;

export class SecureStorage {
  async setAccessToken(token: string): Promise<void> {
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);
  }

  async getAccessToken(): Promise<string | null> {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  }

  async setRefreshToken(token: string): Promise<void> {
    localStorage.setItem(KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
  }

  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    return {
      accessToken: localStorage.getItem(KEYS.ACCESS_TOKEN),
      refreshToken: localStorage.getItem(KEYS.REFRESH_TOKEN),
    };
  }

  async clearTokens(): Promise<void> {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
  }

  async setUserData(user: any): Promise<void> {
    localStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
  }

  async getUserData(): Promise<any | null> {
    const data = localStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  async clearUserData(): Promise<void> {
    localStorage.removeItem(KEYS.USER_DATA);
  }

  async clearAll(): Promise<void> {
    this.clearTokens();
    this.clearUserData();
  }

  async hasValidSession(): Promise<boolean> {
    return !!(localStorage.getItem(KEYS.ACCESS_TOKEN) && localStorage.getItem(KEYS.REFRESH_TOKEN));
  }
}

export const secureStorage = new SecureStorage();
