import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/ai.service';
import { postgresService } from '../services/postgres.service';
import { PERSONAS } from '../config/behaviors';

class ChatController {
  async streamMessage(req: AuthRequest, res: Response) {
    const { content, behaviorId } = req.body;
    const userId = req.userId || 'f08ffbd7-ccd6-4a2f-ae08-ed0e007d70fa';

    if (!content || !behaviorId) {
      res.status(400).json({ error: 'Content and behaviorId required' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendChunk = (text: string) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    };

    const onDone = (_fullText: string) => {
      res.write('data: [DONE]\n\n');
      res.end();
    };

    const onError = (err: Error) => {
      console.error('Chat stream error:', err);
      try {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (_) {
        // Response may already be closed
      }
    };

    try {
      const hasAnthropicKey =
        !!process.env.ANTHROPIC_API_KEY &&
        process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';

      if (hasAnthropicKey && process.env.AI_PROVIDER !== 'nvidia') {
        await aiService.streamMessageWithAnthropic(
          userId,
          content,
          behaviorId,
          sendChunk,
          onDone,
          onError
        );
      } else {
        // Non-Anthropic fallback: emit whole response as a single chunk
        const response = await aiService.sendMessage(userId, content, behaviorId);
        sendChunk(response.content);
        onDone(response.content);
      }
    } catch (err: any) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { content, behaviorId } = req.body;
      const userId = req.userId || 'f08ffbd7-ccd6-4a2f-ae08-ed0e007d70fa'; // test@example.com

      if (!content || !behaviorId) {
        return res.status(400).json({ error: 'Content and behaviorId required' });
      }

      const response = await aiService.sendMessage(userId, content, behaviorId);

      res.json(response);
    } catch (error) {
      console.error('SendMessage Error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  async getChatHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await postgresService.getChatHistory(userId, limit);

      res.json(history);
    } catch (error) {
      console.error('GetChatHistory Error:', error);
      res.status(500).json({ error: 'Failed to get chat history' });
    }
  }

  async switchBehavior(req: AuthRequest, res: Response) {
    try {
      const { behaviorId } = req.body;
      const userId = req.userId!;

      if (!behaviorId) {
        return res.status(400).json({ error: 'behaviorId required' });
      }

      // For now, just return success - behavior switching will be handled by AI
      // In the future, we can track this in user preferences
      res.json({ success: true });
    } catch (error) {
      console.error('SwitchBehavior Error:', error);
      res.status(500).json({ error: 'Failed to switch behavior' });
    }
  }

  async getCurrentBehavior(req: AuthRequest, res: Response) {
    try {
      // For now, always return free-form-chat as the default
      // In the agentic system, behavior is determined dynamically
      res.json({ behaviorId: 'free-form-chat' });
    } catch (error) {
      console.error('GetCurrentBehavior Error:', error);
      res.status(500).json({ error: 'Failed to get current behavior' });
    }
  }

  async getPersonas(_req: AuthRequest, res: Response) {
    try {
      res.json(PERSONAS);
    } catch (error) {
      console.error('GetPersonas Error:', error);
      res.status(500).json({ error: 'Failed to get personas' });
    }
  }
}

export const chatController = new ChatController();
