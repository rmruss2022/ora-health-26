import { postgresService } from './postgres.service';
import { activitiesService } from './activities.service';

// Tool definitions for Claude with proper typing
export const aiTools = [
  {
    name: 'get_user_summaries',
    description: `Get summaries about the user to understand their personality, goals, patterns, and preferences.
This provides context about who the user is and what they're working on.
Summary types: 'personality', 'goals', 'patterns', 'preferences'`,
    input_schema: {
      type: 'object' as const,
      properties: {
        summary_type: {
          type: 'string' as const,
          description:
            "Optional: Filter by summary type ('personality', 'goals', 'patterns', 'preferences')",
        },
      },
    },
  },
  {
    name: 'get_recent_journal_entries',
    description: `Get the user's recent journal entries to understand their recent thoughts, experiences, and emotional state.
Use this to provide personalized responses based on what they've been journaling about.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number' as const,
          description: 'Number of entries to retrieve (default: 5, max: 20)',
        },
      },
    },
  },
  {
    name: 'search_journal_entries',
    description: `Search through the user's journal entries for specific topics or keywords.
Use this to find relevant past entries when the user asks about their history or patterns.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string' as const,
          description: 'Search query (keywords or phrases to find)',
        },
        limit: {
          type: 'number' as const,
          description: 'Maximum number of results (default: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_conversation_history',
    description: `Get recent conversation history to understand the context of the current discussion.
Use this sparingly as recent context is usually provided automatically.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number' as const,
          description: 'Number of messages to retrieve (default: 20)',
        },
      },
    },
  },
  {
    name: 'save_user_insight',
    description: `Save a new insight or summary about the user based on the conversation.
Use this to remember important details about the user's personality, goals, patterns, or preferences.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        summary_type: {
          type: 'string' as const,
          enum: ['personality', 'goals', 'patterns', 'preferences'] as const,
          description: 'Type of summary to save',
        },
        summary_text: {
          type: 'string' as const,
          description: 'The insight or summary to save',
        },
        confidence: {
          type: 'number' as const,
          description: 'Confidence level (0.0-1.0)',
        },
      },
      required: ['summary_type', 'summary_text'],
    },
  },
  {
    name: 'get_available_activities',
    description: `Get ALL available activities, exercises, and practices the user can do.
This is your COMPLETE INDEX of everything available to the user. Use this whenever user asks:
- "What can I do?"
- "What exercises are available?"
- "Help me with [stress/anxiety/planning/etc]"
- Or shows signs of needing support

Categories returned:
- 'meditation': Guided audio practices (3-15 min) - breathwork, sleep, anxiety relief, loving-kindness
- 'conversation': Talk through challenges with AI (10-25 min) - emotion processing, boundaries, self-compassion, cognitive reframing
- 'planning': Set intentions and goals (15-20 min) - weekly planning, goal setting
- 'reflection': Process patterns (10-25 min) - weekly review, gratitude, values clarification, inner child work
- 'quick-practice': Fast exercises (5 min) - energy check-ins

Each activity includes: name, category, duration, description, whenToUse, and triggers.
Use this to recommend specific activities based on user's current state and needs.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string' as const,
          enum: ['meditation', 'conversation', 'planning', 'reflection', 'quick-practice'] as const,
          description: 'Optional: Filter by category',
        },
      },
    },
  },
  {
    name: 'search_activities',
    description: `Search activities by keywords or emotional state (e.g., "stress", "sleep", "boundaries", "plan").
Use this when user describes how they're feeling or what they need help with.
Returns matching activities with suggestions.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string' as const,
          description: 'Search query (emotional state, need, or topic)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_user_progress',
    description: `Get user's progress check-ins and mood entries to understand how they've been feeling.
Use this when user asks about their mood, feelings, or progress over time.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        days: {
          type: 'number' as const,
          description: 'Number of days to look back (default: 7)',
        },
      },
    },
  },
  {
    name: 'get_user_letters',
    description: `Get user's letters (AI-generated reflections and messages sent to them).
Use this when user asks about their letters, messages, or what we've sent them.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number' as const,
          description: 'Number of letters to retrieve (default: 10)',
        },
        days: {
          type: 'number' as const,
          description: 'Only show letters from last N days (optional)',
        },
      },
    },
  },
  {
    name: 'get_meditation_sessions',
    description: `Get user's meditation practice history to see what they've been practicing.
Use this when user asks about their meditation, practice, or mindfulness habits.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        days: {
          type: 'number' as const,
          description: 'Number of days to look back (default: 7)',
        },
      },
    },
  },
  {
    name: 'get_inbox_messages',
    description: `Get user's inbox prompts and reflections that need response.
Use this when user asks about prompts, questions, or things to respond to.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        unread_only: {
          type: 'boolean' as const,
          description: 'Only show unread messages (default: false)',
        },
      },
    },
  },
  {
    name: 'save_weekly_plan',
    description: `Save user's weekly plan including goals, intentions, and focus areas.
Use this when user wants to plan their week or set weekly goals.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        week_start: {
          type: 'string' as const,
          description: 'Start date of the week (YYYY-MM-DD format)',
        },
        goals: {
          type: 'array' as const,
          description: 'Weekly goals/intentions',
          items: {
            type: 'string' as const,
          },
        },
        focus_areas: {
          type: 'array' as const,
          description: 'Key focus areas for the week',
          items: {
            type: 'string' as const,
          },
        },
        notes: {
          type: 'string' as const,
          description: 'Additional notes or context',
        },
      },
      required: ['week_start', 'goals'],
    },
  },
  {
    name: 'get_weekly_plan',
    description: `Get user's weekly plan for a specific week or the current week.
Use this when user asks about their plan, goals, or what they wanted to focus on.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        week_start: {
          type: 'string' as const,
          description: 'Start date of the week (YYYY-MM-DD). If not provided, gets current week.',
        },
      },
    },
  },
  {
    name: 'save_weekly_review',
    description: `Save user's weekly review including what went well, challenges, and learnings.
Use this when user wants to reflect on their week or do a weekly review.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        week_start: {
          type: 'string' as const,
          description: 'Start date of the week being reviewed (YYYY-MM-DD)',
        },
        highlights: {
          type: 'array' as const,
          description: 'What went well this week',
          items: {
            type: 'string' as const,
          },
        },
        challenges: {
          type: 'array' as const,
          description: 'Challenges or difficulties',
          items: {
            type: 'string' as const,
          },
        },
        learnings: {
          type: 'array' as const,
          description: 'Key learnings or insights',
          items: {
            type: 'string' as const,
          },
        },
        overall_rating: {
          type: 'number' as const,
          description: 'Overall week rating (1-10)',
        },
        notes: {
          type: 'string' as const,
          description: 'Additional reflection notes',
        },
      },
      required: ['week_start'],
    },
  },
  {
    name: 'get_weekly_review',
    description: `Get user's weekly review for a specific week.
Use this when user asks about how their week went or wants to see past reviews.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        week_start: {
          type: 'string' as const,
          description: 'Start date of the week (YYYY-MM-DD). If not provided, gets current week.',
        },
        last_n_weeks: {
          type: 'number' as const,
          description: 'Get reviews for last N weeks (alternative to specific date)',
        },
      },
    },
  },
];

