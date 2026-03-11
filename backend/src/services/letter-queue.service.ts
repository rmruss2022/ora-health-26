/**
 * Letter Queue Service
 * - 3 letters per day per user, pulled from queue
 * - Prioritize unread; can re-deliver read letters to fill
 * - Letters "disappear" next day (filter by delivery_date)
 */

import { query } from '../config/database';

export interface DailyLetter {
  id: string;
  subject: string;
  content: string;
  messageType: string;
  authorName?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export class LetterQueueService {
  private readonly LETTERS_PER_DAY = 3;

  /**
   * Get 3 letters for today. Pulls from queue if needed.
   * Uses server date; client can pass timezone/date for 3am local rollover.
   */
  async getDailyLetters(
    userId: string,
    forDate?: string // YYYY-MM-DD, defaults to server date
  ): Promise<DailyLetter[]> {
    const dateStr = forDate || new Date().toISOString().split('T')[0];

    // 1. Check existing deliveries for this date
    const existing = await query(
      `SELECT udl.id, udl.letter_queue_id, udl.read_at, lq.subject, lq.content, lq.message_type, lq.author_name, udl.created_at
       FROM user_daily_letters udl
       JOIN letter_queue lq ON lq.id = udl.letter_queue_id
       WHERE udl.user_id = $1 AND udl.delivered_date = $2::date
       ORDER BY udl.read_at NULLS FIRST, udl.created_at ASC`,
      [userId, dateStr]
    );

    if (existing.rows.length >= this.LETTERS_PER_DAY) {
      return existing.rows.map((r) => ({
        id: r.id,
        subject: r.subject,
        content: r.content,
        messageType: r.message_type || 'encouragement',
        authorName: r.author_name,
        isRead: !!r.read_at,
        readAt: r.read_at,
        createdAt: r.created_at,
      }));
    }

    // 2. Need to pull more from queue (prioritize unread for this user)
    const needed = this.LETTERS_PER_DAY - existing.rows.length;
    const existingQueueIds = existing.rows.map((r) => r.letter_queue_id);

    const poolParams: any[] = [userId, dateStr];
    if (existingQueueIds.length > 0) poolParams.push(existingQueueIds);
    poolParams.push(needed);
    const limitParam = existingQueueIds.length > 0 ? 4 : 3;

    const pool = await query(
      `SELECT lq.id, lq.subject, lq.content, lq.message_type
       FROM letter_queue lq
       WHERE NOT EXISTS (
         SELECT 1 FROM user_daily_letters udl2
         WHERE udl2.user_id = $1 AND udl2.letter_queue_id = lq.id AND udl2.delivered_date = $2::date
       )
       ${existingQueueIds.length > 0 ? 'AND lq.id != ALL($3::uuid[])' : ''}
       ORDER BY
         EXISTS (SELECT 1 FROM user_letter_reads ulr WHERE ulr.user_id = $1 AND ulr.letter_queue_id = lq.id) ASC,
         lq.created_at DESC
       LIMIT $` + limitParam,
      poolParams
    );

    for (const row of pool.rows) {
      await query(
        `INSERT INTO user_daily_letters (user_id, letter_queue_id, delivered_date)
         VALUES ($1, $2, $3::date)
         ON CONFLICT (user_id, letter_queue_id, delivered_date) DO NOTHING`,
        [userId, row.id, dateStr]
      );
    }

    // 3. Re-fetch full set
    const updated = await query(
      `SELECT udl.id, udl.letter_queue_id, udl.read_at, lq.subject, lq.content, lq.message_type, lq.author_name, udl.created_at
       FROM user_daily_letters udl
       JOIN letter_queue lq ON lq.id = udl.letter_queue_id
       WHERE udl.user_id = $1 AND udl.delivered_date = $2::date
       ORDER BY udl.read_at NULLS FIRST, udl.created_at ASC`,
      [userId, dateStr]
    );

    return updated.rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      content: r.content,
      messageType: r.message_type || 'encouragement',
      authorName: r.author_name,
      isRead: !!r.read_at,
      readAt: r.read_at,
      createdAt: r.created_at,
    }));
  }

  /**
   * Mark a daily letter as read.
   */
  async markAsRead(userId: string, dailyLetterId: string): Promise<void> {
    const res = await query(
      `UPDATE user_daily_letters
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL
       RETURNING letter_queue_id`,
      [dailyLetterId, userId]
    );
    if (res.rows.length > 0) {
      await query(
        `INSERT INTO user_letter_reads (user_id, letter_queue_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, letter_queue_id) DO NOTHING`,
        [userId, res.rows[0].letter_queue_id]
      );
    }
  }

  /**
   * Respond to a daily letter. Stores response and optionally creates a community post.
   */
  async respondToDailyLetter(
    userId: string,
    dailyLetterId: string,
    responseText: string,
    createPost: boolean,
    isAnonymous: boolean = false,
    authorName: string = 'User',
    authorAvatar: string = '👤'
  ): Promise<{ success: boolean; postId?: string }> {
    const letterRes = await query(
      `SELECT udl.id, udl.letter_queue_id, lq.message_type, lq.content
       FROM user_daily_letters udl
       JOIN letter_queue lq ON lq.id = udl.letter_queue_id
       WHERE udl.id = $1 AND udl.user_id = $2`,
      [dailyLetterId, userId]
    );
    if (letterRes.rows.length === 0) {
      throw new Error('Letter not found');
    }
    const letter = letterRes.rows[0];

    let createdPostId: string | undefined;
    const categoryMap: Record<string, string> = {
      prompt: 'reflection',
      encouragement: 'growth',
      activity_suggestion: 'growth',
      insight: 'growth',
      community_highlight: 'gratitude',
    };
    const category = categoryMap[letter.message_type] || 'growth';

    if (createPost) {
      const postRes = await query(
        `INSERT INTO community_posts (user_id, type, category, content, is_anonymous, author_name, author_avatar)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [userId, category, category, responseText, isAnonymous, authorName, authorAvatar]
      );
      createdPostId = postRes.rows[0].id;
    }

    await query(
      `INSERT INTO letter_responses (user_daily_letter_id, user_id, response_text, created_post_id)
       VALUES ($1, $2, $3, $4)`,
      [dailyLetterId, userId, responseText, createdPostId || null]
    );

    await this.markAsRead(userId, dailyLetterId);

    return { success: true, postId: createdPostId };
  }

  /**
   * Add a letter to the queue (e.g. when user creates a community post).
   */
  async addToQueue(params: {
    sourcePostId?: string;
    sourceType?: string;
    subject: string;
    content: string;
    authorUserId?: string;
    messageType?: string;
  }): Promise<string> {
    const res = await query(
      `INSERT INTO letter_queue (source_post_id, source_type, subject, content, author_user_id, message_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        params.sourcePostId || null,
        params.sourceType || 'community_post',
        params.subject,
        params.content,
        params.authorUserId || null,
        params.messageType || 'encouragement',
      ]
    );
    return res.rows[0].id;
  }
}

export const letterQueueService = new LetterQueueService();
