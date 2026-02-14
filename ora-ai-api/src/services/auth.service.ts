// Auth Service
// Business logic for authentication operations

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { userModel, User } from '../models/user.model';
import { authConfig } from '../config/auth.config';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export class AuthService {
  // ===== PASSWORD OPERATIONS =====

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, authConfig.password.bcryptRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < authConfig.password.minLength) {
      return {
        valid: false,
        error: `Password must be at least ${authConfig.password.minLength} characters`,
      };
    }
    return { valid: true };
  }

  validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true };
  }

  // ===== JWT OPERATIONS =====

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.accessTokenExpiry,
      algorithm: authConfig.jwt.algorithm,
    });
  }

  generateRefreshTokenString(): string {
    // Generate a cryptographically secure random token
    return randomBytes(64).toString('hex');
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // ===== AUTH OPERATIONS =====

  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    // Validate email
    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.valid) {
      throw new Error(emailValidation.error);
    }

    // Validate password
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    // Check if user exists
    const existingUser = await userModel.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const password_hash = await this.hashPassword(data.password);

    // Create user
    const user = await userModel.createUser({
      email: data.email,
      password_hash,
      name: data.name,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  async login(data: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    // Get user
    const user = await userModel.getUserByEmail(data.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const validPassword = await this.verifyPassword(data.password, user.password_hash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await userModel.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user, data.ipAddress, data.userAgent);

    return { user, tokens };
  }

  async generateTokens(
    user: User,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    // Generate access token
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Generate refresh token
    const refreshTokenString = this.generateRefreshTokenString();
    const refreshTokenExpiry = new Date(
      Date.now() + this.parseExpiry(authConfig.jwt.refreshTokenExpiry)
    );

    // Store refresh token in database
    await userModel.createRefreshToken({
      user_id: user.id,
      token: refreshTokenString,
      expires_at: refreshTokenExpiry,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  async refresh(data: {
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthTokens> {
    // Validate refresh token
    const storedToken = await userModel.getRefreshToken(data.refreshToken);
    if (!storedToken) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const user = await userModel.getUserById(storedToken.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Revoke old refresh token (rotation)
    await userModel.revokeRefreshToken(data.refreshToken, 'token_rotation');

    // Generate new tokens
    const tokens = await this.generateTokens(user, data.ipAddress, data.userAgent);

    return tokens;
  }

  async forgotPassword(data: {
    email: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; token?: string }> {
    // Get user (but don't reveal if they exist)
    const user = await userModel.getUserByEmail(data.email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    // Generate reset token
    const resetToken = this.generateRefreshTokenString();
    const expiresAt = new Date(Date.now() + authConfig.passwordReset.tokenExpiry);

    // Store reset token
    await userModel.createPasswordResetToken({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt,
      ip_address: data.ipAddress,
    });

    // In production, send email here
    // For now, return token (in production, don't return it)
    return { success: true, token: resetToken };
  }

  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<{ success: boolean }> {
    // Validate new password
    const passwordValidation = this.validatePassword(data.newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    // Validate reset token
    const resetToken = await userModel.getPasswordResetToken(data.token);
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const password_hash = await this.hashPassword(data.newPassword);

    // Update password
    await userModel.updatePassword(resetToken.user_id, password_hash);

    // Mark token as used
    await userModel.markPasswordResetTokenUsed(data.token);

    // Revoke all existing refresh tokens (force re-login)
    await userModel.revokeAllUserRefreshTokens(resetToken.user_id, 'password_reset');

    return { success: true };
  }

  async getUserProfile(userId: string): Promise<Omit<User, 'password_hash'>> {
    const user = await userModel.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove password hash from response
    const { password_hash, ...userProfile } = user;
    return userProfile;
  }

  // ===== UTILITY METHODS =====

  private parseExpiry(expiry: string): number {
    // Parse expiry string like '7d', '30d', '1h', etc.
    const match = expiry.match(/^(\d+)([dhms])$/);
    if (!match) {
      throw new Error('Invalid expiry format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: { [key: string]: number } = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }

  // ===== CLEANUP OPERATIONS =====

  async cleanupExpiredTokens(): Promise<void> {
    await userModel.cleanupExpiredRefreshTokens();
    await userModel.cleanupExpiredResetTokens();
  }
}

export const authService = new AuthService();
