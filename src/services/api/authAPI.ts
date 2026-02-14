import { apiClient } from './apiClient';

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
}

export class AuthAPI {
  async signUp(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', {
      email,
      password,
    });

    // Store token in API client
    apiClient.setAuthToken(response.token);

    return response;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signin', {
      email,
      password,
    });

    // Store token in API client
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
