import { apiClient } from './apiClient';

export interface RoomParticipant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface MeditationRoom {
  id: string;
  name: string;
  description: string;
  theme: string;
  icon: string;
  tags: string[];
  gradientStart: string;
  gradientEnd: string;
  currentParticipants: number;
  participants?: RoomParticipant[];
}

interface JoinRoomPayload {
  userId: string;
  userName: string;
  avatarUrl?: string;
}

interface JoinRoomResponse {
  participant: RoomParticipant;
  room: MeditationRoom;
}

interface LeaveRoomResponse {
  success: boolean;
  participantCount: number;
}

export class RoomsAPI {
  async getRooms(): Promise<MeditationRoom[]> {
    return apiClient.get<MeditationRoom[]>('/api/rooms');
  }

  async getRecommendedRoom(userId?: string): Promise<MeditationRoom> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return apiClient.get<MeditationRoom>(`/api/rooms/recommendation${query}`);
  }

  async getRoomDetails(roomId: string): Promise<MeditationRoom> {
    return apiClient.get<MeditationRoom>(`/api/rooms/${roomId}`);
  }

  async joinRoom(roomId: string, payload: JoinRoomPayload): Promise<JoinRoomResponse> {
    return apiClient.post<JoinRoomResponse>(`/api/rooms/${roomId}/join`, payload);
  }

  async leaveRoom(roomId: string, userId: string): Promise<LeaveRoomResponse> {
    return apiClient.post<LeaveRoomResponse>(`/api/rooms/${roomId}/leave`, { userId });
  }
}

export const roomsAPI = new RoomsAPI();
