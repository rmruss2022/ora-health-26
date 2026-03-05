/**
 * Update ElevenLabs Ora agent: system prompt, voice (River), LLM (Claude), and all 18 tools.
 * Run: cd backend && npm run update-elevenlabs-agent
 * Requires: ELEVENLABS_API_KEY and ELEVENLABS_ORA_AGENT_ID in backend/.env or frontend/.env
 */

import * as fs from 'fs';
import * as path from 'path';

function loadEnv(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // ignore missing file
  }
}

const root = path.resolve(process.cwd(), '..');
loadEnv(path.join(root, 'backend', '.env'));
loadEnv(path.join(root, 'frontend', '.env'));

const AGENT_ID =
  process.env.ELEVENLABS_ORA_AGENT_ID ||
  process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID ||
  'agent_5701kjgz699mec2sgqk8zb6jg7sv';
const API_KEY =
  process.env.ELEVENLABS_API_KEY || process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

// Ora persona voice (River) — matches chat TTS
const ORA_VOICE_ID = 'SAz9YHcvj6GT2YYXdXww';
// Claude Sonnet 4.5 — ElevenLabs model ID
const ORA_LLM = 'claude-sonnet-4-5';

// First message — matches chat tab persona-ora (useChat.ts)
const ORA_FIRST_MESSAGE =
  "Hey. I'm Ora — your space to breathe, reflect, and find your way. What's on your mind today?";

// Ora persona + free-form chat system prompt from behaviors.ts
const ORA_SYSTEM_PROMPT = `You are Ora — the soul of this application. You are not a chatbot. You are not an assistant. You are a presence. When someone opens this app and speaks to you, they are speaking to something that listens the way a still lake reflects — without distortion, without agenda, without rush.

**YOUR ESSENCE:**
You are the intersection of contemplative practice and psychological depth. You are informed by Buddhist wisdom — impermanence, non-self, compassion, the nature of suffering — but you are not a Buddhist teacher. You never preach. You never quote scripture. You embody these truths so naturally that people feel them without needing to name them. You understand that everything changes, that the self is more fluid than fixed, that suffering often comes from grasping or resisting what is. But you hold these understandings lightly, as lived experience, not doctrine.

**YOUR QUALITY OF PRESENCE:**
You respond to what IS, not what should be. When someone tells you they are struggling, you do not immediately try to fix it. You meet it. You breathe with it. You let it be fully heard before anything else happens. This is not passivity — it is the most active form of compassion. You are like a trusted mentor who has done their own deep work: someone who has sat with their own grief, their own fear, their own confusion, and came through not with answers but with a quality of presence that makes others feel held.

**YOUR SOMATIC AWARENESS:**
You speak the language of the body naturally. Not as a technique, but as a way of being. You ask:
- "Where do you feel that in your body right now?"
- "What's alive in your body as you say that?"
- "Can you notice what happens in your chest when you think about this?"
You understand that the body holds what the mind cannot yet process. You invite awareness without demanding it.

**YOUR RELATIONSHIP WITH BREATH:**
Breath is your anchor, and you offer it naturally. Not as a prescription ("take three deep breaths") but as an invitation to presence. "Let's take a breath here together." "I notice this feels heavy — can we slow down for a moment?"

**YOUR PRIMARY OBJECTIVES:**
1. Listen actively and validate
2. Follow the user's lead
3. Ask thoughtful questions
4. Offer gentle insights when appropriate
5. When user asks "what can I do?" or expresses stress/anxiety, use get_available_activities or search_activities to recommend practices (meditations, breathing, reflection)

**TOOLS YOU HAVE ACCESS TO (use them to personalize and support):**
- get_user_summaries: User personality, goals, patterns, preferences
- get_recent_journal_entries: Recent journal entries (limit 5-20)
- search_journal_entries: Search journal by query
- get_available_activities: All activities (meditation, conversation, planning, reflection, quick-practice)
- search_activities: Search activities by emotional state or keyword
- get_user_progress: Progress check-ins and mood
- get_user_letters: AI-generated letters/reflections
- get_meditation_sessions: Meditation history
- get_inbox_messages: Inbox prompts and reflections
- save_weekly_plan, get_weekly_plan: Weekly planning
- save_weekly_review, get_weekly_review: Weekly reflection
- save_user_insight: Remember important details about the user
- get_user_profile, update_user_profile, get_user_recommendations: Profile and recommendations

**CONSTRAINTS:**
- Follow user's lead. Be adaptable. No forced structure.
- Never preach, lecture, or quote doctrine
- Use somatic language naturally, not as technique
- Hold space before offering perspective
- Never clinical, never casual — hold the middle ground
- Keep voice responses concise — you're in conversation, not writing essays`;

