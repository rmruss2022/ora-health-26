/**
 * Vector Broadcast Service
 * Core broadcast mechanism that generates all 6 vector types simultaneously
 * and ranks behaviors using weighted multi-vector similarity search
 */

import { embeddingService } from './embedding.service';
import { vectorSearchService } from './vector-search.service';
import OpenAI from 'openai';

interface BroadcastInput {
  userId: string;
  userMessage: string;
  lastAgentMessage?: string;
  recentToolCalls?: Array<{ tool: string; params: any; result: any }>;
  currentBehaviorId?: string;
  sessionId?: string;
}

interface VectorGenerationResult {
  userMessage: number[];
  agentMessage?: number[];
  combined?: number[];
  agentThought?: number[];
  externalContext?: number[];
  toolCall?: number[];
}

interface BehaviorRanking {
  behaviorId: string;
  overallScore: number;
  vectorScores: {
    [vectorType: string]: number;
  };
  metadata: any;
}

interface BroadcastResult {
  rankings: BehaviorRanking[];
  topBehaviorId: string;
  topBehaviorScore: number;
  vectorLatencyMs: number;
  searchLatencyMs: number;
  totalLatencyMs: number;
  generatedVectors: {
    userMessage: boolean;
    agentMessage: boolean;
    combined: boolean;
    agentThought: boolean;
    externalContext: boolean;
    toolCall: boolean;
  };
  innerThought?: string;
}

export class VectorBroadcastService {
  private openai: OpenAI;
  
