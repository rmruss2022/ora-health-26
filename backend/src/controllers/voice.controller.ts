import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { profileService } from '../services/profile.service';

interface ConversationTokenResponse {
  token: string;
}

type AllowedToolName =
  | 'get_user_profile'
  | 'update_user_profile'
  | 'get_user_recommendations';

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
      const elevenResponse = await fetch(tokenUrl, {
        method: 'GET',
        headers: {
          'xi-api-key': elevenApiKey,
        },
      });

      if (!elevenResponse.ok) {
        const errText = await elevenResponse.text().catch(() => '');
        return res.status(502).json({
          error: 'Failed to create conversation token',
          message: `ElevenLabs responded ${elevenResponse.status}: ${errText}`,
        });
      }

      const body = (await elevenResponse.json()) as ConversationTokenResponse;
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
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user found',
      });
    }

    const toolName = String(req.body?.toolName || '').trim() as AllowedToolName;
    const args = req.body?.args ?? {};

    const allowedTools: AllowedToolName[] = [
      'get_user_profile',
      'update_user_profile',
      'get_user_recommendations',
    ];

    if (!allowedTools.includes(toolName)) {
      return res.status(400).json({
        error: 'Unsupported tool',
        message: `Tool "${toolName}" is not allowed`,
      });
    }

    try {
      switch (toolName) {
        case 'get_user_profile': {
          const profile = await profileService.getUserProfile(userId);
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
    } catch (error: any) {
      console.error('[VoiceController] executeToolCall error:', error);
      return res.status(500).json({
        error: 'Tool execution failed',
        message: error?.message || 'Unknown error',
      });
    }
  }
}

export const voiceController = new VoiceController();
