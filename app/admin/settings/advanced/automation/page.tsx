'use client';

import { useState } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Zap, Database, Webhook, ShoppingBag, Save } from 'lucide-react';

export default function AutomationPage() {
  const { settings, updateAutomationSettings } = useAdvancedSettings();
  const [formData, setFormData] = useState(settings.automation);

  const integrations = [
    { name: 'Shopee', logo: '🛍️', connected: false, color: 'orange' },
    { name: 'Lazada', logo: '🛒', connected: false, color: 'blue' },
    { name: 'LINE', logo: '💬', connected: true, color: 'green' },
    { name: 'Facebook', logo: '📘', connected: false, color: 'blue' },
    { name: 'TikTok Shop', logo: '🎵', connected: false, color: 'black' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
          <Zap className="w-6 h-6 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation & Integrations</h1>
          <p className="text-gray-600">ระบบอัตโนมัติและการเชื่อมต่อภายนอก</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Auto Backup */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">สำรองข้อมูลอัตโนมัติ</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.auto_backup_enabled}
                onChange={(e) =>
                  setFormData({ ...formData, auto_backup_enabled: e.target.checked })
                }
                className="w-4 h-4 text-cyan-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">เปิดใช้งาน Auto Backup</span>
            </label>

            {formData.auto_backup_enabled && (
              <div className="ml-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ความถี่</label>
                  <select
                    value={formData.backup_frequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        backup_frequency: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="hourly">ทุกชั่วโมง</option>
                    <option value="daily">ทุกวัน</option>
                    <option value="weekly">ทุกสัปดาห์</option>
                    <option value="monthly">ทุกเดือน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เวลา</label>
                  <input
                    type="time"
                    value={formData.backup_time}
                    onChange={(e) => setFormData({ ...formData, backup_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เก็บไว้ (วัน): {formData.backup_retention_days}
                  </label>
                  <input
                    type="range"
                    min="7"
                    max="90"
                    value={formData.backup_retention_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        backup_retention_days: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ปลายทาง</label>
                  <select
                    value={formData.backup_location || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, backup_location: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">เลือกปลายทาง</option>
                    <option value="s3">Amazon S3</option>
                    <option value="gdrive">Google Drive</option>
                    <option value="dropbox">Dropbox</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Webhooks</h3>
            </div>
            <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm">
              + เพิ่ม Webhook
            </button>
          </div>

          <div className="space-y-3">
            {[
              { event: 'order.created', url: 'https://api.example.com/webhooks/order', active: true },
              { event: 'order.shipped', url: 'https://api.example.com/webhooks/ship', active: false },
            ].map((webhook, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                      {webhook.event}
                    </code>
                    {webhook.active && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{webhook.url}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded">
                    Test
                  </button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marketplace Integrations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Marketplace Integrations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="border border-gray-200 rounded-lg p-4 text-center"
              >
                <div className="text-5xl mb-3">{integration.logo}</div>
                <h4 className="font-semibold text-gray-900 mb-2">{integration.name}</h4>
                {integration.connected ? (
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      เชื่อมต่อแล้ว ✓
                    </span>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        ตั้งค่า
                      </button>
                      <button className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                        ตัดการเชื่อมต่อ
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm">
                    เชื่อมต่อ
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => updateAutomationSettings(formData)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <Save className="w-5 h-5" />
          บันทึกการเปลี่ยนแปลง
        </button>
      </div>
    </div>
  );
}
