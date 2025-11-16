# Live Chat & Customer Support System

## Overview

The Live Chat & Customer Support System is a comprehensive solution for managing customer support tickets, live chat conversations, and support agent operations within the Omni-Sales platform. It provides multi-tenant support with complete ticket lifecycle management, real-time chat capabilities, agent management, and advanced analytics.

## Database Schema

The support system uses 8 PostgreSQL tables with advanced features including JSON storage for flexible data structures, comprehensive indexing for performance, and Row-Level Security (RLS) for multi-tenant isolation.

## Core Tables

### 1. support_tickets
Manages customer support tickets with full lifecycle tracking, agent assignment, and SLA metrics.
- Columns: id, user_id, customer_name, customer_email, customer_phone, subject, description, category, priority, status, assigned_agent_id, created_at, updated_at, resolved_at, first_response_time, resolution_time, custom_fields
- Statuses: open, in_progress, waiting_customer, resolved, closed
- Priorities: low, medium, high, urgent
- Use Cases: Create tickets from multiple channels, track SLA metrics, assign to agents, manage ticket lifecycle

### 2. ticket_conversations
Thread-based message management for ticket discussions with support for internal notes and attachments.
- Columns: id, ticket_id, user_id, sender_type, sender_name, sender_email, message, is_internal, attachments, created_at, updated_at
- Sender Types: customer, agent, system
- Use Cases: Message threading, internal notes, file attachments, conversation history

### 3. support_agents
Agent management system with capacity tracking, skill tagging, and performance metrics.
- Columns: id, user_id, agent_name, agent_email, department, skills, status, current_chats, max_concurrent_chats, total_tickets_resolved, average_resolution_time, average_rating, response_time_average, created_at, updated_at, last_activity_at
- Statuses: available, busy, away, offline
- Use Cases: Agent availability management, skill-based routing, performance tracking, capacity management

### 4. live_chat_sessions
Real-time chat session management with visitor tracking and session metadata.
- Columns: id, user_id, visitor_id, visitor_name, visitor_email, status, assigned_agent_id, transferred_from_agent_id, visitor_ip, visitor_browser, session_start_time, session_end_time, total_messages, message_count, duration, rating, feedback, created_at, updated_at
- Statuses: active, waiting, transferred, closed
- Use Cases: Real-time chat management, visitor tracking, chat transfers, session analytics

### 5. chat_messages
Individual message ledger for live chat conversations with attachment support.
- Columns: id, session_id, user_id, sender_type, sender_name, message, attachment_url, attachment_type, is_read, read_at, created_at
- Sender Types: customer, agent, system
- Use Cases: Message storage, read receipts, attachment tracking, message history

### 6. canned_responses
Pre-defined response templates for agents with usage tracking and categorization.
- Columns: id, user_id, response_title, response_content, shortcut_key, category, usage_count, last_used_at, created_at, updated_at
- Use Cases: Quick responses, response standardization, efficiency tracking, response libraries

### 7. support_analytics
Daily aggregated KPI metrics for dashboard and reporting purposes.
- Columns: id, user_id, analytics_date, total_tickets_created, total_tickets_resolved, total_chats_started, total_chats_completed, average_resolution_time, average_first_response_time, average_chat_duration, customer_satisfaction_score, agent_response_time, tickets_by_status, tickets_by_priority, tickets_by_category, chats_by_agent, created_at
- Use Cases: Dashboard metrics, trend analysis, performance reporting, KPI tracking

### 8. ticket_feedback
Customer satisfaction ratings and feedback collection after ticket resolution.
- Columns: id, ticket_id, user_id, rating, recommendation, feedback, resolved_issue, agent_rating, response_time_rating, communication_rating, created_at
- Use Cases: Satisfaction tracking, agent performance evaluation, quality assurance, feedback analysis

## Service Layer Functions

### Ticket Management

- **getTickets(userId, filters)**: Retrieves all tickets for a user with optional filtering
  - Filters: status, priority, assignedAgentId, category, search
  - Returns: Array of SupportTicket objects

- **createTicket(userId, ticketData)**: Creates a new support ticket
  - Input: customerName, customerEmail, customerPhone, subject, description, category, priority
  - Returns: Created SupportTicket object or null on error

- **updateTicket(ticketId, updates)**: Updates existing ticket
  - Updates: status, priority, assignedAgentId, category, customFields
  - Returns: Updated SupportTicket object or null on error

