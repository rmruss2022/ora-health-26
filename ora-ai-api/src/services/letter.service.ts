import { query } from '../config/database';
import { websocketService } from './websocket.service';
import { notificationService } from './notification.service';

export interface Letter {
  id: string;
  senderId?: string;
  recipientId: string;
  subject: string;
  body: string;
  isAiGenerated: boolean;
  aiCategory?: string;
  metadata?: Record<string, any>;
  sentAt: Date;
  readAt?: Date;
  isArchived: boolean;
  archivedAt?: Date;
  isStarred: boolean;
  parentLetterId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  timestamp?: string;
  senderName?: string;
  isReply?: boolean;
}

export interface LetterThread {
  id: string;
  letterId: string;
  threadRootId: string;
  threadPosition: number;
  createdAt: Date;
}

export interface LetterTemplate {
  id: string;
  category: string;
  subcategory?: string;
  subjectTemplate: string;
  bodyTemplate: string;
  variables?: Record<string, any>;
  tone: string;
  priority: number;
  isActive: boolean;
  usageCount: number;
}

export interface UserLetterPreferences {
  id: string;
  userId: string;
  dailyLetterEnabled: boolean;
  preferredDeliveryTime: string;
  preferredCategories?: string[];
  maxDailyLetters: number;
}

export class LetterService {
  // ===== GET INBOX =====
  async getInbox(
    userId: string,
    filters: {
      unreadOnly?: boolean;
      starredOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ letters: Letter[]; unreadCount: number; totalCount: number }> {
    const { unreadOnly = false, starredOnly = false, limit = 20, offset = 0 } = filters;

    // Build WHERE clause
    const whereConditions = ['recipient_id = $1', 'is_archived = false'];
    if (unreadOnly) {
      whereConditions.push('read_at IS NULL');
    }
    if (starredOnly) {
      whereConditions.push('is_starred = true');
    }

    const whereClause = whereConditions.join(' AND ');

    // Get letters with sender info
    const queryText = `
      SELECT
        l.id,
        l.sender_id as "senderId",
        l.recipient_id as "recipientId",
        l.subject,
        l.body,
        l.is_ai_generated as "isAiGenerated",
        l.ai_category as "aiCategory",
        l.metadata,
        l.sent_at as "sentAt",
        l.read_at as "readAt",
        l.is_archived as "isArchived",
        l.archived_at as "archivedAt",
        l.is_starred as "isStarred",
        l.parent_letter_id as "parentLetterId",
        l.created_at as "createdAt",
        l.updated_at as "updatedAt",
        u.name as "senderName"
      FROM letters l
      LEFT JOIN users u ON l.sender_id = u.id
      WHERE ${whereClause}
      ORDER BY l.sent_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(queryText, [userId, limit, offset]);

    // Get counts
    const countQuery = `
      SELECT
        COUNT(*) FILTER (WHERE read_at IS NULL AND is_archived = false) as unread_count,
        COUNT(*) FILTER (WHERE is_archived = false) as total_count
      FROM letters
      WHERE recipient_id = $1
    `;
    const countResult = await query(countQuery, [userId]);

    const letters = result.rows.map(row => ({
      ...row,
      isReply: !!row.parentLetterId,
      timestamp: this.formatTimestamp(row.sentAt)
    }));

    return {
      letters,
      unreadCount: parseInt(countResult.rows[0].unread_count, 10),
      totalCount: parseInt(countResult.rows[0].total_count, 10)
    };
  }

  // ===== GET SENT LETTERS =====
  async getSentLetters(
    userId: string,
    filters: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ letters: Letter[]; totalCount: number }> {
    const { limit = 20, offset = 0 } = filters;

    // Get sent letters with recipient info
    const queryText = `
      SELECT
        l.id,
        l.sender_id as "senderId",
        l.recipient_id as "recipientId",
        l.subject,
        l.body,
        l.is_ai_generated as "isAiGenerated",
        l.ai_category as "aiCategory",
        l.metadata,
        l.sent_at as "sentAt",
        l.read_at as "readAt",
        l.is_archived as "isArchived",
        l.archived_at as "archivedAt",
        l.is_starred as "isStarred",
        l.parent_letter_id as "parentLetterId",
        l.created_at as "createdAt",
        l.updated_at as "updatedAt",
        u.name as recipient_name
      FROM letters l
      LEFT JOIN users u ON l.recipient_id = u.id
      WHERE l.sender_id = $1
      ORDER BY l.sent_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(queryText, [userId, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM letters
      WHERE sender_id = $1
    `;
    const countResult = await query(countQuery, [userId]);

    const letters = result.rows.map(row => ({
      ...row,
      isReply: !!row.parentLetterId,
      timestamp: this.formatTimestamp(row.sentAt)
    }));

    return {
      letters,
      totalCount: parseInt(countResult.rows[0].total_count, 10)
    };
  }

  // ===== GET SPECIFIC LETTER =====
  async getLetter(letterId: string, userId: string): Promise<Letter | null> {
    const queryText = `
      SELECT
        l.id,
        l.sender_id as "senderId",
        l.recipient_id as "recipientId",
        l.subject,
        l.body,
        l.is_ai_generated as "isAiGenerated",
        l.ai_category as "aiCategory",
        l.metadata,
        l.sent_at as "sentAt",
        l.read_at as "readAt",
        l.is_archived as "isArchived",
        l.archived_at as "archivedAt",
        l.is_starred as "isStarred",
        l.parent_letter_id as "parentLetterId",
        l.created_at as "createdAt",
        l.updated_at as "updatedAt",
        u.name as "senderName"
      FROM letters l
      LEFT JOIN users u ON l.sender_id = u.id
      WHERE l.id = $1 AND (l.recipient_id = $2 OR l.sender_id = $2)
    `;

    const result = await query(queryText, [letterId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      isReply: !!row.parentLetterId,
      timestamp: this.formatTimestamp(row.sentAt)
    };
  }

  // ===== SEND LETTER =====
  async sendLetter(params: {
    senderId?: string;
    recipientId: string;
    subject: string;
    body: string;
    parentLetterId?: string;
    isAiGenerated?: boolean;
    aiCategory?: string;
    metadata?: Record<string, any>;
  }): Promise<Letter> {
    const {
      senderId,
      recipientId,
      subject,
      body,
      parentLetterId,
      isAiGenerated = false,
      aiCategory,
      metadata
    } = params;

    const queryText = `
      INSERT INTO letters (
        sender_id,
        recipient_id,
        subject,
        body,
        parent_letter_id,
        is_ai_generated,
        ai_category,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        sender_id as "senderId",
        recipient_id as "recipientId",
        subject,
        body,
        is_ai_generated as "isAiGenerated",
        ai_category as "aiCategory",
        metadata,
        sent_at as "sentAt",
        read_at as "readAt",
        is_archived as "isArchived",
        archived_at as "archivedAt",
        is_starred as "isStarred",
        parent_letter_id as "parentLetterId",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query(queryText, [
      senderId || null,
      recipientId,
      subject,
      body,
      parentLetterId || null,
      isAiGenerated,
      aiCategory || null,
      metadata ? JSON.stringify(metadata) : null
    ]);

    const row = result.rows[0];

    // If this is a reply, update thread
    if (parentLetterId) {
      await this.updateLetterThread(row.id, parentLetterId);
    }

    // Send notifications (async, don't await to avoid blocking)
    this.sendLetterNotifications(row, senderId).catch(err => {
      console.error('Error sending letter notifications:', err);
    });

    return {
      ...row,
      isReply: !!row.parentLetterId,
      timestamp: this.formatTimestamp(row.sentAt)
    };
  }

  /**
   * Send notifications for new letter
   */
  private async sendLetterNotifications(letter: any, senderId?: string): Promise<void> {
    try {
      // Get sender name
      let senderName = 'Ora AI';
      if (senderId) {
        const senderResult = await query(
          'SELECT name FROM users WHERE id = $1',
          [senderId]
        );
        senderName = senderResult.rows[0]?.name || 'Someone';
      }

      // Create preview (first 100 chars)
      const preview = letter.body.length > 100
        ? letter.body.substring(0, 100) + '...'
        : letter.body;

      // Send real-time WebSocket notification
      websocketService.notifyNewLetter(letter.recipientId, {
        id: letter.id,
        subject: letter.subject,
        senderName,
        preview,
      });

      // Send push notification
      await notificationService.sendPushNotification({
        userId: letter.recipientId,
        title: `New letter from ${senderName}`,
        body: letter.subject,
        data: {
          type: 'new_letter',
          letterId: letter.id,
          senderId: senderId || 'ora-ai-system',
        },
      });
    } catch (error) {
      console.error('Error in sendLetterNotifications:', error);
      // Don't throw - notifications shouldn't break letter sending
    }
  }

  // ===== REPLY TO LETTER =====
  async replyToLetter(params: {
    letterId: string;
    senderId: string;
    subject: string;
    body: string;
  }): Promise<Letter> {
    // Get the original letter to determine recipient
    const originalLetter = await query(
      'SELECT sender_id, recipient_id FROM letters WHERE id = $1',
      [params.letterId]
    );

    if (originalLetter.rows.length === 0) {
      throw new Error('Original letter not found');
    }

    const original = originalLetter.rows[0];

    // Determine who should receive the reply
    // If the sender is the original recipient, send to original sender
    // Otherwise, send to original recipient
    const recipientId = params.senderId === original.recipient_id
      ? original.sender_id
      : original.recipient_id;

    if (!recipientId) {
      throw new Error('Cannot reply to AI-generated letter with no sender');
    }

    return this.sendLetter({
      senderId: params.senderId,
      recipientId,
      subject: params.subject.startsWith('Re: ') ? params.subject : `Re: ${params.subject}`,
      body: params.body,
      parentLetterId: params.letterId
    });
  }

  // ===== MARK AS READ =====
  async markAsRead(letterId: string, userId: string): Promise<void> {
    const queryText = `
      UPDATE letters
      SET read_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND recipient_id = $2 AND read_at IS NULL
    `;
    await query(queryText, [letterId, userId]);
  }

  // ===== MARK AS UNREAD =====
  async markAsUnread(letterId: string, userId: string): Promise<void> {
    const queryText = `
      UPDATE letters
      SET read_at = NULL, updated_at = NOW()
      WHERE id = $1 AND recipient_id = $2
    `;
    await query(queryText, [letterId, userId]);
  }

  // ===== ARCHIVE LETTER =====
  async archiveLetter(letterId: string, userId: string): Promise<void> {
    const queryText = `
      UPDATE letters
      SET is_archived = true, archived_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND recipient_id = $2
    `;
    await query(queryText, [letterId, userId]);
  }

  // ===== UNARCHIVE LETTER =====
  async unarchiveLetter(letterId: string, userId: string): Promise<void> {
    const queryText = `
      UPDATE letters
      SET is_archived = false, archived_at = NULL, updated_at = NOW()
      WHERE id = $1 AND recipient_id = $2
    `;
    await query(queryText, [letterId, userId]);
  }

  // ===== STAR LETTER =====
  async toggleStar(letterId: string, userId: string, starred: boolean): Promise<void> {
    const queryText = `
      UPDATE letters
      SET is_starred = $3, updated_at = NOW()
      WHERE id = $1 AND recipient_id = $2
    `;
    await query(queryText, [letterId, userId, starred]);
  }

  // ===== GET UNREAD COUNT =====
  async getUnreadCount(userId: string): Promise<number> {
    const queryText = `
      SELECT COUNT(*) as count
      FROM letters
      WHERE recipient_id = $1 AND read_at IS NULL AND is_archived = false
    `;
    const result = await query(queryText, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  // ===== UPDATE LETTER THREAD =====
  private async updateLetterThread(letterId: string, parentLetterId: string): Promise<void> {
    // Find the root of the thread
    const rootQuery = `
      SELECT COALESCE(thread_root_id, letter_id) as root_id
      FROM letter_threads
      WHERE letter_id = $1
    `;
    const rootResult = await query(rootQuery, [parentLetterId]);

    const threadRootId = rootResult.rows.length > 0
      ? rootResult.rows[0].root_id
      : parentLetterId;

    // Get the next position in the thread
    const positionQuery = `
      SELECT COALESCE(MAX(thread_position), 0) + 1 as next_position
      FROM letter_threads
      WHERE thread_root_id = $1
    `;
    const positionResult = await query(positionQuery, [threadRootId]);
    const nextPosition = positionResult.rows[0].next_position;

    // Insert the thread entry
    await query(
      `INSERT INTO letter_threads (letter_id, thread_root_id, thread_position)
       VALUES ($1, $2, $3)`,
      [letterId, threadRootId, nextPosition]
    );
  }

  // ===== GENERATE AI DAILY LETTER =====
  async generateDailyLetter(userId: string): Promise<Letter> {
    // Get user info and preferences
    const userQuery = `
      SELECT u.name, u.email, p.preferred_categories
      FROM users u
      LEFT JOIN user_letter_preferences p ON u.id = p.user_id
      WHERE u.id = $1
    `;
    const userResult = await query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get a random template (prioritize based on priority field)
    const templateQuery = `
      SELECT *
      FROM letter_templates
      WHERE is_active = true
      ORDER BY priority DESC, RANDOM()
      LIMIT 1
    `;
    const templateResult = await query(templateQuery, []);

    if (templateResult.rows.length === 0) {
      throw new Error('No active letter templates found');
    }

    const template = templateResult.rows[0];

    // Simple variable replacement
    const subject = this.replaceTemplateVariables(template.subject_template, {
      user_name: user.name
    });

    const body = this.replaceTemplateVariables(template.body_template, {
      user_name: user.name,
      personalized_insight: this.generatePersonalizedInsight(),
      personalized_reflection: this.generatePersonalizedReflection(),
      supportive_message: this.generateSupportiveMessage(),
      achievement_description: 'You\'ve been consistently engaging with your journey',
      mindfulness_prompt: 'What are three things you can see, hear, and feel right now?',
      gratitude_prompt: 'Consider one person who made your day a little brighter',
      community_highlight: 'Others in the community have been sharing similar experiences',
      personal_insight: 'You\'ve shown remarkable resilience in challenging moments'
    });

    // Increment template usage
    await query(
      'UPDATE letter_templates SET usage_count = usage_count + 1 WHERE id = $1',
      [template.id]
    );

    // Create the letter
    return this.sendLetter({
      recipientId: userId,
      subject,
      body,
      isAiGenerated: true,
      aiCategory: template.category,
      metadata: {
        templateId: template.id,
        tone: template.tone,
        generatedAt: new Date().toISOString()
      }
    });
  }

  // ===== HELPER: REPLACE TEMPLATE VARIABLES =====
  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  // ===== HELPER: GENERATE PERSONALIZED CONTENT =====
  private generatePersonalizedInsight(): string {
    const insights = [
      'Every step forward, no matter how small, is still progress.',
      'Your consistency speaks volumes about your commitment to growth.',
      'The fact that you\'re here, engaging with your journey, is already a victory.',
      'Remember: growth isn\'t always visible, but it\'s always happening.'
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  }

  private generatePersonalizedReflection(): string {
    const reflections = [
      'You showed up today, and that matters more than you might realize.',
      'Every moment of self-awareness is a step toward healing and growth.',
      'The effort you put into understanding yourself is deeply valuable.',
      'You\'re building something meaningful, one day at a time.'
    ];
    return reflections[Math.floor(Math.random() * reflections.length)];
  }

  private generateSupportiveMessage(): string {
    const messages = [
      'It\'s okay to have hard days. They don\'t erase your progress.',
      'Struggling doesn\'t mean failing. It means you\'re human.',
      'You\'re allowed to rest. Recovery is part of the journey.',
      'Every challenge you face is teaching you something valuable.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // ===== HELPER: FORMAT TIMESTAMP =====
  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  }

  // ===== GET USER PREFERENCES =====
  async getUserPreferences(userId: string): Promise<UserLetterPreferences | null> {
    const queryText = `
      SELECT
        id,
        user_id as "userId",
        daily_letter_enabled as "dailyLetterEnabled",
        preferred_delivery_time as "preferredDeliveryTime",
        preferred_categories as "preferredCategories",
        max_daily_letters as "maxDailyLetters"
      FROM user_letter_preferences
      WHERE user_id = $1
    `;
    const result = await query(queryText, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // ===== UPDATE USER PREFERENCES =====
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserLetterPreferences>
  ): Promise<UserLetterPreferences> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (preferences.dailyLetterEnabled !== undefined) {
      updates.push(`daily_letter_enabled = $${paramCount++}`);
      values.push(preferences.dailyLetterEnabled);
    }
    if (preferences.preferredDeliveryTime !== undefined) {
      updates.push(`preferred_delivery_time = $${paramCount++}`);
      values.push(preferences.preferredDeliveryTime);
    }
    if (preferences.preferredCategories !== undefined) {
      updates.push(`preferred_categories = $${paramCount++}`);
      values.push(preferences.preferredCategories);
    }
    if (preferences.maxDailyLetters !== undefined) {
      updates.push(`max_daily_letters = $${paramCount++}`);
      values.push(preferences.maxDailyLetters);
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const queryText = `
      UPDATE user_letter_preferences
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING
        id,
        user_id as "userId",
        daily_letter_enabled as "dailyLetterEnabled",
        preferred_delivery_time as "preferredDeliveryTime",
        preferred_categories as "preferredCategories",
        max_daily_letters as "maxDailyLetters"
    `;

    const result = await query(queryText, values);
    return result.rows[0];
  }
}

export const letterService = new LetterService();
