import { query } from '../config/database';

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
  participants: Participant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: Date;
}

export class RoomService {
  /**
   * Get all active rooms with participant counts
   */
  async getAllRooms(): Promise<MeditationRoom[]> {
    const queryText = `
      SELECT 
        mr.id,
        mr.name,
        mr.description,
        mr.theme,
        mr.icon,
        mr.tags,
        mr.gradient_start as "gradientStart",
        mr.gradient_end as "gradientEnd",
        mr.is_active as "isActive",
        mr.created_at as "createdAt",
        mr.updated_at as "updatedAt",
        COALESCE(
          (SELECT COUNT(*) FROM room_participants 
           WHERE room_id = mr.id AND left_at IS NULL), 
          0
        ) as "currentParticipants"
      FROM meditation_rooms mr
      WHERE mr.is_active = true
      ORDER BY 
        CASE mr.theme
          WHEN 'commons' THEN 1
          WHEN 'tide-pool' THEN 2
          WHEN 'starlit' THEN 3
          WHEN 'forest' THEN 4
          WHEN 'solo' THEN 5
        END
    `;

    const result = await query(queryText);
    return result.rows.map(row => ({
      ...row,
      participants: [], // Will be populated in getRoomDetails if needed
    }));
  }

  /**
   * Get a specific room with full participant list
   */
  async getRoomDetails(roomId: string): Promise<MeditationRoom | null> {
    // Get room info
    const roomQuery = `
      SELECT 
        id,
        name,
        description,
        theme,
        icon,
        tags,
        gradient_start as "gradientStart",
        gradient_end as "gradientEnd",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM meditation_rooms
      WHERE id = $1 AND is_active = true
    `;

    const roomResult = await query(roomQuery, [roomId]);
    if (roomResult.rows.length === 0) return null;

    const room = roomResult.rows[0];

    // Get participants
    const participantsQuery = `
      SELECT 
        user_id as "userId",
        user_name as "userName",
        avatar_url as "avatarUrl",
        joined_at as "joinedAt"
      FROM room_participants
      WHERE room_id = $1 AND left_at IS NULL
      ORDER BY joined_at ASC
    `;

    const participantsResult = await query(participantsQuery, [roomId]);
    const participants = participantsResult.rows;

    return {
      ...room,
      currentParticipants: participants.length,
      participants,
    };
  }

  /**
   * Join a room
   */
  async joinRoom(
    roomId: string,
    userId: string,
    userName: string,
    avatarUrl?: string
  ): Promise<Participant> {
    // Check if user is already in the room
    const checkQuery = `
      SELECT id FROM room_participants
      WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
    `;
    const existing = await query(checkQuery, [roomId, userId]);

    if (existing.rows.length > 0) {
      // Already in room, just return existing participant
      const participant = await this.getParticipant(roomId, userId);
      return participant!;
    }

    // Join the room
    const insertQuery = `
      INSERT INTO room_participants (room_id, user_id, user_name, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        user_id as "userId",
        user_name as "userName",
        avatar_url as "avatarUrl",
        joined_at as "joinedAt"
    `;

    const result = await query(insertQuery, [roomId, userId, userName, avatarUrl]);
    return result.rows[0];
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const updateQuery = `
      UPDATE room_participants
      SET left_at = NOW()
      WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
    `;

    await query(updateQuery, [roomId, userId]);
  }

  /**
   * Get a specific participant
   */
  async getParticipant(roomId: string, userId: string): Promise<Participant | null> {
    const queryText = `
      SELECT 
        user_id as "userId",
        user_name as "userName",
        avatar_url as "avatarUrl",
        joined_at as "joinedAt"
      FROM room_participants
      WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
    `;

    const result = await query(queryText, [roomId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Get participant count for a room
   */
  async getParticipantCount(roomId: string): Promise<number> {
    const queryText = `
      SELECT COUNT(*) as count
      FROM room_participants
      WHERE room_id = $1 AND left_at IS NULL
    `;

    const result = await query(queryText, [roomId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get recommended room based on time of day
   */
  async getRecommendedRoom(userId?: string): Promise<MeditationRoom | null> {
    const hour = new Date().getHours();

    let recommendedTheme: string;

    if (hour >= 5 && hour < 12) {
      // Morning: The Commons
      recommendedTheme = 'commons';
    } else if (hour >= 12 && hour < 17) {
      // Afternoon: Tide Pool (calming)
      recommendedTheme = 'tide-pool';
    } else if (hour >= 17 && hour < 21) {
      // Evening: Forest Nest
      recommendedTheme = 'forest';
    } else {
      // Night: Starlit Clearing
      recommendedTheme = 'starlit';
    }

    const queryText = `
      SELECT 
        mr.id,
        mr.name,
        mr.description,
        mr.theme,
        mr.icon,
        mr.tags,
        mr.gradient_start as "gradientStart",
        mr.gradient_end as "gradientEnd",
        mr.is_active as "isActive",
        mr.created_at as "createdAt",
        mr.updated_at as "updatedAt",
        COALESCE(
          (SELECT COUNT(*) FROM room_participants 
           WHERE room_id = mr.id AND left_at IS NULL), 
          0
        ) as "currentParticipants"
      FROM meditation_rooms mr
      WHERE mr.theme = $1 AND mr.is_active = true
      LIMIT 1
    `;

    const result = await query(queryText, [recommendedTheme]);
    if (result.rows.length === 0) return null;

    return {
      ...result.rows[0],
      participants: [],
    };
  }

  /**
   * Clean up stale participants (left > 1 hour ago)
   */
  async cleanupStaleParticipants(): Promise<number> {
    const deleteQuery = `
      DELETE FROM room_participants
      WHERE left_at IS NOT NULL 
        AND left_at < NOW() - INTERVAL '1 hour'
    `;

    const result = await query(deleteQuery);
    return result.rowCount || 0;
  }
}

export const roomService = new RoomService();