- **closeTicket(ticketId)**: Closes a support ticket
  - Sets status to 'closed' and records resolved_at timestamp
  - Returns: Boolean success indicator

### Ticket Conversation Management

- **getTicketConversations(ticketId)**: Retrieves all messages in a ticket
  - Returns: Array of TicketConversation objects ordered by creation date

- **addTicketConversation(ticketId, userId, messageData)**: Adds message to ticket
  - Input: senderType, senderName, senderEmail, message, isInternal, attachments
  - Returns: Created TicketConversation object or null on error

### Agent Management

- **getAgents(userId)**: Retrieves all support agents
  - Returns: Array of SupportAgent objects

- **updateAgentStatus(agentId, status)**: Updates agent availability status
  - Input: status (available, busy, away, offline)
  - Returns: Boolean success indicator

- **assignTicketToAgent(ticketId, agentId)**: Assigns ticket to an agent
  - Updates ticket status to 'in_progress'
  - Returns: Boolean success indicator

### Live Chat Functions

- **startChatSession(userId, visitorData)**: Initiates new chat session
  - Input: visitorId, visitorName, visitorEmail, visitorIp, visitorBrowser
  - Returns: Created LiveChatSession object or null on error

- **getActiveChatSessions(userId)**: Retrieves all active chat sessions
  - Filters by status='active'
  - Returns: Array of LiveChatSession objects

- **endChatSession(sessionId, duration)**: Closes chat session
  - Sets status to 'closed' and records session duration
  - Returns: Boolean success indicator

### Chat Message Functions

- **getChatMessages(sessionId)**: Retrieves all messages in a chat session
  - Returns: Array of ChatMessage objects ordered by creation date

- **addChatMessage(sessionId, userId, messageData)**: Adds message to chat
  - Input: senderType, senderName, message, attachmentUrl, attachmentType
  - Returns: Created ChatMessage object or null on error

### Canned Response Functions

- **getCannedResponses(userId)**: Retrieves all canned responses for a user
  - Returns: Array of CannedResponse objects

- **createCannedResponse(userId, responseData)**: Creates new canned response
  - Input: responseTitle, responseContent, shortcutKey, category
  - Returns: Created CannedResponse object or null on error

- **useCannedResponse(responseId)**: Records usage of canned response
  - Increments usage_count and updates last_used_at
  - Returns: Boolean success indicator

### Dashboard & Analytics

- **getSupportDashboardData(userId)**: Retrieves comprehensive dashboard metrics
  - Returns: SupportDashboardData with:
    - totalTickets, openTickets, resolvedTickets
    - totalChats, activeChats
    - totalAgents, availableAgents
    - averageResolutionTime, averageFirstResponseTime
    - customerSatisfactionScore, averageChatDuration
    - ticketsCreatedToday, chatsStartedToday
    - recentTickets (array), topAgents (array)
    - ticketsByStatus, ticketsByPriority, ticketsByCategory (objects)
    - agentAvailability (object)
    - satisfactionTrendLastWeek, ticketVolumeTrendLastWeek (arrays)

## API Endpoints

### GET /api/support/dashboard
Retrieves support system dashboard data with all KPI metrics.
- Query: userId (required)
- Returns: Dashboard data with metrics and lists
- Response:
  ```json
  {
    "success": true,
    "data": {
      "totalTickets": 150,
      "openTickets": 23,
      "resolvedTickets": 127,
      "totalChats": 89,
      "activeChats": 5,
      "totalAgents": 8,
      "availableAgents": 6,
      "averageResolutionTime": 28800,
      "averageFirstResponseTime": 1800,
      "customerSatisfactionScore": 4.3,
      "averageChatDuration": 780,
      "recentTickets": [...],
      "topAgents": [...],
      "ticketsByStatus": {...},
      "ticketsByPriority": {...},
      "ticketsByCategory": {...},
      "agentAvailability": {...},
      "satisfactionTrendLastWeek": [...],
      "ticketVolumeTrendLastWeek": [...]
    }
  }
  ```

## Best Practices

### Ticket Management
1. **Categorization** - Use consistent category names for better analytics and routing
2. **Priority Assignment** - Set appropriate priority based on impact and urgency
3. **Timely Response** - Respond to tickets within SLA targets
4. **Agent Assignment** - Assign to agents with relevant skills
5. **Custom Fields** - Use for domain-specific information

