/**
 * AI Chatbot Types
 * Type definitions for AI-powered chatbot system
 */

export type AIProvider = 'openai' | 'anthropic';
export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
export type IntentType =
  | 'order_lookup'
  | 'shipping_tracking'
  | 'return_request'
  | 'refund_request'
  | 'product_recommendation'
  | 'faq'
  | 'escalate_to_human'
  | 'general_inquiry'
  | 'complaint'
  | 'account_management';

export type IntentConfidence = 'high' | 'medium' | 'low';
export type EscalationReason = 'complex_issue' | 'user_request' | 'low_confidence' | 'sensitive_data';

// Database types
export interface DbChatbotConversation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  session_id: string;
  channel: 'web' | 'whatsapp' | 'messenger' | 'mobile';
  context: {
    order_history?: any[];
    customer_info?: any;
    previous_intents?: string[];
    custom_data?: Record<string, any>;
  };
  escalated: boolean;
  escalation_reason?: EscalationReason;
  escalated_to?: string; // agent ID
  escalated_at?: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbChatbotMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: IntentType;
  intent_confidence?: IntentConfidence;
  entities?: Record<string, any>;
  metadata?: {
    model_used?: AIModel;
    tokens_used?: number;
    response_time_ms?: number;
    cached?: boolean;
    pii_masked?: boolean;
  };
  created_at: string;
}

export interface DbIntentLog {
  id: string;
  conversation_id: string;
  message_id: string;
  intent: IntentType;
  confidence: IntentConfidence;
  entities: Record<string, any>;
  action_taken?: string;
  action_result?: any;
  created_at: string;
}

export interface DbChatbotTrainingData {
  id: string;
  intent: IntentType;
  user_message: string;
  expected_response?: string;
  entities?: Record<string, any>;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// Application types
export interface ChatbotConversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  sessionId: string;
  channel: 'web' | 'whatsapp' | 'messenger' | 'mobile';
  context: ChatbotContext;
  escalated: boolean;
  escalationReason?: EscalationReason;
  escalatedTo?: string;
  escalatedAt?: Date;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatbotMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: IntentType;
  intentConfidence?: IntentConfidence;
  entities?: Record<string, any>;
  metadata?: {
    modelUsed?: AIModel;
    tokensUsed?: number;
    responseTimeMs?: number;
    cached?: boolean;
    piiMasked?: boolean;
  };
  createdAt: Date;
}

export interface ChatbotContext {
  orderHistory?: any[];
  customerInfo?: any;
  previousIntents?: string[];
  customData?: Record<string, any>;
}

export interface IntentLog {
  id: string;
  conversationId: string;
  messageId: string;
  intent: IntentType;
  confidence: IntentConfidence;
  entities: Record<string, any>;
  actionTaken?: string;
  actionResult?: any;
  createdAt: Date;
}

export interface TrainingData {
  id: string;
  intent: IntentType;
  userMessage: string;
  expectedResponse?: string;
  entities?: Record<string, any>;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types
export interface ChatRequest {
  conversationId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  message: string;
  channel?: 'web' | 'whatsapp' | 'messenger' | 'mobile';
  context?: Partial<ChatbotContext>;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  response: string;
  intent?: IntentType;
  intentConfidence?: IntentConfidence;
  entities?: Record<string, any>;
  suggestions?: string[];
  escalated?: boolean;
  metadata?: {
    modelUsed: AIModel;
    tokensUsed: number;
    responseTimeMs: number;
    cached: boolean;
  };
}

export interface IntentDetectionResult {
  intent: IntentType;
  confidence: IntentConfidence;
  entities: Record<string, any>;
  shouldEscalate: boolean;
  escalationReason?: EscalationReason;
}

export interface IntentActionResult {
  success: boolean;
  data?: any;
  error?: string;
  shouldEscalate?: boolean;
  escalationReason?: EscalationReason;
}

// Configuration
export interface ChatbotConfig {
  provider: AIProvider;
  model: AIModel;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  systemPrompt?: string;
  enableCache: boolean;
  cacheTTL: number; // seconds
  enablePIIMasking: boolean;
  autoEscalateOnLowConfidence: boolean;
  lowConfidenceThreshold: number; // 0.0 - 1.0
}

// Analytics
export interface ChatbotAnalytics {
  period: string;
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  averageConfidence: number;
  intentDistribution: Record<IntentType, number>;
  escalationRate: number;
  resolutionRate: number;
  customerSatisfaction?: number;
}
