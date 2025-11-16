# AI Chatbot Implementation Guide

Complete guide for the AI-powered customer service chatbot with OpenAI/Anthropic integration.

## Overview

The AI Chatbot system provides intelligent, automated customer support powered by OpenAI GPT-4 or Anthropic Claude. It features multi-turn conversations, intent detection, context awareness, and seamless escalation to human agents.

## Features

### Core Capabilities
- **Multi-Provider Support**: OpenAI (GPT-4, GPT-3.5-turbo) and Anthropic (Claude 3)
- **Intent Detection**: Automatically detects customer intent and routes to appropriate actions
- **Context Awareness**: Maintains conversation context including order history and customer info
- **Response Caching**: Caches similar queries to reduce API costs and improve speed
- **Multi-Channel**: Web, WhatsApp, Facebook Messenger, Mobile app support
- **Escalation**: Smart escalation to human agents when needed

### Intent Support
1. **Order Lookup** - Search and display order information
2. **Shipping Tracking** - Track shipment status
3. **Return Request** - Initiate product returns
4. **Refund Request** - Handle refund inquiries
5. **Product Recommendation** - Suggest products based on preferences
6. **FAQ** - Answer frequently asked questions
7. **Account Management** - Handle account-related queries
8. **Complaint Handling** - Escalate complaints to human agents

### Security Features
- **Rate Limiting**: Per-user and per-IP rate limiting
- **PII Masking**: Automatic masking of emails, phones, credit cards
- **Content Filtering**: Detects and blocks inappropriate content
- **Input Sanitization**: Prevents XSS, SQL injection, command injection
- **Spam Detection**: Identifies and blocks spam messages

## Architecture

```
┌─────────────────┐
│   Chat Widget   │ (React Component)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│  /api/ai/chat   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Chatbot Engine  │ (OpenAI/Claude)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Intents │ │Actions │
└────────┘ └────────┘
```

## Setup

### 1. Database Migration

Run the database migration to create chatbot tables:

```bash
# Using Supabase CLI
supabase db push supabase/migrations/20250116_ai_chatbot.sql

# Or apply manually through Supabase dashboard
```

This creates:
- `chatbot_conversations` - Conversation sessions
- `chatbot_messages` - Individual messages
- `intent_logs` - Intent detection logs
- `chatbot_training_data` - Training data for improvements

### 2. Environment Configuration

Add to your `.env` file:

```bash
# AI Provider (openai or anthropic)
AI_PROVIDER=openai

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key

# Or Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Model Selection
AI_MODEL=gpt-4

# Configuration
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000
AI_ENABLE_CACHE=true
AI_ENABLE_PII_MASKING=true
AI_AUTO_ESCALATE_LOW_CONFIDENCE=true
AI_LOW_CONFIDENCE_THRESHOLD=0.6
```

### 3. Install Dependencies

The chatbot uses existing dependencies in `package.json`. No additional packages needed.

## Usage

### Basic Implementation

Add the AI Chat Widget to your application:

```tsx
import AIChatWidget from '@/components/ai/AIChatWidget';

export default function MyPage() {
  return (
    <div>
      {/* Your page content */}

      {/* AI Chat Widget */}
      <AIChatWidget
        customerId="user_123"
        customerName="John Doe"
        customerEmail="john@example.com"
        channel="web"
        position="bottom-right"
        primaryColor="#3B82F6"
      />
    </div>
  );
}
```

### API Endpoints

#### Send Message
```typescript
POST /api/ai/chat

Request:
{
  "conversationId": "optional-existing-conversation-id",
  "customerId": "user_123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "message": "Where is my order?",
  "channel": "web"
}

Response:
{
  "conversationId": "conv_1234567890",
  "messageId": "msg_1234567890",
  "response": "I'll help you track your order...",
  "intent": "order_lookup",
  "intentConfidence": "high",
  "suggestions": ["Track my order", "Change delivery address"],
  "metadata": {
    "modelUsed": "gpt-4",
    "tokensUsed": 150,
    "responseTimeMs": 1250,
    "cached": false
  }
}
```

