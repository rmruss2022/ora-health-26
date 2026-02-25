import { callKimiAPI, getKimiConfig } from '../config/kimi';
import { getAnthropicClient, ANTHROPIC_CONFIG } from '../config/anthropic';
import { postgresService } from './postgres.service';
import { aiTools, aiToolsService } from './ai-tools.service';
import { behaviorDetectionService } from './behavior-detection.service';
import { BEHAVIORS } from '../config/behaviors';

type KimiErrorCategory =
  | 'timeout'
  | 'rate_limit'
  | 'server'
  | 'network'
  | 'bad_request'
  | 'auth'
  | 'unknown';

export class AIService {
  private resolveRequestedBehaviorId(requestedBehaviorId: string): string {
    const behaviorAliasMap: Record<string, string> = {
      planning: 'weekly-planning',
      review: 'weekly-review',
      journal: 'weekly-review',
      exercise: 'self-compassion-exercise',
      'journal-prompt': 'weekly-review',
      'guided-exercise': 'self-compassion-exercise',
      'progress-analysis': 'weekly-review',
    };

    return behaviorAliasMap[requestedBehaviorId] || requestedBehaviorId;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractStatusCode(error: unknown): number | null {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(/\((\d{3})\)/);
    if (!match) return null;
    return parseInt(match[1], 10);
  }

  private classifyKimiError(error: unknown): KimiErrorCategory {
    const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
    const status = this.extractStatusCode(error);

    if (message.includes('timeout') || message.includes('aborted')) return 'timeout';
    if (status === 429 || message.includes('rate limit') || message.includes('too many requests')) return 'rate_limit';
    if (status === 400) return 'bad_request';
    if (status === 401 || status === 403 || message.includes('unauthorized') || message.includes('forbidden')) return 'auth';
    if (status && status >= 500) return 'server';
    if (message.includes('network') || message.includes('fetch failed') || message.includes('econn') || message.includes('socket')) return 'network';

    return 'unknown';
  }

  private isRetryableKimiError(category: KimiErrorCategory): boolean {
    return category === 'timeout' || category === 'rate_limit' || category === 'server' || category === 'network';
  }

  private getRetryDelayMs(category: KimiErrorCategory, attempt: number): number {
    // attempt is 1-indexed
    switch (category) {
      case 'timeout':
        return 2000 * attempt;
      case 'rate_limit':
        return 4000 * attempt;
      case 'server':
      case 'network':
        return 1500 * attempt;
      default:
        return 1500 * attempt;
    }
  }

  private async callKimiWithRetry(
    messages: any[],
    systemPrompt: string,
    tools: any[] | undefined,
    phase: 'initial' | 'tool-followup'
  ): Promise<any> {
    const maxAttempts = 3;
    let currentTools = tools;
    let disabledToolsAfterBadRequest = false;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await callKimiAPI(messages, systemPrompt, currentTools);
      } catch (error) {
        lastError = error;
        const category = this.classifyKimiError(error);
        const status = this.extractStatusCode(error);

        // Tool schema/tool call formatting problems often manifest as 400s.
        // Retry once without tools to keep the conversation responsive.
        if (
          category === 'bad_request' &&
          !disabledToolsAfterBadRequest &&
          currentTools &&
          currentTools.length > 0
        ) {
          console.warn(
            `[Kimi retry] ${phase}: disabling tools after bad request (status=${status ?? 'n/a'})`
          );
          currentTools = undefined;
          disabledToolsAfterBadRequest = true;
          continue;
        }

        if (!this.isRetryableKimiError(category) || attempt === maxAttempts) {
          throw error;
        }

        const delayMs = this.getRetryDelayMs(category, attempt);
        console.warn(
          `[Kimi retry] ${phase}: attempt ${attempt}/${maxAttempts} failed (${category}, status=${status ?? 'n/a'}). Retrying in ${delayMs}ms`
        );
        await this.sleep(delayMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Unknown Kimi API error');
  }

  private getProvider(): 'anthropic' | 'nvidia' | 'mock' {
    const provider = process.env.AI_PROVIDER?.toLowerCase();
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const hasAnthropic = !!anthropicKey && anthropicKey !== 'your_anthropic_api_key_here';
    const hasNvidia = !!nvidiaKey && nvidiaKey !== 'your_nvidia_api_key_here';

    // Prefer Anthropic when available to keep chat on Claude.
    if (hasAnthropic) {
      if (provider && provider !== 'anthropic') {
        console.warn(`AI_PROVIDER="${provider}" overridden to Anthropic because ANTHROPIC_API_KEY is configured`);
      }
      return 'anthropic';
    }

    if (provider === 'anthropic' && !hasAnthropic) {
      console.warn('AI_PROVIDER="anthropic" set but ANTHROPIC_API_KEY is missing; falling back');
    }
    if (hasNvidia) return 'nvidia';

    return 'mock';
  }

  private shouldUseMock(): boolean {
    return this.getProvider() === 'mock';
  }

  async sendMessage(
    userId: string,
    message: string,
    behaviorId: string // This parameter is now ignored - we detect dynamically
  ): Promise<{
    content: string;
    role: string;
    toolsUsed?: string[];
    activeBehavior?: string;
  }> {
    // Use mock responses only when NVIDIA is not configured
    if (this.shouldUseMock()) {
      console.log('Using mock AI responses');
      const mockResponse = this.getMockResponse(message, behaviorId);
      // Still save user message to database
      try {
        await postgresService.saveChatMessage({
          userId,
          role: 'user',
          content: message,
          behaviorId: behaviorId,
        });
      } catch (dbError) {
        console.error('Failed to save user message:', dbError);
      }
      return {
        ...mockResponse,
        toolsUsed: undefined,
        activeBehavior: behaviorId,
      };
    }

    const provider = this.getProvider();

    if (provider === 'anthropic') {
      return this.sendMessageWithAnthropic(userId, message, behaviorId);
    }

    if (provider === 'nvidia') {
      return this.sendMessageWithKimi(userId, message, behaviorId);
    } else {
      // Should not reach here due to shouldUseMock check, but just in case
      const mockResponse = this.getMockResponse(message, behaviorId);
      try {
        await postgresService.saveChatMessage({
          userId,
          role: 'user',
          content: message,
          behaviorId: behaviorId,
        });
      } catch (dbError) {
        console.error('Failed to save user message:', dbError);
      }
      return {
        ...mockResponse,
        toolsUsed: undefined,
        activeBehavior: behaviorId,
      };
    }
  }

  private async sendMessageWithAnthropic(
    userId: string,
    message: string,
    behaviorId: string
  ): Promise<{
    content: string;
    role: string;
    toolsUsed?: string[];
    activeBehavior?: string;
  }> {
    let activeBehaviorName = behaviorId;
    let activeBehaviorId = behaviorId;

    try {
      const history = await postgresService.getChatHistory(userId, 10);

      const requestedBehavior = this.resolveRequestedBehaviorId(behaviorId);
      const explicitlySelectedBehavior =
        requestedBehavior && requestedBehavior !== 'free-form-chat'
          ? BEHAVIORS.find((behavior) => behavior.id === requestedBehavior)
          : undefined;

      let activeBehavior = explicitlySelectedBehavior;
      let behaviorConfidence = 1;
      let matchedTriggers: string[] = ['explicit-selection'];

      if (!activeBehavior) {
        const behaviorDetection = await behaviorDetectionService.detectBehavior(
          message,
          userId,
          history
        );
        activeBehavior = behaviorDetection.behavior;
        behaviorConfidence = behaviorDetection.confidence;
        matchedTriggers = behaviorDetection.matchedTriggers;
      }

      activeBehaviorName = activeBehavior.name;
      activeBehaviorId = activeBehavior.id;

      const client = getAnthropicClient();
      const anthropicMessages = [
        ...history.map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: message,
        },
      ];

      const completion = await client.messages.create({
        model: ANTHROPIC_CONFIG.model,
        max_tokens: ANTHROPIC_CONFIG.maxTokens,
        system: activeBehavior.instructions.systemPrompt,
        messages: anthropicMessages as any,
      });

      const assistantMessage =
        ((completion.content as any[])
          ?.filter((block) => block?.type === 'text')
          ?.map((block) => block.text)
          ?.join('\n')
          ?.trim() as string) || "I'm here with you.";

      await postgresService.saveChatMessage({
        userId,
        role: 'user',
        content: message,
        behaviorId: activeBehavior.id,
      });

      await postgresService.saveChatMessage({
        userId,
        role: 'assistant',
        content: assistantMessage,
        behaviorId: activeBehavior.id,
        metadata: {
          model: completion.model || ANTHROPIC_CONFIG.model,
          behaviorName: activeBehavior.name,
          behaviorConfidence,
          matchedTriggers,
        },
      });

      return {
        content: assistantMessage,
        role: 'assistant',
        activeBehavior: activeBehavior.name,
      };
    } catch (error: any) {
      console.error('Anthropic API Service Error:', error);
      const fallbackContent =
        "I'm having trouble reaching the AI service right now. Please try again in a moment.";

      try {
        await postgresService.saveChatMessage({
          userId,
          role: 'user',
          content: message,
          behaviorId: activeBehaviorId,
        });
        await postgresService.saveChatMessage({
          userId,
          role: 'assistant',
          content: fallbackContent,
          behaviorId: activeBehaviorId,
          metadata: {
            model: 'anthropic-fallback',
          },
        });
      } catch (dbError) {
        console.error('Failed to persist Anthropic fallback response:', dbError);
      }

      return {
        content: fallbackContent,
        role: 'assistant',
        activeBehavior: activeBehaviorName,
      };
    }
  }

  private async sendMessageWithKimi(
    userId: string,
    message: string,
    behaviorId: string
  ): Promise<{
    content: string;
    role: string;
    toolsUsed?: string[];
    activeBehavior?: string;
  }> {
    console.log('Using Kimi K2.5 API with dynamic behaviors');

    let activeBehaviorName = behaviorId;
    let activeBehaviorId = behaviorId;

    try {
      // Get chat history from Postgres
      const history = await postgresService.getChatHistory(userId, 10);

      const requestedBehavior = this.resolveRequestedBehaviorId(behaviorId);
      const explicitlySelectedBehavior =
        requestedBehavior && requestedBehavior !== 'free-form-chat'
          ? BEHAVIORS.find((behavior) => behavior.id === requestedBehavior)
          : undefined;

      let activeBehavior = explicitlySelectedBehavior;
      let behaviorConfidence = 1;
      let matchedTriggers: string[] = ['explicit-selection'];

      // If no explicit mode is selected (or unknown mode), detect behavior dynamically.
      if (!activeBehavior) {
        const behaviorDetection = await behaviorDetectionService.detectBehavior(
          message,
          userId,
          history
        );
        activeBehavior = behaviorDetection.behavior;
        behaviorConfidence = behaviorDetection.confidence;
        matchedTriggers = behaviorDetection.matchedTriggers;
      }

      activeBehaviorName = activeBehavior.name;
      activeBehaviorId = activeBehavior.id;
      console.log(`🎯 Activated behavior: ${activeBehavior.name}`);
      console.log(
        `   Confidence: ${behaviorConfidence.toFixed(2)}, Triggers: ${matchedTriggers.join(', ')}`
      );

      // Build messages array for Kimi (OpenAI-compatible format)
      const messages: any[] = [
        ...history.map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
        {
          role: 'user',
          content: message,
        },
      ];

      const toolsUsed: string[] = [];
      let assistantMessage = '';
      let completion: any;

      // Call Kimi API with tools and dynamic behavior system prompt
      completion = await this.callKimiWithRetry(
        messages,
        activeBehavior.instructions.systemPrompt,
        aiTools,
        'initial'
      );

      // Handle tool calls (OpenAI format uses tool_calls in choices[0].message)
      let responseMessage = completion.choices?.[0]?.message;
      let finishReason = completion.choices?.[0]?.finish_reason;

      // Handle tool use responses (Kimi may use multiple tools)
      while (finishReason === 'tool_calls' && responseMessage?.tool_calls) {
        // Execute all tool calls
        const toolResults = await Promise.all(
          responseMessage.tool_calls.map(async (toolCall: any) => {
            const rawArgs = toolCall.function.arguments || '{}';
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(rawArgs);
            } catch (parseError) {
              console.warn(`Invalid tool args for ${toolCall.function.name}; using empty args`);
            }

            console.log(`Executing tool: ${toolCall.function.name}`, parsedArgs);
            toolsUsed.push(toolCall.function.name);

            try {
              const result = await aiToolsService.executeTool(
                toolCall.function.name,
                parsedArgs,
                userId
              );

              return {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              };
            } catch (error: any) {
              return {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: error.message }),
              };
            }
          })
        );

        // Continue conversation with tool results
        messages.push({
          role: 'assistant',
          content: responseMessage.content || '',
          tool_calls: responseMessage.tool_calls,
        });

        messages.push(...toolResults);

        // Get next response from Kimi with tool results
        completion = await this.callKimiWithRetry(
          messages,
          activeBehavior.instructions.systemPrompt,
          aiTools,
          'tool-followup'
        );

        responseMessage = completion.choices?.[0]?.message;
        finishReason = completion.choices?.[0]?.finish_reason;
      }

