/**
 * Agent Dashboard
 * Shows queue, active chats, and conversation management
 */

'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Filter,
  Search,
} from 'lucide-react';

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  status: 'queued' | 'active' | 'resolved' | 'closed';
  channel: 'web' | 'mobile' | 'email';
  subject?: string;
  startedAt: Date;
  assignedAt?: Date;
  lastMessage?: {
    content: string;
    createdAt: Date;
  };
  unreadCount?: number;
}

interface AgentDashboardProps {
  agentId: string;
  agentName: string;
}

export default function AgentDashboard({ agentId, agentName }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'active' | 'resolved'>('queue');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations based on tab
  const fetchConversations = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/chat/queue';
      const params = new URLSearchParams();

      if (activeTab === 'active') {
        endpoint = '/api/chat/conversations';
        params.append('agentId', agentId);
        params.append('status', 'active');
      } else if (activeTab === 'resolved') {
        endpoint = '/api/chat/conversations';
        params.append('agentId', agentId);
        params.append('status', 'resolved');
      }

      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();

      if (data.success) {
        const convs = (data.queue || data.conversations || []).map((conv: any) => ({
          ...conv,
          startedAt: new Date(conv.startedAt),
          assignedAt: conv.assignedAt ? new Date(conv.assignedAt) : undefined,
          lastMessage: conv.lastMessage
            ? {
                ...conv.lastMessage,
                createdAt: new Date(conv.lastMessage.createdAt),
              }
            : undefined,
        }));
        setConversations(convs);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [activeTab, agentId]);

  // Accept conversation from queue
  const acceptConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchConversations();
        setActiveTab('active');
      }
    } catch (error) {
      console.error('Error accepting conversation:', error);
    }
  };

  // Resolve conversation
  const resolveConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      const data = await response.json();
      if (data.success) {
        fetchConversations();
      }
    } catch (error) {
      console.error('Error resolving conversation:', error);
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'active':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chat Dashboard</h2>
            <p className="text-gray-600">Agent: {agentName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              Online
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'queue'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Queue ({conversations.filter((c) => c.status === 'queued').length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Chats ({conversations.filter((c) => c.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'resolved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {!loading && filteredConversations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No conversations found</p>
          </div>
        )}

        {!loading &&
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedConversation === conversation.id ? 'border-blue-500' : 'border-gray-200'
              }`}
              onClick={() => setSelectedConversation(conversation.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {conversation.customerName}
                    </span>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  {conversation.customerEmail && (
                    <p className="text-sm text-gray-600 mb-1">{conversation.customerEmail}</p>
                  )}
                  {conversation.subject && (
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {conversation.subject}
                    </p>
                  )}
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(conversation.status)}
                      <span className="capitalize">{conversation.status}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{conversation.startedAt.toLocaleTimeString()}</span>
                    </span>
                    <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">
                      {conversation.channel}
                    </span>
                  </div>
                </div>

                {activeTab === 'queue' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptConversation(conversation.id);
                    }}
                    className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Accept
                  </button>
                )}

                {activeTab === 'active' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resolveConversation(conversation.id);
                    }}
                    className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
