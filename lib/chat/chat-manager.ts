/**
 * Chat Manager
 * Core chat management system with WebSocket support
 */

import type {
  Conversation,
  Message,
  Agent,
  ConversationStatus,
  AgentStatus,
  TypingIndicator,
  ChatEvent,
  RoutingRule,
  ConversationFilters,
} from './types';
import {
  createConversation,
  getConversation,
  getConversations,
  updateConversation,
  createMessage,
  getMessages,
  markMessageAsRead,
  getAgent,
  getAgents,
  updateAgent,
} from './database';

// WebSocket connection management
interface WebSocketConnection {
  conversationId: string;
  userId: string;
  userType: 'customer' | 'agent';
  socket: WebSocket;
  lastActivity: Date;
}

class ChatManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private routingRules: RoutingRule[] = [];

  // ==================== CONVERSATION MANAGEMENT ====================

  /**
   * Start a new conversation (visitor mode)
   */
  async startConversation(params: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    channel: 'web' | 'mobile' | 'email';
    subject?: string;
    metadata?: Record<string, any>;
  }): Promise<Conversation> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      customerId: params.customerId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      status: 'queued',
      channel: params.channel,
      subject: params.subject,
      tags: [],
      metadata: params.metadata,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await createConversation(conversation);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    // Try to auto-assign an agent
    await this.tryAssignAgent(result.data.id);

    return result.data;
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string): Promise<Conversation | null> {
    const result = await getConversation(conversationId);
    return result.success ? result.data : null;
  }

  /**
   * Get conversations with filters
   */
  async getConversationsList(filters?: ConversationFilters): Promise<Conversation[]> {
    const result = await getConversations(filters);
    return result.success ? result.data : [];
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(
    conversationId: string,
    status: ConversationStatus
  ): Promise<Conversation> {
    const updates: Partial<Conversation> = { status };

    if (status === 'resolved') {
      updates.resolvedAt = new Date();
    } else if (status === 'closed') {
      updates.closedAt = new Date();
    }

    const result = await updateConversation(conversationId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    // Broadcast status change
    this.broadcastEvent({
      type: 'status_change',
      conversationId,
      data: { status },
      timestamp: new Date(),
    });

    return result.data;
  }

  /**
   * Assign conversation to an agent
   */
  async assignToAgent(conversationId: string, agentId: string): Promise<Conversation> {
    const agentResult = await getAgent(agentId);
    if (!agentResult.success) {
      throw new Error('Agent not found');
    }

    const agent = agentResult.data;

    // Check if agent can take more chats
    if (agent.activeChats >= agent.maxConcurrentChats) {
      throw new Error('Agent has reached maximum concurrent chats');
    }

    const updates: Partial<Conversation> = {
      agentId: agent.id,
      agentName: agent.name,
      status: 'active',
      assignedAt: new Date(),
    };

    const result = await updateConversation(conversationId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    // Update agent's active chats count
    await updateAgent(agentId, {
      activeChats: agent.activeChats + 1,
      totalChats: agent.totalChats + 1,
    });

    // Broadcast assignment
    this.broadcastEvent({
      type: 'agent_assigned',
      conversationId,
      data: { agentId, agentName: agent.name },
      timestamp: new Date(),
    });

    return result.data;
  }

  /**
   * Try to auto-assign an agent based on routing rules
   */
  private async tryAssignAgent(conversationId: string): Promise<void> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return;

    // Get available agents
    const result = await getAgents({ status: 'online' });
    if (!result.success || result.data.length === 0) {
      return; // No agents available
    }

    const agents = result.data;

    // Apply routing rules
    let selectedAgent: Agent | null = null;

    // 1. Try skill-based routing
    if (conversation.tags && conversation.tags.length > 0) {
      selectedAgent = agents.find((agent) =>
        conversation.tags.some((tag) => agent.skills.includes(tag))
      ) || null;
    }

    // 2. Fallback to least busy agent
    if (!selectedAgent) {
      selectedAgent = agents.reduce((prev, current) =>
        prev.activeChats < current.activeChats ? prev : current
      );
    }

    // Assign to selected agent if available
    if (selectedAgent && selectedAgent.activeChats < selectedAgent.maxConcurrentChats) {
      await this.assignToAgent(conversationId, selectedAgent.id);
    }
  }

  // ==================== MESSAGE MANAGEMENT ====================

  /**
   * Send a message
   */
  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderType: 'customer' | 'agent' | 'system';
    content: string;
    messageType?: 'text' | 'image' | 'file' | 'system';
    attachments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
    metadata?: Record<string, any>;
  }): Promise<Message> {
    const message: Message = {
      id: crypto.randomUUID(),
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderName: params.senderName,
      senderType: params.senderType,
      messageType: params.messageType || 'text',
      content: params.content,
      attachments: params.attachments,
      metadata: params.metadata,
      createdAt: new Date(),
    };

    const result = await createMessage(message);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    // Broadcast message to all connected clients
    this.broadcastEvent({
      type: 'message',
      conversationId: params.conversationId,
      data: result.data,
      timestamp: new Date(),
    });

    // Stop typing indicator
    this.stopTyping(params.conversationId, params.senderId);

    return result.data;
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
    limit?: number,
    offset?: number
  ): Promise<Message[]> {
    const result = await getMessages(conversationId, limit, offset);
    return result.success ? result.data : [];
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    const result = await markMessageAsRead(messageId);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    // Broadcast read receipt
    this.broadcastEvent({
      type: 'read',
      conversationId: result.data.conversationId,
      data: { messageId },
      timestamp: new Date(),
    });
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<void> {
    const messages = await this.getConversationMessages(conversationId);
    const unreadMessages = messages.filter((msg) => !msg.readAt);

    for (const message of unreadMessages) {
      await this.markAsRead(message.id);
    }
  }

  // ==================== TYPING INDICATORS ====================

  /**
   * Start typing indicator
   */
  startTyping(conversationId: string, userId: string, userName: string): void {
    // Clear existing timeout
    const key = `${conversationId}:${userId}`;
    const existingTimeout = this.typingTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Broadcast typing indicator
    this.broadcastEvent({
      type: 'typing',
      conversationId,
      data: { userId, userName, isTyping: true } as TypingIndicator,
      timestamp: new Date(),
    });

    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      this.stopTyping(conversationId, userId);
    }, 3000);

    this.typingTimeouts.set(key, timeout);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string, userId: string): void {
    const key = `${conversationId}:${userId}`;
    const timeout = this.typingTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(key);
    }

    // Broadcast typing stopped
    this.broadcastEvent({
      type: 'typing',
      conversationId,
      data: { userId, isTyping: false } as TypingIndicator,
      timestamp: new Date(),
    });
  }

  // ==================== AGENT MANAGEMENT ====================

  /**
   * Get agent queue (pending conversations)
   */
  async getAgentQueue(agentId?: string): Promise<Conversation[]> {
    const filters: ConversationFilters = { status: 'queued' };
    return await this.getConversationsList(filters);
  }

  /**
   * Get active chats for an agent
   */
  async getAgentActiveChats(agentId: string): Promise<Conversation[]> {
    const filters: ConversationFilters = {
      agentId,
      status: 'active',
    };
    return await this.getConversationsList(filters);
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<Agent> {
    const updates: Partial<Agent> = {
      status,
      lastActiveAt: new Date(),
    };

    const result = await updateAgent(agentId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  /**
   * Get online agents
   */
  async getOnlineAgents(): Promise<Agent[]> {
    const result = await getAgents({ status: 'online' });
    return result.success ? result.data : [];
  }

  // ==================== WEBSOCKET MANAGEMENT ====================

  /**
   * Register WebSocket connection
   */
  registerConnection(
    conversationId: string,
    userId: string,
    userType: 'customer' | 'agent',
    socket: WebSocket
  ): void {
    const connection: WebSocketConnection = {
      conversationId,
      userId,
      userType,
      socket,
      lastActivity: new Date(),
    };

    const key = `${conversationId}:${userId}`;
    this.connections.set(key, connection);
  }

  /**
   * Unregister WebSocket connection
   */
  unregisterConnection(conversationId: string, userId: string): void {
    const key = `${conversationId}:${userId}`;
    this.connections.delete(key);
  }

  /**
   * Broadcast event to all connections in a conversation
   */
  private broadcastEvent(event: ChatEvent): void {
    this.connections.forEach((connection) => {
      if (connection.conversationId === event.conversationId) {
        try {
          if (connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.send(JSON.stringify(event));
          }
        } catch (error) {
          console.error('Error broadcasting event:', error);
        }
      }
    });
  }

  // ==================== SEARCH ====================

  /**
   * Search conversations by keyword
   */
  async searchConversations(query: string, filters?: ConversationFilters): Promise<Conversation[]> {
    // This would typically use full-text search in the database
    // For now, we'll do a simple filter
    const conversations = await this.getConversationsList(filters);

    const lowerQuery = query.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.customerName.toLowerCase().includes(lowerQuery) ||
        conv.customerEmail?.toLowerCase().includes(lowerQuery) ||
        conv.subject?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Search messages by keyword
   */
  async searchMessages(conversationId: string, query: string): Promise<Message[]> {
    const messages = await this.getConversationMessages(conversationId);
    const lowerQuery = query.toLowerCase();

    return messages.filter((msg) => msg.content.toLowerCase().includes(lowerQuery));
  }

  // ==================== CONVERSATION TRANSFER ====================

  /**
   * Transfer conversation to another agent
   */
  async transferConversation(
    conversationId: string,
    fromAgentId: string,
    toAgentId: string
  ): Promise<Conversation> {
    // Decrease active chats for current agent
    const fromAgent = await getAgent(fromAgentId);
    if (fromAgent.success) {
      await updateAgent(fromAgentId, {
        activeChats: Math.max(0, fromAgent.data.activeChats - 1),
      });
    }

    // Assign to new agent
    const conversation = await this.assignToAgent(conversationId, toAgentId);

    // Send system message about transfer
    await this.sendMessage({
      conversationId,
      senderId: 'system',
      senderName: 'System',
      senderType: 'system',
      content: `Conversation transferred to ${conversation.agentName}`,
      messageType: 'system',
    });

    return conversation;
  }

  // ==================== CONVERSATION HISTORY ====================

  /**
   * Get conversation history for a customer
   */
  async getCustomerHistory(customerId: string, limit = 10): Promise<Conversation[]> {
    const filters: ConversationFilters = {
      customerId,
      limit,
    };
    return await this.getConversationsList(filters);
  }

  /**
   * Get conversation with full message history
   */
  async getConversationWithMessages(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  } | null> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return null;

    const messages = await this.getConversationMessages(conversationId);

    return {
      conversation,
      messages,
    };
  }
}

// Singleton instance
let chatManagerInstance: ChatManager | null = null;

export function getChatManager(): ChatManager {
  if (!chatManagerInstance) {
    chatManagerInstance = new ChatManager();
  }
  return chatManagerInstance;
}

export { ChatManager };