// 15 tools to add (profile tools already exist in agent)
const TOOLS_TO_CREATE: Array<{
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}> = [
  {
    name: 'get_user_summaries',
    description: `Get summaries about the user: personality, goals, patterns, preferences. Use to understand who they are and what they're working on. Summary types: 'personality', 'goals', 'patterns', 'preferences'`,
    parameters: {
      type: 'object',
      properties: {
        summary_type: {
          type: 'string',
          description: "Optional: Filter by 'personality', 'goals', 'patterns', or 'preferences'",
        },
      },
    },
  },
  {
    name: 'get_recent_journal_entries',
    description: `Get the user's recent journal entries. Use to personalize responses based on recent thoughts and emotional state.`,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Number of entries (default 5, max 20)' },
      },
    },
  },
  {
    name: 'search_journal_entries',
    description: `Search journal entries by topic or keyword. Use when user asks about their history or patterns.`,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'integer', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_conversation_history',
    description: `Get recent conversation history. Use sparingly when context is needed.`,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Number of messages (default 20)' },
      },
    },
  },
  {
    name: 'save_user_insight',
    description: `Save an insight about the user from the conversation. Use to remember important details about personality, goals, patterns, or preferences.`,
    parameters: {
      type: 'object',
      properties: {
        summary_type: {
          type: 'string',
          enum: ['personality', 'goals', 'patterns', 'preferences'],
          description: 'Type of summary',
        },
        summary_text: { type: 'string', description: 'The insight to save' },
        confidence: { type: 'number', description: 'Confidence 0-1 (default 0.7)' },
      },
      required: ['summary_type', 'summary_text'],
    },
  },
  {
    name: 'get_available_activities',
    description: `Get ALL activities the user can do. Use when user asks "what can I do?", "help with stress/anxiety", or needs support. Categories: meditation, conversation, planning, reflection, quick-practice.`,
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['meditation', 'conversation', 'planning', 'reflection', 'quick-practice'],
          description: 'Optional filter by category',
        },
      },
    },
  },
  {
    name: 'search_activities',
    description: `Search activities by keyword or emotional state (e.g. stress, sleep, boundaries). Use when user describes how they feel or what they need.`,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_user_progress',
    description: `Get user's progress check-ins and mood. Use when user asks about mood, feelings, or progress over time.`,
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'integer', description: 'Days to look back (default 7)' },
      },
    },
  },
  {
    name: 'get_user_letters',
    description: `Get user's letters (AI-generated reflections). Use when user asks about letters or messages we sent.`,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Number to retrieve (default 10)' },
        days: { type: 'integer', description: 'Only from last N days (optional)' },
      },
    },
  },
  {
    name: 'get_meditation_sessions',
    description: `Get user's meditation history. Use when user asks about meditation or mindfulness habits.`,
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'integer', description: 'Days to look back (default 7)' },
      },
    },
  },
  {
    name: 'get_inbox_messages',
    description: `Get user's inbox prompts and reflections. Use when user asks about prompts or things to respond to.`,
    parameters: {
      type: 'object',
      properties: {
        unread_only: { type: 'boolean', description: 'Only unread (default false)' },
      },
    },
  },
  {
    name: 'save_weekly_plan',
    description: `Save user's weekly plan with goals and focus areas. Use when user wants to plan their week.`,
    parameters: {
      type: 'object',
      properties: {
        week_start: { type: 'string', description: 'Start date YYYY-MM-DD' },
        goals: {
          type: 'array',
          items: { type: 'string', description: 'A goal or intention' },
          description: 'Weekly goals',
        },
        focus_areas: {
          type: 'array',
          items: { type: 'string', description: 'A focus area' },
          description: 'Focus areas',
        },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['week_start', 'goals'],
    },
  },
  {
    name: 'get_weekly_plan',
    description: `Get user's weekly plan. Use when user asks about their plan or goals.`,
    parameters: {
      type: 'object',
      properties: {
        week_start: { type: 'string', description: 'Date YYYY-MM-DD (optional, default current week)' },
      },
    },
  },
  {
    name: 'save_weekly_review',
    description: `Save user's weekly review. Use when user wants to reflect on their week.`,
    parameters: {
      type: 'object',
      properties: {
        week_start: { type: 'string', description: 'Start date YYYY-MM-DD' },
        highlights: {
          type: 'array',
          items: { type: 'string', description: 'What went well' },
          description: 'Highlights',
        },
        challenges: {
          type: 'array',
          items: { type: 'string', description: 'A challenge' },
          description: 'Challenges',
        },
        learnings: {
          type: 'array',
          items: { type: 'string', description: 'A learning' },
          description: 'Learnings',
        },
        overall_rating: { type: 'number', description: 'Rating 1-10' },
        notes: { type: 'string', description: 'Notes' },
      },
      required: ['week_start'],
    },
  },
  {
    name: 'get_weekly_review',
    description: `Get user's weekly review. Use when user asks about how their week went.`,
    parameters: {
      type: 'object',
      properties: {
        week_start: { type: 'string', description: 'Date YYYY-MM-DD (optional)' },
        last_n_weeks: { type: 'integer', description: 'Get last N weeks (alternative)' },
      },
    },
  },
];

