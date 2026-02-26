import { Router } from 'express';
import { roomService } from '../services/room.service';
import { websocketService } from '../services/websocket.service';

const router = Router();

/**
 * GET /api/rooms
 * Get all active meditation rooms with participant counts
 */
router.get('/', async (req, res) => {
  try {
    const rooms = await roomService.getAllRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

/**
 * GET /api/rooms/recommendation
 * Get personalized room recommendation
 */
router.get('/recommendation', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const room = await roomService.getRecommendedRoom(userId);

    if (!room) {
      return res.status(404).json({ message: 'No recommendation available' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error getting recommendation:', error);
    res.status(500).json({ error: 'Failed to get recommendation' });
  }
});

/**
 * GET /api/rooms/:id
 * Get specific room details with full participant list
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const room = await roomService.getRoomDetails(id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
});

/**
 * POST /api/rooms/:id/join
 * Join a meditation room
 */
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, avatarUrl } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({ error: 'userId and userName are required' });
    }

    // Verify room exists
    const room = await roomService.getRoomDetails(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Join the room
    const participant = await roomService.joinRoom(id, userId, userName, avatarUrl);

    // Get updated participant count
    const participantCount = await roomService.getParticipantCount(id);

    // Broadcast to WebSocket
    websocketService.notifyRoomUserJoined(id, participant, participantCount);

    res.json({
      participant,
      room: {
        ...room,
        currentParticipants: participantCount,
      },
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

/**
 * POST /api/rooms/:id/leave
 * Leave a meditation room
 */
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Leave the room
    await roomService.leaveRoom(id, userId);

    // Get updated participant count
    const participantCount = await roomService.getParticipantCount(id);

    // Broadcast to WebSocket
    websocketService.notifyRoomUserLeft(id, userId, participantCount);

    res.json({
      success: true,
      participantCount,
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

/**
 * POST /api/rooms/cleanup
 * Clean up stale participant records (admin only)
 */
router.post('/cleanup', async (req, res) => {
  try {
    const removed = await roomService.cleanupStaleParticipants();
    res.json({
      success: true,
      removedCount: removed,
    });
  } catch (error) {
    console.error('Error cleaning up participants:', error);
    res.status(500).json({ error: 'Failed to cleanup participants' });
  }
});

export default router;