### Chat Operations
1. **Visitor Experience** - Minimize wait times, greet visitors promptly
2. **Chat Transfers** - Transfer to specialists when needed
3. **Session Documentation** - Record chat outcomes and next steps
4. **Feedback Collection** - Request satisfaction ratings after chats
5. **Availability** - Keep agent availability status updated

### Agent Management
1. **Skill Tagging** - Mark agents' expertise areas for routing
2. **Capacity Limits** - Set max concurrent chats based on agent capability
3. **Performance Monitoring** - Track resolution times and satisfaction scores
4. **Training Needs** - Identify agents needing additional training
5. **Workload Balancing** - Distribute tickets and chats fairly

### Analytics & Reporting
1. **SLA Tracking** - Monitor first response and resolution times
2. **Quality Metrics** - Track satisfaction scores and agent ratings
3. **Volume Trends** - Analyze ticket and chat volume patterns
4. **Category Analysis** - Identify common issue categories
5. **Agent Performance** - Compare agent metrics and identify top performers

### Customer Communication
1. **Templates** - Use canned responses for consistency and efficiency
2. **Professionalism** - Maintain professional tone in all communications
3. **Clarity** - Provide clear, step-by-step solutions
4. **Follow-up** - Ensure customer confirms resolution
5. **Documentation** - Keep detailed conversation history

## Compliance Considerations

### Data Privacy
- Secure storage of customer contact information
- Encryption of sensitive data in transit and at rest
- Audit trails for all support interactions
- Compliance with GDPR, CCPA, and local regulations

### Quality Assurance
- Regular agent training and competency assessments
- Quality audits of support interactions
- Customer satisfaction monitoring
- Issue escalation procedures

### SLA Management
- Define clear SLA response and resolution times
- Monitor SLA compliance metrics
- Escalation procedures for breaches
- Customer communication on status updates

### Record Retention
- Maintain conversation history for compliance and reference
- Archival policies for old tickets and chats
- Data deletion procedures for customer requests
- Audit log retention

## Troubleshooting

### High Response Times
- Check agent availability and capacity utilization
- Analyze if tickets are properly categorized and routed
- Identify peak hours and adjust staffing accordingly
- Review skill matching between tickets and agents

### Low Satisfaction Scores
- Review recent tickets for common issues
- Evaluate agent performance through call/chat reviews
- Collect customer feedback on specific pain points
- Implement targeted training for improvement areas

### Chat Abandonment
- Monitor wait times in chat queue
- Ensure adequate agent availability
- Use proactive chat invitations to engage visitors
- Analyze abandonment patterns and times

### Ticket Backlog
- Prioritize high-urgency tickets
- Distribute workload more evenly
- Review ticket categorization for accuracy
- Implement automation for common issues

### Agent Burnout
- Monitor concurrent chat/ticket load per agent
- Enforce regular breaks and time off
- Provide career development opportunities
- Recognize and reward high performers

## System Limits

- Ticket Volume: Up to 1,000,000 tickets per user
- Concurrent Chats: Limited by agent max_concurrent_chats setting (typically 5-10)
- Message Size: Up to 50KB per message
- Attachment Size: Up to 100MB per file
- Canned Responses: Up to 10,000 per user
- Agents: Up to 500 per organization
- Conversation History: Retention per organization policy (default: unlimited)

## Integration Patterns

### Channel Integration
- Email ticket creation from customer emails
- Phone call logging to support system
- Social media message routing to tickets
- Form-based ticket creation on website

### Workflow Automation
- Auto-assignment based on agent skills
- Automatic escalation on SLA breach
- Status updates to customers via email
- Canned response suggestions based on keywords

### External Systems
- CRM integration for customer history
- Knowledge base integration for agent help
- Payment system integration for billing issues
- Order system integration for order-related tickets

## Version History

**v1.0 - Initial Release**
- Core ticket management
- Live chat functionality
- Agent management system
- Support analytics
- Dashboard and reporting
- Multi-tenant architecture
- Full SLA tracking
- Customer feedback collection

## Related Documentation

- **Email Marketing**: EMAIL_MARKETING.md
- **SMS & Push Notifications**: SMS_PUSH_NOTIFICATIONS.md
- **Loyalty Program**: LOYALTY_PROGRAM.md
- **Orders Management**: Orders tracking and management
- **Payments & Invoicing**: Payment processing integration

## Support & Feedback

For issues, questions, or feature requests, please:
1. Check the troubleshooting section above
2. Review the service layer function documentation
3. Check API endpoint response formats
4. Contact the development team with detailed information about the issue
