import { query } from '../config/database';
import { randomUUID } from 'crypto';

export interface AnalyticsEvent {
  id?: string;
  userId: string;
  eventType: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

export interface BatchAnalyticsRequest {
  events: AnalyticsEvent[];
}

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  uniqueUsers: number;
}

export class AnalyticsService {
  /**
   * Track a single analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const eventId = event.id || randomUUID();
    await query(
      `INSERT INTO events (id, user_id, event_type, properties, timestamp)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        eventId,
        event.userId,
        event.eventType,
        JSON.stringify(event.properties || {}),
        event.timestamp || new Date().toISOString(),
      ]
    );
  }

  /**
   * Track multiple analytics events (batch insert)
   */
  async trackEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;

    const client = await query('SELECT 1').then(() => query);
    
    for (const event of events) {
      await this.trackEvent(event);
    }
  }

  /**
   * Get events for a specific user
   */
  async getUserEvents(
    userId: string,
    options: {
      eventTypes?: string[];
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AnalyticsEvent[]> {
    let queryText = `
      SELECT id, user_id as "userId", event_type as "eventType", 
             properties, timestamp, created_at as "createdAt"
      FROM events 
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 1;

    if (options.eventTypes && options.eventTypes.length > 0) {
      paramIndex++;
      const placeholders = options.eventTypes.map((_, i) => `$${paramIndex + i}`).join(', ');
      queryText += ` AND event_type IN (${placeholders})`;
      params.push(...options.eventTypes);
      paramIndex += options.eventTypes.length;
    }

    if (options.startDate) {
      paramIndex++;
      queryText += ` AND timestamp >= $${paramIndex}`;
      params.push(options.startDate);
    }

    if (options.endDate) {
      paramIndex++;
      queryText += ` AND timestamp <= $${paramIndex}`;
      params.push(options.endDate);
    }

    queryText += ` ORDER BY timestamp DESC`;

    if (options.limit) {
      paramIndex++;
      queryText += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
    }

    if (options.offset) {
      paramIndex++;
      queryText += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get event statistics for a user
   */
  async getUserEventStats(userId: string): Promise<EventStats> {
    const totalQuery = `SELECT COUNT(*) as total FROM events WHERE user_id = $1`;
    const byTypeQuery = `
      SELECT event_type, COUNT(*) as count 
      FROM events 
      WHERE user_id = $1 
      GROUP BY event_type
    `;

    const [totalResult, byTypeResult] = await Promise.all([
      query(totalQuery, [userId]),
      query(byTypeQuery, [userId]),
    ]);

    const eventsByType: Record<string, number> = {};
    byTypeResult.rows.forEach((row: any) => {
      eventsByType[row.event_type] = parseInt(row.count);
    });

    return {
      totalEvents: parseInt(totalResult.rows[0].total),
      eventsByType,
      uniqueUsers: 1,
    };
  }

  /**
   * Get global event statistics
   */
  async getGlobalStats(
    startDate?: string,
    endDate?: string
  ): Promise<EventStats> {
    let whereClause = '';
    const params: any[] = [];

    if (startDate) {
      whereClause += `WHERE timestamp >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += whereClause ? ` AND timestamp <= $${params.length + 1}` : `WHERE timestamp <= $${params.length + 1}`;
      params.push(endDate);
    }

    const totalQuery = `SELECT COUNT(*) as total FROM events ${whereClause}`;
    const byTypeQuery = `
      SELECT event_type, COUNT(*) as count 
      FROM events 
      ${whereClause}
      GROUP BY event_type
    `;
    const uniqueUsersQuery = `
      SELECT COUNT(DISTINCT user_id) as unique_users 
      FROM events 
      ${whereClause}
    `;

    const [totalResult, byTypeResult, uniqueUsersResult] = await Promise.all([
      query(totalQuery, params),
      query(byTypeQuery, params),
      query(uniqueUsersQuery, params),
    ]);

    const eventsByType: Record<string, number> = {};
    byTypeResult.rows.forEach((row: any) => {
      eventsByType[row.event_type] = parseInt(row.count);
    });

    return {
      totalEvents: parseInt(totalResult.rows[0].total),
      eventsByType,
      uniqueUsers: parseInt(uniqueUsersResult.rows[0].unique_users),
    };
  }

  /**
   * Get events grouped by date for time-series analysis
   */
  async getEventsByDay(
    eventType?: string,
    days: number = 30
  ): Promise<Array<{ date: string; count: number }>> {
    let queryText = `
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM events
      WHERE timestamp >= NOW() - INTERVAL '${days} days'
    `;
    const params: any[] = [];

    if (eventType) {
      queryText += ` AND event_type = $1`;
      params.push(eventType);
    }

    queryText += `
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    const result = await query(queryText, params);
    return result.rows.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count),
    }));
  }
}

export const analyticsService = new AnalyticsService();
