import { getAnthropicClient, ANTHROPIC_CONFIG } from '../config/anthropic';
import { callKimiAPI, getKimiConfig } from '../config/kimi';
import { postgresService } from './postgres.service';
import { aiTools, aiToolsService } from './ai-tools.service';
import { behaviorDetectionService } from './behavior-detection.service';

export class AIService {
  private getProvider(): 'anthropic' | 'kimi' | 'mock' {
    const provider = process.env.AI_PROVIDER?.toLowerCase() || 'auto';
    
    if (provider === 'anthropic') {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey && anthropicKey !== 'your_anthropic_api_key_here') {
        return 'anthropic';
      }
    }
    
    if (provider === 'kimi') {
      const kimiKey = process.env.KIMI_API_KEY || process.env.NVIDIA_API_KEY;
      if (kimiKey && kimiKey !== 'your_kimi_api_key_here' && kimiKey !== 'your_nvidia_api_key_here') {
        return 'kimi';
      }
    }
    
    // Auto-detect: prefer Kimi if available, then Anthropic, then mock
    if (provider === 'auto' || provider === 'kimi') {
      const kimiKey = process.env.KIMI_API_KEY || process.env.NVIDIA_API_KEY;
      if (kimiKey && kimiKey !== 'your_kimi_api_key_here' && kimiKey !== 'your_nvidia_api_key_here') {
        return 'kimi';
      }
    }
    
