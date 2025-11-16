import { supabase } from '@/lib/supabase/client';
import type {
  SupportTicket,
  TicketConversation,
  SupportAgent,
  LiveChatSession,
  ChatMessage,
  CannedResponse,
  SupportAnalytics,
  TicketFeedback,
  SupportDashboardData,
  TicketStatus,
  TicketPriority,
  AgentStatus,
  ChatSessionStatus,
} from '@/types';

// ============================================================================
// Ticket Management Functions
// ============================================================================

export async function getTickets(
  userId: string,
  filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedAgentId?: string;
    category?: string;
    search?: string;
  }
): Promise<SupportTicket[]> {
  let query = supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.assignedAgentId) {
    query = query.eq('assigned_agent_id', filters.assignedAgentId);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.search) {
    query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }

  return (data || []).map((ticket: any) => ({
    id: ticket.id,
    userId: ticket.user_id,
    customerName: ticket.customer_name,
    customerEmail: ticket.customer_email,
    customerPhone: ticket.customer_phone,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    assignedAgentId: ticket.assigned_agent_id,
    createdAt: new Date(ticket.created_at),
    updatedAt: new Date(ticket.updated_at),
    resolvedAt: ticket.resolved_at ? new Date(ticket.resolved_at) : undefined,
    firstResponseTime: ticket.first_response_time,
    resolutionTime: ticket.resolution_time,
    customFields: ticket.custom_fields,
  }));
}

