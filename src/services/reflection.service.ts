import { API_URL } from '../config/api';

export interface DailyPrompt {
  id: string;
  question: string;
  date: string;
  category: string;
  createdAt: string;
}

export interface ReflectionResponse {
  id: string;
  userId: string;
  promptId: string;
  response: string;
  isPublic: boolean;
  createdAt: string;
}

export interface PublicReflection {
  id: string;
  response: string;
  createdAt: string;
}

class ReflectionService {
  private baseUrl = `${API_URL}/reflections`;

  async getDailyPrompt(date?: string): Promise<DailyPrompt> {
    try {
      const dateParam = date ? `?date=${date}` : '';
      const response = await fetch(`${this.baseUrl}/daily${dateParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily prompt');
      }

      return await response.json();
    } catch (error) {
      console.error('getDailyPrompt error:', error);
      throw error;
    }
  }

  async saveReflection(
    promptId: string,
    response: string,
    isPublic: boolean = false
  ): Promise<ReflectionResponse> {
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId,
          response,
          isPublic,
          // userId would come from auth context in real app
          userId: 'current-user-id',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save reflection');
      }

      return await res.json();
    } catch (error) {
      console.error('saveReflection error:', error);
      throw error;
    }
  }

  async getUserReflection(promptId: string): Promise<ReflectionResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/user?promptId=${promptId}&userId=current-user-id`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user reflection');
      }

      return await response.json();
    } catch (error) {
      console.error('getUserReflection error:', error);
      throw error;
    }
  }

  async getPublicReflections(promptId: string, limit: number = 5): Promise<PublicReflection[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${promptId}/public?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch public reflections');
      }

      return await response.json();
    } catch (error) {
      console.error('getPublicReflections error:', error);
      throw error;
    }
  }
}

export const reflectionService = new ReflectionService();
