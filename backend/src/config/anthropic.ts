import Anthropic from '@anthropic-ai/sdk';
import type { Tool } from '@anthropic-ai/sdk/resources/messages/messages';

let anthropicClient: Anthropic | null = null;

/**
 * Convert aiTools (from ai-tools.service) to Anthropic Tool format.
 * Chat and voice should use the same tool set.
 */
export function convertAiToolsToAnthropic(aiTools: Array<{ name: string; description?: string; input_schema: any }>): Tool[] {
  return aiTools.map((t) => ({
    name: t.name,
    description: t.description || '',
    input_schema: {
      type: 'object' as const,
      properties: t.input_schema?.properties ?? {},
      required: t.input_schema?.required ?? [],
    },
  }));
}

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export const ANTHROPIC_CONFIG = {
  get model() {
    return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  },
  get maxTokens() {
    return parseInt(process.env.ANTHROPIC_MAX_TOKENS || '1000');
  },
};
