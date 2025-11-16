/**
 * Conversation History Component
 * Display past conversations and messages
 */

'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Calendar, User, Search, Filter } from 'lucide-react';

interface Conversation {
  id: string;
  customerName: string;
  customerEmail?: string;
  agentName?: string;
  status: string;
  channel: string;
  subject?: string;
  startedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

interface ConversationHistoryProps {
  customerId?: string;
  agentId?: string;
  limit?: number;
}

export default function ConversationHistory({
  customerId,
  agentId,
  limit = 20,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, [customerId, agentId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', customerId);
      if (agentId) params.append('agentId', agentId);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/chat/conversations?${params}`);
      const data = await response.json();

      if (data.success) {
        const convs = data.conversations.map((conv: any) => ({
          ...conv,
          startedAt: new Date(conv.startedAt),
          resolvedAt: conv.resolvedAt ? new Date(conv.resolvedAt) : undefined,
          closedAt: conv.closedAt ? new Date(conv.closedAt) : undefined,
        }));
        setConversations(convs);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/${conversationId}/messages`);
      const data = await response.json();

      if (data.success) {
        setMessages(
          data.messages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchMessages(conversationId);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar - Conversation List */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Conversation History</h2>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="queued">Queued</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
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
                onClick={() => handleSelectConversation(conversation.id)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conversation.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{conversation.customerName}</p>
                    {conversation.subject && (
                      <p className="text-sm text-gray-600 mt-1">{conversation.subject}</p>
                    )}
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{conversation.startedAt.toLocaleDateString()}</span>
                      </span>
                      {conversation.agentName && (
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{conversation.agentName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      conversation.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : conversation.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {conversation.status}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Main - Messages */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Messages Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {conversations.find((c) => c.id === selectedConversation)?.customerName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {conversations.find((c) => c.id === selectedConversation)?.subject}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderType === 'customer' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.senderType === 'customer'
                        ? 'bg-gray-100 text-gray-900'
                        : message.senderType === 'agent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 text-sm'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1">{message.senderName}</p>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.createdAt.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
