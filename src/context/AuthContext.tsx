/**
 * Authentication Context
 * Manages authentication state, login, register, logout, and token refresh
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { secureStorage } from '../services/secureStorage';

// User type matching backend response
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface AuthContextType {
  // State
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // BYPASS AUTH: Always use mock user for testing
  const [user, setUser] = useState<AuthUser | null>({
    id: 'test-user-123',
    email: 'test@ora.ai',
    name: 'Test User',
    created_at: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Initialize auth state on app launch
   * DISABLED FOR TESTING - Auth bypassed
   */
  useEffect(() => {
    // initializeAuth(); // DISABLED - using mock user
  }, []);

  /**
   * Listen for logout events from API interceptor
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLogout = () => {
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  /**
   * Initialize authentication on app start
   * Checks for stored tokens and validates session
   */
  async function initializeAuth() {
    try {
      setIsLoading(true);

      // Check if we have stored tokens
      const hasSession = await secureStorage.hasValidSession();
      if (!hasSession) {
        setUser(null);
        return;
      }

      // Try to get user profile with stored token
      // This will automatically refresh if needed via interceptor
      const response = await authApi.getProfile();
      setUser(response.user);
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear invalid session
      await secureStorage.clearAll();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Register new user
   */
  async function register(email: string, password: string, name: string) {
    try {
      setIsLoading(true);

      const response = await authApi.register({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
      });

      // Store tokens
      await secureStorage.setTokens(response.accessToken, response.refreshToken);

      // Store user data
      await secureStorage.setUserData(response.user);

      // Update state
      setUser(response.user);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Login existing user
   */
  async function login(email: string, password: string) {
    try {
      setIsLoading(true);

      const response = await authApi.login({
        email: email.toLowerCase().trim(),
        password,
      });

      // Store tokens
      await secureStorage.setTokens(response.accessToken, response.refreshToken);

      // Store user data
      await secureStorage.setUserData(response.user);

      // Update state
      setUser(response.user);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Logout user
   */
  async function logout() {
    try {
      setIsLoading(true);

      // Get refresh token for server-side revocation
      const refreshToken = await secureStorage.getRefreshToken();

      // Call logout endpoint (optional - revokes refresh token)
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch (error) {
          // Continue logout even if API call fails
          console.error('Logout API call failed:', error);
        }
      }

      // Clear local storage
      await secureStorage.clearAll();

      // Clear state
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Force clear even if error occurred
      await secureStorage.clearAll();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Manually refresh authentication (useful for updating user profile)
   */
  async function refreshAuth() {
    try {
      const response = await authApi.getProfile();
      setUser(response.user);
      await secureStorage.setUserData(response.user);
    } catch (error) {
      console.error('Auth refresh failed:', error);
      // Don't throw - let the app handle it gracefully
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
