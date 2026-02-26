import { AuthAPI } from '../../../src/services/api/authAPI';
import { apiClient } from '../../../src/services/api/apiClient';

// Mock the API client
jest.mock('../../../src/services/api/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
    setAuthToken: jest.fn(),
    clearAuthToken: jest.fn(),
  },
}));

describe('AuthAPI', () => {
  let authAPI: AuthAPI;

  beforeEach(() => {
    authAPI = new AuthAPI();
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up successfully and store token', async () => {
      const mockResponse = {
        token: 'test-token',
        userId: 'user-123',
        email: 'test@example.com',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authAPI.signUp('test@example.com', 'password123');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(apiClient.setAuthToken).toHaveBeenCalledWith('test-token');
    });

    it('should handle sign up errors', async () => {
      const error = new Error('Email already exists');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        authAPI.signUp('existing@example.com', 'password')
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('signIn', () => {
    it('should sign in successfully and store token', async () => {
      const mockResponse = {
        token: 'auth-token-456',
        userId: 'user-456',
        email: 'user@example.com',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authAPI.signIn('user@example.com', 'mypassword');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/signin', {
        email: 'user@example.com',
        password: 'mypassword',
      });
      expect(apiClient.setAuthToken).toHaveBeenCalledWith('auth-token-456');
    });

    it('should handle invalid credentials', async () => {
      const error = new Error('Invalid credentials');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        authAPI.signIn('wrong@example.com', 'wrongpass')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out and clear token', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});

      await authAPI.signOut();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/signout');
      expect(apiClient.clearAuthToken).toHaveBeenCalled();
    });

    it('should clear token even if API call fails', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // signOut throws the error but still calls clearAuthToken
      try {
        await authAPI.signOut();
      } catch (error) {
        // Expected to throw
      }
      expect(apiClient.clearAuthToken).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        token: 'new-token',
        userId: 'user-123',
        email: 'test@example.com',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authAPI.refreshToken();

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      const mockResponse = { success: true };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authAPI.resetPassword('user@example.com');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        email: 'user@example.com',
      });
    });

    it('should handle non-existent email', async () => {
      const mockResponse = { success: false };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authAPI.resetPassword('nonexistent@example.com');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const mockResponse = { success: true };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authAPI.verifyEmail('valid-token-123');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-email', {
        token: 'valid-token-123',
      });
    });

    it('should handle invalid verification token', async () => {
      const error = new Error('Invalid or expired token');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        authAPI.verifyEmail('invalid-token')
      ).rejects.toThrow('Invalid or expired token');
    });
  });
});
