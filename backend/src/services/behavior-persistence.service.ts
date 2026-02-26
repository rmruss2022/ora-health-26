/**
 * Behavior Persistence Service
 * Implements behavior stickiness with decay over exchanges
 * Prevents rapid behavior switching and maintains conversation flow
 */

import { vectorSearchService } from './vector-search.service';

interface BehaviorTransition {
  userId: string;
  sessionId: string;
  fromBehaviorId: string | null;
  toBehaviorId: string;
  timestamp: Date;
  exchangeCount: number; // Number of exchanges before transition
  transitionReason: string;
  confidence: number;
}

interface BehaviorPersistenceState {
  userId: string;
  sessionId: string;
  currentBehaviorId: string;
  behaviorStartedAt: Date;
  messageCountInBehavior: number;
  persistenceScore: number;
  decayRate: number;
  lastTransitionAt?: Date;
  transitionHistory: BehaviorTransition[];
}

interface PersistenceConfig {
  initialPersistence: number; // Starting persistence score (default 1.0)
  decayPerExchange: number; // Decay per exchange (default 0.15)
  minPersistence: number; // Minimum persistence before allowing easy transitions (default 0.0)
  transitionThreshold: number; // How much better new behavior must be (default 0.2)
  maxExchangesBeforeForceDecay: number; // Force decay after N exchanges (default 10)
}

export class BehaviorPersistenceService {
  private readonly DEFAULT_CONFIG: PersistenceConfig = {
    initialPersistence: 1.0,
    decayPerExchange: 0.15,
    minPersistence: 0.0,
    transitionThreshold: 0.2,
    maxExchangesBeforeForceDecay: 10,
  };

  private config: PersistenceConfig;