export async function createTicket(
  userId: string,
  ticketData: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    subject: string;
    description: string;
    category: string;
    priority: TicketPriority;
  }
): Promise<SupportTicket | null> {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert([
      {
        user_id: userId,
        customer_name: ticketData.customerName,
        customer_email: ticketData.customerEmail,
        customer_phone: ticketData.customerPhone,
        subject: ticketData.subject,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        status: 'open',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    return null;
  }

  return data
    ? {
        id: data.id,
        userId: data.user_id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        assignedAgentId: data.assigned_agent_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
        firstResponseTime: data.first_response_time,
        resolutionTime: data.resolution_time,
        customFields: data.custom_fields,
      }
    : null;
}

export async function updateTicket(
  ticketId: string,
  updates: Partial<{
    status: TicketStatus;
    priority: TicketPriority;
    assignedAgentId: string;
    category: string;
    customFields: Record<string, any>;
  }>
): Promise<SupportTicket | null> {
  const updateData: any = {};

  if (updates.status) updateData.status = updates.status;
  if (updates.priority) updateData.priority = updates.priority;
  if (updates.assignedAgentId) updateData.assigned_agent_id = updates.assignedAgentId;
  if (updates.category) updateData.category = updates.category;
  if (updates.customFields) updateData.custom_fields = updates.customFields;
  updateData.updated_at = new Date();

  const { data, error } = await supabase
    .from('support_tickets')
    .update(updateData)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ticket:', error);
    return null;
  }

  return data
    ? {
        id: data.id,
        userId: data.user_id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        assignedAgentId: data.assigned_agent_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
        firstResponseTime: data.first_response_time,
        resolutionTime: data.resolution_time,
        customFields: data.custom_fields,
      }
    : null;
}

export async function closeTicket(ticketId: string): Promise<boolean> {
  const { error } = await supabase
    .from('support_tickets')
    .update({
      status: 'closed',
      resolved_at: new Date(),
      updated_at: new Date(),
    })
    .eq('id', ticketId);

  if (error) {
    console.error('Error closing ticket:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Ticket Conversation Functions
// ============================================================================

export async function getTicketConversations(ticketId: string): Promise<TicketConversation[]> {
  const { data, error } = await supabase
    .from('ticket_conversations')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return (data || []).map((conv: any) => ({
    id: conv.id,
    ticketId: conv.ticket_id,
    userId: conv.user_id,
    senderType: conv.sender_type,
    senderName: conv.sender_name,
    senderEmail: conv.sender_email,
    message: conv.message,
    isInternal: conv.is_internal,
    attachments: conv.attachments,
    createdAt: new Date(conv.created_at),
    updatedAt: conv.updated_at ? new Date(conv.updated_at) : undefined,
  }));
}

export async function addTicketConversation(
  ticketId: string,
  userId: string,
  messageData: {
    senderType: 'customer' | 'agent' | 'system';
    senderName: string;
    senderEmail?: string;
    message: string;
    isInternal?: boolean;
    attachments?: Array<{ id: string; url: string; fileName: string; fileSize: number; mimeType: string }>;
  }
): Promise<TicketConversation | null> {
  const { data, error } = await supabase
    .from('ticket_conversations')
    .insert([
      {
        ticket_id: ticketId,
        user_id: userId,
        sender_type: messageData.senderType,
        sender_name: messageData.senderName,
        sender_email: messageData.senderEmail,
        message: messageData.message,
        is_internal: messageData.isInternal || false,
        attachments: messageData.attachments || null,
        created_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding conversation:', error);
    return null;
  }

  return data
    ? {
        id: data.id,
        ticketId: data.ticket_id,
        userId: data.user_id,
        senderType: data.sender_type,
        senderName: data.sender_name,
        senderEmail: data.sender_email,
        message: data.message,
        isInternal: data.is_internal,
        attachments: data.attachments,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      }
    : null;
}

// ============================================================================
// Support Agent Functions
// ============================================================================

export async function getAgents(userId: string): Promise<SupportAgent[]> {
  const { data, error } = await supabase
    .from('support_agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
    return [];
  }

  return (data || []).map((agent: any) => ({
    id: agent.id,
    userId: agent.user_id,
    agentName: agent.agent_name,
    agentEmail: agent.agent_email,
    department: agent.department,
    skills: agent.skills || [],
    status: agent.status,
    currentChats: agent.current_chats,
    maxConcurrentChats: agent.max_concurrent_chats,
    totalTicketsResolved: agent.total_tickets_resolved,
    averageResolutionTime: agent.average_resolution_time,
    averageRating: agent.average_rating,
    responseTimeAverage: agent.response_time_average,
    createdAt: new Date(agent.created_at),
    updatedAt: new Date(agent.updated_at),
    lastActivityAt: agent.last_activity_at ? new Date(agent.last_activity_at) : undefined,
  }));
}

export async function updateAgentStatus(agentId: string, status: AgentStatus): Promise<boolean> {
  const { error } = await supabase
    .from('support_agents')
    .update({
      status,
      last_activity_at: new Date(),
      updated_at: new Date(),
    })
    .eq('id', agentId);

  if (error) {
    console.error('Error updating agent status:', error);
    return false;
  }

  return true;
}

export async function assignTicketToAgent(
  ticketId: string,
  agentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('support_tickets')
    .update({
      assigned_agent_id: agentId,
      status: 'in_progress',
      updated_at: new Date(),
    })
    .eq('id', ticketId);

  if (error) {
    console.error('Error assigning ticket:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Live Chat Session Functions
// ============================================================================

export async function startChatSession(
  userId: string,
  visitorData: {
    visitorId: string;
    visitorName: string;
    visitorEmail?: string;
    visitorIp?: string;
    visitorBrowser?: string;
  }
): Promise<LiveChatSession | null> {
  const { data, error } = await supabase
    .from('live_chat_sessions')
    .insert([
      {
        user_id: userId,
        visitor_id: visitorData.visitorId,
        visitor_name: visitorData.visitorName,
        visitor_email: visitorData.visitorEmail,
        status: 'waiting',
        visitor_ip: visitorData.visitorIp,
        visitor_browser: visitorData.visitorBrowser,
        session_start_time: new Date(),
        message_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error starting chat session:', error);
    return null;
  }

  return data
    ? {
        id: data.id,
        userId: data.user_id,
        visitorId: data.visitor_id,
        visitorName: data.visitor_name,
        visitorEmail: data.visitor_email,
        status: data.status,
        assignedAgentId: data.assigned_agent_id,
        transferredFromAgentId: data.transferred_from_agent_id,
        visitorIp: data.visitor_ip,
        visitorBrowser: data.visitor_browser,
        sessionStartTime: new Date(data.session_start_time),
        sessionEndTime: data.session_end_time ? new Date(data.session_end_time) : undefined,
        totalMessages: data.total_messages,
        messageCount: data.message_count,
        duration: data.duration,
        rating: data.rating,
        feedback: data.feedback,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    : null;
}

export async function getActiveChatSessions(userId: string): Promise<LiveChatSession[]> {
  const { data, error } = await supabase
    .from('live_chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('session_start_time', { ascending: false });

  if (error) {
    console.error('Error fetching active chats:', error);
    return [];
  }

  return (data || []).map((session: any) => ({
    id: session.id,
    userId: session.user_id,
    visitorId: session.visitor_id,
    visitorName: session.visitor_name,
    visitorEmail: session.visitor_email,
    status: session.status,
    assignedAgentId: session.assigned_agent_id,
    transferredFromAgentId: session.transferred_from_agent_id,
    visitorIp: session.visitor_ip,
    visitorBrowser: session.visitor_browser,
    sessionStartTime: new Date(session.session_start_time),
    sessionEndTime: session.session_end_time ? new Date(session.session_end_time) : undefined,
    totalMessages: session.total_messages,
    messageCount: session.message_count,
    duration: session.duration,
    rating: session.rating,
    feedback: session.feedback,
    createdAt: new Date(session.created_at),
    updatedAt: new Date(session.updated_at),
  }));
}

export async function endChatSession(sessionId: string, duration?: number): Promise<boolean> {
  const { error } = await supabase
    .from('live_chat_sessions')
    .update({
      status: 'closed',
      session_end_time: new Date(),
      duration: duration,
      updated_at: new Date(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error ending chat session:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Chat Message Functions
// ============================================================================

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }

  return (data || []).map((msg: any) => ({
    id: msg.id,
    sessionId: msg.session_id,
    userId: msg.user_id,
    senderType: msg.sender_type,
    senderName: msg.sender_name,
    message: msg.message,
    attachmentUrl: msg.attachment_url,
    attachmentType: msg.attachment_type,
    isRead: msg.is_read,
    readAt: msg.read_at ? new Date(msg.read_at) : undefined,
    createdAt: new Date(msg.created_at),
  }));
}

export async function addChatMessage(
  sessionId: string,
  userId: string,
  messageData: {
    senderType: 'customer' | 'agent' | 'system';
    senderName: string;
    message: string;
    attachmentUrl?: string;
    attachmentType?: string;
  }
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([
      {
        session_id: sessionId,
        user_id: userId,
        sender_type: messageData.senderType,
        sender_name: messageData.senderName,
        message: messageData.message,
        attachment_url: messageData.attachmentUrl,
        attachment_type: messageData.attachmentType,
        is_read: false,
        created_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding chat message:', error);
    return null;
  }

  return data
    ? {
        id: data.id,
        sessionId: data.session_id,
        userId: data.user_id,
        senderType: data.sender_type,
        senderName: data.sender_name,
        message: data.message,
        attachmentUrl: data.attachment_url,
        attachmentType: data.attachment_type,
        isRead: data.is_read,
        readAt: data.read_at ? new Date(data.read_at) : undefined,
        createdAt: new Date(data.created_at),
      }
    : null;
}

// ============================================================================
// Canned Response Functions
// ============================================================================

export async function getCannedResponses(userId: string): Promise<CannedResponse[]> {
  const { data, error } = await supabase
    .from('canned_responses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching canned responses:', error);
    return [];
  }

  return (data || []).map((resp: any) => ({
    id: resp.id,
    userId: resp.user_id,
    responseTitle: resp.response_title,
    responseContent: resp.response_content,
    shortcutKey: resp.shortcut_key,
    category: resp.category,
    usageCount: resp.usage_count,
    lastUsedAt: resp.last_used_at ? new Date(resp.last_used_at) : undefined,
    createdAt: new Date(resp.created_at),
    updatedAt: new Date(resp.updated_at),
  }));
}

export async function createCannedResponse(
  userId: string,
  responseData: {
    responseTitle: string;
    responseContent: string;
    shortcutKey?: string;
    category: string;
  }
): Promise<CannedResponse | null> {
  const { data, error } = await supabase
    .from('canned_responses')
    .insert([
      {
        user_id: userId,
        response_title: responseData.responseTitle,
        response_content: responseData.responseContent,
        shortcut_key: responseData.shortcutKey,
        category: responseData.category,
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating canned response:', error);
    return null;
  }

  return data
    ? {
        id: data.id,
        userId: data.user_id,
        responseTitle: data.response_title,
        responseContent: data.response_content,
        shortcutKey: data.shortcut_key,
        category: data.category,
        usageCount: data.usage_count,
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    : null;
}

export async function useCannedResponse(responseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('canned_responses')
    .update({
      usage_count: supabase.rpc('increment', { id: responseId }),
      last_used_at: new Date(),
    })
    .eq('id', responseId);

  if (error) {
    console.error('Error updating canned response usage:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Support Dashboard Functions
// ============================================================================

export async function getSupportDashboardData(userId: string): Promise<SupportDashboardData> {
  try {
    const [
      ticketsResult,
      chatsResult,
      agentsResult,
      analyticsResult,
      feedbackResult,
    ] = await Promise.all([
      supabase
        .from('support_tickets')
        .select('*', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('live_chat_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('support_agents')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('support_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('analytics_date', { ascending: false })
        .limit(1),
      supabase
        .from('ticket_feedback')
        .select('rating')
        .eq('user_id', userId),
    ]);

    const tickets = ticketsResult.data || [];
    const chats = chatsResult.data || [];
    const agents = agentsResult.data || [];
    const analytics = analyticsResult.data?.[0];
    const feedback = feedbackResult.data || [];

    const openTickets = tickets.filter((t: any) => t.status === 'open').length;
    const resolvedTickets = tickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length;
    const activeChats = chats.filter((c: any) => c.status === 'active').length;
    const availableAgents = agents.filter((a: any) => a.status === 'available').length;

    const avgSatisfactionScore = feedback.length > 0
      ? feedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedback.length
      : 0;

    const ticketsByStatus = tickets.reduce((acc: Record<string, number>, t: any) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    const ticketsByPriority = tickets.reduce((acc: Record<string, number>, t: any) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});

    const ticketsByCategory = tickets.reduce((acc: Record<string, number>, t: any) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    const agentAvailability = agents.reduce((acc: Record<string, number>, a: any) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    const ticketsCreatedToday = tickets.filter((t: any) => {
      const createdDate = new Date(t.created_at).toDateString();
      const today = new Date().toDateString();
      return createdDate === today;
    }).length;

    const chatsStartedToday = chats.filter((c: any) => {
      const startDate = new Date(c.session_start_time).toDateString();
      const today = new Date().toDateString();
      return startDate === today;
    }).length;

    const topAgents = agents
      .sort((a: any, b: any) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, 5)
      .map((agent: any) => ({
        id: agent.id,
        userId: agent.user_id,
        agentName: agent.agent_name,
        agentEmail: agent.agent_email,
        department: agent.department,
        skills: agent.skills || [],
        status: agent.status,
        currentChats: agent.current_chats,
        maxConcurrentChats: agent.max_concurrent_chats,
        totalTicketsResolved: agent.total_tickets_resolved,
        averageResolutionTime: agent.average_resolution_time,
        averageRating: agent.average_rating,
        responseTimeAverage: agent.response_time_average,
        createdAt: new Date(agent.created_at),
        updatedAt: new Date(agent.updated_at),
        lastActivityAt: agent.last_activity_at ? new Date(agent.last_activity_at) : undefined,
      }));

    const recentTickets = tickets
      .slice(0, 10)
      .map((ticket: any) => ({
        id: ticket.id,
        userId: ticket.user_id,
        customerName: ticket.customer_name,
        customerEmail: ticket.customer_email,
        customerPhone: ticket.customer_phone,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        assignedAgentId: ticket.assigned_agent_id,
        createdAt: new Date(ticket.created_at),
        updatedAt: new Date(ticket.updated_at),
        resolvedAt: ticket.resolved_at ? new Date(ticket.resolved_at) : undefined,
        firstResponseTime: ticket.first_response_time,
        resolutionTime: ticket.resolution_time,
        customFields: ticket.custom_fields,
      }));

    return {
      totalTickets: ticketsResult.count || 0,
      openTickets,
      resolvedTickets,
      totalChats: chatsResult.count || 0,
      activeChats,
      totalAgents: agents.length,
      availableAgents,
      averageResolutionTime: analytics?.average_resolution_time || 0,
      averageFirstResponseTime: analytics?.average_first_response_time || 0,
      customerSatisfactionScore: avgSatisfactionScore,
      averageChatDuration: analytics?.average_chat_duration || 0,
      ticketsCreatedToday,
      chatsStartedToday,
      recentTickets,
      topAgents,
      ticketsByStatus,
      ticketsByPriority,
      ticketsByCategory,
      agentAvailability,
      satisfactionTrendLastWeek: Array(7).fill(0),
      ticketVolumeTrendLastWeek: Array(7).fill(0),
    };
  } catch (error) {
    console.error('Error fetching support dashboard data:', error);
    return {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      totalChats: 0,
      activeChats: 0,
      totalAgents: 0,
      availableAgents: 0,
      averageResolutionTime: 0,
      averageFirstResponseTime: 0,
      customerSatisfactionScore: 0,
      averageChatDuration: 0,
      ticketsCreatedToday: 0,
      chatsStartedToday: 0,
      recentTickets: [],
      topAgents: [],
      ticketsByStatus: {},
      ticketsByPriority: {},
      ticketsByCategory: {},
      agentAvailability: {},
      satisfactionTrendLastWeek: Array(7).fill(0),
      ticketVolumeTrendLastWeek: Array(7).fill(0),
    };
  }
}
