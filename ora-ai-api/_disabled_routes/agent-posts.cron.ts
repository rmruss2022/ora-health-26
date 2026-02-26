// Agent Posts Cron Job
// Periodically generates AI agent posts to keep the community engaged

import cron from 'node-cron';
import { aiAgentService } from '../services/ai-agent.service';
import { communityService } from '../services/community.service';
import { query } from '../config/database';
import { getRandomAgent } from '../config/agent-personalities';

/**
 * Generate periodic AI agent posts
 * Runs every 6 hours to add fresh content to the community
 */
export function scheduleAgentPosts() {
  // Run every 6 hours at minute 0
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('🤖 Running agent post generation...');

      // Randomly decide whether to post (50% chance)
      if (Math.random() < 0.5) {
        console.log('Skipping this cycle (random selection)');
        return;
      }

      // Get a random active prompt from the database
      const promptQuery = await query(
        `SELECT * FROM community_prompts 
         WHERE is_active = true 
         ORDER BY RANDOM() 
         LIMIT 1`
      );

      let promptText: string | undefined;
      let category = 'reflection';
      let agentId: string | undefined;

      if (promptQuery.rows.length > 0) {
        const prompt = promptQuery.rows[0];
        promptText = prompt.prompt_text;
        category = prompt.category || 'reflection';
        agentId = prompt.agent_id;
      }

      // Generate agent post
      const result = await aiAgentService.generateAgentPost({
        agentId,
        category,
        promptText,
      });

      // Create post in database
      const post = await communityService.createPost('system', {
        type: promptText ? 'prompt' : 'support',
        category,
        content: result.content,
        promptText,
        isAnonymous: false,
        authorName: result.agentName,
        authorAvatar: result.agentAvatar,
      });

      // Mark as agent post
      await query(
        'UPDATE community_posts SET agent_id = $1, is_agent_post = true WHERE id = $2',
        [result.agentId, post.id]
      );

      console.log(`✅ Agent post created by ${result.agentName}: ${result.content.substring(0, 50)}...`);
    } catch (error) {
      console.error('❌ Error generating agent post:', error);
    }
  });

  console.log('✅ Agent post scheduler started (runs every 6 hours)');
}

/**
 * Manually trigger an agent post (for testing)
 */
export async function generateAgentPostNow(agentId?: string): Promise<void> {
  try {
    console.log('🤖 Generating agent post now...');

    // Get a random agent if not specified
    const agent = agentId ? agentId : getRandomAgent().id;

    const result = await aiAgentService.generateAgentPost({
      agentId: agent,
      category: 'reflection',
    });

    const post = await communityService.createPost('system', {
      type: 'support',
      category: 'reflection',
      content: result.content,
      isAnonymous: false,
      authorName: result.agentName,
      authorAvatar: result.agentAvatar,
    });

    await query(
      'UPDATE community_posts SET agent_id = $1, is_agent_post = true WHERE id = $2',
      [result.agentId, post.id]
    );

    console.log(`✅ Agent post created: ${result.content}`);
  } catch (error) {
    console.error('❌ Error generating agent post:', error);
    throw error;
  }
}
