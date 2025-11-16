'use client';

/**
 * Conversation Display Component
 * Display chat messages in a conversation
 */

import React from 'react';
import { Bot, User, Info } from 'lucide-react';
import IntentBadge from './IntentBadge';
import type { ChatbotMessage } from '@/lib/ai/chatbot/types';
import { formatDistanceToNow } from 'date-fns';

interface ConversationDisplayProps {
  messages: ChatbotMessage[];
}

export default function ConversationDisplay({ messages }: ConversationDisplayProps) {
  return (
    <>
      {messages.map((message) => {
        const isUser = message.role === 'user';
        const isSystem = message.role === 'system';

        return (
          <div
            key={message.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${
              isSystem ? 'justify-center' : ''
            }`}
          >
            <div
              className={`max-w-[80%] ${
                isUser
                  ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
                  : isSystem
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg'
                  : 'bg-white text-gray-800 rounded-r-lg rounded-tl-lg shadow-sm'
              } p-3`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1">
                {isUser ? (
                  <User className="w-4 h-4" />
                ) : isSystem ? (
                  <Info className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">
                  {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
                </span>
              </div>

              {/* Message Content */}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* Intent Badge */}
              {message.intent && message.intentConfidence && !isSystem && (
                <div className="mt-2">
                  <IntentBadge
                    intent={message.intent}
                    confidence={message.intentConfidence}
                  />
                </div>
              )}

              {/* Metadata */}
              {message.metadata && !isSystem && (
                <div className="mt-2 pt-2 border-t border-opacity-20 border-gray-300">
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    {message.metadata.cached && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Cached
                      </span>
                    )}
                    {message.metadata.responseTimeMs && (
                      <span>{message.metadata.responseTimeMs}ms</span>
                    )}
                    {message.metadata.modelUsed && (
                      <span>{message.metadata.modelUsed}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <p
                className={`text-xs mt-1 ${
                  isUser
                    ? 'text-blue-100'
                    : isSystem
                    ? 'text-yellow-600'
                    : 'text-gray-500'
                }`}
              >
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}
