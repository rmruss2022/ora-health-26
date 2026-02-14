import { BEHAVIORS, Behavior } from '../config/behaviors';

interface BehaviorDetectionResult {
  behavior: Behavior;
  confidence: number;
  matchedTriggers: string[];
  detectionMethod?: 'vector' | 'keyword' | 'fallback';
}

export class BehaviorDetectionService {
  /**
   * Simplified behavior detection - always returns free-form-chat
   * (Complex multi-vector system disabled for stability)
   */
  async detectBehavior(
    message: string,
    userId: string,
    conversationHistory?: any[]
  ): Promise<BehaviorDetectionResult> {
    // Always return free-form chat behavior
    const freeFormBehavior = BEHAVIORS.find((b) => b.id === 'free-form-chat')!;

    return {
      behavior: freeFormBehavior,
      confidence: 1.0,
      matchedTriggers: ['default'],
      detectionMethod: 'fallback',
    };
  }

  /**
   * Log behavior transition (simplified)
   */
  private async logBehaviorTransition(
    userId: string,
    result: BehaviorDetectionResult,
    message: string
  ): Promise<void> {
    // Simplified logging - just console
    console.log(`User ${userId}: Behavior=${result.behavior.id} (${result.detectionMethod})`);
  }
}

export const behaviorDetectionService = new BehaviorDetectionService();
