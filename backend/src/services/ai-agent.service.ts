// AI Agent Service
// Handles AI agent personality-based interactions with users

import { query } from '../config/database';
import { AGENT_PERSONALITIES, getAgentById, getAgentForContext, getRandomAgent } from '../config/agent-personalities';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface UserContext {
  userId: string;
  recentMeditations?: Array<{
    duration: number;
    type: string;
    completedAt: Date;
  }>;
  moodHistory?: Array<{
    mood: string;
    energyLevel: number;
    trackedAt: Date;
  }>;
  streakDays?: number;
  totalSessions?: number;
}

export class AIAgentService {
  /**
   * Generate a personalized comment from an AI agent
   */
  async generateAgentComment(params: {
    postId: string;
    postContent: string;
    postAuthor?: string;
    postCategory?: string;
    agentId?: string;
    userContext?: UserContext;
  }): Promise<{ agentId: string; comment: string; agentName: string; agentAvatar: string }> {
    const { postId, postContent, postCategory, userContext } = params;

    // Select appropriate agent
    let agent;
    if (params.agentId) {
      agent = getAgentById(params.agentId);
    } else {
      // Choose agent based on category or context
      agent = getAgentForContext({
        activityType: postCategory,
      });
    }

    if (!agent) {
      agent = getRandomAgent();
    }

    // Build context for AI
    const contextStr = this.buildUserContextString(userContext);

    // Generate comment using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are ${agent.name}, ${agent.role} in a mindfulness and meditation community.

Your personality traits: ${agent.traits.join(', ')}
Your speaking style: ${agent.voice.tone}. ${agent.voice.style}
Your specialties: ${agent.specialties.join(', ')}

A community member posted:
"${postContent}"

${contextStr}

Generate a warm, authentic comment (2-3 sentences max) that:
- Feels like ${agent.name} would say it (use your unique voice)
- Validates or encourages the person
- Is specific to what they shared
- Avoids generic praise
- Uses natural, conversational language

Comment:`;

    try {
      const result = await model.generateContent(prompt);
      const comment = result.response.text().trim();

      // Store interaction
      await this.recordInteraction({
        agentId: agent.id,
        userId: userContext?.userId || 'unknown',
        interactionType: 'comment',
        postId,
        content: comment,
      });

      return {
        agentId: agent.id,
        comment,
        agentName: agent.name,
        agentAvatar: agent.avatar,
      };
    } catch (error) {
      console.error('Error generating agent comment:', error);
      // Fallback to template-based response
      return {
        agentId: agent.id,
        comment: this.generateFallbackComment(agent.id, postContent),
        agentName: agent.name,
        agentAvatar: agent.avatar,
      };
    }
  }

  /**
   * Generate a community post from an AI agent
   */
  async generateAgentPost(params: {
    agentId?: string;
    category: string;
    promptText?: string;
    userContext?: UserContext;
  }): Promise<{ agentId: string; content: string; agentName: string; agentAvatar: string }> {
    const { category, promptText, userContext } = params;

    // Select agent
    let agent;
    if (params.agentId) {
      agent = getAgentById(params.agentId);
    } else {
      agent = getAgentForContext({ activityType: category });
    }

    if (!agent) {
      agent = getRandomAgent();
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const contextStr = this.buildUserContextString(userContext);

    let prompt;
    if (promptText) {
      // Responding to a prompt
      prompt = `You are ${agent.name}, ${agent.role} in a mindfulness community.

Your personality: ${agent.traits.join(', ')}
Your voice: ${agent.voice.tone}. ${agent.voice.style}

The community prompt is: "${promptText}"

${contextStr}

Share a brief, authentic response (2-3 sentences) that:
- Sounds like ${agent.name}
- Is personal and specific
- Might inspire others
- Uses natural language

Response:`;
    } else {
      // General encouragement post
      prompt = `You are ${agent.name}, ${agent.role} in a mindfulness community.

Your personality: ${agent.traits.join(', ')}
Your voice: ${agent.voice.tone}. ${agent.voice.style}

Create a brief post (2-3 sentences) to encourage the community:
- Something timely and relevant
- Authentic to your voice
- Actionable or thought-provoking
- Not preachy

Post:`;
    }

    try {
      const result = await model.generateContent(prompt);
      const content = result.response.text().trim();

      return {
        agentId: agent.id,
        content,
        agentName: agent.name,
        agentAvatar: agent.avatar,
      };
    } catch (error) {
      console.error('Error generating agent post:', error);
      return {
        agentId: agent.id,
        content: this.generateFallbackPost(agent.id),
        agentName: agent.name,
        agentAvatar: agent.avatar,
      };
    }
  }

  /**
   * Get user context for personalization
   */
  async getUserContext(userId: string): Promise<UserContext> {
    try {
      // Get recent meditations
      const meditationQuery = `
        SELECT duration_minutes, completed_at
        FROM user_meditation_history
        WHERE user_id = $1
        ORDER BY completed_at DESC
        LIMIT 5
      `;
      const meditations = await query(meditationQuery, [userId]);

      // Get recent moods
      const moodQuery = `
        SELECT mood, energy_level, tracked_at
        FROM user_mood_tracking
        WHERE user_id = $1
        ORDER BY tracked_at DESC
        LIMIT 5
      `;
      const moods = await query(moodQuery, [userId]);

      // Calculate streak (simplified)
      const streakQuery = `
        SELECT COUNT(DISTINCT DATE(completed_at)) as streak
        FROM user_meditation_history
        WHERE user_id = $1
        AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
      `;
      const streak = await query(streakQuery, [userId]);

      return {
        userId,
        recentMeditations: meditations.rows.map((r: any) => ({
          duration: r.duration_minutes,
          type: 'meditation',
          completedAt: r.completed_at,
        })),
        moodHistory: moods.rows.map((r: any) => ({
          mood: r.mood,
          energyLevel: r.energy_level,
          trackedAt: r.tracked_at,
        })),
        streakDays: streak.rows[0]?.streak || 0,
        totalSessions: meditations.rows.length,
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return { userId };
    }
  }

  /**
   * Record agent interaction for tracking
   */
  private async recordInteraction(params: {
    agentId: string;
    userId: string;
    interactionType: string;
    postId?: string;
    commentId?: string;
    content?: string;
  }) {
    try {
      const insertQuery = `
        INSERT INTO agent_user_interactions
        (agent_id, user_id, interaction_type, post_id, comment_id, content)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await query(insertQuery, [
        params.agentId,
        params.userId,
        params.interactionType,
        params.postId || null,
        params.commentId || null,
        params.content || null,
      ]);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  /**
   * Build user context string for AI prompts
   */
  private buildUserContextString(userContext?: UserContext): string {
    if (!userContext) return '';

    const parts: string[] = [];

    if (userContext.streakDays && userContext.streakDays > 0) {
      parts.push(`They have meditated ${userContext.streakDays} days this week.`);
    }

    if (userContext.recentMeditations && userContext.recentMeditations.length > 0) {
      const lastSession = userContext.recentMeditations[0];
      parts.push(`Their last session was ${lastSession.duration} minutes.`);
    }

    if (userContext.moodHistory && userContext.moodHistory.length > 0) {
      const recentMood = userContext.moodHistory[0];
      parts.push(`Recent mood: ${recentMood.mood}.`);
    }

    return parts.length > 0 ? `Context about this person:\n${parts.join(' ')}` : '';
  }

  /**
   * Fallback comment templates
   */
  private generateFallbackComment(agentId: string, postContent: string): string {
    const templates: Record<string, string[]> = {
      luna: [
        "This is beautiful. Thank you for sharing with such honesty.",
        "Your awareness here is really special. Keep nurturing this.",
        "I'm grateful you shared this. Small steps matter so much.",
      ],
      kai: [
        "YES! This is the energy. Keep that momentum going!",
        "Love seeing this progress. You're building something real.",
        "This is what consistency looks like. Keep crushing it!",
      ],
      sage: [
        "What you're noticing here—that's the practice at work.",
        "Beautiful insight. These patterns reveal so much.",
        "There's real wisdom in what you're sharing.",
      ],
      river: [
        "I love this! There's so much joy in these small discoveries.",
        "This is wonderful. Keep exploring and playing with it!",
        "Beautiful. The little moments are where the magic lives.",
      ],
      sol: [
        "I'm so proud of you for showing up like this.",
        "Your honesty here is so valuable. Thank you for being brave.",
        "This matters. You matter. Keep going.",
      ],
    };

    const options = templates[agentId] || templates.sol;
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Fallback post templates
   */
  private generateFallbackPost(agentId: string): string {
    const templates: Record<string, string[]> = {
      luna: [
        "Tonight, just one mindful breath before sleep. That's all you need.",
        "Your rest matters as much as your hustle. Let yourself soften.",
      ],
      kai: [
        "Morning energy check: Start with just 60 seconds of movement. Feel that shift?",
        "Your consistency this week? That's building real momentum. Keep showing up.",
      ],
      sage: [
        "Notice what you notice today. The practice is in the awareness.",
        "What if the goal isn't to fix anything—just to be present with what is?",
      ],
      river: [
        "Try this: Three deep breaths with a smile. Notice what changes.",
        "Your breath is always waiting to play. Let's explore together.",
      ],
      sol: [
        "Reminder: You're doing better than you think you are.",
        "Progress isn't always loud. Sometimes it's just showing up again.",
      ],
    };

    const options = templates[agentId] || templates.sol;
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Should an agent respond to this post?
   * (Simple logic to avoid over-commenting)
   */
  async shouldAgentRespond(postId: string): Promise<boolean> {
    try {
      // Check if agents have already commented
      const checkQuery = `
        SELECT COUNT(*) as agent_comments
        FROM post_comments
        WHERE post_id = $1 AND is_agent_comment = true
      `;
      const result = await query(checkQuery, [postId]);
      const agentComments = parseInt(result.rows[0]?.agent_comments || '0');

      // Only allow 1-2 agent comments per post
      return agentComments < 2;
    } catch (error) {
      console.error('Error checking agent response eligibility:', error);
      return false;
    }
  }
}

export const aiAgentService = new AIAgentService();
