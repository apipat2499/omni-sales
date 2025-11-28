'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Minimize2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatWidget() {
  const { settings } = useAdvancedSettings();
  const aiSettings = settings.aiAgent;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Don't render if disabled
  if (!aiSettings.is_enabled) {
    return null;
  }

  // Auto-open after delay
  useEffect(() => {
    if (aiSettings.auto_open_after_seconds > 0) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, aiSettings.auto_open_after_seconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [aiSettings.auto_open_after_seconds]);

  // Add greeting message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: aiSettings.greeting_message,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const userInput = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call real AI API
      const response = await fetch('/api/ai-chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          conversationId: conversationIdRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Save conversation ID for next messages
      if (data.conversation?.id) {
        conversationIdRef.current = data.conversation.id;
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'ขออภัยครับ ไม่สามารถตอบกลับได้ในขณะนี้',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI Chat error:', error);

      // Fallback to keyword-based response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(userInput),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Simple keyword-based responses (replace with actual AI in production)
    if (input.includes('สินค้า') || input.includes('product')) {
      return 'เรามีสินค้าหลากหลายประเภทครับ สามารถดูได้ที่หน้า Products หรือถ้ามีสินค้าที่สนใจเป็นพิเศษ บอกผมได้เลยครับ 😊';
    } else if (input.includes('ราคา') || input.includes('price')) {
      return 'ราคาสินค้าของเราขึ้นอยู่กับประเภทและรุ่นสินค้าครับ สามารถดูรายละเอียดราคาได้ในหน้าสินค้าแต่ละรายการ หรือถ้าต้องการสอบถามเพิ่มเติม ยินดีให้คำปรึกษาครับ';
    } else if (input.includes('จัดส่ง') || input.includes('shipping') || input.includes('delivery')) {
      return 'เรามีบริการจัดส่งทั่วประเทศไทยครับ ใช้เวลาจัดส่ง 1-3 วันทำการ ส่งฟรีเมื่อสั่งซื้อตั้งแต่ 1,000 บาทขึ้นไป 📦';
    } else if (input.includes('ชำระเงิน') || input.includes('payment')) {
      return 'รับชำระผ่านโอนเงิน, บัตรเครดิต, และเก็บเงินปลายทางครับ ปลอดภัย 100% 💳';
    } else if (input.includes('คืนสินค้า') || input.includes('return')) {
      return 'เรารับคืนสินค้าภายใน 7 วัน หากสินค้ามีปัญหาหรือไม่ตรงตามที่สั่งครับ สามารถติดต่อแจ้งปัญหาได้เลย';
    } else if (input.includes('ติดต่อ') || input.includes('contact')) {
      return 'ติดต่อเราได้ที่:\n📞 โทร: 02-123-4567\n✉️ อีเมล: support@omnisales.com\n💬 LINE: @omnisales';
    } else if (input.includes('สวัสดี') || input.includes('hello') || input.includes('hi')) {
      return 'สวัสดีครับ! ยินดีต้อนรับสู่ร้านของเรา มีอะไรให้ช่วยไหมครับ? 😊';
    } else if (input.includes('ขอบคุณ') || input.includes('thank')) {
      return 'ยินดีครับ! หากมีคำถามเพิ่มเติม สามารถถามได้ตลอดเวลานะครับ 🙏';
    } else {
      return `ขอบคุณสำหรับคำถามครับ ผมเข้าใจว่าคุณสนใจเรื่อง "${userInput}" \n\nขณะนี้ผมยังเรียนรู้อยู่ครับ คุณสามารถถามเกี่ยวกับ:\n• สินค้าและราคา\n• การจัดส่ง\n• การชำระเงิน\n• การคืนสินค้า\n• การติดต่อเรา\n\nหรือหากต้องการคุยกับเจ้าหน้าที่โดยตรง พิมพ์ "พูดคุยกับคน" ได้เลยครับ`;
    }
  };

  const handleFeedback = (messageId: string, rating: 'positive' | 'negative') => {
    console.log(`Feedback for message ${messageId}:`, rating);
    // In production, send feedback to backend
  };

  const positionClass =
    aiSettings.widget_position === 'bottom-right' ? 'right-4 bottom-4' : 'left-4 bottom-4';

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClass} z-50 w-16 h-16 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center group`}
          style={{ backgroundColor: aiSettings.widget_color }}
          aria-label="Open chat"
        >
          <Bot className="w-8 h-8 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
          <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-sm py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            💬 คุยกับเรา
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed ${positionClass} z-50 ${
            isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
          } bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300`}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 rounded-t-2xl"
            style={{ backgroundColor: aiSettings.widget_color }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" style={{ color: aiSettings.widget_color }} />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Assistant</h3>
                <div className="flex items-center gap-1 text-white/90 text-xs">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  พร้อมให้บริการ
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 shadow-sm border border-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Feedback buttons for assistant messages */}
                    {message.role === 'assistant' && aiSettings.track_user_satisfaction && (
                      <div className="flex gap-2 mt-2 ml-12">
                        <button
                          onClick={() => handleFeedback(message.id, 'positive')}
                          className="text-gray-400 hover:text-green-600 transition-colors"
                          title="ตอบดี"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'negative')}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="ตอบไม่ดี"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 shadow-sm border border-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="p-3 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: aiSettings.widget_color }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Powered by AI • ตอบคำถามโดยอัตโนมัติ 24/7
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
