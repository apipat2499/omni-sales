/**
 * Chat and Support System Types
 * Core type definitions for live chat and customer support
 */

export type ConversationStatus = 'queued' | 'active' | 'resolved' | 'closed';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type AgentStatus = 'online' | 'away' | 'busy' | 'offline';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

// Database types
export interface DbConversation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  agent_id?: string;
  agent_name?: string;
  status: ConversationStatus;
  channel: 'web' | 'mobile' | 'email';
  subject?: string;
  tags: string[];
  metadata?: Record<string, any>;
  started_at: string;
  assigned_at?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'customer' | 'agent' | 'system';
  message_type: MessageType;
  content: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  read_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DbAgent {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: AgentStatus;
  team_id?: string;
  team_name?: string;
  skills: string[];
  max_concurrent_chats: number;
  active_chats: number;
  total_chats: number;
  average_rating: number;
  average_response_time: number; // seconds
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbTicket {
  id: string;
  conversation_id?: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  assigned_team_id?: string;
  assigned_team_name?: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category?: string;
  tags: string[];
  sla_due_at?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DbCannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
  category?: string;
  tags: string[];
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbChatAnalytics {
  id: string;
  date: string;
  agent_id?: string;
  team_id?: string;
  total_conversations: number;
  total_messages: number;
  average_response_time: number; // seconds
  average_resolution_time: number; // seconds
  customer_satisfaction_score?: number;
  first_contact_resolution_rate: number;
  metadata?: Record<string, any>;
  created_at: string;
}

// Application types
export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  agentId?: string;
  agentName?: string;
  status: ConversationStatus;
  channel: 'web' | 'mobile' | 'email';
  subject?: string;
  tags: string[];
  metadata?: Record<string, any>;
  startedAt: Date;
  assignedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Runtime properties
  messages?: Message[];
  unreadCount?: number;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'agent' | 'system';
  messageType: MessageType;
  content: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: AgentStatus;
  teamId?: string;
  teamName?: string;
  skills: string[];
  maxConcurrentChats: number;
  activeChats: number;
  totalChats: number;
  averageRating: number;
  averageResponseTime: number;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  conversationId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category?: string;
  tags: string[];
  slaDueAt?: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
  category?: string;
  tags: string[];
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatAnalytics {
  id: string;
  date: string;
  agentId?: string;
  teamId?: string;
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  customerSatisfactionScore?: number;
  firstContactResolutionRate: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// WebSocket types
export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ChatEvent {
  type: 'message' | 'typing' | 'read' | 'agent_assigned' | 'status_change';
  conversationId: string;
  data: any;
  timestamp: Date;
}

// Assignment rules
export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  conditions: {
    channel?: 'web' | 'mobile' | 'email';
    tags?: string[];
    customerSegment?: string;
    businessHours?: boolean;
  };
  action: {
    assignTo?: 'team' | 'agent' | 'skillBased';
    teamId?: string;
    agentId?: string;
    skills?: string[];
  };
  enabled: boolean;
}

// Search and filtering
export interface ConversationFilters {
  status?: ConversationStatus;
  agentId?: string;
  customerId?: string;
  channel?: 'web' | 'mobile' | 'email';
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string;
  assignedTeamId?: string;
  category?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// Performance metrics
export interface AgentMetrics {
  agentId: string;
  agentName: string;
  period: string;
  totalConversations: number;
  activeConversations: number;
  resolvedConversations: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  customerSatisfactionScore: number;
  firstContactResolutionRate: number;
  messagesPerConversation: number;
}

export interface TeamMetrics {
  teamId: string;
  teamName: string;
  period: string;
  totalConversations: number;
  activeConversations: number;
  queuedConversations: number;
  averageWaitTime: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  customerSatisfactionScore: number;
  agentCount: number;
  onlineAgentCount: number;
}
