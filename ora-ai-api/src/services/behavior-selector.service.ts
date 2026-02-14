/**
 * Behavior Selector Service
 * Takes top-ranked behavior candidates from vector broadcast
 * and uses LLM to make final behavior selection
 */

import OpenAI from 'openai';
import { vectorBroadcastService } from './vector-broadcast.service';
import { vectorSearchService } from './vector-search.service';

interface BehaviorCandidate {
  behaviorId: string;
  overallScore: number;
  vectorScores: {
    [vectorType: string]: number;
  };
  metadata: {
    name?: string;
    description?: string;
    category?: string;
    priority?: number;
  };
}

interface BehaviorSelectionContext {
  userId: string;
  userMessage: string;
  lastAgentMessage?: string;
  currentBehaviorId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  recentToolCalls?: any[];
}

interface BehaviorSelectionResult {
  selectedBehaviorId: string;
  confidence: number;
  reasoning: string;
  candidates: BehaviorCandidate[];
  vectorLatencyMs: number;
  llmLatencyMs: number;
  totalLatencyMs: number;
}

export class BehaviorSelectorService {
  private openai: OpenAI;
  private candidatePoolSize: number = 20;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Select behavior from candidates using LLM
   */
  async selectBehavior(
    context: BehaviorSelectionContext
  ): Promise<BehaviorSelectionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Get behavior candidacy pool from vector broadcast
      const vectorStartTime = Date.now();
      const broadcastResult = await vectorBroadcastService.broadcast({
        userId: context.userId,
        userMessage: context.userMessage,
        lastAgentMessage: context.lastAgentMessage,
        currentBehaviorId: context.currentBehaviorId,
        recentToolCalls: context.recentToolCalls,
      });

      const candidates = broadcastResult.rankings.slice(0, this.candidatePoolSize);
      const vectorLatencyMs = Date.now() - vectorStartTime;

      // Step 2: Add current behavior as persistent candidate (for continuity)
      if (context.currentBehaviorId) {
        const currentBehaviorExists = candidates.some(
          c => c.behaviorId === context.currentBehaviorId
        );

        if (!currentBehaviorExists) {
          // Add current behavior with persistence bonus
          candidates.push({
            behaviorId: context.currentBehaviorId,
            overallScore: 0.5, // Base persistence score
            vectorScores: {},
            metadata: {
              name: context.currentBehaviorId,
              description: 'Current active behavior',
              category: 'persistent',
              priority: 5,
            },
          });
        }
      }

      // Step 3: Use LLM for final selection
      const llmStartTime = Date.now();
      const llmSelection = await this.llmSelectBehavior(context, candidates);
      const llmLatencyMs = Date.now() - llmStartTime;

      const totalLatencyMs = Date.now() - startTime;

      // Log the selection
      await vectorSearchService.logBehaviorDetection({
        userId: context.userId,
        userMessage: context.userMessage,
        previousBehaviorId: context.currentBehaviorId,
        detectedBehaviorId: llmSelection.behaviorId,
        detectionMethod: 'multi-vector-llm',
        confidenceScore: llmSelection.confidence,
        vectorScores: broadcastResult.rankings[0]?.vectorScores,
        topCandidates: candidates.slice(0, 10),
        llmReasoning: llmSelection.reasoning,
        latencyMs: totalLatencyMs,
        embeddingLatencyMs: broadcastResult.vectorLatencyMs,
        searchLatencyMs: broadcastResult.searchLatencyMs,
        llmLatencyMs,
      });

