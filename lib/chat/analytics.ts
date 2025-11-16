/**
 * Chat Analytics Service
 * Performance metrics and reporting for chat and support
 */

import type {
  ChatAnalytics,
  AgentMetrics,
  TeamMetrics,
  Conversation,
  Ticket,
  Agent,
} from './types';
import { getConversations, getTickets, getAgents, getMessages } from './database';

export class ChatAnalyticsService {
  // ==================== AGENT PERFORMANCE ====================

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(
    agentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AgentMetrics> {
    const conversations = await getConversations({
      agentId,
      dateFrom: startDate,
      dateTo: endDate,
    });

    if (!conversations.success) {
      throw new Error('Failed to fetch conversations');
    }

    const convs = conversations.data;
    const totalConversations = convs.length;
    const activeConversations = convs.filter((c) => c.status === 'active').length;
    const resolvedConversations = convs.filter((c) => c.status === 'resolved').length;

    // Calculate response times
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const conv of convs) {
      const messages = await getMessages(conv.id);
      if (messages.success && messages.data.length > 0) {
        const sortedMessages = messages.data.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        // Find first customer message
        const firstCustomerMsg = sortedMessages.find((m) => m.senderType === 'customer');
        // Find first agent response
        const firstAgentMsg = sortedMessages.find((m) => m.senderType === 'agent');

        if (firstCustomerMsg && firstAgentMsg) {
          const responseTime =
            firstAgentMsg.createdAt.getTime() - firstCustomerMsg.createdAt.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }

    // Calculate resolution times
    let totalResolutionTime = 0;
    let resolutionCount = 0;

    for (const conv of convs) {
      if (conv.resolvedAt) {
        const resolutionTime =
          new Date(conv.resolvedAt).getTime() - new Date(conv.startedAt).getTime();
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }
    }

    // Get agent info
    const agentResult = await getAgents();
    const agent = agentResult.success
      ? agentResult.data.find((a) => a.id === agentId)
      : null;

    // Calculate messages per conversation
    let totalMessages = 0;
    for (const conv of convs) {
      const messages = await getMessages(conv.id);
      if (messages.success) {
        totalMessages += messages.data.length;
      }
    }

    return {
      agentId,
      agentName: agent?.name || 'Unknown',
      period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      totalConversations,
      activeConversations,
      resolvedConversations,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0, // seconds
      averageResolutionTime:
        resolutionCount > 0 ? totalResolutionTime / resolutionCount / 1000 / 60 : 0, // minutes
      customerSatisfactionScore: agent?.averageRating || 0,
      firstContactResolutionRate:
        totalConversations > 0 ? (resolvedConversations / totalConversations) * 100 : 0,
      messagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0,
    };
  }

  /**
   * Get all agents performance comparison
   */
  async getAllAgentsMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<AgentMetrics[]> {
    const agentsResult = await getAgents();
    if (!agentsResult.success) {
      return [];
    }

    const metrics: AgentMetrics[] = [];

    for (const agent of agentsResult.data) {
      try {
        const agentMetrics = await this.getAgentMetrics(agent.id, startDate, endDate);
        metrics.push(agentMetrics);
      } catch (error) {
        console.error(`Error getting metrics for agent ${agent.id}:`, error);
      }
    }

    return metrics.sort((a, b) => b.totalConversations - a.totalConversations);
  }

  // ==================== TEAM PERFORMANCE ====================

  /**
   * Get team performance metrics
   */
  async getTeamMetrics(
    teamId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TeamMetrics> {
    // Get team agents
    const agentsResult = await getAgents({ teamId });
    if (!agentsResult.success) {
      throw new Error('Failed to fetch team agents');
    }

    const agents = agentsResult.data;
    const agentIds = agents.map((a) => a.id);

    // Get all conversations for team agents
    const allConversations: Conversation[] = [];
    for (const agentId of agentIds) {
      const convResult = await getConversations({
        agentId,
        dateFrom: startDate,
        dateTo: endDate,
      });
      if (convResult.success) {
        allConversations.push(...convResult.data);
      }
    }

    // Get queued conversations
    const queuedResult = await getConversations({
      status: 'queued',
      dateFrom: startDate,
      dateTo: endDate,
    });

    const totalConversations = allConversations.length;
    const activeConversations = allConversations.filter((c) => c.status === 'active').length;
    const queuedConversations = queuedResult.success ? queuedResult.data.length : 0;

    // Calculate average wait time
    let totalWaitTime = 0;
    let waitCount = 0;

    for (const conv of allConversations) {
      if (conv.assignedAt) {
        const waitTime =
          new Date(conv.assignedAt).getTime() - new Date(conv.startedAt).getTime();
        totalWaitTime += waitTime;
        waitCount++;
      }
    }

    // Calculate response and resolution times
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseCount = 0;
    let resolutionCount = 0;

    for (const conv of allConversations) {
      if (conv.resolvedAt) {
        const resolutionTime =
          new Date(conv.resolvedAt).getTime() - new Date(conv.startedAt).getTime();
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }

      // Get messages for response time
      const messages = await getMessages(conv.id);
      if (messages.success && messages.data.length > 0) {
        const sortedMessages = messages.data.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const firstCustomerMsg = sortedMessages.find((m) => m.senderType === 'customer');
        const firstAgentMsg = sortedMessages.find((m) => m.senderType === 'agent');

        if (firstCustomerMsg && firstAgentMsg) {
          const responseTime =
            firstAgentMsg.createdAt.getTime() - firstCustomerMsg.createdAt.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }

    // Calculate average satisfaction score
    const totalRating = agents.reduce((sum, agent) => sum + agent.averageRating, 0);
    const avgSatisfaction = agents.length > 0 ? totalRating / agents.length : 0;

    const onlineAgents = agents.filter((a) => a.status === 'online').length;

    return {
      teamId,
      teamName: agents[0]?.teamName || 'Unknown Team',
      period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      totalConversations,
      activeConversations,
      queuedConversations,
      averageWaitTime: waitCount > 0 ? totalWaitTime / waitCount / 1000 : 0, // seconds
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0, // seconds
      averageResolutionTime:
        resolutionCount > 0 ? totalResolutionTime / resolutionCount / 1000 / 60 : 0, // minutes
      customerSatisfactionScore: avgSatisfaction,
      agentCount: agents.length,
      onlineAgentCount: onlineAgents,
    };
  }

  // ==================== GENERAL ANALYTICS ====================

  /**
   * Get overall chat statistics
   */
  async getOverallStats(startDate: Date, endDate: Date): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalTickets: number;
    activeConversations: number;
    queuedConversations: number;
    resolvedConversations: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    customerSatisfactionScore: number;
    topAgents: Array<{ agentId: string; agentName: string; conversations: number }>;
    busiestHours: Array<{ hour: number; count: number }>;
    conversationsByChannel: Record<string, number>;
  }> {
    const conversationsResult = await getConversations({
      dateFrom: startDate,
      dateTo: endDate,
    });

    if (!conversationsResult.success) {
      throw new Error('Failed to fetch conversations');
    }

    const conversations = conversationsResult.data;
    const totalConversations = conversations.length;
    const activeConversations = conversations.filter((c) => c.status === 'active').length;
    const queuedConversations = conversations.filter((c) => c.status === 'queued').length;
    const resolvedConversations = conversations.filter((c) => c.status === 'resolved').length;

    // Get tickets
    const ticketsResult = await getTickets({
      dateFrom: startDate,
      dateTo: endDate,
    });
    const totalTickets = ticketsResult.success ? ticketsResult.data.length : 0;

    // Calculate total messages
    let totalMessages = 0;
    for (const conv of conversations) {
      const messages = await getMessages(conv.id);
      if (messages.success) {
        totalMessages += messages.data.length;
      }
    }

    // Calculate response and resolution times
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseCount = 0;
    let resolutionCount = 0;

    for (const conv of conversations) {
      if (conv.resolvedAt) {
        const resolutionTime =
          new Date(conv.resolvedAt).getTime() - new Date(conv.startedAt).getTime();
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }

      const messages = await getMessages(conv.id);
      if (messages.success && messages.data.length > 0) {
        const sortedMessages = messages.data.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const firstCustomerMsg = sortedMessages.find((m) => m.senderType === 'customer');
        const firstAgentMsg = sortedMessages.find((m) => m.senderType === 'agent');

        if (firstCustomerMsg && firstAgentMsg) {
          const responseTime =
            firstAgentMsg.createdAt.getTime() - firstCustomerMsg.createdAt.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }

    // Get top agents
    const agentConversations: Record<string, { name: string; count: number }> = {};
    for (const conv of conversations) {
      if (conv.agentId && conv.agentName) {
        if (!agentConversations[conv.agentId]) {
          agentConversations[conv.agentId] = { name: conv.agentName, count: 0 };
        }
        agentConversations[conv.agentId].count++;
      }
    }

    const topAgents = Object.entries(agentConversations)
      .map(([agentId, data]) => ({
        agentId,
        agentName: data.name,
        conversations: data.count,
      }))
      .sort((a, b) => b.conversations - a.conversations)
      .slice(0, 5);

    // Busiest hours
    const hourCounts: Record<number, number> = {};
    for (const conv of conversations) {
      const hour = new Date(conv.startedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    const busiestHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    // Conversations by channel
    const conversationsByChannel: Record<string, number> = {};
    for (const conv of conversations) {
      conversationsByChannel[conv.channel] =
        (conversationsByChannel[conv.channel] || 0) + 1;
    }

    // Get average satisfaction score
    const agentsResult = await getAgents();
    const avgSatisfaction = agentsResult.success
      ? agentsResult.data.reduce((sum, agent) => sum + agent.averageRating, 0) /
        agentsResult.data.length
      : 0;

    return {
      totalConversations,
      totalMessages,
      totalTickets,
      activeConversations,
      queuedConversations,
      resolvedConversations,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0,
      averageResolutionTime:
        resolutionCount > 0 ? totalResolutionTime / resolutionCount / 1000 / 60 : 0,
      customerSatisfactionScore: avgSatisfaction,
      topAgents,
      busiestHours,
      conversationsByChannel,
    };
  }

  /**
   * Get time-based analytics (hourly/daily breakdown)
   */
  async getTimeBasedAnalytics(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' = 'day'
  ): Promise<
    Array<{
      timestamp: string;
      conversations: number;
      messages: number;
      averageResponseTime: number;
    }>
  > {
    const conversationsResult = await getConversations({
      dateFrom: startDate,
      dateTo: endDate,
    });

    if (!conversationsResult.success) {
      return [];
    }

    const conversations = conversationsResult.data;
    const timeBuckets: Record<
      string,
      { conversations: number; messages: number; responseTimes: number[] }
    > = {};

    for (const conv of conversations) {
      const date = new Date(conv.startedAt);
      let key: string;

      if (granularity === 'hour') {
        key = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!timeBuckets[key]) {
        timeBuckets[key] = { conversations: 0, messages: 0, responseTimes: [] };
      }

      timeBuckets[key].conversations++;

      // Get messages and calculate response time
      const messages = await getMessages(conv.id);
      if (messages.success) {
        timeBuckets[key].messages += messages.data.length;

        const sortedMessages = messages.data.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const firstCustomerMsg = sortedMessages.find((m) => m.senderType === 'customer');
        const firstAgentMsg = sortedMessages.find((m) => m.senderType === 'agent');

        if (firstCustomerMsg && firstAgentMsg) {
          const responseTime =
            firstAgentMsg.createdAt.getTime() - firstCustomerMsg.createdAt.getTime();
          timeBuckets[key].responseTimes.push(responseTime);
        }
      }
    }

    return Object.entries(timeBuckets)
      .map(([timestamp, data]) => ({
        timestamp,
        conversations: data.conversations,
        messages: data.messages,
        averageResponseTime:
          data.responseTimes.length > 0
            ? data.responseTimes.reduce((a, b) => a + b, 0) /
              data.responseTimes.length /
              1000
            : 0,
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Get common issues/tags analytics
   */
  async getCommonIssues(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ tag: string; count: number; percentage: number }>> {
    const ticketsResult = await getTickets({
      dateFrom: startDate,
      dateTo: endDate,
    });

    if (!ticketsResult.success) {
      return [];
    }

    const tickets = ticketsResult.data;
    const tagCounts: Record<string, number> = {};

    for (const ticket of tickets) {
      for (const tag of ticket.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const total = Object.values(tagCounts).reduce((a, b) => a + b, 0);

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// Singleton instance
let analyticsServiceInstance: ChatAnalyticsService | null = null;

export function getChatAnalyticsService(): ChatAnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new ChatAnalyticsService();
  }
  return analyticsServiceInstance;
}
