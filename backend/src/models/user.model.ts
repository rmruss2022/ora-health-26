// User Model
// Database queries for user operations

import { query } from '../config/database';
import { randomUUID } from 'crypto';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
  quiz_data?: any;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date;
  revoked_reason?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used_at?: Date;
  created_at: Date;
  ip_address?: string;
}

export class UserModel {
  // ===== USER OPERATIONS =====

  async createUser(data: {
    email: string;
    password_hash: string;
    name: string;
  }): Promise<User> {
    const id = randomUUID();
    const result = await query(
      `INSERT INTO users (id, email, password_hash, name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, data.email, data.password_hash, data.name]
    );
    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    return result.rows[0] || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userId]
    );
  }

  async updatePassword(userId: string, password_hash: string): Promise<void> {
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, userId]
    );
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // ===== REFRESH TOKEN OPERATIONS =====

  async createRefreshToken(data: {
    user_id: string;
    token: string;
    expires_at: Date;
    ip_address?: string;
    user_agent?: string;
  }): Promise<RefreshToken> {
    const id = randomUUID();
    const result = await query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, data.user_id, data.token, data.expires_at, data.ip_address, data.user_agent]
    );
    return result.rows[0];
  }

  async getRefreshToken(token: string): Promise<RefreshToken | null> {
    const result = await query(
      `SELECT * FROM refresh_tokens 
       WHERE token = $1 
       AND revoked_at IS NULL 
       AND expires_at > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  }

  async revokeRefreshToken(token: string, reason?: string): Promise<void> {
    await query(
      `UPDATE refresh_tokens 
       SET revoked_at = NOW(), revoked_reason = $2
       WHERE token = $1`,
      [token, reason || 'manual_revoke']
    );
  }

  async revokeAllUserRefreshTokens(userId: string, reason?: string): Promise<void> {
    await query(
      `UPDATE refresh_tokens 
       SET revoked_at = NOW(), revoked_reason = $2
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId, reason || 'password_reset']
    );
  }

  async cleanupExpiredRefreshTokens(): Promise<number> {
    const result = await query(
      'SELECT cleanup_expired_refresh_tokens() as deleted_count'
    );
    return result.rows[0]?.deleted_count || 0;
  }

  // ===== PASSWORD RESET TOKEN OPERATIONS =====

  async createPasswordResetToken(data: {
    user_id: string;
    token: string;
    expires_at: Date;
    ip_address?: string;
  }): Promise<PasswordResetToken> {
    const id = randomUUID();
    const result = await query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, data.user_id, data.token, data.expires_at, data.ip_address]
    );
    return result.rows[0];
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const result = await query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 
       AND used_at IS NULL 
       AND expires_at > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
      [token]
    );
  }

  async cleanupExpiredResetTokens(): Promise<number> {
    const result = await query(
      'SELECT cleanup_expired_reset_tokens() as deleted_count'
    );
    return result.rows[0]?.deleted_count || 0;
  }
}

export const userModel = new UserModel();
