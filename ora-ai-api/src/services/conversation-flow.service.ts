/**
 * Conversation Flow Engine
 * Manages goal-oriented 3-4 exchange flows with stages, exit conditions, and completion actions
 */

import { vectorSearchService } from './vector-search.service';
import OpenAI from 'openai';

interface FlowStage {
  id: string;
  name: string;
  agentPrompt: string; // System prompt for this stage
  userExpectation: string; // What we expect from user
  minExchanges?: number; // Minimum exchanges before moving to next stage
  maxExchanges?: number; // Maximum exchanges in this stage
}

interface ExitCondition {
  type: 'keyword' | 'sentiment' | 'exchange_count' | 'llm_eval' | 'user_signal';
  condition: string | number | ((context: FlowContext) => boolean);
  description: string;
}

interface CompletionAction {
  type: 'save_journal' | 'save_activity' | 'update_profile' | 'send_summary' | 'none';
  params?: any;
}

interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  stages: FlowStage[];
  exitConditions: ExitCondition[];
  completionAction: CompletionAction;
  targetExchangeCount: number; // Ideal number of exchanges (3-4)
  allowEarlyExit: boolean; // Can user exit before completion?
}

interface FlowContext {
  userId: string;
  sessionId: string;
  flowId: string;
  currentStage: number;
  stageStartedAt: Date;
  exchangeCount: number;
  conversationHistory: Array<{ role: 'user' | 'agent'; content: string; timestamp: Date }>;
  collectedData: { [key: string]: any }; // Data collected during flow
  flowStartedAt: Date;
}

interface FlowProgressResult {
  shouldContinue: boolean;
  nextStage?: number;
  shouldExit: boolean;
  exitReason?: string;
  completed: boolean;
  completionData?: any;
}