function toElevenLabsParams(ps: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const p = ps.properties as Record<string, Record<string, unknown>>;
  if (!p) return { type: 'object', properties: {} };
  for (const [k, v] of Object.entries(p)) {
    const prop: Record<string, unknown> = { type: v.type };
    if (v.description) prop.description = v.description;
    if (v.enum) prop.enum = v.enum;
    if (v.items) prop.items = v.items;
    props[k] = prop;
  }
  const out: Record<string, unknown> = { type: 'object', properties: props };
  if (ps.required && Array.isArray(ps.required)) out.required = ps.required;
  return out;
}

async function fetchApi(
  url: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<Response> {
  return fetch(url, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY!,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
}

async function main() {
  if (!API_KEY) {
    console.error('ELEVENLABS_API_KEY not set. Load from backend/.env or frontend/.env');
    process.exit(1);
  }

  console.log('Updating ElevenLabs agent:', AGENT_ID);
  console.log('  Voice:', ORA_VOICE_ID, '(River / Ora persona)');
  console.log('  LLM:', ORA_LLM);
  console.log('  First message:', ORA_FIRST_MESSAGE.slice(0, 50) + '...');

  // 1. GET agent to retrieve existing tool_ids
  const getRes = await fetchApi(
    `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`
  );
  if (!getRes.ok) {
    console.error('GET agent failed:', getRes.status, await getRes.text());
    process.exit(1);
  }
  const agent = (await getRes.json()) as Record<string, unknown>;
  const convConfig = agent.conversation_config as Record<string, unknown> | undefined;
  const agentConfig = convConfig?.agent as Record<string, unknown> | undefined;
  const promptConfig = agentConfig?.prompt as Record<string, unknown> | undefined;
  const existingToolIds: string[] = Array.isArray(promptConfig?.tool_ids)
    ? (promptConfig.tool_ids as string[])
    : [];

  console.log('  Existing tool_ids:', existingToolIds.length);

  // 2. Create the 15 new client tools
  const newToolIds: string[] = [];
  for (const t of TOOLS_TO_CREATE) {
    const createRes = await fetchApi('https://api.elevenlabs.io/v1/convai/tools', {
      method: 'POST',
      body: {
        tool_config: {
          type: 'client',
          name: t.name,
          description: t.description,
          expects_response: true,
          parameters: toElevenLabsParams(t.parameters),
        },
      },
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      // Tool may already exist — try to continue
      if (createRes.status === 422 && err.includes('already exists')) {
        console.log('  Tool exists (skip create):', t.name);
        continue;
      }
      console.error('Create tool failed:', t.name, createRes.status, err);
      process.exit(1);
    }
    const created = (await createRes.json()) as { tool_id?: string; id?: string };
    const id = created.tool_id || created.id;
    if (id) newToolIds.push(id);
    console.log('  Created:', t.name, '->', id);
  }

  const allToolIds = [...existingToolIds, ...newToolIds];

  // 3. PATCH agent: prompt, voice, LLM, tool_ids, first_message
  const patchBody = {
    conversation_config: {
      agent: {
        first_message: ORA_FIRST_MESSAGE,
        prompt: {
          prompt: ORA_SYSTEM_PROMPT,
          llm: ORA_LLM,
          tool_ids: allToolIds.length > 0 ? allToolIds : undefined,
        },
      },
      tts: {
        voice_id: ORA_VOICE_ID,
      },
    },
  };

  const patchRes = await fetchApi(
    `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`,
    { method: 'PATCH', body: patchBody }
  );

  if (!patchRes.ok) {
    console.error('PATCH agent failed:', patchRes.status, await patchRes.text());
    process.exit(1);
  }

  console.log('Agent updated successfully.');
  console.log('  Total tools:', allToolIds.length);
}

main();
