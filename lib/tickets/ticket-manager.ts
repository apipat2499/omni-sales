/**
 * Ticket Manager
 * Support ticket system with SLA tracking and assignment
 */

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
  Agent,
  TicketFilters,
} from '../chat/types';
import {
  createTicket,
  getTicket,
  getTickets,
  updateTicket,
  getAgent,
  getAgents,
  getConversation,
} from '../chat/database';
import { sendEmail } from '../email/service';
import { sendSMS } from '../sms/service';

// SLA configuration (in hours)
const SLA_CONFIG = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 72,
} as const;

class TicketManager {
  // ==================== TICKET CREATION ====================

  /**
   * Create a new support ticket
   */
  async createNewTicket(params: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    subject: string;
    description: string;
    priority?: TicketPriority;
    category?: string;
    tags?: string[];
    conversationId?: string;
    metadata?: Record<string, any>;
  }): Promise<Ticket> {
    const priority = params.priority || 'medium';
    const slaDueAt = this.calculateSLADueDate(priority);

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      conversationId: params.conversationId,
      customerId: params.customerId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      subject: params.subject,
      description: params.description,
      priority,
      status: 'open',
      category: params.category,
      tags: params.tags || [],
      slaDueAt,
      metadata: params.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await createTicket(ticket);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    // Auto-assign based on priority
    if (priority === 'urgent' || priority === 'high') {
      await this.tryAutoAssign(result.data.id);
    }

    // Send notifications
    await this.sendTicketNotifications(result.data, 'created');

    return result.data;
  }

  /**
   * Create ticket from chat conversation
   */
  async createTicketFromConversation(conversationId: string, params: {
    subject: string;
    description: string;
    priority?: TicketPriority;
    category?: string;
    tags?: string[];
  }): Promise<Ticket> {
    const convResult = await getConversation(conversationId);
    if (!convResult.success) {
      throw new Error('Conversation not found');
    }

    const conversation = convResult.data;

    return await this.createNewTicket({
      conversationId,
      customerId: conversation.customerId,
      customerName: conversation.customerName,
      customerEmail: conversation.customerEmail || '',
      subject: params.subject,
      description: params.description,
      priority: params.priority,
      category: params.category,
      tags: params.tags,
      metadata: {
        source: 'chat',
        agentId: conversation.agentId,
        agentName: conversation.agentName,
      },
    });
  }

  // ==================== TICKET RETRIEVAL ====================

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string): Promise<Ticket | null> {
    const result = await getTicket(ticketId);
    return result.success ? result.data : null;
  }

  /**
   * Get tickets with filters
   */
  async getTicketsList(filters?: TicketFilters): Promise<Ticket[]> {
    const result = await getTickets(filters);
    return result.success ? result.data : [];
  }

  /**
   * Get tickets assigned to an agent
   */
  async getAgentTickets(agentId: string, status?: TicketStatus): Promise<Ticket[]> {
    const filters: TicketFilters = {
      assignedAgentId: agentId,
      status,
    };
    return await this.getTicketsList(filters);
  }

  /**
   * Get tickets by customer
   */
  async getCustomerTickets(customerId: string): Promise<Ticket[]> {
    const allTickets = await this.getTicketsList();
    return allTickets.filter((ticket) => ticket.customerId === customerId);
  }

  /**
   * Get overdue tickets (past SLA)
   */
  async getOverdueTickets(): Promise<Ticket[]> {
    const allTickets = await this.getTicketsList({
      status: 'open',
    });

    const now = new Date();
    return allTickets.filter(
      (ticket) =>
        ticket.slaDueAt && new Date(ticket.slaDueAt) < now && ticket.status !== 'resolved'
    );
  }

  /**
   * Get tickets by priority
   */
  async getTicketsByPriority(priority: TicketPriority): Promise<Ticket[]> {
    return await this.getTicketsList({ priority });
  }

  // ==================== TICKET UPDATES ====================

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<Ticket> {
    const updates: Partial<Ticket> = { status };

    if (status === 'resolved') {
      updates.resolvedAt = new Date();
    } else if (status === 'closed') {
      updates.closedAt = new Date();
    }

    const result = await updateTicket(ticketId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    // Send notification
    await this.sendTicketNotifications(result.data, 'status_updated');

    return result.data;
  }

  /**
   * Update ticket priority
   */
  async updateTicketPriority(ticketId: string, priority: TicketPriority): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const updates: Partial<Ticket> = {
      priority,
      slaDueAt: this.calculateSLADueDate(priority, ticket.createdAt),
    };

    const result = await updateTicket(ticketId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    // Send notification for high priority
    if (priority === 'urgent' || priority === 'high') {
      await this.sendTicketNotifications(result.data, 'priority_updated');
    }

    return result.data;
  }

  /**
   * Assign ticket to agent
   */
  async assignTicketToAgent(ticketId: string, agentId: string): Promise<Ticket> {
    const agentResult = await getAgent(agentId);
    if (!agentResult.success) {
      throw new Error('Agent not found');
    }

    const agent = agentResult.data;
    const updates: Partial<Ticket> = {
      assignedAgentId: agent.id,
      assignedAgentName: agent.name,
      status: 'in_progress',
    };

    const result = await updateTicket(ticketId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    // Send notification
    await this.sendTicketNotifications(result.data, 'assigned');

    return result.data;
  }

  /**
   * Assign ticket to team
   */
  async assignTicketToTeam(ticketId: string, teamId: string, teamName: string): Promise<Ticket> {
    const updates: Partial<Ticket> = {
      assignedTeamId: teamId,
      assignedTeamName: teamName,
      status: 'in_progress',
    };

    const result = await updateTicket(ticketId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  /**
   * Add first response timestamp
   */
  async recordFirstResponse(ticketId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    if (!ticket || ticket.firstResponseAt) {
      throw new Error('Invalid ticket or already has first response');
    }

    const updates: Partial<Ticket> = {
      firstResponseAt: new Date(),
    };

    const result = await updateTicket(ticketId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  /**
   * Add tags to ticket
   */
  async addTicketTags(ticketId: string, tags: string[]): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const uniqueTags = [...new Set([...ticket.tags, ...tags])];
    const updates: Partial<Ticket> = { tags: uniqueTags };

    const result = await updateTicket(ticketId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  /**
   * Remove tags from ticket
   */
  async removeTicketTags(ticketId: string, tagsToRemove: string[]): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const filteredTags = ticket.tags.filter((tag) => !tagsToRemove.includes(tag));
    const updates: Partial<Ticket> = { tags: filteredTags };

    const result = await updateTicket(ticketId, updates);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  // ==================== SLA TRACKING ====================

  /**
   * Calculate SLA due date based on priority
   */
  private calculateSLADueDate(priority: TicketPriority, createdAt?: Date): Date {
    const hours = SLA_CONFIG[priority];
    const start = createdAt || new Date();
    const dueDate = new Date(start);
    dueDate.setHours(dueDate.getHours() + hours);
    return dueDate;
  }

  /**
   * Check if ticket is overdue
   */
  isTicketOverdue(ticket: Ticket): boolean {
    if (!ticket.slaDueAt || ticket.status === 'resolved' || ticket.status === 'closed') {
      return false;
    }
    return new Date() > new Date(ticket.slaDueAt);
  }

  /**
   * Get time remaining until SLA breach
   */
  getTimeUntilSLABreach(ticket: Ticket): number | null {
    if (!ticket.slaDueAt || ticket.status === 'resolved' || ticket.status === 'closed') {
      return null;
    }
    const now = new Date().getTime();
    const dueTime = new Date(ticket.slaDueAt).getTime();
    return Math.max(0, dueTime - now);
  }

  /**
   * Get SLA compliance metrics
   */
  async getSLAMetrics(filters?: TicketFilters): Promise<{
    total: number;
    withinSLA: number;
    breachedSLA: number;
    complianceRate: number;
    averageResponseTime: number;
    averageResolutionTime: number;
  }> {
    const tickets = await this.getTicketsList(filters);
    const total = tickets.length;
    let withinSLA = 0;
    let breachedSLA = 0;
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseCount = 0;
    let resolutionCount = 0;

    for (const ticket of tickets) {
      // Check SLA compliance
      if (ticket.resolvedAt && ticket.slaDueAt) {
        if (new Date(ticket.resolvedAt) <= new Date(ticket.slaDueAt)) {
          withinSLA++;
        } else {
          breachedSLA++;
        }
      }

      // Calculate response time
      if (ticket.firstResponseAt) {
        const responseTime =
          new Date(ticket.firstResponseAt).getTime() - new Date(ticket.createdAt).getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }

      // Calculate resolution time
      if (ticket.resolvedAt) {
        const resolutionTime =
          new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime();
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }
    }

    return {
      total,
      withinSLA,
      breachedSLA,
      complianceRate: total > 0 ? (withinSLA / total) * 100 : 0,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount / 1000 / 60 : 0, // minutes
      averageResolutionTime:
        resolutionCount > 0 ? totalResolutionTime / resolutionCount / 1000 / 60 / 60 : 0, // hours
    };
  }

  // ==================== AUTO-ASSIGNMENT ====================

  /**
   * Try to auto-assign ticket based on rules
   */
  private async tryAutoAssign(ticketId: string): Promise<void> {
    const ticket = await this.getTicketById(ticketId);
    if (!ticket) return;

    // Get available agents
    const result = await getAgents({ status: 'online' });
    if (!result.success || result.data.length === 0) {
      return; // No agents available
    }

    const agents = result.data;

    // 1. Try skill-based assignment
    let selectedAgent: Agent | null = null;
    if (ticket.category) {
      selectedAgent = agents.find((agent) => agent.skills.includes(ticket.category)) || null;
    }

    // 2. Fallback to least busy agent
    if (!selectedAgent) {
      selectedAgent = agents.reduce((prev, current) =>
        prev.activeChats < current.activeChats ? prev : current
      );
    }

    // Assign to selected agent
    if (selectedAgent) {
      await this.assignTicketToAgent(ticketId, selectedAgent.id);
    }
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Send ticket notifications
   */
  private async sendTicketNotifications(
    ticket: Ticket,
    eventType: 'created' | 'assigned' | 'status_updated' | 'priority_updated'
  ): Promise<void> {
    try {
      const subject = this.getNotificationSubject(ticket, eventType);
      const body = this.getNotificationBody(ticket, eventType);

      // Send email to customer
      if (ticket.customerEmail) {
        await sendEmail({
          to: ticket.customerEmail,
          subject,
          body,
          html: body,
        });
      }

      // Send SMS for urgent tickets
      if (ticket.priority === 'urgent' && eventType === 'created') {
        // SMS notification would require customer phone number
        // await sendSMS({ to: customerPhone, message: subject });
      }

      // Notify assigned agent
      if (ticket.assignedAgentId && eventType === 'assigned') {
        const agent = await getAgent(ticket.assignedAgentId);
        if (agent.success && agent.data.email) {
          await sendEmail({
            to: agent.data.email,
            subject: `New ticket assigned: ${ticket.subject}`,
            body: `You have been assigned ticket #${ticket.id}: ${ticket.subject}`,
            html: `You have been assigned ticket #${ticket.id}: ${ticket.subject}`,
          });
        }
      }
    } catch (error) {
      console.error('Error sending ticket notifications:', error);
      // Don't throw - notifications are not critical
    }
  }

  private getNotificationSubject(
    ticket: Ticket,
    eventType: 'created' | 'assigned' | 'status_updated' | 'priority_updated'
  ): string {
    switch (eventType) {
      case 'created':
        return `Support Ticket Created: ${ticket.subject}`;
      case 'assigned':
        return `Ticket Assigned: ${ticket.subject}`;
      case 'status_updated':
        return `Ticket Status Updated: ${ticket.subject}`;
      case 'priority_updated':
        return `Ticket Priority Changed: ${ticket.subject}`;
    }
  }

  private getNotificationBody(
    ticket: Ticket,
    eventType: 'created' | 'assigned' | 'status_updated' | 'priority_updated'
  ): string {
    const ticketInfo = `
Ticket ID: ${ticket.id}
Subject: ${ticket.subject}
Priority: ${ticket.priority}
Status: ${ticket.status}
Created: ${ticket.createdAt.toLocaleString()}
${ticket.slaDueAt ? `SLA Due: ${new Date(ticket.slaDueAt).toLocaleString()}` : ''}
    `.trim();

    switch (eventType) {
      case 'created':
        return `Your support ticket has been created.\n\n${ticketInfo}`;
      case 'assigned':
        return `Your ticket has been assigned to ${ticket.assignedAgentName}.\n\n${ticketInfo}`;
      case 'status_updated':
        return `Your ticket status has been updated to: ${ticket.status}\n\n${ticketInfo}`;
      case 'priority_updated':
        return `Your ticket priority has been changed to: ${ticket.priority}\n\n${ticketInfo}`;
    }
  }

  // ==================== SEARCH ====================

  /**
   * Search tickets by keyword
   */
  async searchTickets(query: string, filters?: TicketFilters): Promise<Ticket[]> {
    const tickets = await this.getTicketsList(filters);
    const lowerQuery = query.toLowerCase();

    return tickets.filter(
      (ticket) =>
        ticket.subject.toLowerCase().includes(lowerQuery) ||
        ticket.description.toLowerCase().includes(lowerQuery) ||
        ticket.customerName.toLowerCase().includes(lowerQuery) ||
        ticket.customerEmail.toLowerCase().includes(lowerQuery) ||
        ticket.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk update ticket status
   */
  async bulkUpdateStatus(ticketIds: string[], status: TicketStatus): Promise<Ticket[]> {
    const results: Ticket[] = [];

    for (const ticketId of ticketIds) {
      try {
        const ticket = await this.updateTicketStatus(ticketId, status);
        results.push(ticket);
      } catch (error) {
        console.error(`Error updating ticket ${ticketId}:`, error);
      }
    }

    return results;
  }

  /**
   * Bulk assign tickets to agent
   */
  async bulkAssignToAgent(ticketIds: string[], agentId: string): Promise<Ticket[]> {
    const results: Ticket[] = [];

    for (const ticketId of ticketIds) {
      try {
        const ticket = await this.assignTicketToAgent(ticketId, agentId);
        results.push(ticket);
      } catch (error) {
        console.error(`Error assigning ticket ${ticketId}:`, error);
      }
    }

    return results;
  }
}

// Singleton instance
let ticketManagerInstance: TicketManager | null = null;

export function getTicketManager(): TicketManager {
  if (!ticketManagerInstance) {
    ticketManagerInstance = new TicketManager();
  }
  return ticketManagerInstance;
}

export { TicketManager };
