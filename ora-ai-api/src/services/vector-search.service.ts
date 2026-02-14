/**
 * Vector Search Service
 * Handles similarity search using pgvector
 * Supports HNSW index and cosine similarity
 */

import { query } from '../config/database';
import { embeddingService } from './embedding.service';

interface VectorSearchResult {
  behaviorId: string;
  triggerDescription: string;
  similarity: number;
  metadata: any;
  vectorType: string;
}

interface BehaviorCandidate {
  behaviorId: string;
  score: number;
  vectorScores: {
    [vectorType: string]: number;
  };
  metadata: any;
}

interface SearchOptions {
  topK?: number;
  similarityThreshold?: number;
  vectorTypes?: string[];
}

export class VectorSearchService {
  private defaultTopK: number = 5;
  private defaultSimilarityThreshold: number = 0.4;

  /**
   * Search for similar behaviors using a single vector
   */
  async searchBehaviorTriggers(
    embedding: number[],
    vectorType: string,
    options: SearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const topK = options.topK || this.defaultTopK;
    const threshold = options.similarityThreshold || this.defaultSimilarityThreshold;

    try {
      const result = await query(
        `SELECT * FROM search_behavior_triggers($1::vector, $2, $3, $4)`,
        [JSON.stringify(embedding), vectorType, topK, threshold]
      );

      return result.rows.map(row => ({
        behaviorId: row.behavior_id,
        triggerDescription: row.trigger_description,
        similarity: parseFloat(row.similarity),
        metadata: row.metadata,
        vectorType,
      }));
    } catch (error) {
      console.error(`Error searching behavior triggers for ${vectorType}:`, error);
      return [];
    }
  }

  /**
   * Search across multiple vector types in parallel
   */
  async searchMultiVector(
    embeddings: {
      userMessage?: number[];
      agentMessage?: number[];
      combined?: number[];
      agentThought?: number[];
      externalContext?: number[];
      toolCall?: number[];
    },
    options: SearchOptions = {}
  ): Promise<{
    results: { [vectorType: string]: VectorSearchResult[] };
    searchLatencyMs: number;
  }> {
    const startTime = Date.now();
    const searches: Promise<VectorSearchResult[]>[] = [];
    const vectorTypes: string[] = [];

    // Build parallel search promises
    if (embeddings.userMessage) {
      vectorTypes.push('user_message');
      searches.push(this.searchBehaviorTriggers(embeddings.userMessage, 'user_message', options));
    }

    if (embeddings.agentMessage) {
      vectorTypes.push('agent_message');
      searches.push(this.searchBehaviorTriggers(embeddings.agentMessage, 'agent_message', options));
    }

    if (embeddings.combined) {
      vectorTypes.push('combined_exchange');
      searches.push(this.searchBehaviorTriggers(embeddings.combined, 'combined_exchange', options));
    }

    if (embeddings.agentThought) {
      vectorTypes.push('agent_thought');
      searches.push(this.searchBehaviorTriggers(embeddings.agentThought, 'agent_thought', options));
    }

    if (embeddings.externalContext) {
      vectorTypes.push('external_context');
      searches.push(this.searchBehaviorTriggers(embeddings.externalContext, 'external_context', options));
    }

    if (embeddings.toolCall) {
      vectorTypes.push('tool_call');
      searches.push(this.searchBehaviorTriggers(embeddings.toolCall, 'tool_call', options));
    }

    // Execute all searches in parallel
    const searchResults = await Promise.all(searches);

    // Map results back to vector types
    const results: { [vectorType: string]: VectorSearchResult[] } = {};
    vectorTypes.forEach((type, index) => {
      results[type] = searchResults[index];
    });

    const searchLatencyMs = Date.now() - startTime;

    return { results, searchLatencyMs };
  }

