'use client';

import { useState, useEffect, useRef } from 'react';
import { WhatsAppPhoneInput } from './WhatsAppPhoneInput';

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  content: any;
  status?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
}

interface WhatsAppConversationProps {
  phoneNumber?: string;
  contactId?: string;
  onClose?: () => void;
}

export function WhatsAppConversation({
  phoneNumber: initialPhoneNumber = '',
  contactId,
  onClose,
}: WhatsAppConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'image' | 'document'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages on mount or when phone number changes
  useEffect(() => {
    if (phoneNumber && isValidPhone) {
      loadMessages();
    }
  }, [phoneNumber, isValidPhone]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!phoneNumber) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/whatsapp/status?phone_number=${encodeURIComponent(phoneNumber)}&limit=100`
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || !isValidPhone) {
      setError('กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง');
      return;
    }

    if (messageType === 'text' && !messageText.trim()) {
      setError('กรุณากรอกข้อความ');
      return;
    }

    if ((messageType === 'image' || messageType === 'document') && !mediaUrl.trim()) {
      setError('กรุณากรอก URL ของไฟล์');
      return;
    }

    setSending(true);
    setError('');

    try {
      const payload: any = {
        to: phoneNumber,
        type: messageType,
      };

      if (messageType === 'text') {
        payload.message = messageText;
      } else if (messageType === 'image' || messageType === 'document') {
        payload.mediaUrl = mediaUrl;
        payload.caption = messageText || undefined;
      }

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      // Clear form
      setMessageText('');
      setMediaUrl('');

      // Reload messages
      await loadMessages();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  };

  const getStatusIcon = (message: Message) => {
    if (message.direction === 'inbound') return null;

    if (message.status === 'read') {
      return <span className="text-blue-500">✓✓</span>;
    } else if (message.status === 'delivered') {
      return <span className="text-gray-500">✓✓</span>;
    } else if (message.status === 'sent') {
      return <span className="text-gray-400">✓</span>;
    } else if (message.status === 'failed') {
      return <span className="text-red-500">✗</span>;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              WhatsApp Conversation
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {phoneNumber || 'กรอกหมายเลขเพื่อเริ่มต้น'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Phone Number Input */}
      {!initialPhoneNumber && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <WhatsAppPhoneInput
            value={phoneNumber}
            onChange={(value, valid) => {
              setPhoneNumber(value);
              setIsValidPhone(valid);
            }}
            placeholder="กรอกหมายเลข WhatsApp"
            label=""
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>ยังไม่มีข้อความ</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.direction === 'outbound'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {message.message_type === 'text' && (
                  <p className="whitespace-pre-wrap">{message.content?.text || message.content?.message}</p>
                )}

                {message.message_type === 'image' && (
                  <div>
                    {message.content?.mediaUrl && (
                      <img
                        src={message.content.mediaUrl}
                        alt="Image"
                        className="rounded-md mb-2 max-w-full"
                      />
                    )}
                    {message.content?.caption && (
                      <p className="text-sm">{message.content.caption}</p>
                    )}
                  </div>
                )}

                {message.message_type === 'document' && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{message.content?.filename || 'Document'}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-1 text-xs opacity-70">
                  <span>{formatTime(message.sent_at)}</span>
                  {getStatusIcon(message)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={sendMessage} className="space-y-3">
          {/* Message Type Selector */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setMessageType('text')}
              className={`px-4 py-2 rounded-md text-sm ${
                messageType === 'text'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              ข้อความ
            </button>
            <button
              type="button"
              onClick={() => setMessageType('image')}
              className={`px-4 py-2 rounded-md text-sm ${
                messageType === 'image'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              รูปภาพ
            </button>
            <button
              type="button"
              onClick={() => setMessageType('document')}
              className={`px-4 py-2 rounded-md text-sm ${
                messageType === 'document'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              เอกสาร
            </button>
          </div>

          {/* Media URL Input */}
          {(messageType === 'image' || messageType === 'document') && (
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="URL ของไฟล์"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          )}

          {/* Message Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={
                messageType === 'text'
                  ? 'พิมพ์ข้อความ...'
                  : 'คำอธิบาย (ไม่บังคับ)'
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required={messageType === 'text'}
              disabled={!isValidPhone}
            />

            <button
              type="submit"
              disabled={sending || !isValidPhone}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'ส่ง'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