      // Extract final text response
      assistantMessage = responseMessage?.content || responseMessage?.reasoning || '';

      // Save both messages to Postgres
      await postgresService.saveChatMessage({
        userId,
        role: 'user',
        content: message,
        behaviorId: activeBehavior.id,
      });

      await postgresService.saveChatMessage({
        userId,
        role: 'assistant',
        content: assistantMessage,
        behaviorId: activeBehavior.id,
        metadata: {
          tokens: completion.usage?.total_tokens || 0,
          model: completion.model || getKimiConfig().model,
          toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
          behaviorName: activeBehavior.name,
            behaviorConfidence,
            matchedTriggers,
        },
      });

      return {
        content: assistantMessage,
        role: 'assistant',
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        activeBehavior: activeBehavior.name,
      };
    } catch (error: any) {
      console.error('NVIDIA Kimi API Service Error:', error);
      const category = this.classifyKimiError(error);

      // Graceful fallback to avoid surfacing hard 500s for transient provider issues.
      const fallbackByCategory: Record<KimiErrorCategory, string> = {
        timeout:
          "I'm still here - the AI provider took too long to respond. Please try sending that again in a few seconds.",
        rate_limit:
          "I'm receiving a lot of requests right now. Please wait a moment and send your message again.",
        server:
          "The AI provider is temporarily unavailable. Please try again shortly.",
        network:
          "There was a temporary network issue reaching the AI provider. Please try again in a moment.",
        bad_request:
          "I had trouble processing that request format. Please rephrase slightly and try again.",
        auth:
          "The AI service credentials are currently invalid. Please contact support or check server configuration.",
        unknown:
          "I hit an unexpected AI service issue. Please try again in a few seconds.",
      };

      const fallbackContent = fallbackByCategory[category] || fallbackByCategory.unknown;

      try {
        await postgresService.saveChatMessage({
          userId,
          role: 'user',
          content: message,
          behaviorId: activeBehaviorId,
        });

        await postgresService.saveChatMessage({
          userId,
          role: 'assistant',
          content: fallbackContent,
          behaviorId: activeBehaviorId,
          metadata: {
            model: 'nvidia-fallback',
            errorCategory: category,
          },
        });
      } catch (dbError) {
        console.error('Failed to persist fallback chat response:', dbError);
      }

      return {
        content: fallbackContent,
        role: 'assistant',
        activeBehavior: activeBehaviorName,
      };
    }
  }

  private getMockResponse(
    message: string,
    behaviorId: string
  ): { content: string; role: string } {
    const responses: Record<string, string[]> = {
      'free-form-chat': [
        'I hear you. Tell me more about that. What thoughts or feelings are coming up for you?',
        "That's interesting. How does that make you feel?",
        'I appreciate you sharing that with me. What would you like to explore further?',
        "Thank you for opening up. What's been on your mind lately?",
        "I'm here to listen. Can you tell me more about what you're experiencing?",
        "That sounds important. How are you feeling about that?",
      ],
      'journal-prompt': [
        "Let's start journaling. What was the most significant moment of your day?",
        'What are you grateful for right now?',
        "Describe how you're feeling in this moment.",
        "What's been on your mind today?",
      ],
      'guided-exercise': [
        "I'd love to guide you through an exercise. What area would you like to focus on?",
        "Let's work through this together. What would be most helpful for you right now?",
      ],
      'weekly-planning': [
        "Let's plan your week together. What are your main priorities?",
        "What would make this week meaningful for you?",
      ],
      'progress-analysis': [
        "Let's look at your journey together. What patterns have you noticed?",
        "I can help you reflect on your progress. What stands out to you?",
      ],
    };

    const behaviorResponses =
      responses[behaviorId] || responses['free-form-chat'];
    const randomResponse =
      behaviorResponses[Math.floor(Math.random() * behaviorResponses.length)];

    return {
      content: randomResponse,
      role: 'assistant',
    };
  }

  private getBehaviorPrompt(behaviorId: string): string {
    const prompts: Record<string, string> = {
      'journal-prompt': `You are a supportive journaling companion. Help users reflect on their thoughts and feelings through thoughtful questions and gentle guidance. Encourage deeper exploration of their experiences.

You have access to tools to get context about the user and their journal history. Use these tools when relevant to provide personalized support.`,

      'free-form-chat': `You are a compassionate listener and mental wellness companion. Provide a safe space for users to express themselves. Listen actively, validate emotions, and offer gentle insights when appropriate.

You have access to tools to understand the user better. Use them when helpful to provide more personalized support.`,

      'progress-analysis': `You are an insightful analyst helping users understand their personal growth journey. Review their journal entries and provide meaningful observations about patterns, progress, and areas for continued focus.

Use the available tools to access the user's journal history and summaries to provide detailed insights.`,

      'weekly-planning': `You are a thoughtful planning assistant. Help users set intentions for their week, break down goals into manageable steps, and plan for self-care activities.

You can access the user's goals and preferences to help create personalized plans.`,

      'guided-exercise': `You are a skilled guide for personal growth exercises. Lead users through structured activities like gratitude practice, cognitive reframing, or values clarification with clear instructions and supportive feedback.

You can access user context to make exercises more relevant to their situation.`,
    };

    return prompts[behaviorId] || prompts['free-form-chat'];
  }
}

export const aiService = new AIService();
