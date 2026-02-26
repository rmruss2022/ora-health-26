import { apiClient } from './apiClient';
import type { User } from '../../types';

export class UserAPI {
  async createUser(userData: {
    email: string;
    displayName: string;
  }): Promise<User> {
    return apiClient.post<User>('/users', userData);
  }

  async getUser(userId: string): Promise<User> {
    return apiClient.get<User>(`/users/${userId}`);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return apiClient.put<User>(`/users/${userId}`, updates);
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/users/me');
  }
}

export const userAPI = new UserAPI();