#### Get Conversation History
```typescript
GET /api/ai/chat/history?conversationId=conv_123

Response:
{
  "conversation": {...},
  "messages": [...]
}

GET /api/ai/chat/history?customerId=user_123&limit=10

Response:
{
  "conversations": [...]
}
```

#### Escalate to Human
```typescript
POST /api/ai/chat/escalate

Request:
{
  "conversationId": "conv_123",
  "customerId": "user_123",
  "reason": "user_request",
  "message": "I need to speak with a human"
}

Response:
{
  "success": true,
  "liveConversationId": "live_123",
  "message": "Conversation escalated successfully"
}
```

#### Training Data
```typescript
POST /api/ai/training

Request:
{
  "intent": "order_lookup",
  "userMessage": "Where is my package?",
  "expectedResponse": "I'll help you track your order...",
  "entities": {"orderId": "12345"}
}

GET /api/ai/training?intent=order_lookup&approved=true
```

## Programmatic Usage

### Direct Engine Usage

```typescript
import { getChatbotEngine } from '@/lib/ai/chatbot/chatbot-engine';

const chatbot = getChatbotEngine({
  provider: 'openai',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
});

const response = await chatbot.chat({
  conversationId: 'conv_123',
  customerId: 'user_123',
  customerName: 'John Doe',
  message: 'Where is my order #12345?',
  context: {
    orderHistory: [...],
    customerInfo: {...}
  }
});
```

### Intent Detection

```typescript
import { detectIntent, executeIntentAction } from '@/lib/ai/chatbot/intents';

// Detect intent
const intent = await detectIntent("Where is my package?");
// {
//   intent: "shipping_tracking",
//   confidence: "high",
//   entities: {...},
//   shouldEscalate: false
// }

// Execute action
const result = await executeIntentAction(
  intent.intent,
  intent.entities,
  customerId
);
```

### Security Utilities

```typescript
import {
  performSecurityCheck,
  maskPII,
  filterContent,
  checkRateLimit
} from '@/lib/ai/chatbot/security';

// Comprehensive security check
const check = await performSecurityCheck(
  message,
  userId,
  ipAddress
);

if (!check.allowed) {
  console.log('Blocked:', check.warnings);
}

// PII masking
const { maskedText, hasPII } = maskPII("My email is john@example.com");
// maskedText: "My email is [EMAIL_REDACTED]"

// Content filtering
const filter = filterContent("inappropriate message");
// { isAppropriate: false, reason: "...", severity: "high" }

// Rate limiting
const limit = await checkRateLimit(userId);
// { allowed: true, remaining: 19, resetAt: 1234567890 }
```

## Customization

### Custom System Prompt

Set a custom personality for your chatbot:

```bash
AI_SYSTEM_PROMPT="You are TechBot, a friendly AI assistant for TechStore.
You help customers with orders, returns, and product recommendations.
Always be professional, helpful, and empathetic."
```

### Custom Intents

Add custom intents in `lib/ai/chatbot/intents.ts`:

```typescript
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  // ... existing intents
  custom_intent: [
    /\bcustom\s+pattern\b/i,
    /\bspecific\s+keywords\b/i,
  ],
};

// Add handler
async function handleCustomIntent(
  entities: Record<string, any>,
  customerId: string
): Promise<IntentActionResult> {
  // Your custom logic
  return {
    success: true,
    data: {...}
  };
}
```

## Multi-Channel Integration

### WhatsApp Business

```typescript
// Set environment variables
WHATSAPP_BUSINESS_ACCOUNT_ID=your-account-id
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token

// Webhook handler (create in app/api/webhooks/whatsapp/route.ts)
export async function POST(request: Request) {
  const { from, message } = await request.json();

  const response = await chatbot.chat({
    customerId: from,
    customerName: from,
    message: message.text.body,
    channel: 'whatsapp'
  });

  // Send response via WhatsApp API
  await sendWhatsAppMessage(from, response.response);
}
```

