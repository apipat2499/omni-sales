# Live Chat & Customer Support System

Comprehensive live chat and customer support system with real-time messaging, ticket management, agent dashboard, and analytics.

## Features

### 1. Live Chat Core
- **Real-time messaging** with WebSocket support
- **Multi-channel support** (web, mobile, email)
- **Conversation threading** and history
- **Agent assignment** with intelligent routing
- **Queue management** for incoming chats

### 2. Chat Features
- Start conversation (visitor mode)
- Agent dashboard with queue and active chats
- **Typing indicators** for real-time feedback
- **Read receipts** to track message status
- **File/image sharing** support
- **Emoji support** for friendly communication
- **Message history** with search
- **Conversation search** and filtering

### 3. Support Ticket System
- Create tickets from chat conversations
- Track ticket status (open, in_progress, waiting, resolved, closed)
- Assign to agents or teams
- **Priority levels** (low, medium, high, urgent)
- **SLA tracking** with automatic due dates
- First response time tracking

### 4. Agent Management
- Agent status (online, away, busy, offline)
- Team assignment and management
- **Chat routing rules** based on skills
- **Concurrent chat limits** per agent
- Performance tracking and metrics

### 5. Canned Responses
- Quick reply templates
- Keyboard shortcuts
- Category organization
- Usage analytics
- Team sharing

### 6. Analytics & Reporting
- **Average response time**
- **Customer satisfaction ratings**
- **Agent performance metrics**
- **Busiest hours/days analysis**
- **Common issues tracking**
- **SLA compliance metrics**

### 7. Integrations
- **Email notifications** for new messages
- **SMS notifications** for high priority
- **CRM integration** for customer context
- Customer history synchronization

## Architecture

### Database Schema

```sql
-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  customer_name VARCHAR NOT NULL,
  customer_email VARCHAR,
  agent_id UUID,
  agent_name VARCHAR,
  status VARCHAR CHECK (status IN ('queued', 'active', 'resolved', 'closed')),
  channel VARCHAR CHECK (channel IN ('web', 'mobile', 'email')),
  subject VARCHAR,
  tags TEXT[],
  metadata JSONB,
  started_at TIMESTAMP NOT NULL,
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id VARCHAR NOT NULL,
  sender_name VARCHAR NOT NULL,
  sender_type VARCHAR CHECK (sender_type IN ('customer', 'agent', 'system')),
  message_type VARCHAR CHECK (message_type IN ('text', 'image', 'file', 'system')),
  content TEXT NOT NULL,
  attachments JSONB,
  read_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agents
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  status VARCHAR CHECK (status IN ('online', 'away', 'busy', 'offline')),
  team_id UUID,
  team_name VARCHAR,
  skills TEXT[],
  max_concurrent_chats INTEGER DEFAULT 5,
  active_chats INTEGER DEFAULT 0,
  total_chats INTEGER DEFAULT 0,
  average_rating DECIMAL DEFAULT 0,
  average_response_time INTEGER DEFAULT 0,
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  customer_id VARCHAR NOT NULL,
  customer_name VARCHAR NOT NULL,
  customer_email VARCHAR NOT NULL,
  assigned_agent_id UUID,
  assigned_agent_name VARCHAR,
  assigned_team_id UUID,
  assigned_team_name VARCHAR,
  subject VARCHAR NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  category VARCHAR,
  tags TEXT[],
  sla_due_at TIMESTAMP,
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Canned Responses
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  shortcut VARCHAR,
  category VARCHAR,
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Analytics
CREATE TABLE chat_analytics (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  agent_id UUID,
  team_id UUID,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_response_time INTEGER DEFAULT 0,
  average_resolution_time INTEGER DEFAULT 0,
  customer_satisfaction_score DECIMAL,
  first_contact_resolution_rate DECIMAL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Chat API

```
POST   /api/chat/start                    - Start a new conversation
GET    /api/chat/:conversationId          - Get conversation details
PUT    /api/chat/:conversationId          - Update conversation
POST   /api/chat/:conversationId/message  - Send a message
GET    /api/chat/:conversationId/messages - Get conversation messages
GET    /api/chat/queue                    - Get chat queue
GET    /api/chat/analytics                - Get chat analytics
```

### Tickets API

```
POST   /api/tickets              - Create a new ticket
GET    /api/tickets              - Get tickets (with filters)
GET    /api/tickets/:ticketId    - Get ticket details
PUT    /api/tickets/:ticketId    - Update ticket
```

### Example Usage

#### Start a Conversation

```typescript
const response = await fetch('/api/chat/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'customer-123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    channel: 'web',
    subject: 'Product Inquiry',
  }),
});

const { conversation } = await response.json();
```

#### Send a Message

```typescript
const response = await fetch(`/api/chat/${conversationId}/message`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    senderId: 'customer-123',
    senderName: 'John Doe',
    senderType: 'customer',
    content: 'Hello, I need help with my order',
  }),
});

const { message } = await response.json();
```

#### Create a Ticket

```typescript
const response = await fetch('/api/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'customer-123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    subject: 'Order Issue',
    description: 'My order has not arrived',
    priority: 'high',
    category: 'shipping',
  }),
});

const { ticket } = await response.json();
```

## Components

### Customer Components

#### ChatWidget

Floating chat widget for customers to initiate conversations.

```tsx
import ChatWidget from '@/components/chat/ChatWidget';

<ChatWidget
  customerId="customer-123"
  customerName="John Doe"
  customerEmail="john@example.com"
/>
```

### Agent Components

#### AgentDashboard

Complete dashboard for agents to manage conversations.

```tsx
import AgentDashboard from '@/components/chat/AgentDashboard';

<AgentDashboard
  agentId="agent-456"
  agentName="Jane Smith"
