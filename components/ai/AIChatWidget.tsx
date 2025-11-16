'use client';

/**
 * AI Chat Widget Component
 * Floating chat widget for AI-powered customer support
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, User, Bot } from 'lucide-react';
import ConversationDisplay from './ConversationDisplay';
import IntentBadge from './IntentBadge';
import type { ChatbotMessage, ChatResponse } from '@/lib/ai/chatbot/types';

interface AIChatWidgetProps {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  channel?: 'web' | 'whatsapp' | 'messenger' | 'mobile';
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

export default function AIChatWidget({
  customerId,
  customerName,
  customerEmail,
  channel = 'web',
  position = 'bottom-right',
  primaryColor = '#3B82F6',
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Load conversation history when widget opens
  useEffect(() => {
    if (isOpen && customerId && !conversationId) {
      loadConversationHistory();
    }
  }, [isOpen, customerId]);

  // Load conversation history
  const loadConversationHistory = async () => {
    try {
      const response = await fetch(
        `/api/ai/chat/history?customerId=${customerId}&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.conversations && data.conversations.length > 0) {
          const latestConv = data.conversations[0];
          setConversationId(latestConv.conversation.id);

          // Load messages from latest conversation
          const messagesResponse = await fetch(
            `/api/ai/chat/history?conversationId=${latestConv.conversation.id}`
          );

          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            setMessages(messagesData.messages || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatbotMessage = {
      id: `temp_${Date.now()}`,
      conversationId: conversationId || '',
      role: 'user',
      content: inputMessage,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          customerId,
          customerName,
          customerEmail,
          message: inputMessage,
          channel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: ChatResponse = await response.json();

      // Update conversation ID if new
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      // Add assistant response
      const assistantMessage: ChatbotMessage = {
        id: data.messageId,
        conversationId: data.conversationId,
        role: 'assistant',
        content: data.response,
        intent: data.intent,
        intentConfidence: data.intentConfidence,
        metadata: data.metadata,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update suggestions
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }

      // Handle escalation
      if (data.escalated) {
        const escalationMessage: ChatbotMessage = {
          id: `system_${Date.now()}`,
          conversationId: data.conversationId,
          role: 'system',
          content: 'You are being connected to a human agent. Please wait...',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, escalationMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Show error message
      const errorMessage: ChatbotMessage = {
        id: `error_${Date.now()}`,
        conversationId: conversationId || '',
        role: 'system',
        content: 'Sorry, there was an error sending your message. Please try again.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setSuggestions([]);
  };

  // Handle escalate to human
  const handleEscalate = async () => {
    if (!conversationId) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat/escalate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          customerId,
          customerName,
          customerEmail,
          reason: 'user_request',
          message: 'Customer requested human assistance',
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const escalationMessage: ChatbotMessage = {
          id: `system_${Date.now()}`,
          conversationId: conversationId,
          role: 'system',
          content: data.message,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, escalationMessage]);
      }
    } catch (error) {
      console.error('Error escalating conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const positionClasses = position === 'bottom-right'
    ? 'right-4 bottom-4'
    : 'left-4 bottom-4';

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {/* Chat Widget */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-lg hover:shadow-xl transition-shadow p-4"
          style={{ backgroundColor: primaryColor }}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[600px] flex flex-col">
          {/* Header */}
          <div
            className="p-4 rounded-t-lg text-white flex justify-between items-center"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs opacity-90">Powered by AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Bot className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Hi! How can I help you today?</p>
              </div>
            )}

            <ConversationDisplay messages={messages} />
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500 mb-2">Suggested:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2 mb-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="p-2 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={handleEscalate}
                className="text-xs text-gray-600 hover:text-gray-800"
                disabled={isLoading || !conversationId}
              >
                Speak with a human
              </button>
              <p className="text-xs text-gray-400">AI-powered support</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
