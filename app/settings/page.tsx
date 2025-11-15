'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Building, Bell, Lock, Palette, Globe, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'notifications' | 'security' | 'appearance'>('profile');

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การตั้งค่า</h1>
          <p className="text-gray-600 mt-1">จัดการการตั้งค่าระบบและบัญชีของคุณ</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5" />
                โปรไฟล์
              </button>
              <button
                onClick={() => setActiveTab('business')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'business'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building className="h-5 w-5" />
                ข้อมูลธุรกิจ
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bell className="h-5 w-5" />
                การแจ้งเตือน
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Lock className="h-5 w-5" />
                ความปลอดภัย
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Palette className="h-5 w-5" />
                รูปแบบ
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'business' && <BusinessSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'appearance' && <AppearanceSettings />}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">โปรไฟล์</h2>
        <p className="text-sm text-gray-600">จัดการข้อมูลส่วนตัวของคุณ</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-700">AD</span>
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          เปลี่ยนรูปโปรไฟล์
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อ
          </label>
          <input
            type="text"
            defaultValue="Admin"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            นามสกุล
          </label>
          <input
            type="text"
            defaultValue="User"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          อีเมล
        </label>
        <input
          type="email"
          defaultValue="admin@omnisales.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          เบอร์โทรศัพท์
        </label>
        <input
          type="tel"
          defaultValue="081-234-5678"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Save className="h-5 w-5" />
        บันทึกการเปลี่ยนแปลง
      </button>
    </div>
  );
}

function BusinessSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">ข้อมูลธุรกิจ</h2>
        <p className="text-sm text-gray-600">จัดการข้อมูลธุรกิจของคุณ</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ชื่อธุรกิจ
        </label>
        <input
          type="text"
          defaultValue="Omni Sales"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          เลขประจำตัวผู้เสียภาษี
        </label>
        <input
          type="text"
          placeholder="0123456789012"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ที่อยู่
        </label>
        <textarea
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="ที่อยู่ธุรกิจ"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สกุลเงิน
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>THB (฿)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เขตเวลา
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Asia/Bangkok (GMT+7)</option>
          </select>
        </div>
      </div>

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Save className="h-5 w-5" />
        บันทึกการเปลี่ยนแปลง
      </button>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">การแจ้งเตือน</h2>
        <p className="text-sm text-gray-600">จัดการการแจ้งเตือนที่คุณต้องการรับ</p>
      </div>

      <div className="space-y-4">
        <ToggleSetting
          label="แจ้งเตือนคำสั่งซื้อใหม่"
          description="รับการแจ้งเตือนเมื่อมีคำสั่งซื้อใหม่"
          defaultChecked
        />
        <ToggleSetting
          label="แจ้งเตือนสต็อกสินค้าเหลือน้อย"
          description="รับการแจ้งเตือนเมื่อสต็อกสินค้าต่ำกว่า 10 ชิ้น"
          defaultChecked
        />
        <ToggleSetting
          label="แจ้งเตือนลูกค้าใหม่"
          description="รับการแจ้งเตือนเมื่อมีลูกค้าใหม่สมัครสมาชิก"
        />
        <ToggleSetting
          label="สรุปรายงานรายวัน"
          description="รับอีเมลสรุปยอดขายประจำวัน"
          defaultChecked
        />
        <ToggleSetting
          label="สรุปรายงานรายสัปดาห์"
          description="รับอีเมลสรุปยอดขายประจำสัปดาห์"
        />
      </div>

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Save className="h-5 w-5" />
        บันทึกการเปลี่ยนแปลง
      </button>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">ความปลอดภัย</h2>
        <p className="text-sm text-gray-600">จัดการความปลอดภัยของบัญชี</p>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">เปลี่ยนรหัสผ่าน</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่านปัจจุบัน
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <ToggleSetting
          label="ยืนยันตัวตนแบบ 2 ชั้น (2FA)"
          description="เพิ่มความปลอดภัยด้วยการยืนยันตัวตนแบบ 2 ชั้น"
        />
      </div>

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Save className="h-5 w-5" />
        บันทึกการเปลี่ยนแปลง
      </button>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">รูปแบบ</h2>
        <p className="text-sm text-gray-600">ปรับแต่งรูปแบบการแสดงผล</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ธีม
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div className="border-2 border-blue-500 rounded-lg p-4 cursor-pointer">
            <div className="w-full h-20 bg-white border border-gray-200 rounded mb-2" />
            <p className="text-sm font-medium text-center">สว่าง</p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300">
            <div className="w-full h-20 bg-gray-900 rounded mb-2" />
            <p className="text-sm font-medium text-center">มืด</p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300">
            <div className="w-full h-20 bg-gradient-to-br from-white to-gray-900 rounded mb-2" />
            <p className="text-sm font-medium text-center">ตามระบบ</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ภาษา
        </label>
        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>ไทย</option>
          <option>English</option>
        </select>
      </div>

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Save className="h-5 w-5" />
        บันทึกการเปลี่ยนแปลง
      </button>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}
