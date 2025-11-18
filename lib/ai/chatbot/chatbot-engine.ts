/**
 * AI Chatbot Engine
 * Core engine for AI-powered customer service chatbot
 * Supports OpenAI GPT-4 and Anthropic Claude
 */

import type {
  ChatbotConfig,
  ChatRequest,
  ChatResponse,
  ChatbotConversation,
  ChatbotMessage,
  ChatbotContext,
  AIProvider,
  AIModel,
  IntentDetectionResult,
} from './types';
import { detectIntent } from './intents';
import { getCache, setCache } from '@/lib/cache/cache-manager';

// OpenAI Integration
async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  config: ChatbotConfig
): Promise<{ response: string; tokensUsed: number }> {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    response: data.choices[0].message.content,
    tokensUsed: data.usage.total_tokens,
  };
}

// Anthropic Claude Integration
async function callClaude(
  messages: Array<{ role: string; content: string }>,
  config: ChatbotConfig
): Promise<{ response: string; tokensUsed: number }> {
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Extract system message if present
  const systemMessage = messages.find((m) => m.role === 'system');
  const userMessages = messages.filter((m) => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemMessage?.content || config.systemPrompt,
      messages: userMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    response: data.content[0].text,
    tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
  };
}

/**
 * AI Chatbot Engine
 */
export class ChatbotEngine {
  private config: ChatbotConfig;
  private conversationHistory: Map<string, ChatbotMessage[]> = new Map();

  constructor(config: Partial<ChatbotConfig> = {}) {
    // Default configuration
    this.config = {
      provider: (config.provider || process.env.AI_PROVIDER || 'openai') as AIProvider,
      model: (config.model || process.env.AI_MODEL || 'gpt-4') as AIModel,
      temperature: config.temperature ?? parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      maxTokens: config.maxTokens ?? parseInt(process.env.AI_MAX_TOKENS || '1000'),
      apiKey: config.apiKey || '',
      systemPrompt:
        config.systemPrompt ||
        process.env.AI_SYSTEM_PROMPT ||
        this.getDefaultSystemPrompt(),
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL ?? 3600, // 1 hour
      enablePIIMasking: config.enablePIIMasking ?? true,
      autoEscalateOnLowConfidence: config.autoEscalateOnLowConfidence ?? true,
      lowConfidenceThreshold: config.lowConfidenceThreshold ?? 0.6,
    };
  }