  /**
   * Aggregate and rank behavior candidates from multi-vector search
   */
  rankBehaviorCandidates(
    searchResults: { [vectorType: string]: VectorSearchResult[] },
    weights: {
      user_message?: number;
      agent_message?: number;
      combined_exchange?: number;
      agent_thought?: number;
      external_context?: number;
      tool_call?: number;
    } = {}
  ): BehaviorCandidate[] {
    // Default weights from architecture doc
    const defaultWeights = {
      user_message: 1.0,
      agent_message: 0.3,
      combined_exchange: 0.5,
      agent_thought: 0.7,
      external_context: 0.4,
      tool_call: 0.3,
    };

    const finalWeights = { ...defaultWeights, ...weights };

    // Aggregate scores by behavior ID
    const behaviorScores: {
      [behaviorId: string]: {
        scores: { [vectorType: string]: number };
        metadata: any;
      };
    } = {};

    Object.entries(searchResults).forEach(([vectorType, results]) => {
      results.forEach(result => {
        if (!behaviorScores[result.behaviorId]) {
          behaviorScores[result.behaviorId] = {
            scores: {},
            metadata: result.metadata,
          };
        }

        // Store the similarity score for this vector type
        behaviorScores[result.behaviorId].scores[vectorType] = result.similarity;
      });
    });

    // Calculate weighted aggregate scores
    const candidates: BehaviorCandidate[] = Object.entries(behaviorScores).map(
      ([behaviorId, data]) => {
        let weightedSum = 0;
        let totalWeight = 0;

        Object.entries(data.scores).forEach(([vectorType, similarity]) => {
          const weight = finalWeights[vectorType as keyof typeof finalWeights] || 0;
          weightedSum += similarity * weight;
          totalWeight += weight;
        });

        const score = totalWeight > 0 ? weightedSum / totalWeight : 0;

        return {
          behaviorId,
          score,
          vectorScores: data.scores,
          metadata: data.metadata,
        };
      }
    );

    // Sort by score descending
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Apply priority multipliers and persistence bonus
   */
  applyBehaviorPriority(
    candidates: BehaviorCandidate[],
    currentBehaviorId?: string
  ): BehaviorCandidate[] {
    return candidates.map(candidate => {
      let adjustedScore = candidate.score;

      // Apply priority multiplier from metadata
      const priority = candidate.metadata?.priority || 5;
      adjustedScore *= (priority / 10) * 1.2;

      // Apply persistence bonus if this is the current behavior
      if (
        currentBehaviorId &&
        candidate.behaviorId === currentBehaviorId &&
        candidate.score > 0.3
      ) {
        adjustedScore *= 1.5; // 50% bonus
      }

      return {
        ...candidate,
        score: adjustedScore,
      };
    });
  }

  /**
   * Search user's conversation history
   */
  async searchUserHistory(
    userId: string,
    embedding: number[],
    vectorType: string,
    options: {
      topK?: number;
      daysBack?: number;
    } = {}
  ): Promise<any[]> {
    const topK = options.topK || 10;
    const daysBack = options.daysBack || 90;

    try {
      const result = await query(
        `SELECT * FROM search_user_conversation_history($1::vector, $2::uuid, $3, $4, $5)`,
        [JSON.stringify(embedding), userId, vectorType, topK, daysBack]
      );

      return result.rows;
    } catch (error) {
      console.error('Error searching user conversation history:', error);
      return [];
    }
  }

  /**
   * Store embedding in conversation_embeddings table
   */
  async storeConversationEmbedding(data: {
    userId: string;
    sessionId?: string;
    vectorType: string;
    sourceText: string;
    embedding: number[];
    behaviorContext?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO conversation_embeddings
         (user_id, session_id, vector_type, source_text, embedding, behavior_context, metadata)
         VALUES ($1, $2, $3, $4, $5::vector, $6, $7)`,
        [
          data.userId,
          data.sessionId || null,
          data.vectorType,
          data.sourceText,
          JSON.stringify(data.embedding),
          data.behaviorContext || null,
          JSON.stringify(data.metadata || {}),
        ]
      );
    } catch (error) {
      console.error('Error storing conversation embedding:', error);
      throw error;
    }
  }

  /**
   * Store batch of conversation embeddings
   */
  async storeBatchConversationEmbeddings(
    embeddings: Array<{
      userId: string;
      sessionId?: string;
      vectorType: string;
      sourceText: string;
      embedding: number[];
      behaviorContext?: string;
      metadata?: any;
    }>
  ): Promise<void> {
    if (embeddings.length === 0) return;

    try {
      // Build batch insert query
      const values: any[] = [];
      const placeholders: string[] = [];

      embeddings.forEach((emb, index) => {
        const offset = index * 7;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}::vector, $${offset + 6}, $${offset + 7})`
        );
        values.push(
          emb.userId,
          emb.sessionId || null,
          emb.vectorType,
          emb.sourceText,
          JSON.stringify(emb.embedding),
          emb.behaviorContext || null,
          JSON.stringify(emb.metadata || {})
        );
      });

