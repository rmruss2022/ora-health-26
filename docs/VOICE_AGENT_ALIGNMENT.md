# Voice Agent Alignment with Chat Tab

This document describes how the ElevenLabs voice agent is aligned with the chat tab agent, what has been ported, and what limitations remain.

## What Has Been Ported

### 1. System Prompt (Ora Persona)

The voice agent uses the same Ora persona system prompt as the chat tab, merged with free-form-chat objectives and tool usage guidance:

- **Source**: `backend/src/config/behaviors.ts` — `persona-ora` + `free-form-chat`
- **Update script**: `scripts/update-elevenlabs-agent.ts`
- **Run**: `npx ts-node scripts/update-elevenlabs-agent.ts` (from project root)

The script PATCHes the ElevenLabs agent via `https://api.elevenlabs.io/v1/convai/agents/{agent_id}` with `conversation_config.agent.prompt.prompt`.

### 2. Backend Tool Support (18 tools)

The voice controller (`backend/src/controllers/voice.controller.ts`) supports all tools the chat tab uses:

| Tool | Handler | Notes |
|------|---------|-------|
| `get_user_profile` | profileService | Profile data |
| `update_user_profile` | profileService | Update preferences |
| `get_user_recommendations` | profileService | Personalized recs |
| `get_user_summaries` | aiToolsService | Personality, goals, patterns |
| `get_recent_journal_entries` | aiToolsService | Recent journal (5–20) |
| `search_journal_entries` | aiToolsService | Search by query |
| `get_conversation_history` | aiToolsService | Recent chat history |
| `save_user_insight` | aiToolsService | Remember user details |
| `get_available_activities` | aiToolsService | All activities index |
| `search_activities` | aiToolsService | Search by emotion/keyword |
| `get_user_progress` | aiToolsService | Progress check-ins |
| `get_user_letters` | aiToolsService | AI letters/reflections |
| `get_meditation_sessions` | aiToolsService | Meditation history |
| `get_inbox_messages` | aiToolsService | Inbox prompts |
| `save_weekly_plan` | aiToolsService | Weekly planning |
| `get_weekly_plan` | aiToolsService | Get weekly plan |
| `save_weekly_review` | aiToolsService | Weekly reflection |
| `get_weekly_review` | aiToolsService | Get weekly review |

### 3. Client-Side Tool Execution

- **Frontend**: `useElevenVoiceAgent.ts` → `onUnhandledClientToolCall` → `voiceAgentAPI.executeToolCall`
- **API**: `POST /api/voice/tool-call` with `{ toolName, args }`
- **Auth**: Requires authenticated user (JWT)

---

## Limitations

### 1. ElevenLabs MCP Has No `update_agent` Tool

The project’s ElevenLabs MCP server (`project-0-bwa-elevenlabs`) exposes `get_agent`, `list_agents`, `create_agent`, etc., but **no `update_agent`**. System prompt updates must be done via:

- **Option A**: Run `scripts/update-elevenlabs-agent.ts` (uses REST API directly)
- **Option B**: Update the agent in the ElevenLabs dashboard

### 2. Tool Definitions Must Be Configured in ElevenLabs

The backend supports all 18 tools, but the **ElevenLabs agent** must have matching tool definitions (name, description, parameters) so its LLM knows when and how to call them.

- **Client tools**: Configured in the ElevenLabs agent (dashboard or API)
- **Tool names**: Must match exactly (e.g. `get_user_summaries`, `search_activities`)
- **Parameters**: Should align with `ai-tools.service.ts` input schemas

If tools are not defined in the agent, the LLM will not call them even if the system prompt mentions them.

### 3. Single Persona (No Dynamic Behavior Detection)

- **Chat tab**: Uses behavior detection (keywords, patterns, vector search) to choose among many behaviors (e.g. `difficult-emotion-processing`, `persona-ora`, `free-form-chat`).
- **Voice agent**: Uses a single fixed persona (Ora). No runtime behavior switching.

To approximate chat behavior, the Ora prompt includes guidance for emotional support, somatic awareness, and activity recommendations.

### 4. No Memory Context Injection

- **Chat tab**: Can append `---USER CONTEXT---` from memory/vector search to the system prompt per message.
- **Voice agent**: Uses a static prompt. User context is only available when the agent calls tools (e.g. `get_user_summaries`, `get_recent_journal_entries`).

### 5. Different LLM

- **Chat tab**: Anthropic (Claude) or Kimi, depending on config.
- **Voice agent**: ElevenLabs’ configured LLM (e.g. `gemini-2.0-flash-001`).

Response style and tool use may differ slightly between models.

### 6. Voice-Specific Constraints

- **Conciseness**: The prompt instructs the agent to keep voice responses shorter than chat.
- **Turn-taking**: Voice has different turn-taking and latency behavior than text chat.

---

## Running the Update Script

```bash
# From project root
npx ts-node scripts/update-elevenlabs-agent.ts
```

**Environment variables** (from `backend/.env` or `frontend/.env`):

- `ELEVENLABS_API_KEY` or `EXPO_PUBLIC_ELEVENLABS_API_KEY`
- `ELEVENLABS_ORA_AGENT_ID` or `EXPO_PUBLIC_ELEVENLABS_AGENT_ID` (default: `agent_5701kjgz699mec2sgqk8zb6jg7sv`)

---

## Tool Registration in ElevenLabs

To have the voice agent use the full tool set, each tool must be defined in the ElevenLabs agent configuration. Options:

1. **Dashboard**: Add client tools in the ElevenLabs agent settings with matching names and parameters.
2. **API**: Create tools via `POST /v1/convai/tools` and attach them to the agent via `tool_ids` in the agent’s `prompt` config.

Tool names and parameter schemas should match `backend/src/services/ai-tools.service.ts`.
