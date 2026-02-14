/**
 * Secure Storage Service
 * Manages secure token storage using expo-secure-store
 * Falls back to AsyncStorage for non-sensitive data
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER_DATA: 'auth_user_data',
} as const;

export class SecureStorage {
  // ===== TOKEN MANAGEMENT =====

  /**
   * Store access token securely
   */
  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Failed to store access token:', error);
      throw new Error('Failed to store access token');
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Store refresh token securely
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Store both tokens at once
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setAccessToken(accessToken),
      this.setRefreshToken(refreshToken),
    ]);
  }

  /**
   * Get both tokens at once
   */
  async getTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Clear all auth tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // ===== USER DATA MANAGEMENT =====

  /**
   * Store user data (non-sensitive, uses AsyncStorage)
   */
  async setUserData(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  /**
   * Get user data
   */
  async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  /**
   * Clear user data
   */
  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USER_DATA);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // ===== FULL CLEAR =====

  /**
   * Clear all stored auth data (tokens + user data)
   */
  async clearAll(): Promise<void> {
    await Promise.all([this.clearTokens(), this.clearUserData()]);
  }

  // ===== VALIDATION =====

  /**
   * Check if we have valid stored tokens
   */
  async hasValidSession(): Promise<boolean> {
    const { accessToken, refreshToken } = await this.getTokens();
    return !!(accessToken && refreshToken);
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();