  // Vector weights for ranking (can be adjusted per use case)
  private defaultWeights = {
    user_message: 1.0,        // Primary signal
    agent_message: 0.3,       // Context from agent's last response
    combined_exchange: 0.5,   // Interaction pattern
    agent_thought: 0.7,       // Internal reasoning
    external_context: 0.4,    // Time, user state, etc.
    tool_call: 0.3,          // Recent actions
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Main broadcast function: generates all 6 vectors and returns ranked behaviors
   */
  async broadcast(input: BroadcastInput): Promise<BroadcastResult> {
    const startTime = Date.now();
    
    try {
      // STEP 1: Generate all vectors in parallel
      const vectorStartTime = Date.now();
      const vectors = await this.generateAllVectors(input);
      const vectorLatencyMs = Date.now() - vectorStartTime;

      // STEP 2: Broadcast all vectors against behavior triggers
      const searchStartTime = Date.now();
      const { results: searchResults, searchLatencyMs: rawSearchLatency } = 
        await vectorSearchService.searchMultiVector({
          userMessage: vectors.userMessage,
          agentMessage: vectors.agentMessage,
          combined: vectors.combined,
          agentThought: vectors.agentThought,
          externalContext: vectors.externalContext,
          toolCall: vectors.toolCall,
        }, {
          topK: 20, // Get top 20 candidates for LLM selection
          similarityThreshold: 0.3, // Lower threshold to capture more candidates
        });
      const searchLatencyMs = Date.now() - searchStartTime;

      // STEP 3: Rank behaviors using weighted scoring
      let rankedCandidates = vectorSearchService.rankBehaviorCandidates(
        searchResults,
        this.defaultWeights
      );

      // STEP 4: Apply priority multipliers and persistence bonus
      rankedCandidates = vectorSearchService.applyBehaviorPriority(
        rankedCandidates,
        input.currentBehaviorId
      );

      // Convert to BehaviorRanking format
      const rankings: BehaviorRanking[] = rankedCandidates.map(candidate => ({
        behaviorId: candidate.behaviorId,
        overallScore: candidate.score,
        vectorScores: candidate.vectorScores,
        metadata: candidate.metadata,
      }));

      const totalLatencyMs = Date.now() - startTime;

      // Store embeddings for future searches
      await this.storeConversationEmbeddings(input, vectors);

      // Update conversation state
      await vectorSearchService.updateConversationState(input.userId, {
        sessionId: input.sessionId,
        lastUserMessage: input.userMessage,
        lastAgentMessage: input.lastAgentMessage,
        recentToolCalls: input.recentToolCalls,
        messageCountInBehavior: 
          (await vectorSearchService.getConversationState(input.userId))
            ?.message_count_in_behavior + 1 || 1,
      });

      return {
        rankings,
        topBehaviorId: rankings[0]?.behaviorId || 'default',
        topBehaviorScore: rankings[0]?.overallScore || 0,
        vectorLatencyMs,
        searchLatencyMs,
        totalLatencyMs,
        generatedVectors: {
          userMessage: !!vectors.userMessage,
          agentMessage: !!vectors.agentMessage,
          combined: !!vectors.combined,
          agentThought: !!vectors.agentThought,
          externalContext: !!vectors.externalContext,
          toolCall: !!vectors.toolCall,
        },
        innerThought: (vectors as any).innerThoughtText,
      };
    } catch (error) {
      console.error('Error in vector broadcast:', error);
      throw error;
    }
  }

  /**
   * Generate all 6 vector types in parallel
   */
  private async generateAllVectors(
    input: BroadcastInput
  ): Promise<VectorGenerationResult & { innerThoughtText?: string }> {
    const tasks: Promise<any>[] = [];
    const taskNames: string[] = [];

    // 1. User message vector (always generated)
    tasks.push(embeddingService.generateEmbedding(input.userMessage));
    taskNames.push('userMessage');

    // 2. Agent message vector (if available)
    if (input.lastAgentMessage) {
      tasks.push(embeddingService.generateEmbedding(input.lastAgentMessage));
      taskNames.push('agentMessage');
    }

    // 3. Combined exchange vector (if both messages available)
    if (input.lastAgentMessage) {
      const combined = `Agent: ${input.lastAgentMessage}\nUser: ${input.userMessage}`;
      tasks.push(embeddingService.generateEmbedding(combined));
      taskNames.push('combined');
    }

    // 4. Agent inner thought vector (generate from LLM)
    tasks.push(this.generateInnerThought(input));
    taskNames.push('agentThought');

    // 5. External context vector
    tasks.push(this.generateExternalContext(input.userId));
    taskNames.push('externalContext');

    // 6. Tool call vector (if available)
    if (input.recentToolCalls && input.recentToolCalls.length > 0) {
      const toolCallText = this.formatToolCalls(input.recentToolCalls);
      tasks.push(embeddingService.generateEmbedding(toolCallText));
      taskNames.push('toolCall');
    }

    // Execute all in parallel
    const results = await Promise.all(tasks);

    // Map results back to named vectors
    const vectors: any = {};
    results.forEach((result, index) => {
      const name = taskNames[index];
      
      if (name === 'agentThought' && typeof result === 'object') {
        vectors.agentThought = result.embedding;
        vectors.innerThoughtText = result.thought;
      } else if (name === 'externalContext' && typeof result === 'object') {
        vectors.externalContext = result.embedding;
      } else {
        vectors[name] = result;
      }
    });

    return vectors;
  }

  /**
   * Generate inner thought from LLM about the conversation state
   */
  private async generateInnerThought(
    input: BroadcastInput
  ): Promise<{ thought: string; embedding: number[] }> {
    try {
      const prompt = `You are an AI wellness companion observing a conversation.

User's message: "${input.userMessage}"
${input.lastAgentMessage ? `Your last response: "${input.lastAgentMessage}"` : ''}
${input.currentBehaviorId ? `Current behavior: ${input.currentBehaviorId}` : ''}

In 1-2 sentences, what is your internal observation about the user's state, needs, or the conversation direction?
Focus on: emotional state, underlying needs, topic shifts, or appropriate next behavior.

Inner thought:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      });

      const thought = response.choices[0]?.message?.content?.trim() || 
        'User is engaging in conversation.';

      const embedding = await embeddingService.generateEmbedding(thought);

      return { thought, embedding };
    } catch (error) {
      console.error('Error generating inner thought:', error);
      // Fallback: embed the user message
      const fallbackThought = `User said: ${input.userMessage}`;
      return {
        thought: fallbackThought,
        embedding: await embeddingService.generateEmbedding(fallbackThought),
      };
    }
  }

  /**
   * Generate external context vector (time, day, user state)
   */
  private async generateExternalContext(
    userId: string
  ): Promise<{ text: string; embedding: number[] }> {
    try {
      // Get current time context
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
      
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

      // Get user state from database (could include: recent activity, mood, goals, etc.)
      const userState = await vectorSearchService.getConversationState(userId);
      
      const contextText = `Current time: ${timeOfDay} ${dayOfWeek}. ${
        userState?.active_behavior_id 
          ? `Active behavior: ${userState.active_behavior_id}. ` 
          : ''
      }${
        userState?.message_count_in_behavior 
          ? `Messages in current behavior: ${userState.message_count_in_behavior}. `
          : ''
      }`;

      const embedding = await embeddingService.generateEmbedding(contextText);

      return { text: contextText, embedding };
    } catch (error) {
      console.error('Error generating external context:', error);
      const fallbackText = 'Conversation context';
      return {
        text: fallbackText,
        embedding: await embeddingService.generateEmbedding(fallbackText),
      };
    }
  }

  /**
   * Format recent tool calls into text for embedding
   */
  private formatToolCalls(toolCalls: Array<{ tool: string; params: any; result: any }>): string {
    return toolCalls
      .map(tc => `Called ${tc.tool} with params ${JSON.stringify(tc.params)}`)
      .join('. ');
  }

  /**
   * Store all generated embeddings for future search
   */
  private async storeConversationEmbeddings(
    input: BroadcastInput,
    vectors: VectorGenerationResult & { innerThoughtText?: string }
  ): Promise<void> {
    const embeddingsToStore: Array<{
      userId: string;
      sessionId?: string;
      vectorType: string;
      sourceText: string;
      embedding: number[];
      behaviorContext?: string;
      metadata?: any;
    }> = [];

    if (vectors.userMessage) {
      embeddingsToStore.push({
        userId: input.userId,
        sessionId: input.sessionId,
        vectorType: 'user_message',
        sourceText: input.userMessage,
        embedding: vectors.userMessage,
        behaviorContext: input.currentBehaviorId,
      });
    }

    if (vectors.agentMessage && input.lastAgentMessage) {
      embeddingsToStore.push({
        userId: input.userId,
        sessionId: input.sessionId,
        vectorType: 'agent_message',
        sourceText: input.lastAgentMessage,
        embedding: vectors.agentMessage,
        behaviorContext: input.currentBehaviorId,
      });
    }

    if (vectors.agentThought && (vectors as any).innerThoughtText) {
      embeddingsToStore.push({
        userId: input.userId,
        sessionId: input.sessionId,
        vectorType: 'agent_thought',
        sourceText: (vectors as any).innerThoughtText,
        embedding: vectors.agentThought,
        behaviorContext: input.currentBehaviorId,
      });
    }

    try {
      await vectorSearchService.storeBatchConversationEmbeddings(embeddingsToStore);
    } catch (error) {
      console.error('Error storing conversation embeddings:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get behavior candidacy pool (top N ranked behaviors for LLM selection)
   */
  async getBehaviorCandidacyPool(
    input: BroadcastInput,
    topN: number = 20
  ): Promise<BehaviorRanking[]> {
    const result = await this.broadcast(input);
    return result.rankings.slice(0, topN);
  }

  /**
   * Update vector weights (for experimentation/tuning)
   */
  setVectorWeights(weights: Partial<typeof this.defaultWeights>): void {
    this.defaultWeights = { ...this.defaultWeights, ...weights };
  }

  /**
   * Get current vector weights
   */
  getVectorWeights(): typeof this.defaultWeights {
    return { ...this.defaultWeights };
  }
}

// Singleton instance
export const vectorBroadcastService = new VectorBroadcastService();
