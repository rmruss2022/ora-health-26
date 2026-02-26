/**
 * Token Refresh Service
 * Handles JWT refresh tokens and secure session management
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || crypto.randomBytes(64).toString('hex');
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes

class TokenRefreshService {
  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(userId, email) {
    const accessToken = jwt.sign(
      { userId, email, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, email, type: 'refresh' },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify and refresh an access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const newAccessToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Revoke a refresh token (for logout)
   */
  async revokeRefreshToken(refreshToken) {
    // In production: store revoked tokens in Redis with TTL
    // For now: just verify it's valid before revoking
    try {
      jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      return { success: true };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}

module.exports = new TokenRefreshService();
