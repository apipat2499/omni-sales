'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Palette,
  FileText,
  ShoppingCart,
  Receipt,
  Truck,
  Package,
  Mail,
  Globe,
  Users,
  Zap,
  Bot,
} from 'lucide-react';

interface SettingsCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
  badge?: string;
}

const SETTINGS_CATEGORIES: SettingsCard[] = [
  {
    icon: <Palette className="w-6 h-6" />,
    title: 'การปรับแต่งหน้าร้าน',
    description: 'สีธีม, ฟอนต์, แบนเนอร์, ข้อความต้อนรับ',
    href: '/admin/settings/advanced/storefront',
    color: 'bg-purple-500',
    badge: 'HOT',
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'ตั้งค่าภาษี',
    description: 'VAT, ภาษีตามประเภทสินค้า, ภาษีตามพื้นที่',
    href: '/admin/settings/advanced/tax',
    color: 'bg-green-500',
  },
  {
    icon: <ShoppingCart className="w-6 h-6" />,
    title: 'ตั้งค่าคำสั่งซื้อ',
    description: 'รูปแบบหมายเลข, สถานะ, การยกเลิกอัตโนมัติ',
    href: '/admin/settings/advanced/orders',
    color: 'bg-blue-500',
  },
  {
    icon: <Receipt className="w-6 h-6" />,
    title: 'ตั้งค่าใบเสร็จ/ใบกำกับภาษี',
    description: 'ฟอร์แมต, T&C, ข้อมูลบริษัท',
    href: '/admin/settings/advanced/invoice',
    color: 'bg-orange-500',
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: 'การจัดส่งขั้นสูง',
    description: 'โซนการจัดส่ง, ราคา, ผู้ให้บริการ',
    href: '/admin/settings/advanced/shipping',
    color: 'bg-red-500',
  },
  {
    icon: <Package className="w-6 h-6" />,
    title: 'ตั้งค่าสินค้า',
    description: 'การแสดงผล, เรียงลำดับ, SKU format',
    href: '/admin/settings/advanced/products',
    color: 'bg-indigo-500',
  },
  {
    icon: <Mail className="w-6 h-6" />,
    title: 'Email Templates',
    description: 'ปรับแต่งอีเมล Order, Shipping, Welcome',
    href: '/admin/settings/advanced/email-templates',
    color: 'bg-pink-500',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'ภาษาและสกุลเงิน',
    description: 'Multi-language, Multi-currency',
    href: '/admin/settings/advanced/localization',
    color: 'bg-teal-500',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'สิทธิ์และบทบาท',
    description: 'Admin, Staff, Viewer, Activity logs',
    href: '/admin/settings/advanced/permissions',
    color: 'bg-yellow-500',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Automation & Integrations',
    description: 'Backup, Webhooks, API, Marketplace',
    href: '/admin/settings/advanced/automation',
    color: 'bg-cyan-500',
    badge: 'NEW',
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: 'AI Agent',
    description: 'Chat Assistant ช่วยตอบคำถามลูกค้า',
    href: '/admin/settings/advanced/ai-agent',
    color: 'bg-violet-500',
    badge: 'AI',
  },
];

export default function AdvancedSettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSettings = SETTINGS_CATEGORIES.filter(
    (setting) =>
      setting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ตั้งค่าขั้นสูง</h1>
            <p className="text-gray-600">
              ปรับแต่งระบบให้เหมาะกับธุรกิจของคุณ พร้อม AI Agent ที่ช่วยดูแลลูกค้า
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← กลับไปตั้งค่าหลัก
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาการตั้งค่า..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">11</div>
            <Palette className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">หมวดการตั้งค่า</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">100%</div>
            <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">ปรับแต่งได้หมด</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">AI</div>
            <Bot className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">AI Agent พร้อมใช้</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">∞</div>
            <Globe className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">ไม่จำกัดขีดความสามารถ</div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSettings.map((setting, index) => (
          <Link
            key={index}
            href={setting.href}
            className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 overflow-hidden"
          >
            {/* Badge */}
            {setting.badge && (
              <div className="absolute top-4 right-4">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                    setting.badge === 'HOT'
                      ? 'bg-red-100 text-red-700'
                      : setting.badge === 'NEW'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {setting.badge}
                </span>
              </div>
            )}

            {/* Icon */}
            <div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${setting.color} text-white mb-4 group-hover:scale-110 transition-transform duration-200`}
            >
              {setting.icon}
            </div>

            {/* Content */}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {setting.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{setting.description}</p>

            {/* Arrow */}
            <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-2 transition-transform duration-200">
              ตั้งค่า
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
          </Link>
        ))}
      </div>

      {/* No Results */}
      {filteredSettings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            ไม่พบการตั้งค่าที่ค้นหา
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            ลองค้นหาด้วยคำค้นหาอื่นดูครับ
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ต้องการความช่วยเหลือ?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AI Agent ของเราพร้อมช่วยคุณตั้งค่าระบบและตอบคำถามทุกข้อสงสัย
              คุณสามารถถามอะไรก็ได้ตลอด 24/7
            </p>
            <div className="flex gap-3">
              <Link
                href="/admin/settings/advanced/ai-agent"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ตั้งค่า AI Agent
              </Link>
              <button className="px-6 py-3 border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium">
                ดูคู่มือ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-3">💡</div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">เริ่มต้นที่ไหนดี?</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            แนะนำให้เริ่มจาก <strong>การปรับแต่งหน้าร้าน</strong> เพื่อสร้างแบรนด์ที่เป็นเอกลักษณ์
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-3">🚀</div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">เพิ่มประสิทธิภาพ</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ใช้ <strong>Automation</strong> เพื่อประหยัดเวลาและลดความผิดพลาด
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl mb-3">🌍</div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">ขยายตลาด</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            เพิ่ม <strong>ภาษาและสกุลเงิน</strong> เพื่อขายสินค้าในต่างประเทศ
          </p>
        </div>
      </div>
    </div>
  );
}
