import { apiClient } from './apiClient';
import type { AuthUser } from '../../context/AuthContext';

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthProfileResponse {
  user: AuthUser;
}

export class AuthAPI {
  // ===== Methods used by AuthContext =====

  async getProfile(): Promise<AuthProfileResponse> {
    return apiClient.get<AuthProfileResponse>('/auth/me');
  }

  async login(params: {
    email: string;
    password: string;
  }): Promise<AuthLoginResponse> {
    const response = await apiClient.post<AuthLoginResponse>('/auth/login', params);
    apiClient.setAuthToken(response.accessToken);
    return response;
  }

  async register(params: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthLoginResponse> {
    const response = await apiClient.post<AuthLoginResponse>('/auth/register', params);
    apiClient.setAuthToken(response.accessToken);
    return response;
  }

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
    apiClient.clearAuthToken();
  }

  // ===== Legacy / SignIn aliases =====

  async signUp(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', {
      email,
      password,
    });
    apiClient.setAuthToken(response.token);
    return response;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signin', {
      email,
      password,
    });
    apiClient.setAuthToken(response.token);
    return response;
  }

  async signOut(): Promise<void> {
    await apiClient.post('/auth/signout');
    apiClient.clearAuthToken();
  }

  async refreshToken(): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/refresh');
  }

  async resetPassword(email: string): Promise<{ success: boolean }> {
    return apiClient.post('/auth/reset-password', { email });
  }

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    return apiClient.post('/auth/verify-email', { token });
  }
}

export const authAPI = new AuthAPI();

// Alias used by AuthContext (which imports { authApi })
export const authApi = authAPI;
