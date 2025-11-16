'use client';

import { useEffect, useState } from 'react';
import {
  Ticket,
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Plus,
  BarChart3,
  Zap,
  CheckCircle,
  User,
} from 'lucide-react';
import type { SupportDashboardData, SupportTicket, SupportAgent } from '@/types';

interface MetricCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  subtext?: string;
}

export default function SupportPage() {
  const [dashboardData, setDashboardData] = useState<SupportDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState('user-1');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/support/dashboard?userId=${userId}`);

      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
        setupMetrics(result.data);
      }
    } catch (error) {
      console.error('Error fetching support data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupMetrics = (data: SupportDashboardData) => {
    const metricsData: MetricCard[] = [
      {
        label: 'Total Tickets',
        value: data.totalTickets,
        icon: Ticket,
        color: 'bg-blue-500',
        subtext: `${data.openTickets} open`,
      },
      {
        label: 'Active Chats',
        value: data.activeChats,
        icon: MessageSquare,
        color: 'bg-green-500',
        subtext: `${data.totalChats} total`,
      },
      {
        label: 'Support Agents',
        value: data.totalAgents,
        icon: Users,
        color: 'bg-purple-500',
        subtext: `${data.availableAgents} available`,
      },
      {
        label: 'Avg Resolution Time',
        value: `${Math.round(data.averageResolutionTime / 60)}h`,
        icon: Clock,
        color: 'bg-orange-500',
      },
      {
        label: 'First Response Time',
        value: `${Math.round(data.averageFirstResponseTime / 60)}m`,
        icon: TrendingUp,
        color: 'bg-yellow-500',
      },
      {
        label: 'Satisfaction Score',
        value: data.customerSatisfactionScore.toFixed(1),
        icon: CheckCircle,
        color: 'bg-pink-500',
        subtext: `/5 stars`,
      },
    ];

    setMetrics(metricsData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Ticket className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading Support System...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Failed to load support data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Support Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage tickets, chats, and support agents
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </h3>
                  <div className={`${metric.color} p-3 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </div>
                {metric.subtext && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {metric.subtext}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tickets */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recent Tickets
                </h2>
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>

              {dashboardData.recentTickets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Subject
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Priority
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentTickets.slice(0, 8).map((ticket: SupportTicket) => {
                        const priorityColors = {
                          low: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
                          medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
                          high: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
                          urgent: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
                        };

                        const statusColors = {
                          open: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
                          in_progress: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
                          waiting_customer: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
                          resolved: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
                          closed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
                        };

                        return (
                          <tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                              {ticket.subject.substring(0, 30)}...
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityColors[ticket.priority]}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusColors[ticket.status]}`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {ticket.customerName}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No tickets yet
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            {/* Top Agents */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Agents
                </h3>
              </div>

              {dashboardData.topAgents.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.topAgents.slice(0, 5).map((agent: SupportAgent) => (
                    <div key={agent.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {agent.agentName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Rating: {agent.averageRating?.toFixed(1) || 'N/A'}/5
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        agent.status === 'available'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : agent.status === 'busy'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No agents assigned
                </p>
              )}
            </div>

            {/* Ticket Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ticket Status
                </h3>
              </div>

              <div className="space-y-3">
                {Object.entries(dashboardData.ticketsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Availability */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Agent Status
                </h3>
              </div>

              <div className="space-y-3">
                {Object.entries(dashboardData.agentAvailability).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Priority Distribution */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Priority Distribution
            </h2>
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(dashboardData.ticketsByPriority).map(([priority, count]) => (
              <div key={priority} className="flex flex-col">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 capitalize">
                  {priority} Priority
                </p>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {count}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    tickets
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