  constructor(config?: Partial<PersistenceConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate current persistence score for a behavior
   */
  async getPersistenceScore(
    userId: string,
    behaviorId: string
  ): Promise<number> {
    try {
      const state = await vectorSearchService.getConversationState(userId);

      if (!state || state.active_behavior_id !== behaviorId) {
        return 0; // No persistence for non-active behaviors
      }

      const messageCount = state.message_count_in_behavior || 0;

      // Calculate decay
      let score = this.config.initialPersistence - 
                  (messageCount * this.config.decayPerExchange);

      // Apply minimum
      score = Math.max(this.config.minPersistence, score);

      // Force decay after max exchanges
      if (messageCount >= this.config.maxExchangesBeforeForceDecay) {
        score *= 0.5; // Halve persistence to encourage transition
      }

      return score;
    } catch (error) {
      console.error('Error calculating persistence score:', error);
      return 0;
    }
  }

  /**
   * Determine if behavior should transition based on scores and persistence
   */
  shouldTransition(
    currentBehaviorScore: number,
    newBehaviorScore: number,
    persistenceScore: number
  ): boolean {
    // No current behavior - always transition
    if (persistenceScore === 0) {
      return true;
    }

    // Calculate effective current behavior score (includes persistence bonus)
    const effectiveCurrentScore = currentBehaviorScore + persistenceScore;

    // New behavior must exceed current by threshold
    const margin = newBehaviorScore - effectiveCurrentScore;
    
    return margin > this.config.transitionThreshold;
  }

  /**
   * Record a behavior transition
   */
  async recordTransition(
    userId: string,
    sessionId: string,
    fromBehaviorId: string | null,
    toBehaviorId: string,
    transitionReason: string,
    confidence: number
  ): Promise<void> {
    try {
      const state = await vectorSearchService.getConversationState(userId);
      const exchangeCount = state?.message_count_in_behavior || 0;

      const transition: BehaviorTransition = {
        userId,
        sessionId,
        fromBehaviorId,
        toBehaviorId,
        timestamp: new Date(),
        exchangeCount,
        transitionReason,
        confidence,
      };

      // Store transition in database for analytics
      await this.storeTransition(transition);

      // Update conversation state
      await vectorSearchService.updateConversationState(userId, {
        activeBehaviorId: toBehaviorId,
        messageCountInBehavior: 0, // Reset counter
        lastBehaviorTransition: new Date(),
        sessionId,
      });

      console.log(`[BehaviorPersistence] User ${userId}: ${fromBehaviorId || 'none'} → ${toBehaviorId} (${exchangeCount} exchanges, confidence: ${confidence.toFixed(2)})`);
    } catch (error) {
      console.error('Error recording transition:', error);
      throw error;
    }
  }

  /**
   * Increment exchange count for current behavior
   */
  async incrementExchangeCount(userId: string): Promise<number> {
    try {
      const state = await vectorSearchService.getConversationState(userId);
      const currentCount = state?.message_count_in_behavior || 0;
      const newCount = currentCount + 1;

      await vectorSearchService.updateConversationState(userId, {
        messageCountInBehavior: newCount,
      });

      return newCount;
    } catch (error) {
      console.error('Error incrementing exchange count:', error);
      return 0;
    }
  }

  /**
   * Get behavior duration (how long user has been in current behavior)
   */
  async getBehaviorDuration(userId: string): Promise<number> {
    try {
      const state = await vectorSearchService.getConversationState(userId);
      
      if (!state?.last_behavior_transition) {
        return 0;
      }

      const now = new Date();
      const started = new Date(state.last_behavior_transition);
      const durationMs = now.getTime() - started.getTime();

      return Math.floor(durationMs / 1000); // Return seconds
    } catch (error) {
      console.error('Error calculating behavior duration:', error);
      return 0;
    }
  }

  /**
   * Get transition history for a user/session
   */
  async getTransitionHistory(
    userId: string,
    sessionId?: string,
    limit: number = 10
  ): Promise<BehaviorTransition[]> {
    try {
      // Query behavior_transitions table
      const result = await vectorSearchService.pool.query(
        `SELECT 
          user_id,
          session_id,
          from_behavior_id,
          to_behavior_id,
          timestamp,
          exchange_count,
          transition_reason,
          confidence
         FROM behavior_transitions
         WHERE user_id = $1
         ${sessionId ? 'AND session_id = $2' : ''}
         ORDER BY timestamp DESC
         LIMIT $${sessionId ? 3 : 2}`,
        sessionId ? [userId, sessionId, limit] : [userId, limit]
      );

      return result.rows.map(row => ({
        userId: row.user_id,
        sessionId: row.session_id,
        fromBehaviorId: row.from_behavior_id,
        toBehaviorId: row.to_behavior_id,
        timestamp: row.timestamp,
        exchangeCount: row.exchange_count,
        transitionReason: row.transition_reason,
        confidence: row.confidence,
      }));
    } catch (error) {
      console.error('Error fetching transition history:', error);
      return [];
    }
  }

  /**
   * Analyze transition patterns (for debugging/optimization)
   */
  async analyzeTransitionPatterns(userId: string): Promise<{
    totalTransitions: number;
    averageExchangesBeforeTransition: number;
    mostCommonTransitions: Array<{ from: string; to: string; count: number }>;
    averageBehaviorDuration: number;
  }> {
    try {
      const history = await this.getTransitionHistory(userId, undefined, 100);

      if (history.length === 0) {
        return {
          totalTransitions: 0,
          averageExchangesBeforeTransition: 0,
          mostCommonTransitions: [],
          averageBehaviorDuration: 0,
        };
      }

      // Calculate average exchanges before transition
      const avgExchanges = history.reduce((sum, t) => sum + t.exchangeCount, 0) / history.length;

      // Find most common transitions
      const transitionCounts: { [key: string]: number } = {};
      history.forEach(t => {
        const key = `${t.fromBehaviorId || 'start'} → ${t.toBehaviorId}`;
        transitionCounts[key] = (transitionCounts[key] || 0) + 1;
      });

      const mostCommon = Object.entries(transitionCounts)
        .map(([key, count]) => {
          const [from, to] = key.split(' → ');
          return { from, to, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate average behavior duration
      const durations: number[] = [];
      for (let i = 0; i < history.length - 1; i++) {
        const duration = history[i].timestamp.getTime() - history[i + 1].timestamp.getTime();
        if (duration > 0) {
          durations.push(duration);
        }
      }
      const avgDuration = durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length / 1000
        : 0;

      return {
        totalTransitions: history.length,
        averageExchangesBeforeTransition: avgExchanges,
        mostCommonTransitions: mostCommon,
        averageBehaviorDuration: avgDuration,
      };
    } catch (error) {
      console.error('Error analyzing transition patterns:', error);
      return {
        totalTransitions: 0,
        averageExchangesBeforeTransition: 0,
        mostCommonTransitions: [],
        averageBehaviorDuration: 0,
      };
    }
  }

  /**
   * Store transition in database
   */
  private async storeTransition(transition: BehaviorTransition): Promise<void> {
    try {
      await vectorSearchService.pool.query(
        `INSERT INTO behavior_transitions 
         (user_id, session_id, from_behavior_id, to_behavior_id, timestamp, exchange_count, transition_reason, confidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          transition.userId,
          transition.sessionId,
          transition.fromBehaviorId,
          transition.toBehaviorId,
          transition.timestamp,
          transition.exchangeCount,
          transition.transitionReason,
          transition.confidence,
        ]
      );
    } catch (error) {
      console.error('Error storing transition:', error);
      // Don't throw - this is analytics, shouldn't break the flow
    }
  }

  /**
   * Reset persistence for a user (useful for testing or user-initiated resets)
   */
  async resetPersistence(userId: string): Promise<void> {
    try {
      await vectorSearchService.updateConversationState(userId, {
        activeBehaviorId: null,
        messageCountInBehavior: 0,
        lastBehaviorTransition: null,
      });
    } catch (error) {
      console.error('Error resetting persistence:', error);
      throw error;
    }
  }

  /**
   * Update persistence configuration
   */
  updateConfig(config: Partial<PersistenceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PersistenceConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const behaviorPersistenceService = new BehaviorPersistenceService();