/>
```

#### ConversationHistory

View past conversations and messages.

```tsx
import ConversationHistory from '@/components/chat/ConversationHistory';

<ConversationHistory
  customerId="customer-123"  // Optional: filter by customer
  agentId="agent-456"        // Optional: filter by agent
  limit={20}
/>
```

### Admin Components

#### AgentManagement

Manage agents, teams, and settings.

```tsx
import AgentManagement from '@/components/chat/AgentManagement';

<AgentManagement />
```

#### CannedResponses

Manage quick reply templates.

```tsx
import CannedResponses from '@/components/chat/CannedResponses';

<CannedResponses
  onSelect={(response) => {
    // Use the selected response
    console.log(response.content);
  }}
/>
```

## Agent Workflow

1. **Agent comes online**
   - Update status to "online"
   - System starts auto-assigning conversations

2. **Customer starts chat**
   - Conversation enters queue
   - Auto-assignment based on:
     - Agent availability
     - Skills matching
     - Current workload
     - Routing rules

3. **Agent accepts chat**
   - Conversation status: queued → active
   - Agent can:
     - Send messages
     - Use canned responses
     - Share files
     - Create ticket

4. **Resolve conversation**
   - Mark as resolved
   - Optionally create ticket for follow-up
   - Send satisfaction survey
   - Sync to CRM

## Performance Metrics

### Agent Metrics
- Total conversations handled
- Active conversations
- Average response time
- Average resolution time
- Customer satisfaction score
- First contact resolution rate
- Messages per conversation

### Team Metrics
- Total conversations
- Queue length
- Average wait time
- Team satisfaction score
- Agent utilization
- Online agent count

### SLA Metrics
- SLA compliance rate
- Average response time vs target
- Breached tickets count
- Average resolution time

## WebSocket Events

### Client → Server

```typescript
// Typing indicator
{
  type: 'typing',
  data: { userName: 'John Doe' }
}

// Stop typing
{
  type: 'stop_typing',
  data: { userName: 'John Doe' }
}

// Read receipt
{
  type: 'read',
  data: { messageId: 'msg-123' }
}

// Heartbeat
{
  type: 'ping'
}
```

### Server → Client

```typescript
// New message
{
  type: 'message',
  conversationId: 'conv-123',
  data: { ...message },
  timestamp: '2025-01-01T00:00:00Z'
}

// Typing indicator
{
  type: 'typing',
  conversationId: 'conv-123',
  data: {
    userId: 'user-123',
    userName: 'John Doe',
    isTyping: true
  },
  timestamp: '2025-01-01T00:00:00Z'
}

// Agent assigned
{
  type: 'agent_assigned',
  conversationId: 'conv-123',
  data: {
    agentId: 'agent-456',
    agentName: 'Jane Smith'
  },
  timestamp: '2025-01-01T00:00:00Z'
}

// Status change
{
  type: 'status_change',
  conversationId: 'conv-123',
  data: { status: 'resolved' },
  timestamp: '2025-01-01T00:00:00Z'
}
```

## Integration Examples

### Email Notification

```typescript
import { getEmailIntegration } from '@/lib/chat/integrations';

const emailIntegration = getEmailIntegration();

// Notify new message
await emailIntegration.notifyNewMessage(
  conversation,
  message,
  'agent@example.com'
);

// Send conversation summary
await emailIntegration.sendConversationSummary(
  conversation,
  messages,
  'customer@example.com'
);
```

### SMS Notification

```typescript
import { getSMSIntegration } from '@/lib/chat/integrations';

const smsIntegration = getSMSIntegration();

// Notify high priority ticket
await smsIntegration.notifyHighPriorityTicket(
  '+1234567890',
  ticket
);

// SLA breach warning
await smsIntegration.sendSLABreachWarning(
  '+1234567890',
  ticket,
  30 // minutes remaining
);
```

### CRM Integration

```typescript
import { getCRMIntegration } from '@/lib/chat/integrations';

const crmIntegration = getCRMIntegration();

// Sync conversation
await crmIntegration.syncConversationToCRM(conversation);

// Get customer context
const context = await crmIntegration.getCustomerContext('customer-123');
```

## Configuration

### Environment Variables

```env
# App URL
NEXT_PUBLIC_APP_URL=https://your-app.com

# CRM Integration
CRM_API_KEY=your-crm-api-key
CRM_API_URL=https://crm-api.example.com

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

### SLA Configuration

```typescript
// In lib/tickets/ticket-manager.ts
const SLA_CONFIG = {
  urgent: 1,   // 1 hour
  high: 4,     // 4 hours
  medium: 24,  // 24 hours
  low: 72,     // 72 hours
};
```

## Best Practices

1. **Response Times**
   - Urgent tickets: < 1 hour
   - High priority: < 4 hours
   - Medium priority: < 24 hours
   - Low priority: < 72 hours

2. **Agent Capacity**
   - Max concurrent chats: 3-5 per agent
   - Consider complexity when assigning

3. **Canned Responses**
   - Keep responses personalized
   - Use customer's name
   - Update regularly based on feedback

4. **Ticket Management**
   - Convert complex chats to tickets
   - Track SLA compliance
   - Regular follow-ups

5. **Analytics**
   - Review metrics weekly
   - Identify training needs
   - Optimize routing rules

## Troubleshooting

### WebSocket Connection Issues

- Check firewall settings
- Verify WebSocket support
- Use polling as fallback

### High Response Times

- Increase agent capacity
- Optimize routing rules
- Review canned responses usage

### SLA Breaches

- Monitor queue length
- Adjust priority levels
- Add more agents during peak hours

## Future Enhancements

- [ ] Video chat support
- [ ] Screen sharing
- [ ] Chatbot integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Customer self-service portal
- [ ] Knowledge base integration
- [ ] Social media channel integration
