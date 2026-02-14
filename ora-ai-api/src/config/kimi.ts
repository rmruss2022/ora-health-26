// Configuration for NVIDIA/MoonshotAI Kimi K2.5 model
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
    const apiKey = process.env.KIMI_API_KEY || process.env.NVIDIA_API_KEY;
    if (!apiKey || apiKey === 'your_kimi_api_key_here' || apiKey === 'your_nvidia_api_key_here') {
      throw new Error('KIMI_API_KEY or NVIDIA_API_KEY not configured');
    }

    // Support both MoonshotAI direct API and NVIDIA NIM
    const baseURL = process.env.KIMI_BASE_URL || 
                   process.env.NVIDIA_BASE_URL || 
                   'https://api.moonshot.cn/v1';
    
    // Model options: 
    // - MoonshotAI direct: moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k
    // - NVIDIA NIM: moonshotai/kimi-k2.5
    const model = process.env.KIMI_MODEL || process.env.NVIDIA_MODEL || 'moonshotai/kimi-k2.5';
    
    kimiConfig = {
      apiKey,
      baseURL,
      model,
      maxTokens: parseInt(process.env.KIMI_MAX_TOKENS || '2000'),
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

  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData: any = await response.json().catch(() => ({}));
    throw new Error(
      `Kimi API error: ${errorData.error?.message || response.statusText} (${response.status})`
    );
  }

  return await response.json();
}
