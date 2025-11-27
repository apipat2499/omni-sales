'use client';

import { useState } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Mail, Plus, Edit2, Eye } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  { key: 'order_confirmation', name: 'ยืนยันคำสั่งซื้อ', trigger: 'สั่งซื้อสำเร็จ', icon: '✅' },
  { key: 'shipping_notification', name: 'แจ้งจัดส่งสินค้า', trigger: 'จัดส่งแล้ว', icon: '📦' },
  { key: 'order_delivered', name: 'สินค้าถึงแล้ว', trigger: 'ส่งถึงลูกค้า', icon: '🎉' },
  { key: 'welcome', name: 'ยินดีต้อนรับลูกค้าใหม่', trigger: 'สมัครสมาชิก', icon: '👋' },
  { key: 'review_request', name: 'ขอรีวิวสินค้า', trigger: '7 วันหลังได้สินค้า', icon: '⭐' },
  { key: 'abandoned_cart', name: 'แจ้งเตือนตะกร้า', trigger: 'ทิ้งตะกร้า 1 ชม.', icon: '🛒' },
];

export default function EmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600">ปรับแต่งอีเมลที่ส่งให้ลูกค้า</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
          <Plus className="w-4 h-4" />
          สร้าง Template ใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEFAULT_TEMPLATES.map((template) => (
          <div
            key={template.key}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-pink-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{template.icon}</div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                เปิดใช้งาน
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Trigger:</span> {template.trigger}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTemplate(template.key)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                แก้ไข
              </button>
              <button className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                <Eye className="w-4 h-4" />
                ดู
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                แก้ไข Email Template
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject (ไทย) *
                    </label>
                    <input
                      type="text"
                      defaultValue="ขอบคุณสำหรับคำสั่งซื้อ #{{order_number}}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject (EN)
                    </label>
                    <input
                      type="text"
                      defaultValue="Thank you for your order #{{order_number}}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Body (HTML)
                  </label>
                  <textarea
                    rows={12}
                    defaultValue={`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>สวัสดีครับ {{customer_name}}</h1>
  <p>ขอบคุณที่สั่งซื้อสินค้ากับเรา</p>
  <h2>หมายเลขคำสั่งซื้อ: {{order_number}}</h2>
  <p>ยอดรวม: ฿{{total}}</p>
</div>`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Omni Sales"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      defaultValue="no-reply@omnisales.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-900 mb-2">ตัวแปรที่ใช้ได้:</p>
                  <div className="flex flex-wrap gap-2">
                    {['{{customer_name}}', '{{order_number}}', '{{total}}', '{{tracking_number}}', '{{date}}'].map(
                      (variable) => (
                        <code
                          key={variable}
                          className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs"
                        >
                          {variable}
                        </code>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                  บันทึก
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  ส่งทดสอบ
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