    if (provider === 'auto' || provider === 'anthropic') {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey && anthropicKey !== 'your_anthropic_api_key_here') {
        return 'anthropic';
      }
    }
    
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
    // Use mock responses if Anthropic key not configured
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
    } else if (provider === 'kimi') {
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
    console.log('Using Anthropic Claude API with dynamic behaviors');

    try {
      // Get chat history from Postgres
      const history = await postgresService.getChatHistory(userId, 10);

      // Detect appropriate behavior based on user message and context
      const behaviorDetection = await behaviorDetectionService.detectBehavior(
        message,
        userId,
        history
      );

      const activeBehavior = behaviorDetection.behavior;
      console.log(`🎯 Activated behavior: ${activeBehavior.name}`);
      console.log(
        `   Confidence: ${behaviorDetection.confidence.toFixed(2)}, Triggers: ${behaviorDetection.matchedTriggers.join(', ')}`
      );

      // Build messages array for Claude
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

      // Call Claude API with tools and dynamic behavior system prompt
      let completion = await getAnthropicClient().messages.create({
        model: ANTHROPIC_CONFIG.model,
        max_tokens: ANTHROPIC_CONFIG.maxTokens,
        system: activeBehavior.instructions.systemPrompt,
        messages,
        tools: aiTools,
      });

      const toolsUsed: string[] = [];

      // Handle tool use responses (Claude may use multiple tools)
      while (completion.stop_reason === 'tool_use') {
        // Find all tool use blocks in the response
        const toolUses = completion.content.filter(
          (block: any) => block.type === 'tool_use'
        );

        // Execute all tools
        const toolResults = await Promise.all(
          toolUses.map(async (toolUse: any) => {
            console.log(`Executing tool: ${toolUse.name}`, toolUse.input);
            toolsUsed.push(toolUse.name);

            try {
              const result = await aiToolsService.executeTool(
                toolUse.name,
                toolUse.input,
                userId
              );

              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              };
            } catch (error: any) {
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify({ error: error.message }),
                is_error: true,
              };
            }
          })
        );

        // Continue conversation with tool results
        messages.push({
          role: 'assistant',
          content: completion.content,
        });

        messages.push({
          role: 'user',
          content: toolResults,
        });

        // Get next response from Claude with tool results
        completion = await getAnthropicClient().messages.create({
          model: ANTHROPIC_CONFIG.model,
          max_tokens: ANTHROPIC_CONFIG.maxTokens,
          system: this.getBehaviorPrompt(behaviorId),
          messages,
          tools: aiTools,
        });
      }

      // Extract final text response
      const textBlocks = completion.content.filter(
        (block: any) => block.type === 'text'
      );
      const assistantMessage =
        textBlocks.length > 0 && 'text' in textBlocks[0] ? textBlocks[0].text : '';

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
          tokens:
            completion.usage.input_tokens + completion.usage.output_tokens,
          model: completion.model,
          toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
          behaviorName: activeBehavior.name,
          behaviorConfidence: behaviorDetection.confidence,
          matchedTriggers: behaviorDetection.matchedTriggers,
        },
      });

      return {
        content: assistantMessage,
        role: 'assistant',
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        activeBehavior: activeBehavior.name,
      };
    } catch (error: any) {
      console.error('Anthropic API Service Error:', error);
      
      // Check if it's an API error (e.g., insufficient credits, invalid API key)
      const isAPIError = error?.error?.type === 'invalid_request_error' || 
                        error?.error?.type === 'authentication_error' ||
                        error?.error?.code === 'insufficient_quota' ||
                        error?.message?.includes('credit') ||
                        error?.message?.includes('API') ||
                        error?.message?.includes('Anthropic');
      
      if (isAPIError) {
        console.log('⚠️  Anthropic API error detected, falling back to mock responses');
        console.log('   Error:', error?.error?.message || error?.message);
        
        // Still save the user message to database
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
        
        // Return mock response with proper structure
        const mockResponse = this.getMockResponse(message, behaviorId);
        return {
          ...mockResponse,
          toolsUsed: undefined,
          activeBehavior: behaviorId,
        };
      }
      
      throw new Error('Failed to process message');
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

    try {
      // Get chat history from Postgres
      const history = await postgresService.getChatHistory(userId, 10);

      // Detect appropriate behavior based on user message and context
      const behaviorDetection = await behaviorDetectionService.detectBehavior(
        message,
        userId,
        history
      );

      const activeBehavior = behaviorDetection.behavior;
      console.log(`🎯 Activated behavior: ${activeBehavior.name}`);
      console.log(
        `   Confidence: ${behaviorDetection.confidence.toFixed(2)}, Triggers: ${behaviorDetection.matchedTriggers.join(', ')}`
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
      completion = await callKimiAPI(
        messages,
        activeBehavior.instructions.systemPrompt,
        aiTools
      );

      // Handle tool calls (OpenAI format uses tool_calls in choices[0].message)
      let responseMessage = completion.choices?.[0]?.message;
      let finishReason = completion.choices?.[0]?.finish_reason;

      // Handle tool use responses (Kimi may use multiple tools)
      while (finishReason === 'tool_calls' && responseMessage?.tool_calls) {
        // Execute all tool calls
        const toolResults = await Promise.all(
          responseMessage.tool_calls.map(async (toolCall: any) => {
            console.log(`Executing tool: ${toolCall.function.name}`, JSON.parse(toolCall.function.arguments || '{}'));
            toolsUsed.push(toolCall.function.name);

            try {
              const result = await aiToolsService.executeTool(
                toolCall.function.name,
                JSON.parse(toolCall.function.arguments || '{}'),
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
        completion = await callKimiAPI(
          messages,
          activeBehavior.instructions.systemPrompt,
          aiTools
        );

        responseMessage = completion.choices?.[0]?.message;
        finishReason = completion.choices?.[0]?.finish_reason;
      }

      // Extract final text response
      assistantMessage = responseMessage?.content || '';

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
          behaviorConfidence: behaviorDetection.confidence,
          matchedTriggers: behaviorDetection.matchedTriggers,
        },
      });

      return {
        content: assistantMessage,
        role: 'assistant',
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        activeBehavior: activeBehavior.name,
      };
    } catch (error: any) {
      console.error('Kimi API Service Error:', error);
      
      // Check if it's an API error (e.g., insufficient credits, invalid API key)
      const isAPIError = error?.error?.type === 'invalid_request_error' || 
                        error?.error?.type === 'authentication_error' ||
                        error?.error?.code === 'insufficient_quota' ||
                        error?.message?.includes('credit') ||
                        error?.message?.includes('API') ||
                        error?.message?.includes('Kimi');
      
      if (isAPIError) {
        console.log('⚠️  Kimi API error detected, falling back to mock responses');
        console.log('   Error:', error?.error?.message || error?.message);
        
        // Still save the user message to database
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
        
        // Return mock response with proper structure
        const mockResponse = this.getMockResponse(message, behaviorId);
        return {
          ...mockResponse,
          toolsUsed: undefined,
          activeBehavior: behaviorId,
        };
      }
      
      throw new Error('Failed to process message');
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