export class ConversationFlowService {
  private openai: OpenAI;
  private flowTemplates: Map<string, FlowTemplate>;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.flowTemplates = new Map();
    this.loadFlowTemplates();
  }

  /**
   * Load all flow templates
   */
  private loadFlowTemplates(): void {
    // Journal Prompt Flow
    this.registerFlowTemplate({
      id: 'journal-prompt',
      name: 'Journal Prompt',
      description: 'Guided journaling conversation with reflection',
      targetExchangeCount: 4,
      allowEarlyExit: true,
      stages: [
        {
          id: 'initial-prompt',
          name: 'Opening Prompt',
          agentPrompt: 'Start with an open-ended, warm journal prompt. Keep it simple and inviting.',
          userExpectation: 'User shares initial thoughts',
          minExchanges: 1,
          maxExchanges: 1,
        },
        {
          id: 'follow-up',
          name: 'Follow-up',
          agentPrompt: 'Ask a follow-up question based on what the user shared. Show genuine curiosity.',
          userExpectation: 'User elaborates on their thoughts',
          minExchanges: 1,
          maxExchanges: 1,
        },
        {
          id: 'deeper-exploration',
          name: 'Deeper Exploration',
          agentPrompt: 'Invite deeper reflection. Ask about feelings, patterns, or connections.',
          userExpectation: 'User explores deeper meaning',
          minExchanges: 1,
          maxExchanges: 2,
        },
        {
          id: 'reflection-closure',
          name: 'Reflection & Closure',
          agentPrompt: 'Acknowledge what was shared. Offer a reflection or insight. Prepare for closure.',
          userExpectation: 'User receives closure and feels heard',
          minExchanges: 1,
          maxExchanges: 1,
        },
      ],
      exitConditions: [
        {
          type: 'exchange_count',
          condition: 4,
          description: 'Completed 4 exchanges (natural flow completion)',
        },
        {
          type: 'user_signal',
          condition: 'done|finished|that\'s all|nothing else',
          description: 'User signals they are done',
        },
        {
          type: 'llm_eval',
          condition: 'conversation feels complete',
          description: 'LLM determines natural completion',
        },
      ],
      completionAction: {
        type: 'save_journal',
        params: { category: 'prompted_reflection' },
      },
    });

    // Guided Exercise Flow
    this.registerFlowTemplate({
      id: 'guided-exercise',
      name: 'Guided Exercise',
      description: 'Structured wellness exercise with steps and reflection',
      targetExchangeCount: 4,
      allowEarlyExit: false,
      stages: [
        {
          id: 'introduction',
          name: 'Introduction',
          agentPrompt: 'Introduce the exercise, explain what it involves, and get user buy-in.',
          userExpectation: 'User agrees to participate',
          minExchanges: 1,
          maxExchanges: 1,
        },
        {
          id: 'activity-step-1',
          name: 'Activity Step 1',
          agentPrompt: 'Guide user through first step of the exercise. Be clear and supportive.',
          userExpectation: 'User completes first step',
          minExchanges: 1,
          maxExchanges: 2,
        },
        {
          id: 'activity-step-2',
          name: 'Activity Step 2',
          agentPrompt: 'Guide user through second step. Build on what they did in step 1.',
          userExpectation: 'User completes second step',
          minExchanges: 1,
          maxExchanges: 2,
        },
        {
          id: 'reflection',
          name: 'Reflection',
          agentPrompt: 'Ask user to reflect on the exercise. What did they notice? How do they feel?',
          userExpectation: 'User reflects on experience',
          minExchanges: 1,
          maxExchanges: 1,
        },
      ],
      exitConditions: [
        {
          type: 'exchange_count',
          condition: 5,
          description: 'Completed exercise flow',
        },
        {
          type: 'user_signal',
          condition: 'stop|exit|skip',
          description: 'User wants to exit early',
        },
      ],
      completionAction: {
        type: 'save_activity',
        params: { activity_type: 'guided_exercise' },
      },
    });

    // Progress Analysis Flow
    this.registerFlowTemplate({
      id: 'progress-analysis',
      name: 'Progress Analysis',
      description: 'Review patterns and deliver insights',
      targetExchangeCount: 3,
      allowEarlyExit: true,
      stages: [
        {
          id: 'data-review',
          name: 'Data Review',
          agentPrompt: 'Present user with their recent activity patterns. Be specific with data.',
          userExpectation: 'User acknowledges and responds',
          minExchanges: 1,
          maxExchanges: 1,
        },
        {
          id: 'insights',
          name: 'Insights',
          agentPrompt: 'Share 2-3 insights or patterns you noticed. Be supportive and constructive.',
          userExpectation: 'User reflects on insights',
          minExchanges: 1,
          maxExchanges: 1,
        },
        {
          id: 'next-action',
          name: 'Next Action',
          agentPrompt: 'Suggest one concrete next step based on the analysis.',
          userExpectation: 'User considers next action',
          minExchanges: 1,
          maxExchanges: 1,
        },
      ],
      exitConditions: [
        {
          type: 'exchange_count',
          condition: 3,
          description: 'Completed progress analysis',
        },
      ],
      completionAction: {
        type: 'none',
      },
    });

    // Weekly Planning Flow
    this.registerFlowTemplate({
      id: 'weekly-planning',
      name: 'Weekly Planning',
      description: 'Set intentions and plan for the week ahead',
      targetExchangeCount: 4,
      allowEarlyExit: true,
      stages: [
        {
          id: 'check-in',
          name: 'Energy Check-in',
          agentPrompt: 'Ask about user\'s current energy and commitments for the week.',
          userExpectation: 'User shares their state and schedule',
          minExchanges: 1,
          maxExchanges: 1,
        },
        {
          id: 'intentions',
          name: 'Set Intentions',
          agentPrompt: 'Help user set 3-5 intentions for the week. Be realistic and supportive.',
          userExpectation: 'User defines intentions',
          minExchanges: 1,
          maxExchanges: 2,
        },
        {
          id: 'obstacles',
          name: 'Anticipate Obstacles',
          agentPrompt: 'Ask what might get in the way and help plan around it.',
          userExpectation: 'User identifies potential challenges',
          minExchanges: 1,
          maxExchanges: 1,
        },
        {
          id: 'confirmation',
          name: 'Confirm Plan',
          agentPrompt: 'Summarize the plan and offer encouragement.',
          userExpectation: 'User feels prepared',
          minExchanges: 1,
          maxExchanges: 1,
        },
      ],
      exitConditions: [
        {
          type: 'exchange_count',
          condition: 4,
          description: 'Completed planning flow',
        },
      ],
      completionAction: {
        type: 'save_activity',
        params: { activity_type: 'weekly_plan' },
      },
    });
  }

  /**
   * Register a new flow template
   */
  registerFlowTemplate(template: FlowTemplate): void {
    this.flowTemplates.set(template.id, template);
  }

  /**
   * Start a new flow for a user
   */
  async startFlow(
    userId: string,
    sessionId: string,
    flowId: string
  ): Promise<FlowContext> {
    const template = this.flowTemplates.get(flowId);
    if (!template) {
      throw new Error(`Flow template not found: ${flowId}`);
    }

    const context: FlowContext = {
      userId,
      sessionId,
      flowId,
      currentStage: 0,
      stageStartedAt: new Date(),
      exchangeCount: 0,
      conversationHistory: [],
      collectedData: {},
      flowStartedAt: new Date(),
    };

    // Store flow context in database
    await this.storeFlowContext(context);

    return context;
  }

  /**
   * Progress the flow based on user input
   */
  async progressFlow(
    context: FlowContext,
    userMessage: string,
    agentMessage: string
  ): Promise<FlowProgressResult> {
    const template = this.flowTemplates.get(context.flowId);
    if (!template) {
      throw new Error(`Flow template not found: ${context.flowId}`);
    }

    // Add to conversation history
    context.conversationHistory.push(
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'agent', content: agentMessage, timestamp: new Date() }
    );
    context.exchangeCount++;

    // Check exit conditions
    const exitEval = await this.evaluateExitConditions(context, template);
    if (exitEval.shouldExit) {
      const completionData = await this.executeCompletionAction(
        context,
        template.completionAction
      );

      await this.completeFlow(context);

      return {
        shouldContinue: false,
        shouldExit: true,
        exitReason: exitEval.reason,
        completed: true,
        completionData,
      };
    }

    // Check if we should progress to next stage
    const currentStage = template.stages[context.currentStage];
    const stageExchangeCount = context.conversationHistory.filter(
      (msg, index) => index >= context.conversationHistory.length - (context.exchangeCount * 2)
    ).length / 2;

    let shouldAdvanceStage = false;
    
    // Check minimum exchanges met
    if (currentStage.minExchanges && stageExchangeCount >= currentStage.minExchanges) {
      // Use LLM to evaluate if stage objectives are met
      const stageComplete = await this.evaluateStageCompletion(context, currentStage);
      shouldAdvanceStage = stageComplete;
    }

    // Check maximum exchanges (force progression)
    if (currentStage.maxExchanges && stageExchangeCount >= currentStage.maxExchanges) {
      shouldAdvanceStage = true;
    }

    if (shouldAdvanceStage && context.currentStage < template.stages.length - 1) {
      context.currentStage++;
      context.stageStartedAt = new Date();
      await this.updateFlowContext(context);

      return {
        shouldContinue: true,
        nextStage: context.currentStage,
        shouldExit: false,
        completed: false,
      };
    }

    // Update context
    await this.updateFlowContext(context);

    return {
      shouldContinue: true,
      shouldExit: false,
      completed: false,
    };
  }

  /**
   * Evaluate if exit conditions are met
   */
  private async evaluateExitConditions(
    context: FlowContext,
    template: FlowTemplate
  ): Promise<{ shouldExit: boolean; reason?: string }> {
    for (const exitCondition of template.exitConditions) {
      switch (exitCondition.type) {
        case 'exchange_count':
          if (context.exchangeCount >= (exitCondition.condition as number)) {
            return { shouldExit: true, reason: 'Target exchange count reached' };
          }
          break;

        case 'user_signal':
          const lastUserMessage = context.conversationHistory
            .slice()
            .reverse()
            .find(msg => msg.role === 'user');
          
          if (lastUserMessage) {
            const pattern = new RegExp(exitCondition.condition as string, 'i');
            if (pattern.test(lastUserMessage.content)) {
              return { shouldExit: true, reason: 'User signaled completion' };
            }
          }
          break;

        case 'llm_eval':
          const llmEval = await this.evaluateCompletionWithLLM(context, template);
          if (llmEval) {
            return { shouldExit: true, reason: 'LLM determined natural completion' };
          }
          break;
      }
    }

    return { shouldExit: false };
  }

  /**
   * Evaluate if current stage is complete using LLM
   */
  private async evaluateStageCompletion(
    context: FlowContext,
    stage: FlowStage
  ): Promise<boolean> {
    try {
      const recentHistory = context.conversationHistory.slice(-4); // Last 2 exchanges

      const prompt = `Evaluate if the following conversation stage is complete:

Stage: ${stage.name}
Agent goal: ${stage.agentPrompt}
User expectation: ${stage.userExpectation}

Recent conversation:
${recentHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Agent'}: ${msg.content}`).join('\n')}