  /**
   * Get default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are a helpful AI customer service assistant for an e-commerce platform. Your role is to:

1. Help customers with order inquiries, shipping tracking, returns, and refunds
2. Provide product recommendations based on customer preferences
3. Answer frequently asked questions about policies and procedures
4. Be polite, professional, and empathetic
5. If you cannot help with a complex issue, escalate to a human agent

Always provide accurate information. If you're unsure, say so and offer to connect with a human agent.

Available actions:
- Order lookup: Search for order by ID or customer email
- Shipping tracking: Track shipment status
- Return/Refund: Initiate return or refund process
- Product recommendations: Suggest products based on preferences
- FAQ: Answer common questions
- Escalate: Transfer to human agent for complex issues

Respond naturally and helpfully.`;
  }

  /**
   * Process a chat message
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const conversationId = request.conversationId || this.generateConversationId();

    try {
      // Get or create conversation history
      let history = this.conversationHistory.get(conversationId) || [];

      // Add customer context to system prompt
      const contextEnhancedPrompt = this.enhancePromptWithContext(
        this.config.systemPrompt || this.getDefaultSystemPrompt(),
        request.context
      );

      // Mask PII if enabled
      let processedMessage = request.message;
      if (this.config.enablePIIMasking) {
        processedMessage = this.maskPII(request.message);
      }

      // Detect intent
      const intentResult = await detectIntent(processedMessage, request.context);

      // Check for auto-escalation
      if (
        this.config.autoEscalateOnLowConfidence &&
        intentResult.shouldEscalate
      ) {
        return this.createEscalationResponse(conversationId, intentResult);
      }

      // Check cache for similar queries
      let response: string;
      let tokensUsed: number;
      let cached = false;

      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(processedMessage, intentResult.intent);
        const cachedResponse = await getCache(cacheKey);

        if (cachedResponse) {
          response = cachedResponse as string;
          tokensUsed = 0;
          cached = true;
        } else {
          const aiResponse = await this.callAI(
            contextEnhancedPrompt,
            history,
            processedMessage
          );
          response = aiResponse.response;
          tokensUsed = aiResponse.tokensUsed;

          // Cache the response
          await setCache(cacheKey, response, this.config.cacheTTL);
        }
      } else {
        const aiResponse = await this.callAI(
          contextEnhancedPrompt,
          history,
          processedMessage
        );
        response = aiResponse.response;
        tokensUsed = aiResponse.tokensUsed;
      }

      // Update conversation history
      history.push({
        id: this.generateMessageId(),
        conversationId,
        role: 'user',
        content: request.message,
        intent: intentResult.intent,
        intentConfidence: intentResult.confidence,
        entities: intentResult.entities,
        createdAt: new Date(),
      });

      history.push({
        id: this.generateMessageId(),
        conversationId,
        role: 'assistant',
        content: response,
        metadata: {
          modelUsed: this.config.model,
          tokensUsed,
          responseTimeMs: Date.now() - startTime,
          cached,
        },
        createdAt: new Date(),
      });

      // Keep only last 20 messages in memory
      if (history.length > 20) {
        history = history.slice(-20);
      }
      this.conversationHistory.set(conversationId, history);

      // Generate suggestions
      const suggestions = this.generateSuggestions(intentResult.intent);

      return {
        conversationId,
        messageId: history[history.length - 1].id,
        response,
        intent: intentResult.intent,
        intentConfidence: intentResult.confidence,
        entities: intentResult.entities,
        suggestions,
        metadata: {
          modelUsed: this.config.model,
          tokensUsed,
          responseTimeMs: Date.now() - startTime,
          cached,
        },
      };
    } catch (error) {
      console.error('Chatbot error:', error);
      throw new Error(`Chatbot processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Call AI provider
   */
  private async callAI(
    systemPrompt: string,
    history: ChatbotMessage[],
    userMessage: string
  ): Promise<{ response: string; tokensUsed: number }> {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    if (this.config.provider === 'openai') {
      return callOpenAI(messages, this.config);
    } else if (this.config.provider === 'anthropic') {
      return callClaude(messages, this.config);
    } else {
      throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  /**
   * Enhance system prompt with customer context
   */
  private enhancePromptWithContext(
    basePrompt: string,
    context?: Partial<ChatbotContext>
  ): string {
    if (!context) return basePrompt;

    let enhancedPrompt = basePrompt;

    if (context.customerInfo) {
      enhancedPrompt += `\n\nCustomer Information:\n${JSON.stringify(context.customerInfo, null, 2)}`;
    }

    if (context.orderHistory && context.orderHistory.length > 0) {
      enhancedPrompt += `\n\nRecent Orders:\n${JSON.stringify(context.orderHistory.slice(0, 5), null, 2)}`;
    }

    if (context.previousIntents && context.previousIntents.length > 0) {
      enhancedPrompt += `\n\nPrevious Conversation Topics: ${context.previousIntents.join(', ')}`;
    }

    return enhancedPrompt;
  }

  /**
   * Mask PII (Personal Identifiable Information)
   */
  private maskPII(text: string): string {
    // Email masking
    text = text.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '[EMAIL]'
    );

    // Phone number masking (Thai format)
    text = text.replace(/\b0\d{1,2}-?\d{3,4}-?\d{4}\b/g, '[PHONE]');

    // Credit card masking
    text = text.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD]');

    return text;
  }

  /**
   * Create escalation response
   */
  private createEscalationResponse(
    conversationId: string,
    intentResult: IntentDetectionResult
  ): ChatResponse {
    return {
      conversationId,
      messageId: this.generateMessageId(),
      response:
        "I understand this is an important matter. Let me connect you with one of our customer service specialists who can better assist you with this request. Please hold for a moment.",
      intent: 'escalate_to_human',
      intentConfidence: 'high',
      escalated: true,
      metadata: {
        modelUsed: this.config.model,
        tokensUsed: 0,
        responseTimeMs: 0,
        cached: false,
      },
    };
  }

  /**
   * Generate suggestions based on intent
   */
  private generateSuggestions(intent?: string): string[] {
    const suggestions: Record<string, string[]> = {
      order_lookup: [
        'Track my order',
        'When will my order arrive?',
        'Change delivery address',
      ],
      shipping_tracking: [
        'Where is my package?',
        'Update shipping address',
        'Contact delivery driver',
      ],
      return_request: [
        'How to return an item?',
        'Return policy',
        'Get return label',
      ],
      product_recommendation: [
        'Show similar products',
        'Best sellers',
        'New arrivals',
      ],
      faq: ['Shipping policy', 'Return policy', 'Payment methods'],
    };

    return intent && suggestions[intent] ? suggestions[intent] : [];
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(message: string, intent?: string): string {
    const normalized = message.toLowerCase().trim();
    return `chatbot:${intent || 'general'}:${normalized.substring(0, 100)}`;
  }

  /**
   * Generate conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): ChatbotMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ChatbotConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ChatbotConfig {
    return { ...this.config };
  }
}

// Singleton instance
let chatbotEngineInstance: ChatbotEngine | null = null;

export function getChatbotEngine(config?: Partial<ChatbotConfig>): ChatbotEngine {
  if (!chatbotEngineInstance) {
    chatbotEngineInstance = new ChatbotEngine(config);
  }
  return chatbotEngineInstance;
}

export default ChatbotEngine;