      return {
        selectedBehaviorId: llmSelection.behaviorId,
        confidence: llmSelection.confidence,
        reasoning: llmSelection.reasoning,
        candidates,
        vectorLatencyMs,
        llmLatencyMs,
        totalLatencyMs,
      };
    } catch (error) {
      console.error('Error in behavior selection:', error);
      
      // Fallback to highest scoring candidate
      const fallbackBehaviorId = context.currentBehaviorId || 'free-form-chat';
      
      return {
        selectedBehaviorId: fallbackBehaviorId,
        confidence: 0.5,
        reasoning: 'Fallback due to error',
        candidates: [],
        vectorLatencyMs: 0,
        llmLatencyMs: 0,
        totalLatencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Use LLM to select best behavior from candidates
   */
  private async llmSelectBehavior(
    context: BehaviorSelectionContext,
    candidates: BehaviorCandidate[]
  ): Promise<{
    behaviorId: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const candidatesText = candidates
        .slice(0, 10) // Top 10 candidates
        .map((c, i) => {
          const isCurrent = c.behaviorId === context.currentBehaviorId;
          return `${i + 1}. ${c.behaviorId}${isCurrent ? ' (CURRENT)' : ''}
   Score: ${c.overallScore.toFixed(3)}
   Name: ${c.metadata.name || c.behaviorId}
   Description: ${c.metadata.description || 'No description'}
   ${isCurrent ? 'CONTINUITY BONUS: This is the current active behavior' : ''}`;
        })
        .join('\n\n');

      const prompt = `You are an AI wellness coach behavior selector. Choose the most appropriate behavior for the current conversation state.

USER MESSAGE:
"${context.userMessage}"

${context.lastAgentMessage ? `LAST AGENT MESSAGE:\n"${context.lastAgentMessage}"` : ''}

${context.currentBehaviorId ? `CURRENT ACTIVE BEHAVIOR: ${context.currentBehaviorId}\n(Consider behavior continuity - avoid switching unless clearly needed)` : ''}

TOP BEHAVIOR CANDIDATES (scored via multi-vector similarity):
${candidatesText}

INSTRUCTIONS:
1. Consider the user's current message and recent conversation context
2. Favor behavior continuity (sticking with current behavior) unless a clear shift is needed
3. A behavior switch requires a confidence threshold of at least 0.2 HIGHER than the current behavior
4. Choose the behavior that best serves the user's immediate need
5. Respond in JSON format:
{
  "behaviorId": "selected-behavior-id",
  "confidence": 0.85,
  "reasoning": "Brief explanation (1-2 sentences)"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a behavior selection system. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Low temperature for consistent selection
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from LLM');
      }

      const selection = JSON.parse(content);

      // Validate selection
      const selectedBehaviorId = selection.behaviorId || context.currentBehaviorId || 'free-form-chat';
      const confidence = Math.min(1.0, Math.max(0.0, selection.confidence || 0.5));
      const reasoning = selection.reasoning || 'Selected based on conversation context';

      return {
        behaviorId: selectedBehaviorId,
        confidence,
        reasoning,
      };
    } catch (error) {
      console.error('Error in LLM behavior selection:', error);
      
      // Fallback: Use highest scoring candidate or current behavior
      const fallbackBehaviorId = candidates[0]?.behaviorId || context.currentBehaviorId || 'free-form-chat';
      
      return {
        behaviorId: fallbackBehaviorId,
        confidence: 0.6,
        reasoning: 'Selected based on vector similarity (LLM fallback)',
      };
    }
  }

  /**
   * Set the size of the candidacy pool
   */
  setCandidatePoolSize(size: number): void {
    this.candidatePoolSize = Math.max(5, Math.min(50, size)); // Clamp between 5-50
  }

  /**
   * Get candidate pool size
   */
  getCandidatePoolSize(): number {
    return this.candidatePoolSize;
  }

  /**
   * Check if behavior switch should occur based on confidence threshold
   */
  shouldSwitchBehavior(
    newBehaviorScore: number,
    currentBehaviorScore: number,
    threshold: number = 0.2
  ): boolean {
    return newBehaviorScore > currentBehaviorScore + threshold;
  }
}

// Singleton instance
export const behaviorSelectorService = new BehaviorSelectorService();
