'use client';

import Link from 'next/link';
import { Plus, ShoppingCart, Package, Users, Tag, FileText } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      label: 'สร้างคำสั่งซื้อ',
      href: '/orders',
      icon: ShoppingCart,
      color: 'blue',
      description: 'เพิ่มคำสั่งซื้อใหม่',
    },
    {
      label: 'เพิ่มสินค้า',
      href: '/admin/products',
      icon: Package,
      color: 'green',
      description: 'เพิ่มสินค้าใหม่เข้าสต็อก',
    },
    {
      label: 'เพิ่มลูกค้า',
      href: '/customers',
      icon: Users,
      color: 'purple',
      description: 'เพิ่มลูกค้าใหม่',
    },
    {
      label: 'สร้างส่วนลด',
      href: '/admin/settings',
      icon: Tag,
      color: 'pink',
      description: 'สร้างโค้ดส่วนลด',
    },
    {
      label: 'ดูรายงาน',
      href: '/reports',
      icon: FileText,
      color: 'indigo',
      description: 'รายงานและสถิติ',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50',
      pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${getColorClasses(
                action.color
              )}`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
