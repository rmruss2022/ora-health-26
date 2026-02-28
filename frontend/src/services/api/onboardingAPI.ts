/**
 * Onboarding API
 * Submits the intake chat transcript to the backend after the onboarding chat.
 */

import { apiClient } from './apiClient';
import type { Message } from '../../hooks/useChat';

export interface OnboardingTranscriptResponse {
  success: boolean;
}

export class OnboardingAPI {
  /**
   * Submit the onboarding chat transcript for a user.
   * Non-critical — callers should handle failure gracefully.
   */
  async submitChatTranscript(
    userId: string,
    messages: Message[]
  ): Promise<OnboardingTranscriptResponse> {
    const transcript = messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));

    return apiClient.post<OnboardingTranscriptResponse>(
      `/api/users/${userId}/onboarding`,
      { transcript }
    );
  }
}

export const onboardingAPI = new OnboardingAPI();
