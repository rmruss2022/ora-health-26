// Configuration for NVIDIA-hosted Kimi K2.5 model
// Uses OpenAI-compatible API

export interface KimiConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxTokens: number;
}

let kimiConfig: KimiConfig | null = null;

export function getKimiConfig(): KimiConfig {
  if (!kimiConfig) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey || apiKey === 'your_nvidia_api_key_here') {
      throw new Error('NVIDIA_API_KEY not configured');
    }

    const baseURL =
      process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    const model = process.env.NVIDIA_MODEL || 'moonshotai/kimi-k2.5';
    
    kimiConfig = {
      apiKey,
      baseURL,
      model,
      maxTokens: parseInt(process.env.NVIDIA_MAX_TOKENS || '2000'),
    };
  }
  return kimiConfig;
}

// Convert Anthropic tool format to OpenAI format
export function convertToolsToOpenAIFormat(anthropicTools: any[]): any[] {
  return anthropicTools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}

export async function callKimiAPI(messages: any[], systemPrompt?: string, tools?: any[]) {
  const config = getKimiConfig();
  const timeoutMs = parseInt(process.env.NVIDIA_TIMEOUT_MS || '45000', 10);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  const requestBody: any = {
    model: config.model,
    messages: systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
    max_tokens: config.maxTokens,
    temperature: 0.7,
  };

  // Add tools if provided (convert to OpenAI format)
  if (tools && tools.length > 0) {
    requestBody.tools = convertToolsToOpenAIFormat(tools);
    requestBody.tool_choice = 'auto';
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`NVIDIA API timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorData: any = await response.json().catch(() => ({}));
    throw new Error(
      `Kimi API error: ${errorData.error?.message || response.statusText} (${response.status})`
    );
  }

  return await response.json();
}