Has the stage objective been met? Respond with only "yes" or "no".`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.0,
      });

      const answer = response.choices[0]?.message?.content?.trim().toLowerCase();
      return answer === 'yes';
    } catch (error) {
      console.error('Error evaluating stage completion:', error);
      return true; // Default to progressing on error
    }
  }

  /**
   * Evaluate if flow is naturally complete using LLM
   */
  private async evaluateCompletionWithLLM(
    context: FlowContext,
    template: FlowTemplate
  ): Promise<boolean> {
    try {
      const prompt = `Evaluate if this conversation flow feels naturally complete:

Flow: ${template.name}
Description: ${template.description}
Current exchange count: ${context.exchangeCount}
Target exchanges: ${template.targetExchangeCount}

Recent conversation:
${context.conversationHistory.slice(-6).map(msg => 
  `${msg.role === 'user' ? 'User' : 'Agent'}: ${msg.content}`
).join('\n')}

Does this conversation feel naturally complete and ready to wrap up? Respond with only "yes" or "no".`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.0,
      });

      const answer = response.choices[0]?.message?.content?.trim().toLowerCase();
      return answer === 'yes';
    } catch (error) {
      console.error('Error evaluating completion:', error);
      return false;
    }
  }

  /**
   * Execute completion action for a flow
   */
  private async executeCompletionAction(
    context: FlowContext,
    action: CompletionAction
  ): Promise<any> {
    try {
      switch (action.type) {
        case 'save_journal':
          // Extract journal content from conversation
          const journalContent = context.conversationHistory
            .filter(msg => msg.role === 'user')
            .map(msg => msg.content)
            .join('\n\n');

          await vectorSearchService.pool.query(
            `INSERT INTO journal_entries (user_id, content, category, created_at)
             VALUES ($1, $2, $3, $4)`,
            [context.userId, journalContent, action.params?.category || 'reflection', new Date()]
          );

          return { type: 'journal', content: journalContent };

        case 'save_activity':
          // Save activity record
          await vectorSearchService.pool.query(
            `INSERT INTO user_activities (user_id, activity_type, data, completed_at)
             VALUES ($1, $2, $3, $4)`,
            [
              context.userId,
              action.params?.activity_type || 'flow_completion',
              JSON.stringify(context.collectedData),
              new Date(),
            ]
          );

          return { type: 'activity', data: context.collectedData };

        case 'none':
        default:
          return null;
      }
    } catch (error) {
      console.error('Error executing completion action:', error);
      return null;
    }
  }

  /**
   * Get current flow context for a user
   */
  async getCurrentFlow(userId: string): Promise<FlowContext | null> {
    try {
      const result = await vectorSearchService.pool.query(
        `SELECT * FROM flow_contexts WHERE user_id = $1 AND completed_at IS NULL ORDER BY flow_started_at DESC LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        userId: row.user_id,
        sessionId: row.session_id,
        flowId: row.flow_id,
        currentStage: row.current_stage,
        stageStartedAt: row.stage_started_at,
        exchangeCount: row.exchange_count,
        conversationHistory: JSON.parse(row.conversation_history || '[]'),
        collectedData: JSON.parse(row.collected_data || '{}'),
        flowStartedAt: row.flow_started_at,
      };
    } catch (error) {
      console.error('Error fetching current flow:', error);
      return null;
    }
  }

  /**
   * Get stage prompt for agent
   */
  getStagePrompt(flowId: string, stageIndex: number): string | null {
    const template = this.flowTemplates.get(flowId);
    if (!template || stageIndex >= template.stages.length) {
      return null;
    }
    return template.stages[stageIndex].agentPrompt;
  }

  /**
   * Store flow context in database
   */
  private async storeFlowContext(context: FlowContext): Promise<void> {
    await vectorSearchService.pool.query(
      `INSERT INTO flow_contexts 
       (user_id, session_id, flow_id, current_stage, stage_started_at, exchange_count, conversation_history, collected_data, flow_started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        context.userId,
        context.sessionId,
        context.flowId,
        context.currentStage,
        context.stageStartedAt,
        context.exchangeCount,
        JSON.stringify(context.conversationHistory),
        JSON.stringify(context.collectedData),
        context.flowStartedAt,
      ]
    );
  }

  /**
   * Update flow context
   */
  private async updateFlowContext(context: FlowContext): Promise<void> {
    await vectorSearchService.pool.query(
      `UPDATE flow_contexts 
       SET current_stage = $1, 
           stage_started_at = $2, 
           exchange_count = $3, 
           conversation_history = $4, 
           collected_data = $5
       WHERE user_id = $6 AND session_id = $7 AND flow_id = $8 AND completed_at IS NULL`,
      [
        context.currentStage,
        context.stageStartedAt,
        context.exchangeCount,
        JSON.stringify(context.conversationHistory),
        JSON.stringify(context.collectedData),
        context.userId,
        context.sessionId,
        context.flowId,
      ]
    );
  }

  /**
   * Mark flow as complete
   */
  private async completeFlow(context: FlowContext): Promise<void> {
    await vectorSearchService.pool.query(
      `UPDATE flow_contexts 
       SET completed_at = $1 
       WHERE user_id = $2 AND session_id = $3 AND flow_id = $4 AND completed_at IS NULL`,
      [new Date(), context.userId, context.sessionId, context.flowId]
    );
  }

  /**
   * Get all available flow templates
   */
  getAvailableFlows(): FlowTemplate[] {
    return Array.from(this.flowTemplates.values());
  }
}

// Singleton instance
export const conversationFlowService = new ConversationFlowService();