### Facebook Messenger

Similar setup for Messenger integration.

## Analytics

### View Chatbot Analytics

```sql
-- Daily conversation statistics
SELECT * FROM chatbot_analytics_daily
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;

-- Intent distribution
SELECT * FROM intent_analytics_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY total_count DESC;

-- Message statistics
SELECT * FROM message_analytics_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

### Get Intent Statistics

```sql
SELECT * FROM get_intent_statistics(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);
```

## Best Practices

### 1. Monitor Token Usage
Track API costs by monitoring token usage in `chatbot_messages.metadata`:

```sql
SELECT
  DATE(created_at) as date,
  SUM((metadata->>'tokensUsed')::int) as total_tokens,
  COUNT(*) as message_count
FROM chatbot_messages
WHERE role = 'assistant'
  AND metadata->>'tokensUsed' IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. Optimize Caching
Enable caching for common queries to reduce costs:
- Set `AI_ENABLE_CACHE=true`
- Adjust `AI_CACHE_TTL` based on your needs
- Monitor cache hit rate

### 3. Training Data
Regularly review and approve training data:

```sql
SELECT * FROM chatbot_training_data
WHERE approved = false
ORDER BY created_at DESC;
```

### 4. Escalation Monitoring
Monitor escalation patterns:

```sql
SELECT
  escalation_reason,
  COUNT(*) as count
FROM chatbot_conversations
WHERE escalated = true
GROUP BY escalation_reason;
```

## Sample Conversations

### Order Tracking
```
User: Where is my order #12345?
AI: Let me check the status of your order #12345.

    Order Status: Shipped
    Tracking Number: TH1234567890TH
    Estimated Delivery: Tomorrow, Nov 17

    Your package is currently in transit and should arrive tomorrow.
    Would you like me to send you tracking updates?

Intent: order_lookup
Confidence: high
```

### Product Recommendation
```
User: I'm looking for a laptop for work
AI: I'd be happy to help you find a laptop! Based on our current inventory,
    here are some great options for work:

    1. MacBook Pro 14" - $1,999
       Perfect for creative work and development

    2. Dell XPS 13 - $1,299
       Lightweight and powerful for business use

    3. ThinkPad X1 Carbon - $1,499
       Excellent keyboard and battery life

    What's your budget and main use case?

Intent: product_recommendation
Confidence: high
```

### Return Request
```
User: I want to return my recent purchase
AI: I can help you with that return. Let me check your recent orders.

    I found these recent orders:
    - Order #12345: Wireless Headphones - $99.99 (Ordered 5 days ago)
    - Order #12346: USB Cable - $19.99 (Ordered 10 days ago)

    Which item would you like to return?

Intent: return_request
Confidence: high
```

### Escalation
```
User: This is urgent! I need to speak with someone now!
AI: I understand this is important to you. Let me connect you with one of
    our customer service specialists who can better assist you.

    [Escalates to human agent]

Intent: escalate_to_human
Confidence: high
```

## Troubleshooting

### API Errors
```
Error: "OpenAI API error: Unauthorized"
Solution: Check OPENAI_API_KEY in .env file

Error: "Rate limit exceeded"
Solution: Increase CHATBOT_RATE_LIMIT_MESSAGES or implement queue system

Error: "Conversation not found"
Solution: Ensure conversationId exists in database
```

### Performance Issues
- Enable caching: `AI_ENABLE_CACHE=true`
- Use faster model: `gpt-3.5-turbo` instead of `gpt-4`
- Reduce max tokens: `AI_MAX_TOKENS=500`

## Contributing

To improve the chatbot:

1. Add training data via API
2. Review and approve training data
3. Add new intents in `intents.ts`
4. Customize system prompt
5. Monitor analytics and adjust

## License

Part of Omni-Sales system.
