/**
 * Floating Chat Widget for Customers
 * Provides live chat interface on web and mobile
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Paperclip, Smile } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  createdAt: Date;
  readAt?: Date;
}

interface ChatWidgetProps {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  onClose?: () => void;
}

export default function ChatWidget({
  customerId,
  customerName,
  customerEmail,
  onClose,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start conversation
  const startConversation = async () => {
    if (conversationId) return;

    setIsConnecting(true);
    try {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          customerName,
          customerEmail,
          channel: 'web',
          subject: 'Customer Support',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setConversationId(data.conversation.id);
        if (data.conversation.agentName) {
          setAgentName(data.conversation.agentName);
        }
        // Connect WebSocket
        connectWebSocket(data.conversation.id);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect WebSocket for real-time updates
  const connectWebSocket = (convId: string) => {
    // In production, use proper WebSocket server
    // This is a placeholder for WebSocket connection
    // wsRef.current = new WebSocket(`ws://localhost:3000/ws/chat/${convId}`);

    // For now, use polling as fallback
    const interval = setInterval(() => {
      fetchMessages(convId);
    }, 3000);

    return () => clearInterval(interval);
  };

  // Fetch messages
  const fetchMessages = async (convId: string) => {
    try {
      const response = await fetch(`/api/chat/${convId}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(
          data.messages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
            readAt: msg.readAt ? new Date(msg.readAt) : undefined,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return;

    const messageContent = inputMessage;
    setInputMessage('');

    try {
      const response = await fetch(`/api/chat/${conversationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: customerId,
          senderName: customerName,
          senderType: 'customer',
          content: messageContent,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            ...data.message,
            createdAt: new Date(data.message.createdAt),
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Toggle chat widget
  const toggleChat = () => {
    if (!isOpen && !conversationId) {
      startConversation();
    }
    setIsOpen(!isOpen);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all z-50"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Customer Support</h3>
              {agentName && <p className="text-sm opacity-90">{agentName}</p>}
              {!agentName && conversationId && (
                <p className="text-sm opacity-90">Waiting for agent...</p>
              )}
            </div>
            <button onClick={toggleChat} className="hover:bg-blue-700 rounded p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {isConnecting && (
              <div className="text-center text-gray-500">
                <p>Connecting you to an agent...</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderType === 'customer' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.senderType === 'customer'
                      ? 'bg-blue-600 text-white'
                      : message.senderType === 'agent'
                      ? 'bg-white text-gray-900 border border-gray-200'
                      : 'bg-gray-200 text-gray-700 text-sm'
                  }`}
                >
                  {message.senderType !== 'customer' && message.senderType !== 'system' && (
                    <p className="text-xs font-semibold mb-1">{message.senderName}</p>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.createdAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex items-center space-x-2">
              <button className="text-gray-500 hover:text-gray-700">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                disabled={!conversationId}
              />
              <button className="text-gray-500 hover:text-gray-700">
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !conversationId}
                className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
