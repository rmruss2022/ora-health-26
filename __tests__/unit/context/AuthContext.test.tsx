import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth, AuthUser } from '../../../src/context/AuthContext';
import { authApi } from '../../../src/services/api';
import { secureStorage } from '../../../src/services/secureStorage';

// Mock dependencies
jest.mock('../../../src/services/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  },
}));

jest.mock('../../../src/services/secureStorage', () => ({
  secureStorage: {
    hasValidSession: jest.fn(),
    setTokens: jest.fn(),
    setUserData: jest.fn(),
    clearAll: jest.fn(),
    getRefreshToken: jest.fn(),
  },
}));

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });

    it('should provide auth context', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('refreshAuth');
    });
  });

  describe('Initial state', () => {
    it('should start with mock user (testing mode)', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe('test@ora.ai');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        name: 'New User',
        created_at: new Date().toISOString(),
      };

      const mockResponse = {
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (authApi.register as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register('newuser@example.com', 'password123', 'New User');
      });

      expect(authApi.register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(secureStorage.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(secureStorage.setUserData).toHaveBeenCalledWith(mockUser);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should trim and lowercase email', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'Test', created_at: '' },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      (authApi.register as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register('  TEST@EXAMPLE.COM  ', 'password', '  Test User  ');
      });

      expect(authApi.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      });
    });

    it('should handle registration errors', async () => {
      const error = {
        response: {
          data: { message: 'Email already exists' },
        },
      };

      (authApi.register as jest.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.register('existing@example.com', 'password', 'User');
        })
      ).rejects.toThrow('Email already exists');

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser: AuthUser = {
        id: 'user-456',
        email: 'user@example.com',
        name: 'Test User',
        created_at: new Date().toISOString(),
      };

      const mockResponse = {
        user: mockUser,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      (authApi.login as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('user@example.com', 'mypassword');
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'mypassword',
      });

      expect(secureStorage.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token'
      );
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle invalid credentials', async () => {
      const error = {
        response: {
          data: { message: 'Invalid credentials' },
        },
      };

      (authApi.login as jest.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('wrong@example.com', 'wrongpass');
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should provide default error message when none provided', async () => {
      (authApi.login as jest.Mock).mockRejectedValueOnce(new Error());

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('user@example.com', 'pass');
        })
      ).rejects.toThrow('Login failed. Please check your credentials.');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce('refresh-token');
      (authApi.logout as jest.Mock).mockResolvedValueOnce({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalledWith('refresh-token');
      expect(secureStorage.clearAll).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear storage even if API call fails', async () => {
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce('refresh-token');
      (authApi.logout as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(secureStorage.clearAll).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('should handle logout without refresh token', async () => {
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).not.toHaveBeenCalled();
      expect(secureStorage.clearAll).toHaveBeenCalled();
    });
  });

  describe('refreshAuth', () => {
    it('should refresh user profile', async () => {
      const updatedUser: AuthUser = {
        id: 'user-123',
        email: 'test@ora.ai',
        name: 'Updated Name',
        created_at: new Date().toISOString(),
      };

      (authApi.getProfile as jest.Mock).mockResolvedValueOnce({ user: updatedUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshAuth();
      });

      expect(authApi.getProfile).toHaveBeenCalled();
      expect(secureStorage.setUserData).toHaveBeenCalledWith(updatedUser);
    });

    it('should not throw on refresh error', async () => {
      (authApi.getProfile as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.refreshAuth();
        })
      ).resolves.not.toThrow();
    });
  });

  describe('isAuthenticated', () => {
    it('should be true when user exists', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
