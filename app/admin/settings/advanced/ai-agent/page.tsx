'use client';

import { useState, useEffect } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Bot, Save, MessageSquare, Zap, Clock, Database, TrendingUp } from 'lucide-react';

export default function AIAgentSettingsPage() {
  const { settings, updateAIAgentSettings, loading } = useAdvancedSettings();
  const [formData, setFormData] = useState(settings.aiAgent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'behavior' | 'ai'>('general');

  useEffect(() => {
    setFormData(settings.aiAgent);
  }, [settings.aiAgent]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updateAIAgentSettings(formData);
      setMessage({ type: 'success', text: 'บันทึกการตั้งค่า AI Agent สำเร็จ!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Agent</h1>
            <p className="text-gray-600">Chat Assistant ที่ช่วยตอบคำถามและดูแลลูกค้า 24/7</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              <span className="text-2xl font-bold text-purple-700">2,847</span>
            </div>
            <p className="text-sm text-purple-600">การสนทนาทั้งหมด</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-6 h-6 text-green-600" />
              <span className="text-2xl font-bold text-green-700">94%</span>
            </div>
            <p className="text-sm text-green-600">อัตราแก้ปัญหาสำเร็จ</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700">1.5 นาที</span>
            </div>
            <p className="text-sm text-blue-600">เวลาตอบเฉลี่ย</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              <span className="text-2xl font-bold text-orange-700">4.8/5</span>
            </div>
            <p className="text-sm text-orange-600">คะแนนความพึงพอใจ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">เปิดใช้งาน AI Agent</h3>
                  <p className="text-sm text-gray-600">แสดง Chat Widget ในหน้าร้านค้า</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {[
                { key: 'general', label: 'ทั่วไป' },
                { key: 'appearance', label: 'รูปแบบ' },
                { key: 'behavior', label: 'พฤติกรรม' },
                { key: 'ai', label: 'AI Model' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ข้อความทักทาย
                    </label>
                    <textarea
                      value={formData.greeting_message}
                      onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      ข้อความแรกที่ลูกค้าจะเห็นเมื่อเปิด chat
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ข้อความนอกเวลาทำการ
                    </label>
                    <textarea
                      value={formData.offline_message}
                      onChange={(e) => setFormData({ ...formData, offline_message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">เปิดใช้งานช่วงเวลาทำการ</p>
                      <p className="text-sm text-gray-600">กำหนดช่วงเวลาที่ AI Agent ทำงาน</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.business_hours_enabled}
                      onChange={(e) =>
                        setFormData({ ...formData, business_hours_enabled: e.target.checked })
                      }
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ตำแหน่ง Widget
                    </label>
                    <select
                      value={formData.widget_position}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          widget_position: e.target.value as 'bottom-right' | 'bottom-left',
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="bottom-right">ขวาล่าง</option>
                      <option value="bottom-left">ซ้ายล่าง</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">สีธีม</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.widget_color}
                        onChange={(e) => setFormData({ ...formData, widget_color: e.target.value })}
                        className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.widget_color}
                        onChange={(e) => setFormData({ ...formData, widget_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เปิดอัตโนมัติหลัง (วินาที)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.auto_open_after_seconds}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auto_open_after_seconds: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">ใส่ 0 เพื่อปิดการเปิดอัตโนมัติ</p>
                  </div>
                </div>
              )}

              {/* Behavior Tab */}
              {activeTab === 'behavior' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">เปิดใช้งาน Knowledge Base</p>
                      <p className="text-sm text-gray-600">AI จะเรียนรู้จากเอกสารและข้อมูลของคุณ</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.knowledge_base_enabled}
                      onChange={(e) =>
                        setFormData({ ...formData, knowledge_base_enabled: e.target.checked })
                      }
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">ส่งต่อให้เจ้าหน้าที่</p>
                      <p className="text-sm text-gray-600">
                        อนุญาตให้ลูกค้าขอพูดคุยกับเจ้าหน้าที่คนจริง
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.escalate_to_human}
                      onChange={(e) =>
                        setFormData({ ...formData, escalate_to_human: e.target.checked })
                      }
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">เก็บสถิติการใช้งาน</p>
                      <p className="text-sm text-gray-600">วิเคราะห์การสนทนาเพื่อปรับปรุงคุณภาพ</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.collect_analytics}
                      onChange={(e) =>
                        setFormData({ ...formData, collect_analytics: e.target.checked })
                      }
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">ติดตามความพึงพอใจ</p>
                      <p className="text-sm text-gray-600">ขอให้ลูกค้าให้คะแนนหลังสนทนา</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.track_user_satisfaction}
                      onChange={(e) =>
                        setFormData({ ...formData, track_user_satisfaction: e.target.checked })
                      }
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>
                </div>
              )}

              {/* AI Model Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
                    <select
                      value={formData.ai_provider}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ai_provider: e.target.value as 'openai' | 'anthropic' | 'google',
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="openai">OpenAI (GPT-4)</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="google">Google (Gemini)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <input
                      type="text"
                      value={formData.ai_model}
                      onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <input
                      type="password"
                      value={formData.api_key || ''}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="sk-..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500 mt-1">API Key จะถูกเข้ารหัสและเก็บอย่างปลอดภัย</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Tokens: {formData.max_tokens}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="4000"
                      step="100"
                      value={formData.max_tokens}
                      onChange={(e) =>
                        setFormData({ ...formData, max_tokens: parseInt(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature: {formData.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) =>
                        setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      ต่ำ = เป็นทางการมากขึ้น, สูง = สร้างสรรค์มากขึ้น
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              ทดสอบ AI Agent
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="space-y-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: formData.widget_color }}
                >
                  <Bot className="w-7 h-7 text-white" />
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-600 font-medium mb-1">ข้อความทักทาย:</p>
                  <p className="text-gray-900">{formData.greeting_message}</p>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="mb-1">
                    <strong>ตำแหน่ง:</strong> {formData.widget_position === 'bottom-right' ? 'ขวาล่าง' : 'ซ้ายล่าง'}
                  </p>
                  <p className="mb-1">
                    <strong>AI Model:</strong> {formData.ai_model}
                  </p>
                  <p>
                    <strong>สถานะ:</strong>{' '}
                    <span className={formData.is_enabled ? 'text-green-600' : 'text-red-600'}>
                      {formData.is_enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
              <Database className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Knowledge Base</h4>
              <p className="text-sm text-gray-600 mb-4">
                เพิ่มเอกสาร FAQ และข้อมูลสินค้าเพื่อให้ AI ตอบคำถามได้แม่นยำยิ่งขึ้น
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                จัดการ Knowledge Base
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
