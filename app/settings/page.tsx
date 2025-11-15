'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Building, Bell, Lock, Palette, CreditCard, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'billing' | 'notifications' | 'security' | 'appearance'>('profile');

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">การตั้งค่า</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">จัดการการตั้งค่าระบบและบัญชีของคุณ</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <User className="h-5 w-5" />
                โปรไฟล์
              </button>
              <button
                onClick={() => setActiveTab('business')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'business'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Building className="h-5 w-5" />
                ข้อมูลธุรกิจ
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'billing'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                การเรียกเก็บเงิน
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Bell className="h-5 w-5" />
                การแจ้งเตือน
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Lock className="h-5 w-5" />
                ความปลอดภัย
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Palette className="h-5 w-5" />
                รูปแบบ
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'business' && <BusinessSettings />}
              {activeTab === 'billing' && <BillingSettings />}
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">โปรไฟล์</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">จัดการข้อมูลส่วนตัวของคุณ</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">AD</span>
        </div>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
          เปลี่ยนรูปโปรไฟล์
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ชื่อ
          </label>
          <input
            type="text"
            defaultValue="Admin"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            นามสกุล
          </label>
          <input
            type="text"
            defaultValue="User"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          อีเมล
        </label>
        <input
          type="email"
          defaultValue="admin@omnisales.com"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          เบอร์โทรศัพท์
        </label>
        <input
          type="tel"
          defaultValue="081-234-5678"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600">
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">ข้อมูลธุรกิจ</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">จัดการข้อมูลธุรกิจของคุณ</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ชื่อธุรกิจ
        </label>
        <input
          type="text"
          defaultValue="Omni Sales"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          เลขประจำตัวผู้เสียภาษี
        </label>
        <input
          type="text"
          placeholder="0123456789012"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ที่อยู่
        </label>
        <textarea
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="ที่อยู่ธุรกิจ"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            สกุลเงิน
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>THB (฿)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            เขตเวลา
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Asia/Bangkok (GMT+7)</option>
          </select>
        </div>
      </div>

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600">
        <Save className="h-5 w-5" />
        บันทึกการเปลี่ยนแปลง
      </button>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">การเรียกเก็บเงิน</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">จัดการแผนการใช้งานและการชำระเงิน</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">แผน Starter</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">฿299/เดือน • ต่ออายุวันที่ 15 ธ.ค. 2025</p>
          </div>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm font-medium rounded-full">
            ใช้งานอยู่
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">430/1,000</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">สินค้า</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">182/500</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">คำสั่งซื้อ (เดือนนี้)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">1,245</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">ลูกค้า</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            อัพเกรดแผน
          </button>
          <button className="px-4 py-2 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm font-medium">
            เปรียบเทียบแผน
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">วิธีการชำระเงิน</h3>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">
                VISA
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">•••• •••• •••• 4242</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">หมดอายุ 12/2027</div>
              </div>
            </div>
            <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
              เปลี่ยน
            </button>
          </div>
        </div>
        <button className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
          + เพิ่มบัตรใหม่
        </button>
      </div>

      {/* Billing History */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">ประวัติการเรียกเก็บเงิน</h3>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              { date: '15 พ.ย. 2025', amount: '฿299.00', status: 'ชำระแล้ว', invoice: 'INV-2025-011' },
              { date: '15 ต.ค. 2025', amount: '฿299.00', status: 'ชำระแล้ว', invoice: 'INV-2025-010' },
              { date: '15 ก.ย. 2025', amount: '฿299.00', status: 'ชำระแล้ว', invoice: 'INV-2025-009' },
            ].map((bill, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{bill.invoice}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{bill.date}</div>
                  </div>
                  <div className="text-right mr-6">
                    <div className="font-semibold text-gray-900 dark:text-white">{bill.amount}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">{bill.status}</div>
                  </div>
                  <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                    ดาวน์โหลด PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Alerts */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 bg-yellow-400 dark:bg-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            !
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
              คุณใช้งานมากกว่า 80% ของโควต้าแล้ว
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              คำสั่งซื้อของคุณในเดือนนี้อยู่ที่ 182/500 รายการ (36%)
              พิจารณาอัพเกรดแผนเพื่อความคล่องตัวในการใช้งาน
            </p>
            <button className="text-sm font-medium text-yellow-900 dark:text-yellow-100 underline">
              ดูแผนที่เหมาะสม
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Subscription */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <button className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium">
          ยกเลิกการสมัครสมาชิก
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          การยกเลิกจะมีผลหลังจากรอบการเรียกเก็บเงินปัจจุบันสิ้นสุดลง (15 ธ.ค. 2025)
        </p>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">การแจ้งเตือน</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">จัดการการแจ้งเตือนที่คุณต้องการรับ</p>
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

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600">
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">ความปลอดภัย</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">จัดการความปลอดภัยของบัญชี</p>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">เปลี่ยนรหัสผ่าน</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              รหัสผ่านปัจจุบัน
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <ToggleSetting
          label="ยืนยันตัวตนแบบ 2 ชั้น (2FA)"
          description="เพิ่มความปลอดภัยด้วยการยืนยันตัวตนแบบ 2 ชั้น"
        />
      </div>

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600">
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">รูปแบบ</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">ปรับแต่งรูปแบบการแสดงผล</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          ธีม
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div className="border-2 border-blue-500 rounded-lg p-4 cursor-pointer">
            <div className="w-full h-20 bg-white border border-gray-200 rounded mb-2" />
            <p className="text-sm font-medium text-center text-gray-900 dark:text-white">สว่าง</p>
          </div>
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600">
            <div className="w-full h-20 bg-gray-900 rounded mb-2" />
            <p className="text-sm font-medium text-center text-gray-900 dark:text-white">มืด</p>
          </div>
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600">
            <div className="w-full h-20 bg-gradient-to-br from-white to-gray-900 rounded mb-2" />
            <p className="text-sm font-medium text-center text-gray-900 dark:text-white">ตามระบบ</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ภาษา
        </label>
        <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <option>ไทย</option>
          <option>English</option>
        </select>
      </div>

      <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600">
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
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}
