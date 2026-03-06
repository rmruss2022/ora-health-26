import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { profileService } from '../services/profile.service';
import { aiToolsService } from '../services/ai-tools.service';
import { postgresService } from '../services/postgres.service';

interface ConversationTokenResponse {
  token: string;
}

// All tools available to the voice agent — matches chat tab's ai-tools
type AllowedToolName =
  | 'get_user_profile'
  | 'update_user_profile'
  | 'get_user_recommendations'
  | 'get_user_summaries'
  | 'get_recent_journal_entries'
  | 'search_journal_entries'
  | 'get_conversation_history'
  | 'save_user_insight'
  | 'get_available_activities'
  | 'search_activities'
  | 'get_user_progress'
  | 'get_user_letters'
  | 'get_meditation_sessions'
  | 'get_inbox_messages'
  | 'save_weekly_plan'
  | 'get_weekly_plan'
  | 'save_weekly_review'
  | 'get_weekly_review'
  | 'get_quiz_streak'
  | 'get_quiz_history'
  | 'get_exercise_completions'
  | 'get_meditations'
  | 'get_upcoming_collective_sessions'
  | 'create_journal_entry'
  | 'get_user_notifications'
  | 'get_user_community_posts';

class VoiceController {
  /**
   * POST /api/voice/conversation-token
   * Creates a short-lived ElevenLabs conversation token for private agents.
   */
  async createConversationToken(req: AuthRequest, res: Response) {
    const requestedAgentId = typeof req.body?.agentId === 'string' ? req.body.agentId.trim() : '';
    const defaultAgentId = (process.env.ELEVENLABS_ORA_AGENT_ID || '').trim();
    const agentId = requestedAgentId || defaultAgentId;
    const elevenApiKey = (process.env.ELEVENLABS_API_KEY || '').trim();

    if (!agentId) {
      return res.status(400).json({
        error: 'Missing agent id',
        message: 'Provide agentId in request body or ELEVENLABS_ORA_AGENT_ID in env',
      });
    }

    if (!elevenApiKey) {
      return res.status(500).json({
        error: 'Server misconfigured',
        message: 'ELEVENLABS_API_KEY is not set',
      });
    }

    try {
    const tokenUrl = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`;
    const tokenTimeoutMs = 25000; // 25s — ElevenLabs can be slow under load
    const fetchOpts: RequestInit = {
      method: 'GET',
      headers: { 'xi-api-key': elevenApiKey },
      signal: AbortSignal.timeout(tokenTimeoutMs),
    };
    console.log('[VoiceController] createConversationToken fetching', { agentId });

    let elevenResponse: Awaited<ReturnType<typeof fetch>>;
    let lastErrText = '';
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        elevenResponse = await fetch(tokenUrl, fetchOpts);
        lastErrText = await elevenResponse.text().catch(() => '');

        if (elevenResponse.ok) break;

        // Retry on 500 (transient ElevenLabs issues)
        if (elevenResponse.status === 500 && attempt < maxRetries) {
          console.warn(`[VoiceController] Token fetch 500, retry ${attempt + 1}/${maxRetries}`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        return res.status(502).json({
          error: 'Failed to create conversation token',
          message: `ElevenLabs responded ${elevenResponse.status}: ${lastErrText}`,
        });
      } catch (fetchErr: any) {
        const isTimeout =
          fetchErr?.name === 'TimeoutError' ||
          fetchErr?.name === 'AbortError' ||
          fetchErr?.message?.includes('timeout');
        if (attempt < maxRetries && isTimeout) {
          console.warn(
            `[VoiceController] Token fetch timeout (${fetchErr?.message}), retry ${attempt + 1}/${maxRetries}`
          );
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        console.error('[VoiceController] createConversationToken fetch failed:', fetchErr?.message);
        throw fetchErr;
      }
    }

    try {
      const body = JSON.parse(lastErrText) as ConversationTokenResponse;
      if (!body?.token) {
        return res.status(502).json({
          error: 'Invalid token response',
          message: 'ElevenLabs did not return a token',
        });
      }

      return res.json({
        token: body.token,
        agentId,
        userId: req.userId ?? null,
      });
    } catch (parseErr: any) {
      console.error('[VoiceController] createConversationToken parse error:', parseErr);
      return res.status(502).json({
        error: 'Failed to create conversation token',
        message: 'Invalid response from ElevenLabs',
      });
    }
  } catch (error: any) {
    console.error('[VoiceController] createConversationToken error:', error);
    return res.status(500).json({
      error: 'Failed to create conversation token',
      message: error?.message || 'Unknown error',
    });
  }
  }

  /**
   * POST /api/voice/tool-call
   * Executes whitelisted app tools on behalf of the voice agent.
   */
  async executeToolCall(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const toolName = String(req.body?.toolName || '').trim() as AllowedToolName;
    const args = req.body?.args ?? {};

    console.log('[VoiceController] executeToolCall', { toolName, userId: userId ?? 'none', argsKeys: Object.keys(args ?? {}) });

    if (!userId) {
      console.warn('[VoiceController] executeToolCall rejected: no userId (auth required)');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user found',
      });
    }

    const allowedTools: AllowedToolName[] = [
      'get_user_profile',
      'update_user_profile',
      'get_user_recommendations',
      'get_user_summaries',
      'get_recent_journal_entries',
      'search_journal_entries',
      'get_conversation_history',
      'save_user_insight',
      'get_available_activities',
      'search_activities',
      'get_user_progress',
      'get_user_letters',
      'get_meditation_sessions',
      'get_inbox_messages',
      'save_weekly_plan',
      'get_weekly_plan',
      'save_weekly_review',
      'get_weekly_review',
      'get_quiz_streak',
      'get_quiz_history',
      'get_exercise_completions',
      'get_meditations',
      'get_upcoming_collective_sessions',
      'create_journal_entry',
      'get_user_notifications',
      'get_user_community_posts',
    ];

    if (!allowedTools.includes(toolName)) {
      return res.status(400).json({
        error: 'Unsupported tool',
        message: `Tool "${toolName}" is not allowed`,
      });
    }

    try {
      // Profile tools (existing)
      switch (toolName) {
        case 'get_user_profile': {
          let profile = await profileService.getUserProfile(userId);
          if (!profile) {
            const user = await postgresService.getUserById(userId);
            profile = user
              ? {
                  id: user.id,
                  user_id: user.id,
                  email: user.email,
                  name: user.name,
                  avatar_url: user.avatar_url,
                  quiz_responses: null,
                  quiz_version: '1.0',
                  quiz_completed_at: null,
                  quiz_started_at: null,
                  suggested_behaviors: [],
                  notification_frequency: null,
                  preferred_check_in_time: null,
                  content_difficulty_level: 5,
                  primary_goals: [],
                  focus_area: null,
                  reflection_styles: [],
                  motivation_drivers: [],
                  stress_baseline: null,
                  created_at: new Date(),
                  updated_at: new Date(),
                  revision_count: 0,
                }
              : null;
          }
          return res.json({ success: true, toolName, result: profile });
        }

        case 'get_user_recommendations': {
          const recommendations = await profileService.getPersonalizedRecommendations(userId);
          return res.json({ success: true, toolName, result: recommendations });
        }

        case 'update_user_profile': {
          const updatePayload = {
            notification_frequency:
              typeof args?.notification_frequency === 'string'
                ? args.notification_frequency
                : undefined,
            preferred_check_in_time:
              typeof args?.preferred_check_in_time === 'string'
                ? args.preferred_check_in_time
                : undefined,
            suggested_behaviors: Array.isArray(args?.suggested_behaviors)
              ? args.suggested_behaviors.filter((v: unknown) => typeof v === 'string')
              : undefined,
            content_difficulty_level:
              typeof args?.content_difficulty_level === 'number'
                ? args.content_difficulty_level
                : undefined,
          };

          const updated = await profileService.updateProfile(userId, updatePayload);
          return res.json({ success: true, toolName, result: updated });
        }
      }

      // Chat agent tools (same as chat tab)
      const aiToolResult = await aiToolsService.executeTool(toolName, args, userId);
      console.log('[VoiceController] executeToolCall success:', toolName);
      return res.json({ success: true, toolName, result: aiToolResult });
    } catch (error: any) {
      console.error('[VoiceController] executeToolCall error:', toolName, error?.message, error);
      return res.status(500).json({
        error: 'Tool execution failed',
        message: error?.message || 'Unknown error',
      });
    }
  }

  /**
   * POST /api/voice/conversation-log
   * Logs a single voice conversation message (user or assistant) for transcript analysis.
   */
  async logConversationMessage(req: AuthRequest, res: Response) {
    console.log('[VoiceController] logConversationMessage received', {
      hasUserId: !!req.userId,
      sessionId: req.body?.sessionId?.slice?.(0, 30),
      role: req.body?.role,
    });
    const userId = req.userId;
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
    const role = req.body?.role === 'user' || req.body?.role === 'assistant' ? req.body.role : null;
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    const agentId = typeof req.body?.agentId === 'string' ? req.body.agentId.trim() : undefined;
    const messageOrder = typeof req.body?.messageOrder === 'number' ? req.body.messageOrder : 0;

    if (!userId) {
      console.warn('[VoiceController] logConversationMessage rejected: no userId');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user found',
      });
    }

    if (!sessionId || !role || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sessionId, role, and content are required',
      });
    }

    try {
      await postgresService.saveVoiceConversationLog({
        userId,
        sessionId,
        role,
        content,
        agentId: agentId || undefined,
        messageOrder,
      });
      console.log('[VoiceController] logConversationMessage saved', { userId, role, contentLen: content.length });
      return res.json({ success: true });
    } catch (error: any) {
      console.error('[VoiceController] logConversationMessage error:', error);
      return res.status(500).json({
        error: 'Failed to log message',
        message: error?.message || 'Unknown error',
      });
    }
  }
}

export const voiceController = new VoiceController();
