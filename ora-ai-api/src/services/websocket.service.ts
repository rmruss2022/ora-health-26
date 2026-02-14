/**
 * WebSocket Service
 * Real-time communication for instant letter delivery, typing indicators,
 * behavior changes, and live reactions
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

interface SocketUser {
  socketId: string;
  userId: string;
  userName: string;
  connectedAt: Date;
  lastActivity: Date;
}

// Event types
export type WSEventType =
  | 'new_letter'
  | 'typing_indicator'
  | 'behavior_change'
  | 'community_reaction'
  | 'user_online'
  | 'user_offline'
  | 'message_read'
  | 'flow_completion';

interface WSEvent<T = any> {
  type: WSEventType;
  userId?: string;
  data: T;
  timestamp: Date;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSocketMap: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        socket.userId = decoded.userId;
        socket.userName = decoded.name || 'User';
        
        next();
      } catch (error) {
        console.error('[WebSocket] Authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    console.log('[WebSocket] Server initialized');
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const userName = socket.userName!;

    console.log(`[WebSocket] User connected: ${userId} (${socket.id})`);

    // Track connected user
    this.connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId,
      userName,
      connectedAt: new Date(),
      lastActivity: new Date(),
    });

    // Map userId to socketId(s) - users can have multiple connections
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, new Set());
    }
    this.userSocketMap.get(userId)!.add(socket.id);

    // Subscribe to user's personal room
    socket.join(`user:${userId}`);

    // Notify user is online
    this.broadcastToAll('user_online', { userId, userName });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle typing indicator
    socket.on('typing_start', (data: { chatId?: string }) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', (data: { chatId?: string }) => {
      this.handleTypingStop(socket, data);
    });

    // Handle read receipts
    socket.on('message_read', (data: { messageId: string; chatId: string }) => {
      this.handleMessageRead(socket, data);
    });

    // Handle room subscriptions
    socket.on('subscribe', (data: { room: string }) => {
      socket.join(data.room);
      console.log(`[WebSocket] User ${userId} subscribed to ${data.room}`);
    });

    socket.on('unsubscribe', (data: { room: string }) => {
      socket.leave(data.room);
      console.log(`[WebSocket] User ${userId} unsubscribed from ${data.room}`);
    });

    // Heartbeat for activity tracking
    socket.on('heartbeat', () => {
      const user = this.connectedUsers.get(socket.id);
      if (user) {
        user.lastActivity = new Date();
      }
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const user = this.connectedUsers.get(socket.id);

    console.log(`[WebSocket] User disconnected: ${userId} (${socket.id})`);

    // Remove from tracking
    this.connectedUsers.delete(socket.id);

    // Remove from user socket map
    const userSockets = this.userSocketMap.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      
      // If user has no more active connections, mark as offline
      if (userSockets.size === 0) {
        this.userSocketMap.delete(userId);
        this.broadcastToAll('user_offline', {
          userId,
          userName: user?.userName,
        });
      }
    }
  }

  /**
   * Handle typing start event
   */
  private handleTypingStart(socket: AuthenticatedSocket, data: { chatId?: string }): void {
    const userId = socket.userId!;
    const userName = socket.userName!;

    // Broadcast to chat room or general
    const room = data.chatId ? `chat:${data.chatId}` : 'general';
    socket.to(room).emit('typing_indicator', {
      userId,
      userName,
      isTyping: true,
      chatId: data.chatId,
    });
  }

  /**
   * Handle typing stop event
   */
  private handleTypingStop(socket: AuthenticatedSocket, data: { chatId?: string }): void {
    const userId = socket.userId!;
    const userName = socket.userName!;

    const room = data.chatId ? `chat:${data.chatId}` : 'general';
    socket.to(room).emit('typing_indicator', {
      userId,
      userName,
      isTyping: false,
      chatId: data.chatId,
    });
  }

  /**
   * Handle message read event
   */
  private handleMessageRead(socket: AuthenticatedSocket, data: { messageId: string; chatId: string }): void {
    const userId = socket.userId!;

    // Notify sender that message was read
    socket.to(`chat:${data.chatId}`).emit('message_read', {
      messageId: data.messageId,
      readBy: userId,
      readAt: new Date(),
    });
  }

  /**
   * Send event to a specific user (all their connections)
   */
  emitToUser<T>(userId: string, event: WSEventType, data: T): void {
    if (!this.io) {
      console.error('[WebSocket] IO not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, {
      type: event,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Send new letter notification
   */
  notifyNewLetter(recipientId: string, letterData: {
    id: string;
    subject: string;
    senderName: string;
    preview: string;
  }): void {
    this.emitToUser(recipientId, 'new_letter', letterData);
    console.log(`[WebSocket] Sent new letter notification to user ${recipientId}`);
  }

  /**
   * Notify behavior change
   */
  notifyBehaviorChange(userId: string, behaviorData: {
    fromBehaviorId?: string;
    toBehaviorId: string;
    behaviorName: string;
    reason: string;
  }): void {
    this.emitToUser(userId, 'behavior_change', behaviorData);
    console.log(`[WebSocket] Notified behavior change for user ${userId}: ${behaviorData.toBehaviorId}`);
  }

  /**
   * Notify flow completion
   */
  notifyFlowCompletion(userId: string, completionData: {
    flowId: string;
    flowName: string;
    summary: string;
    completionType: string;
  }): void {
    this.emitToUser(userId, 'flow_completion', completionData);
  }

  /**
   * Broadcast live reaction to a post/comment
   */
  broadcastCommunityReaction(targetId: string, targetType: 'post' | 'comment', reactionData: {
    userId: string;
    userName: string;
    emoji: string;
    action: 'add' | 'remove';
  }): void {
    if (!this.io) return;

    const room = `${targetType}:${targetId}`;
    this.io.to(room).emit('community_reaction', {
      targetId,
      targetType,
      ...reactionData,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast to all connected users
   */
  private broadcastToAll<T>(event: WSEventType, data: T): void {
    if (!this.io) return;

    this.io.emit(event, {
      type: event,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast to a specific room
   */
  emitToRoom<T>(room: string, event: WSEventType, data: T): void {
    if (!this.io) return;

    this.io.to(room).emit(event, {
      type: event,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Get list of online users
   */
  getOnlineUsers(): Array<{ userId: string; userName: string; connectedAt: Date }> {
    const uniqueUsers = new Map<string, SocketUser>();

    // Get unique users (in case of multiple connections)
    for (const user of this.connectedUsers.values()) {
      if (!uniqueUsers.has(user.userId) || 
          user.connectedAt > uniqueUsers.get(user.userId)!.connectedAt) {
        uniqueUsers.set(user.userId, user);
      }
    }

    return Array.from(uniqueUsers.values()).map(user => ({
      userId: user.userId,
      userName: user.userName,
      connectedAt: user.connectedAt,
    }));
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSocketMap.has(userId) && this.userSocketMap.get(userId)!.size > 0;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    uniqueUsers: number;
    rooms: number;
  } {
    return {
      totalConnections: this.connectedUsers.size,
      uniqueUsers: this.userSocketMap.size,
      rooms: this.io?.sockets.adapter.rooms.size || 0,
    };
  }

  /**
   * Disconnect a specific user (all their connections)
   */
  disconnectUser(userId: string, reason?: string): void {
    const socketIds = this.userSocketMap.get(userId);
    
    if (!socketIds || !this.io) {
      return;
    }

    for (const socketId of socketIds) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
    }

    console.log(`[WebSocket] Disconnected user ${userId}${reason ? `: ${reason}` : ''}`);
  }

  /**
   * Clean up inactive connections (can be called periodically)
   */
  cleanupInactiveConnections(maxInactiveMinutes: number = 30): number {
    const now = new Date();
    let cleaned = 0;

    for (const [socketId, user] of this.connectedUsers.entries()) {
      const inactiveMinutes = (now.getTime() - user.lastActivity.getTime()) / 1000 / 60;
      
      if (inactiveMinutes > maxInactiveMinutes) {
        const socket = this.io?.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(`[WebSocket] Cleaned up ${cleaned} inactive connections`);
    }

    return cleaned;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
