import { API_CONFIG } from '../../config/api';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIClient {
  private baseURL: string;
  private authToken: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.baseURL = API_CONFIG.api.baseURL;
  }

  private async ensureAuthenticated() {
    if (this.authToken) {
      if (__DEV__) console.log('[apiClient] ensureAuthenticated: already have token');
      return;
    }
    if (__DEV__) console.log('[apiClient] ensureAuthenticated: no token, running initialize');
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    await this.initPromise;
    // If we still have no token, clear init so next request retries (e.g. user logged in since)
    if (!this.authToken) {
      if (__DEV__) console.log('[apiClient] ensureAuthenticated: still no token after init');
      this.initPromise = null;
    } else if (__DEV__) {
      console.log('[apiClient] ensureAuthenticated: got token from init');
    }
  }

  private async initialize() {
    try {
      const { secureStorage } = await import('../secureStorage');
      const storedToken = await secureStorage.getAccessToken();
      if (storedToken) {
        this.authToken = storedToken;
        if (__DEV__) console.log('[apiClient] initialize: token from secureStorage');
        return;
      }
      if (__DEV__) console.log('[apiClient] initialize: no secureStorage token, trying mockAuth');
      const { mockAuth } = await import('./mockAuth');
      const token = await mockAuth.getOrCreateTestUser();
      this.authToken = token;
      if (__DEV__) console.log('[apiClient] initialize: mockAuth result:', token ? 'got token' : 'no token');
    } catch (error) {
      console.error('[apiClient] initialize failed:', error);
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
    if (__DEV__) console.log('[apiClient] setAuthToken called');
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure we're authenticated before making requests
    await this.ensureAuthenticated();

    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const hasToken = !!this.authToken;
    if (hasToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (__DEV__) {
      const authRelevant = endpoint.includes('/api/voice/') || endpoint.includes('/auth/');
      if (authRelevant) {
        console.log('[apiClient] request:', endpoint, '| token:', hasToken ? 'YES' : 'NO');
      }
    }

    const timeoutMs = API_CONFIG.api.timeout || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const signal = options.signal ?? controller.signal;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal,
      });

      clearTimeout(timeoutId);

      if (__DEV__) {
        const authRelevant = endpoint.includes('/api/voice/') || endpoint.includes('/auth/');
        if (authRelevant) {
          console.log('[apiClient] response:', endpoint, '| status:', response.status, '| ok:', response.ok);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.message || errorData.error || 'Request failed';
        throw new APIError(msg, response.status, errorData.code);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof APIError) {
        throw error;
      }
      const isAbort = (error as Error)?.name === 'AbortError';
      throw new APIError(
        isAbort ? 'Request timed out' : 'Network request failed',
        0,
        isAbort ? 'TIMEOUT' : 'NETWORK_ERROR'
      );
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
