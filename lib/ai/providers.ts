// AI Provider Integrations
// Supports: OpenAI, Anthropic (Claude), Google (Gemini)

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

// ============================================================================
// OpenAI Provider
// ============================================================================

async function callOpenAI(
  messages: Message[],
  config: AIProviderConfig
): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4',
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`OpenAI API error: ${error.error?.message || 'Request failed'}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage,
    model: data.model,
  };
}

// ============================================================================
// Anthropic (Claude) Provider
// ============================================================================

async function callAnthropic(
  messages: Message[],
  config: AIProviderConfig
): Promise<AIResponse> {
  // Extract system message if present
  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      system: systemMessage,
      messages: conversationMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`Anthropic API error: ${error.error?.message || 'Request failed'}`);
  }

  const data = await response.json();

  return {
    content: data.content[0]?.text || '',
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens,
        }
      : undefined,
    model: data.model,
  };
}

// ============================================================================
// Google (Gemini) Provider
// ============================================================================

async function callGoogle(
  messages: Message[],
  config: AIProviderConfig
): Promise<AIResponse> {
  // Convert messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  const systemInstruction = messages.find((m) => m.role === 'system')?.content;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${
      config.model || 'gemini-pro'
    }:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          maxOutputTokens: config.maxTokens || 1000,
          temperature: config.temperature || 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`Google API error: ${error.error?.message || 'Request failed'}`);
  }

  const data = await response.json();

  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    usage: data.usageMetadata
      ? {
          prompt_tokens: data.usageMetadata.promptTokenCount,
          completion_tokens: data.usageMetadata.candidatesTokenCount,
          total_tokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
    model: config.model,
  };
}

// ============================================================================
// Main AI Service
// ============================================================================

export async function callAI(messages: Message[], config: AIProviderConfig): Promise<AIResponse> {
  try {
    switch (config.provider) {
      case 'openai':
        return await callOpenAI(messages, config);
      case 'anthropic':
        return await callAnthropic(messages, config);
      case 'google':
        return await callGoogle(messages, config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  } catch (error: any) {
    console.error(`AI Provider Error (${config.provider}):`, error);
    throw error;
  }
}

// ============================================================================
// Knowledge Base Context Builder
// ============================================================================

export function buildSystemPrompt(knowledgeSources: string[]): string {
  return `You are a helpful AI assistant for an e-commerce platform called Omni Sales.
You help customers with:
- Product information and recommendations
- Order tracking and status
- Shipping information
- Returns and refunds
- General customer support

Guidelines:
- Be friendly, professional, and concise
- Use Thai language when the customer uses Thai, English otherwise
- If you don't know something, be honest and offer to connect them with a human
- Always prioritize customer satisfaction

${
  knowledgeSources.length > 0
    ? `\nKnowledge Base:\n${knowledgeSources.join('\n')}`
    : ''
}`;
}

// ============================================================================
// Conversation Context Manager
// ============================================================================

export function prepareMessages(
  conversationHistory: Array<{ role: string; content: string; timestamp?: string }>,
  newMessage: string,
  systemPrompt: string,
  maxContextLength: number = 10
): Message[] {
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Take only the last N messages to avoid token limits
  const recentHistory = conversationHistory.slice(-maxContextLength);

  for (const msg of recentHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  }

  // Add new user message
  messages.push({
    role: 'user',
    content: newMessage,
  });

  return messages;
}
