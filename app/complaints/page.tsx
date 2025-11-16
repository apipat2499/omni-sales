'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, MessageSquare, TrendingUp, RefreshCw, Filter } from 'lucide-react';

interface ComplaintData {
  id: string;
  complaintTicketId: string;
  subject: string;
  complaintStatus: string;
  priority: string;
  createdAt: string;
  customerId: string;
  satisfactionRating?: number;
}

interface ComplaintStatistics {
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number;
  averageSatisfactionRating: number;
  averageResolutionTime: number;
  escalationRate: number;
  topComplaintType: string;
  customerSatisfactionScore: number;
}

export default function ComplaintsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [stats, setStats] = useState<ComplaintStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user-1' : 'user-1';

  useEffect(() => {
    fetchData();
  }, [userId, activeTab, filterPriority]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      let statusFilter = undefined;
      if (activeTab === 'open') statusFilter = 'open';
      else if (activeTab === 'resolved') statusFilter = 'resolved';

      // Fetch complaints with stats
      const url = new URL('/api/complaints', window.location.origin);
      url.searchParams.set('userId', userId);
      url.searchParams.set('includeStats', 'true');
      if (statusFilter) url.searchParams.set('status', statusFilter);
      if (filterPriority) url.searchParams.set('priority', filterPriority);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch complaints');
      const data = await res.json();
      setComplaints(data.data || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-red-600 dark:text-red-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'resolved':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const kpiCards = [
    {
      title: 'Total Complaints',
      value: stats?.totalComplaints || 0,
      icon: AlertCircle,
      color: 'bg-blue-500',
    },
    {
      title: 'Open Complaints',
      value: stats?.openComplaints || 0,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'Resolved',
      value: `${Math.round(stats?.resolutionRate || 0)}%`,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Satisfaction',
      value: stats?.averageSatisfactionRating.toFixed(1) || '0',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500 p-2">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold dark:text-white">Complaints Management</h1>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-600 dark:text-gray-400">Loading complaints...</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              {kpiCards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                        <p className="mt-2 text-3xl font-bold dark:text-white">{card.value}</p>
                      </div>
                      <div className={`${card.color} rounded-lg p-3`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filters and Tabs */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {['All', 'Open', 'Resolved'].map((tab) => (
                  <button
                    key={tab.toLowerCase()}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                      activeTab === tab.toLowerCase()
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <select
                  value={filterPriority || ''}
                  onChange={(e) => setFilterPriority(e.target.value || null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Complaints List */}
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                        Ticket
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                        Priority
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                        Rating
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length > 0 ? (
                      complaints.map((complaint) => (
                        <tr
                          key={complaint.id}
                          className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {complaint.complaintTicketId}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                            {complaint.subject}
                          </td>
                          <td className={`px-6 py-4 font-medium ${getStatusColor(complaint.complaintStatus)}`}>
                            {complaint.complaintStatus}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block rounded px-3 py-1 text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {complaint.satisfactionRating ? (
                              <span className="text-gray-900 dark:text-white">
                                ★ {complaint.satisfactionRating}/5
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                          No complaints found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statistics Summary */}
            {stats && (
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg Resolution Time:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats.averageResolutionTime.toFixed(1)} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Escalation Rate:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats.escalationRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Customer Satisfaction</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Overall Score:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stats.customerSatisfactionScore.toFixed(2)}/5.0
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(stats.customerSatisfactionScore / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
