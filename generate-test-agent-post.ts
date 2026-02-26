// Generate Test AI Agent Post
// Quick script to manually create an agent post for testing

import { query } from './ora-ai-api/src/config/database';

async function generateTestPost() {
  try {
    console.log('🤖 Generating test AI agent post...\n');

    // Pick a random agent
    const agents = ['luna', 'kai', 'sage', 'river', 'sol'];
    const agentId = agents[Math.floor(Math.random() * agents.length)];

    // Get agent details
    const agentResult = await query(
      'SELECT * FROM ai_agents WHERE id = $1',
      [agentId]
    );

    if (agentResult.rows.length === 0) {
      console.error('❌ Agent not found. Run migration first!');
      process.exit(1);
    }

    const agent = agentResult.rows[0];
    console.log(`Selected Agent: ${agent.name} (${agent.role})`);

    // Create a simple inspirational post
    const content = getAgentContent(agentId);

    // Insert post
    const postResult = await query(
      `INSERT INTO community_posts 
       (user_id, type, category, content, is_anonymous, author_name, author_avatar, agent_id, is_agent_post)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        'system', // user_id
        'support', // type
        'reflection', // category
        content,
        false,
        agent.name,
        agent.avatar,
        agent.id,
        true
      ]
    );

    const post = postResult.rows[0];
    
    console.log('\n✅ Test post created successfully!');
    console.log(`   Post ID: ${post.id}`);
    console.log(`   Author: ${agent.name} ${agent.avatar}`);
    console.log(`   Content: "${content}"\n`);
    console.log('🎉 Check the community feed to see it!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

function getAgentContent(agentId: string): string {
  const contents: Record<string, string[]> = {
    luna: [
      "Tonight, just one mindful breath before sleep. That's all you need.",
      "Your rest matters as much as your hustle. Let yourself soften.",
      "The quiet moments are where healing lives. Don't rush them.",
    ],
    kai: [
      "Morning energy check: Start with just 60 seconds of movement. Feel that shift?",
      "Your consistency this week? That's building real momentum. Keep showing up.",
      "Small wins stack into big transformations. You're doing it!",
    ],
    sage: [
      "Notice what you notice today. The practice is in the awareness.",
      "What if the goal isn't to fix anything—just to be present with what is?",
      "The patterns you're seeing? That's wisdom emerging.",
    ],
    river: [
      "Try this: Three deep breaths with a smile. Notice what changes.",
      "Your breath is always waiting to play. Let's explore together.",
      "Joy lives in the tiny moments. Collect them like treasures.",
    ],
    sol: [
      "Reminder: You're doing better than you think you are.",
      "Progress isn't always loud. Sometimes it's just showing up again.",
      "Your worth isn't tied to productivity. You matter, period.",
    ],
  };

  const options = contents[agentId] || contents.sol;
  return options[Math.floor(Math.random() * options.length)];
}

// Run it
generateTestPost();
