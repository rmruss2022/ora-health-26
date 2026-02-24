import { API_URL } from '../config/api';

export interface CollectiveSession {
  id: string;
  scheduledTime: string;
  durationMinutes: number;
  startedAt?: string;
  endedAt?: string;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectiveParticipant {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string;
  completed: boolean;
  postSessionEmoji?: string;
}

export interface SessionStats {
  participantCount: number;
  activeParticipants: number;
  completedParticipants: number;
}

class CollectiveSessionService {
  private baseUrl = `${API_URL}/collective`;

  async getUpcomingSession(): Promise<CollectiveSession | null> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/upcoming`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch upcoming session');
      return await response.json();
    } catch (error) {
      console.error('getUpcomingSession error:', error);
      throw error;
    }
  }

  async getActiveSession(): Promise<CollectiveSession | null> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/active`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch active session');
      return await response.json();
    } catch (error) {
      console.error('getActiveSession error:', error);
      throw error;
    }
  }

  async joinSession(sessionId: string): Promise<CollectiveParticipant> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // userId would come from auth context in real app
        body: JSON.stringify({ userId: 'current-user-id' }),
      });

      if (!response.ok) throw new Error('Failed to join session');
      return await response.json();
    } catch (error) {
      console.error('joinSession error:', error);
      throw error;
    }
  }

  async leaveSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'current-user-id' }),
      });

      if (!response.ok) throw new Error('Failed to leave session');
    } catch (error) {
      console.error('leaveSession error:', error);
      throw error;
    }
  }

  async completeSession(sessionId: string, emoji?: string, shareToCommunity?: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'current-user-id',
          emoji,
          shareToCommunity,
        }),
      });

      if (!response.ok) throw new Error('Failed to complete session');
    } catch (error) {
      console.error('completeSession error:', error);
      throw error;
    }
  }

  async getSessionStats(sessionId: string): Promise<SessionStats> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch session stats');
      return await response.json();
    } catch (error) {
      console.error('getSessionStats error:', error);
      throw error;
    }
  }

  async getSessionParticipants(sessionId: string): Promise<CollectiveParticipant[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return await response.json();
    } catch (error) {
      console.error('getSessionParticipants error:', error);
      throw error;
    }
  }
}

export const collectiveSessionService = new CollectiveSessionService();
