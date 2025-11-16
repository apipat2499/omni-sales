/**
 * Chat and Support System Database Operations
 * Database schema and operations for live chat and tickets
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  DbConversation,
  DbMessage,
  DbAgent,
  DbTicket,
  DbCannedResponse,
  DbChatAnalytics,
  Conversation,
  Message,
  Agent,
  Ticket,
  CannedResponse,
  ChatAnalytics,
  ConversationFilters,
  TicketFilters,
} from './types';

// Database table names
export const CHAT_TABLES = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  AGENTS: 'agents',
  TICKETS: 'tickets',
  CANNED_RESPONSES: 'canned_responses',
  CHAT_ANALYTICS: 'chat_analytics',
  ROUTING_RULES: 'routing_rules',
} as const;

// Database error handling
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export type DatabaseResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: DatabaseError };

function handleError(error: any): DatabaseError {
  return {
    message: error.message || 'An unknown database error occurred',
    code: error.code,
    details: error.details,
    hint: error.hint,
  };
}

// ==================== TRANSFORMATION FUNCTIONS ====================

function dbConversationToConversation(db: DbConversation): Conversation {
  return {
    id: db.id,
    customerId: db.customer_id,
    customerName: db.customer_name,
    customerEmail: db.customer_email,
    agentId: db.agent_id,
    agentName: db.agent_name,
    status: db.status,
    channel: db.channel,
    subject: db.subject,
    tags: db.tags,
    metadata: db.metadata,
    startedAt: new Date(db.started_at),
    assignedAt: db.assigned_at ? new Date(db.assigned_at) : undefined,
    resolvedAt: db.resolved_at ? new Date(db.resolved_at) : undefined,
    closedAt: db.closed_at ? new Date(db.closed_at) : undefined,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

function conversationToDb(conv: Partial<Conversation>): Partial<DbConversation> {
  return {
    id: conv.id,
    customer_id: conv.customerId,
    customer_name: conv.customerName,
    customer_email: conv.customerEmail,
    agent_id: conv.agentId,
    agent_name: conv.agentName,
    status: conv.status,
    channel: conv.channel,
    subject: conv.subject,
    tags: conv.tags,
    metadata: conv.metadata,
    started_at: conv.startedAt?.toISOString(),
    assigned_at: conv.assignedAt?.toISOString(),
    resolved_at: conv.resolvedAt?.toISOString(),
    closed_at: conv.closedAt?.toISOString(),
  };
}

function dbMessageToMessage(db: DbMessage): Message {
  return {
    id: db.id,
    conversationId: db.conversation_id,
    senderId: db.sender_id,
    senderName: db.sender_name,
    senderType: db.sender_type,
    messageType: db.message_type,
    content: db.content,
    attachments: db.attachments,
    readAt: db.read_at ? new Date(db.read_at) : undefined,
    metadata: db.metadata,
    createdAt: new Date(db.created_at),
  };
}

function messageToDb(msg: Partial<Message>): Partial<DbMessage> {
  return {
    id: msg.id,
    conversation_id: msg.conversationId,
    sender_id: msg.senderId,
    sender_name: msg.senderName,
    sender_type: msg.senderType,
    message_type: msg.messageType,
    content: msg.content,
    attachments: msg.attachments,
    read_at: msg.readAt?.toISOString(),
    metadata: msg.metadata,
  };
}

function dbAgentToAgent(db: DbAgent): Agent {
  return {
    id: db.id,
    userId: db.user_id,
    name: db.name,
    email: db.email,
    status: db.status,
    teamId: db.team_id,
    teamName: db.team_name,
    skills: db.skills,
    maxConcurrentChats: db.max_concurrent_chats,
    activeChats: db.active_chats,
    totalChats: db.total_chats,
    averageRating: db.average_rating,
    averageResponseTime: db.average_response_time,
    lastActiveAt: db.last_active_at ? new Date(db.last_active_at) : undefined,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

function agentToDb(agent: Partial<Agent>): Partial<DbAgent> {
  return {
    id: agent.id,
    user_id: agent.userId,
    name: agent.name,
    email: agent.email,
    status: agent.status,
    team_id: agent.teamId,
    team_name: agent.teamName,
    skills: agent.skills,
    max_concurrent_chats: agent.maxConcurrentChats,
    active_chats: agent.activeChats,
    total_chats: agent.totalChats,
    average_rating: agent.averageRating,
    average_response_time: agent.averageResponseTime,
    last_active_at: agent.lastActiveAt?.toISOString(),
  };
}

function dbTicketToTicket(db: DbTicket): Ticket {
  return {
    id: db.id,
    conversationId: db.conversation_id,
    customerId: db.customer_id,
    customerName: db.customer_name,
    customerEmail: db.customer_email,
    assignedAgentId: db.assigned_agent_id,
    assignedAgentName: db.assigned_agent_name,
    assignedTeamId: db.assigned_team_id,
    assignedTeamName: db.assigned_team_name,
    subject: db.subject,
    description: db.description,
    priority: db.priority,
    status: db.status,
    category: db.category,
    tags: db.tags,
    slaDueAt: db.sla_due_at ? new Date(db.sla_due_at) : undefined,
    firstResponseAt: db.first_response_at ? new Date(db.first_response_at) : undefined,
    resolvedAt: db.resolved_at ? new Date(db.resolved_at) : undefined,
    closedAt: db.closed_at ? new Date(db.closed_at) : undefined,
    metadata: db.metadata,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

function ticketToDb(ticket: Partial<Ticket>): Partial<DbTicket> {
  return {
    id: ticket.id,
    conversation_id: ticket.conversationId,
    customer_id: ticket.customerId,
    customer_name: ticket.customerName,
    customer_email: ticket.customerEmail,
    assigned_agent_id: ticket.assignedAgentId,
    assigned_agent_name: ticket.assignedAgentName,
    assigned_team_id: ticket.assignedTeamId,
    assigned_team_name: ticket.assignedTeamName,
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    category: ticket.category,
    tags: ticket.tags,
    sla_due_at: ticket.slaDueAt?.toISOString(),
    first_response_at: ticket.firstResponseAt?.toISOString(),
    resolved_at: ticket.resolvedAt?.toISOString(),
    closed_at: ticket.closedAt?.toISOString(),
    metadata: ticket.metadata,
  };
}

// ==================== CONVERSATION OPERATIONS ====================

export async function createConversation(
  conversation: Conversation
): Promise<DatabaseResult<Conversation>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const { data, error } = await client
      .from(CHAT_TABLES.CONVERSATIONS)
      .insert(conversationToDb(conversation))
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbConversationToConversation(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function getConversation(
  conversationId: string
): Promise<DatabaseResult<Conversation>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const { data, error } = await client
      .from(CHAT_TABLES.CONVERSATIONS)
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbConversationToConversation(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function getConversations(
  filters?: ConversationFilters
): Promise<DatabaseResult<Conversation[]>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    let query = client.from(CHAT_TABLES.CONVERSATIONS).select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.agentId) {
      query = query.eq('agent_id', filters.agentId);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data.map(dbConversationToConversation),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function updateConversation(
  conversationId: string,
  updates: Partial<Conversation>
): Promise<DatabaseResult<Conversation>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const dbUpdates = conversationToDb(updates);
    const { data, error } = await client
      .from(CHAT_TABLES.CONVERSATIONS)
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbConversationToConversation(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

// ==================== MESSAGE OPERATIONS ====================

export async function createMessage(message: Message): Promise<DatabaseResult<Message>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const { data, error } = await client
      .from(CHAT_TABLES.MESSAGES)
      .insert(messageToDb(message))
      .select()
      .single();

    if (error) throw error;

    // Update conversation's updated_at timestamp
    await client
      .from(CHAT_TABLES.CONVERSATIONS)
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.conversationId);

    return {
      success: true,
      data: dbMessageToMessage(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function getMessages(
  conversationId: string,
  limit?: number,
  offset?: number
): Promise<DatabaseResult<Message[]>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    let query = client
      .from(CHAT_TABLES.MESSAGES)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data.map(dbMessageToMessage),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function markMessageAsRead(
  messageId: string
): Promise<DatabaseResult<Message>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const { data, error } = await client
      .from(CHAT_TABLES.MESSAGES)
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbMessageToMessage(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

// ==================== AGENT OPERATIONS ====================

export async function createAgent(agent: Agent): Promise<DatabaseResult<Agent>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const { data, error } = await client
      .from(CHAT_TABLES.AGENTS)
      .insert(agentToDb(agent))
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbAgentToAgent(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function getAgent(agentId: string): Promise<DatabaseResult<Agent>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const { data, error } = await client
      .from(CHAT_TABLES.AGENTS)
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbAgentToAgent(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function getAgents(filters?: {
  status?: string;
  teamId?: string;
}): Promise<DatabaseResult<Agent[]>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    let query = client.from(CHAT_TABLES.AGENTS).select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.teamId) {
      query = query.eq('team_id', filters.teamId);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    return {
      success: true,
      data: data.map(dbAgentToAgent),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function updateAgent(
  agentId: string,
  updates: Partial<Agent>
): Promise<DatabaseResult<Agent>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const dbUpdates = agentToDb(updates);
    const { data, error } = await client
      .from(CHAT_TABLES.AGENTS)
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbAgentToAgent(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

// ==================== TICKET OPERATIONS ====================

export async function createTicket(ticket: Ticket): Promise<DatabaseResult<Ticket>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const { data, error } = await client
      .from(CHAT_TABLES.TICKETS)
      .insert(ticketToDb(ticket))
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbTicketToTicket(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function getTicket(ticketId: string): Promise<DatabaseResult<Ticket>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const { data, error } = await client
      .from(CHAT_TABLES.TICKETS)
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbTicketToTicket(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function getTickets(filters?: TicketFilters): Promise<DatabaseResult<Ticket[]>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    let query = client.from(CHAT_TABLES.TICKETS).select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assignedAgentId) {
      query = query.eq('assigned_agent_id', filters.assignedAgentId);
    }
    if (filters?.assignedTeamId) {
      query = query.eq('assigned_team_id', filters.assignedTeamId);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data.map(dbTicketToTicket),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

export async function updateTicket(
  ticketId: string,
  updates: Partial<Ticket>
): Promise<DatabaseResult<Ticket>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available' },
    };
  }

  try {
    const dbUpdates = ticketToDb(updates);
    const { data, error } = await client
      .from(CHAT_TABLES.TICKETS)
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: dbTicketToTicket(data),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}