      const queryText = `
        INSERT INTO conversation_embeddings
        (user_id, session_id, vector_type, source_text, embedding, behavior_context, metadata)
        VALUES ${placeholders.join(', ')}
      `;

      await query(queryText, values);
    } catch (error) {
      console.error('Error storing batch conversation embeddings:', error);
      throw error;
    }
  }

  /**
   * Update conversation state
   */
  async updateConversationState(
    userId: string,
    state: {
      sessionId?: string;
      activeBehaviorId?: string;
      behaviorStartedAt?: Date;
      messageCountInBehavior?: number;
      lastUserMessage?: string;
      lastAgentMessage?: string;
      recentToolCalls?: any[];
      externalContext?: any;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO conversation_state
         (user_id, session_id, active_behavior_id, behavior_started_at, message_count_in_behavior,
          last_user_message, last_agent_message, recent_tool_calls, external_context, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (user_id)
         DO UPDATE SET
           session_id = COALESCE(EXCLUDED.session_id, conversation_state.session_id),
           active_behavior_id = COALESCE(EXCLUDED.active_behavior_id, conversation_state.active_behavior_id),
           behavior_started_at = COALESCE(EXCLUDED.behavior_started_at, conversation_state.behavior_started_at),
           message_count_in_behavior = COALESCE(EXCLUDED.message_count_in_behavior, conversation_state.message_count_in_behavior),
           last_user_message = COALESCE(EXCLUDED.last_user_message, conversation_state.last_user_message),
           last_agent_message = COALESCE(EXCLUDED.last_agent_message, conversation_state.last_agent_message),
           recent_tool_calls = COALESCE(EXCLUDED.recent_tool_calls, conversation_state.recent_tool_calls),
           external_context = COALESCE(EXCLUDED.external_context, conversation_state.external_context),
           metadata = COALESCE(EXCLUDED.metadata, conversation_state.metadata),
           last_message_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          state.sessionId || null,
          state.activeBehaviorId || null,
          state.behaviorStartedAt || null,
          state.messageCountInBehavior || 0,
          state.lastUserMessage || null,
          state.lastAgentMessage || null,
          JSON.stringify(state.recentToolCalls || []),
          JSON.stringify(state.externalContext || {}),
          JSON.stringify(state.metadata || {}),
        ]
      );
    } catch (error) {
      console.error('Error updating conversation state:', error);
      throw error;
    }
  }

  /**
   * Get conversation state for user
   */
  async getConversationState(userId: string): Promise<any | null> {
    try {
      const result = await query(
        `SELECT * FROM conversation_state WHERE user_id = $1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting conversation state:', error);
      return null;
    }
  }

  /**
   * Log behavior detection decision
   */
  async logBehaviorDetection(data: {
    userId: string;
    userMessage: string;
    previousBehaviorId?: string;
    detectedBehaviorId: string;
    detectionMethod: string;
    confidenceScore?: number;
    vectorScores?: any;
    topCandidates?: any;
    llmReasoning?: string;
    latencyMs?: number;
    embeddingLatencyMs?: number;
    searchLatencyMs?: number;
    llmLatencyMs?: number;
    metadata?: any;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO behavior_detection_logs
         (user_id, user_message, previous_behavior_id, detected_behavior_id, detection_method,
          confidence_score, vector_scores, top_candidates, llm_reasoning,
          latency_ms, embedding_latency_ms, search_latency_ms, llm_latency_ms, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          data.userId,
          data.userMessage,
          data.previousBehaviorId || null,
          data.detectedBehaviorId,
          data.detectionMethod,
          data.confidenceScore || null,
          JSON.stringify(data.vectorScores || {}),
          JSON.stringify(data.topCandidates || []),
          data.llmReasoning || null,
          data.latencyMs || null,
          data.embeddingLatencyMs || null,
          data.searchLatencyMs || null,
          data.llmLatencyMs || null,
          JSON.stringify(data.metadata || {}),
        ]
      );
    } catch (error) {
      console.error('Error logging behavior detection:', error);
    }
  }
}

// Singleton instance
export const vectorSearchService = new VectorSearchService();
