/**
 * Ora Agent Routes
 * AI-generated context-aware messages for the floating Ora agent
 */

import { Router, Request, Response } from 'express';
import { agentMemoryService } from '../services/agent-memory.service';
import { getAnthropicClient, ANTHROPIC_CONFIG } from '../config/anthropic';

const router = Router();

const SCREEN_INSTRUCTIONS: Record<string, string> = {
  home: 'Generate a warm, personal greeting (2 sentences max). Reference something specific from their history if available. Suggest one gentle action.',
  community: 'Generate a community-focused message (2 sentences max). Reference their community activity or encourage connection. Keep it warm and personal.',
  chat: 'Generate a context-aware opening to start a conversation (1-2 sentences). Reference their wellness journey. Ask one open, gentle question.',
};

function buildContextBlock(
  userName: string,
  screen: string,
  memory: Awaited<ReturnType<typeof agentMemoryService.getUserMemoryContext>>
): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const parts: string[] = [
    `User: ${userName} | Screen: ${screen} | Time: ${dayOfWeek} ${timeOfDay}`,
  ];

  if (memory.meditationHistory.totalSessions > 0) {
    parts.push(
      `Meditation: ${memory.meditationHistory.totalSessions} sessions, ${memory.meditationHistory.totalMinutes} min total`
    );
  }

  if (memory.meditationHistory.recentSessions.length > 0) {
    const last = memory.meditationHistory.recentSessions[0];
    parts.push(`Last meditation: ${last.date}`);
  }

  if (memory.moodPatterns.averageMood !== undefined) {
    const moodLabel =
      memory.moodPatterns.averageMood >= 7
        ? 'positive'
        : memory.moodPatterns.averageMood >= 4
        ? 'balanced'
        : 'challenging';
    parts.push(`Recent mood: ${moodLabel}`);
  }

  if (memory.communityActivity.totalPosts > 0) {
    parts.push(`Community: ${memory.communityActivity.totalPosts} posts shared`);
  }

  if (memory.weeklyPlans.lastPlan?.intentions) {
    const snippet = memory.weeklyPlans.lastPlan.intentions.slice(0, 80);
    parts.push(`Last intention: "${snippet}"`);
  }

  if (memory.weeklyPlans.planningStreak && memory.weeklyPlans.planningStreak > 1) {
    parts.push(`Planning streak: ${memory.weeklyPlans.planningStreak} weeks`);
  }

  return parts.join(' | ');
}

/**
 * POST /api/ora-agent/message
 * Generate a context-aware greeting message for the Ora floating agent
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { userId, userName, screen } = req.body as {
      userId?: string;
      userName?: string;
      screen?: string;
    };

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const screenKey = screen || 'home';
    const instruction = SCREEN_INSTRUCTIONS[screenKey] || SCREEN_INSTRUCTIONS.home;

    // Fetch user memory context (1hr cached)
    const memory = await agentMemoryService.getUserMemoryContext(userId);

    const contextBlock = buildContextBlock(userName || 'Friend', screenKey, memory);

    const prompt = `[Agent Context]\n${contextBlock}\n\n${instruction}\n\nSpeak directly to the user (second person, "you"). No markdown, no asterisks. Under 35 words. Sound like a warm, present friend who genuinely knows them — not a chatbot.`;

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: ANTHROPIC_CONFIG.model,
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    });

    const firstBlock = response.content[0];
    if (!firstBlock || firstBlock.type !== 'text') {
      return res.status(500).json({ error: 'No text in AI response' });
    }

    res.json({ message: firstBlock.text.trim() });
  } catch (error: any) {
    console.error('[ora-agent] message error:', error);
    res.status(500).json({
      error: 'Failed to generate message',
      message: error.message,
    });
  }
});

export default router;