// Tool execution handlers
export class AIToolsService {
  async executeTool(
    toolName: string,
    toolInput: any,
    userId: string
  ): Promise<any> {
    switch (toolName) {
      case 'get_user_summaries':
        return this.getUserSummaries(userId, toolInput.summary_type);

      case 'get_recent_journal_entries':
        return this.getRecentJournalEntries(
          userId,
          toolInput.limit || 5
        );

      case 'search_journal_entries':
        return this.searchJournalEntries(
          userId,
          toolInput.query,
          toolInput.limit || 10
        );

      case 'get_conversation_history':
        return this.getConversationHistory(userId, toolInput.limit || 20);

      case 'save_user_insight':
        return this.saveUserInsight(
          userId,
          toolInput.summary_type,
          toolInput.summary_text,
          toolInput.confidence || 0.7
        );

      case 'get_available_activities':
        return this.getAvailableActivities(toolInput.category);

      case 'search_activities':
        return this.searchActivities(toolInput.query);

      case 'get_user_progress':
        return this.getUserProgress(userId, toolInput.days || 7);

      case 'get_user_letters':
        return this.getUserLetters(userId, toolInput.limit || 10, toolInput.days);

      case 'get_meditation_sessions':
        return this.getMeditationSessions(userId, toolInput.days || 7);

      case 'get_inbox_messages':
        return this.getInboxMessages(userId, toolInput.unread_only || false);

      case 'save_weekly_plan':
        return this.saveWeeklyPlan(userId, toolInput);

      case 'get_weekly_plan':
        return this.getWeeklyPlan(userId, toolInput.week_start);

      case 'save_weekly_review':
        return this.saveWeeklyReview(userId, toolInput);

      case 'get_weekly_review':
        return this.getWeeklyReview(userId, toolInput.week_start, toolInput.last_n_weeks);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async getUserSummaries(
    userId: string,
    summaryType?: string
  ): Promise<any> {
    const summaries = await postgresService.getUserSummaries(
      userId,
      summaryType
    );

    if (summaries.length === 0) {
      return {
        found: false,
        message: 'No summaries found for this user yet.',
      };
    }

    return {
      found: true,
      summaries: summaries.map((s) => ({
        type: s.summary_type,
        content: s.summary_text,
        confidence: s.confidence_score,
        last_updated: s.updated_at,
      })),
    };
  }

  private async getRecentJournalEntries(
    userId: string,
    limit: number
  ): Promise<any> {
    const entries = await postgresService.getJournalEntries(
      userId,
      Math.min(limit, 20)
    );

    if (entries.length === 0) {
      return {
        found: false,
        message: 'No journal entries found for this user yet.',
      };
    }

    return {
      found: true,
      entries: entries.map((e) => ({
        id: e.id,
        content: e.content,
        mood: e.mood,
        tags: e.tags,
        created_at: e.created_at,
        behavior_context: e.behavior_context,
      })),
    };
  }

  private async searchJournalEntries(
    userId: string,
    query: string,
    limit: number
  ): Promise<any> {
    const entries = await postgresService.searchJournalEntries(
      userId,
      query,
      Math.min(limit, 20)
    );

    if (entries.length === 0) {
      return {
        found: false,
        message: `No journal entries found matching "${query}".`,
      };
    }

    return {
      found: true,
      query: query,
      entries: entries.map((e) => ({
        id: e.id,
        content: e.content,
        mood: e.mood,
        created_at: e.created_at,
      })),
    };
  }

  private async getConversationHistory(
    userId: string,
    limit: number
  ): Promise<any> {
    const messages = await postgresService.getChatHistory(
      userId,
      Math.min(limit, 50)
    );

    return {
      found: true,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        behavior_id: m.behavior_id,
        created_at: m.created_at,
      })),
    };
  }

  private async saveUserInsight(
    userId: string,
    summaryType: string,
    summaryText: string,
    confidence: number
  ): Promise<any> {
    // Check if summary already exists
    const existing = await postgresService.getUserSummaries(
      userId,
      summaryType
    );

    if (existing.length > 0) {
      // Update existing
      await postgresService.updateUserSummary(
        userId,
        summaryType,
        summaryText,
        confidence
      );
      return {
        success: true,
        action: 'updated',
        message: `Updated ${summaryType} summary`,
      };
    } else {
      // Create new
      await postgresService.createUserSummary({
        userId,
        summaryType,
        summaryText,
        confidenceScore: confidence,
      });
      return {
        success: true,
        action: 'created',
        message: `Created new ${summaryType} summary`,
      };
    }
  }

  private async getAvailableActivities(category?: string): Promise<any> {
    try {
      const result = await activitiesService.getAllActivities(category);
      return result;
    } catch (error: any) {
      return {
        found: false,
        error: error.message,
      };
    }
  }

  private async searchActivities(query: string): Promise<any> {
    try {
      const result = await activitiesService.searchActivities(query);
      return result;
    } catch (error: any) {
      return {
        found: false,
        error: error.message,
      };
    }
  }

  private async getUserProgress(userId: string, days: number): Promise<any> {
    const { query } = await import('../config/database');
    const result = await query(
      `SELECT check_in_date, mood, notes, created_at
       FROM user_progress
       WHERE user_id = $1 AND check_in_date >= CURRENT_DATE - $2
       ORDER BY check_in_date DESC`,
      [userId, days]
    );

    return {
      entries: result.rows.length,
      progress: result.rows.map((row: any) => ({
        date: row.check_in_date,
        mood: row.mood,
        notes: row.notes,
        timestamp: row.created_at,
      })),
    };
  }

  private async getUserLetters(userId: string, limit: number, days?: number): Promise<any> {
    const { query } = await import('../config/database');
    let queryText = `
      SELECT subject, body, sent_at, read_at, metadata
      FROM letters
      WHERE recipient_id = $1
    `;
    const params: any[] = [userId];

    if (days) {
      queryText += ` AND sent_at >= CURRENT_DATE - $2`;
      params.push(days);
      queryText += ` ORDER BY sent_at DESC LIMIT $3`;
      params.push(limit);
    } else {
      queryText += ` ORDER BY sent_at DESC LIMIT $2`;
      params.push(limit);
    }

    const result = await query(queryText, params);

    return {
      count: result.rows.length,
      letters: result.rows.map((row: any) => ({
        subject: row.subject,
        body: row.body,
        sentAt: row.sent_at,
        read: !!row.read_at,
        mood: row.metadata?.mood,
      })),
    };
  }

  private async getMeditationSessions(userId: string, days: number): Promise<any> {
    const { query } = await import('../config/database');
    const result = await query(
      `SELECT ms.started_at, ms.completed_at, ms.duration_completed, m.title, m.category
       FROM meditation_sessions ms
       JOIN meditations m ON ms.meditation_id = m.id
       WHERE ms.user_id = $1 AND ms.started_at >= CURRENT_DATE - $2
       ORDER BY ms.started_at DESC`,
      [userId, days]
    );

    const completed = result.rows.filter((r: any) => r.completed_at).length;
    const totalMinutes = result.rows.reduce((sum: number, r: any) => sum + (r.duration_completed || 0), 0);

    return {
      sessions: result.rows.length,
      completed,
      incomplete: result.rows.length - completed,
      totalMinutes,
      practices: result.rows.map((row: any) => ({
        title: row.title,
        category: row.category,
        startedAt: row.started_at,
        completed: !!row.completed_at,
        duration: row.duration_completed,
      })),
    };
  }

  private async getInboxMessages(userId: string, unreadOnly: boolean): Promise<any> {
    const { query } = await import('../config/database');
    let queryText = `
      SELECT id, message_type, subject, content, is_read, created_at, metadata
      FROM inbox_messages
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (unreadOnly) {
      queryText += ` AND is_read = false`;
    }

    queryText += ` ORDER BY created_at DESC LIMIT 20`;

    const result = await query(queryText, params);

    // Check for responses
    const messageIds = result.rows.map((r: any) => r.id);
    let responses: any = { rows: [] };
    if (messageIds.length > 0) {
      responses = await query(
        `SELECT message_id, response_text, created_at
         FROM inbox_message_responses
         WHERE message_id = ANY($1)`,
        [messageIds]
      );
    }

    const responseMap = new Map();
    responses.rows.forEach((r: any) => {
      responseMap.set(r.message_id, {
        text: r.response_text,
        createdAt: r.created_at,
      });
    });

    return {
      messages: result.rows.length,
      unread: result.rows.filter((r: any) => !r.is_read).length,
      prompts: result.rows.map((row: any) => ({
        id: row.id,
        type: row.message_type,
        subject: row.subject,
        content: row.content,
        read: row.is_read,
        createdAt: row.created_at,
        response: responseMap.get(row.id) || null,
      })),
    };
  }

  private async saveWeeklyPlan(userId: string, data: any): Promise<any> {
    const { query } = await import('../config/database');
    
    // Store as a special type of inbox message or user summary
    await query(
      `INSERT INTO inbox_messages (id, user_id, message_type, subject, content, metadata, is_read, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      [
        userId,
        'weekly-plan',
        `Weekly Plan - Week of ${data.week_start}`,
        `Goals: ${data.goals.join(', ')}${data.notes ? '\n\nNotes: ' + data.notes : ''}`,
        JSON.stringify({
          week_start: data.week_start,
          goals: data.goals,
          focus_areas: data.focus_areas || [],
        }),
        true,
      ]
    );

    return {
      success: true,
      message: 'Weekly plan saved',
      week_start: data.week_start,
      goals_count: data.goals.length,
    };
  }

  private async getWeeklyPlan(userId: string, weekStart?: string): Promise<any> {
    const { query } = await import('../config/database');
    
    // If no week specified, get current week (Monday)
    let targetWeek = weekStart;
    if (!targetWeek) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      const monday = new Date(today.setDate(diff));
      targetWeek = monday.toISOString().split('T')[0];
    }

    const result = await query(
      `SELECT subject, content, metadata, created_at
       FROM inbox_messages
       WHERE user_id = $1 AND message_type = 'weekly-plan'
       AND metadata->>'week_start' = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, targetWeek]
    );

    if (result.rows.length === 0) {
      return {
        found: false,
        message: `No weekly plan found for week of ${targetWeek}`,
      };
    }

    const plan = result.rows[0];
    return {
      found: true,
      week_start: plan.metadata.week_start,
      goals: plan.metadata.goals || [],
      focus_areas: plan.metadata.focus_areas || [],
      created_at: plan.created_at,
    };
  }

  private async saveWeeklyReview(userId: string, data: any): Promise<any> {
    const { query } = await import('../config/database');
    
    await query(
      `INSERT INTO inbox_messages (id, user_id, message_type, subject, content, metadata, is_read, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())`,
      [
        userId,
        'weekly-review',
        `Weekly Review - Week of ${data.week_start}`,
        `Rating: ${data.overall_rating || 'N/A'}/10\n\nHighlights:\n${(data.highlights || []).map((h: string) => '• ' + h).join('\n')}`,
        JSON.stringify({
          week_start: data.week_start,
          highlights: data.highlights || [],
          challenges: data.challenges || [],
          learnings: data.learnings || [],
          overall_rating: data.overall_rating,
          notes: data.notes,
        }),
        true,
      ]
    );

    return {
      success: true,
      message: 'Weekly review saved',
      week_start: data.week_start,
      rating: data.overall_rating,
    };
  }

  private async getWeeklyReview(userId: string, weekStart?: string, lastNWeeks?: number): Promise<any> {
    const { query } = await import('../config/database');
    
    let queryText = `
      SELECT subject, content, metadata, created_at
      FROM inbox_messages
      WHERE user_id = $1 AND message_type = 'weekly-review'
    `;
    const params: any[] = [userId];

    if (weekStart) {
      queryText += ` AND metadata->>'week_start' = $2 ORDER BY created_at DESC LIMIT 1`;
      params.push(weekStart);
    } else if (lastNWeeks) {
      queryText += ` ORDER BY created_at DESC LIMIT $2`;
      params.push(lastNWeeks);
    } else {
      // Get current week
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const targetWeek = monday.toISOString().split('T')[0];
      queryText += ` AND metadata->>'week_start' = $2 ORDER BY created_at DESC LIMIT 1`;
      params.push(targetWeek);
    }

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return {
        found: false,
        message: lastNWeeks 
          ? `No weekly reviews found for last ${lastNWeeks} weeks`
          : `No weekly review found for week of ${weekStart || 'current week'}`,
      };
    }

    if (lastNWeeks) {
      return {
        found: true,
        count: result.rows.length,
        reviews: result.rows.map((r: any) => ({
          week_start: r.metadata.week_start,
          rating: r.metadata.overall_rating,
          highlights: r.metadata.highlights || [],
          challenges: r.metadata.challenges || [],
          learnings: r.metadata.learnings || [],
          notes: r.metadata.notes,
          created_at: r.created_at,
        })),
      };
    }

    const review = result.rows[0];
    return {
      found: true,
      week_start: review.metadata.week_start,
      rating: review.metadata.overall_rating,
      highlights: review.metadata.highlights || [],
      challenges: review.metadata.challenges || [],
      learnings: review.metadata.learnings || [],
      notes: review.metadata.notes,
      created_at: review.created_at,
    };
  }
}

export const aiToolsService = new AIToolsService();
