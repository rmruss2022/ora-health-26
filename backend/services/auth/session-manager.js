/**
 * Session Manager
 * Handles user sessions and device tracking
 */

class SessionManager {
  constructor() {
    this.activeSessions = new Map(); // In production: use Redis
  }

  /**
   * Create a new session
   */
  createSession(userId, deviceInfo) {
    const sessionId = require('crypto').randomBytes(32).toString('hex');
    const session = {
      userId,
      deviceInfo,
      createdAt: new Date(),
      lastActivity: new Date(),
      active: true,
    };

    this.activeSessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Terminate a session
   */
  terminateSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.active = false;
      this.activeSessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId) {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.active);
  }

  /**
   * Clean up expired sessions (24h inactive)
   */
  cleanupExpiredSessions() {
    const now = new Date();
    const expiryMs = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > expiryMs) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

module.exports = new SessionManager();
