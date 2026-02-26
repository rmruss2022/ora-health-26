/**
 * API Service
 * Centralized HTTP client with authentication and token refresh
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';
import { secureStorage } from './secureStorage';

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Add subscriber to be notified when token is refreshed
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that token has been refreshed
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * Create axios instance with base configuration
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.api.baseURL,
  timeout: API_CONFIG.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token to requests
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip auth for public endpoints
    const publicEndpoints = ['/auth/register', '/auth/login', '/auth/refresh'];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const accessToken = await secureStorage.getAccessToken();
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle token refresh on 401
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for login/register endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      // If already refreshing, wait for the new token
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const response = await axios.post(
          `${API_CONFIG.api.baseURL}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens
        await secureStorage.setTokens(accessToken, newRefreshToken);

        // Update the failed request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Notify all waiting requests
        onTokenRefreshed(accessToken);
        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and reject
        isRefreshing = false;
        refreshSubscribers = [];
        await secureStorage.clearAll();

        // Dispatch logout event (will be caught by AuthContext)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'));
        }

        return Promise.reject(refreshError);
      }
    }

    // Log error for debugging
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: originalRequest.url,
      });
    } else {
      console.error('API Error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Auth API endpoints
 */
export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken?: string) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

/**
 * Quiz API endpoints
 */
export const quizAPI = {
  submitQuiz: async (data: { responses: any[] }) => {
    const response = await api.post('/users/quiz', data);
    return response.data;
  },

  getQuizResults: async () => {
    const response = await api.get('/users/quiz');
    return response.data;
  },
};

/**
 * Letter API endpoints
 */
export const letterAPI = {
  getInbox: async (page = 1, limit = 20) => {
    const response = await api.get('/letters/inbox', { params: { page, limit } });
    return response.data;
  },

  getLetter: async (letterId: string) => {
    const response = await api.get(`/letters/${letterId}`);
    return response.data;
  },

  sendLetter: async (data: { recipient_id: string; subject: string; body: string }) => {
    const response = await api.post('/letters', data);
    return response.data;
  },

  replyToLetter: async (letterId: string, body: string) => {
    const response = await api.post(`/letters/${letterId}/reply`, { body });
    return response.data;
  },

  markAsRead: async (letterId: string) => {
    const response = await api.patch(`/letters/${letterId}/read`);
    return response.data;
  },

  deleteLetter: async (letterId: string) => {
    const response = await api.delete(`/letters/${letterId}`);
    return response.data;
  },

  getThread: async (threadId: string) => {
    const response = await api.get(`/letters/thread/${threadId}`);
    return response.data;
  },
};

export default api;
