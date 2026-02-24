import { apiClient } from './api/apiClient';

export interface Meditation {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  icon: string;
  audioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeditationSession {
  id: string;
  userId: string;
  meditationId: string;
  startedAt: string;
  completedAt?: string;
  durationCompleted?: number;
}

export interface MeditationStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  completedThisWeek: number;
}

export const meditationApi = {
  // Get all meditations
  async getAllMeditations(): Promise<Meditation[]> {
    try {
      const response = await apiClient.get<any>('/meditations');
      console.log('Meditations API response:', response);
      
      // Handle both direct array response and wrapped response
      if (Array.isArray(response)) {
        return response;
      }
      
      // Handle wrapped response
      if (response && typeof response === 'object') {
        if (response.meditations && Array.isArray(response.meditations)) {
          return response.meditations;
        }
        // Sometimes the response might be the meditations array directly
        if (Array.isArray(response.data)) {
          return response.data;
        }
      }
      
      console.warn('Unexpected meditations response format:', response);
      return [];
    } catch (error) {
      console.error('Error fetching meditations:', error);
      return [];
    }
  },

  // Get meditations by category
  async getMeditationsByCategory(category: string): Promise<Meditation[]> {
    const response = await apiClient.get<{ meditations: Meditation[] }>(`/meditations/category/${category}`);
    return response.meditations;
  },

  // Get specific meditation
  async getMeditation(id: string): Promise<Meditation> {
    const response = await apiClient.get<{ meditation: Meditation }>(`/meditations/${id}`);
    return response.meditation;
  },

  // Start a meditation session
  async startSession(meditationId: string, userId?: string): Promise<MeditationSession> {
    const response = await apiClient.post<{ session: MeditationSession }>(`/meditations/${meditationId}/start`, { userId });
    return response.session;
  },

  // Complete a meditation session
  async completeSession(sessionId: string, durationCompleted: number): Promise<MeditationSession> {
    const response = await apiClient.post<{ session: MeditationSession }>(`/meditations/sessions/${sessionId}/complete`, {
      durationCompleted,
    });
    return response.session;
  },

  // Get user's meditation history
  async getUserSessions(userId: string = 'default-user', limit: number = 10): Promise<MeditationSession[]> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.set('limit', limit.toString());
    const query = queryParams.toString();
    const endpoint = `/meditations/sessions/user/${userId}${query ? `?${query}` : ''}`;
    const response = await apiClient.get<{ sessions: MeditationSession[] }>(endpoint);
    return response.sessions;
  },

  // Get user's meditation stats
  async getUserStats(userId: string = 'default-user'): Promise<MeditationStats> {
    try {
      const response = await apiClient.get<{ stats: MeditationStats }>(`/meditations/stats/user/${userId}`);
      return response.stats;
    } catch (error) {
      console.warn('Meditation stats unavailable, using defaults:', error);
      return {
        totalSessions: 0,
        totalMinutes: 0,
        currentStreak: 0,
        completedThisWeek: 0,
      };
    }
  },
};
