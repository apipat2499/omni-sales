'use client';

import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

interface PurchaseTimelineProps {
  orders: Order[];
}

const STATUS_CONFIG = {
  pending: {
    label: 'รอดำเนินการ',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    icon: Clock,
  },
  processing: {
    label: 'กำลังดำเนินการ',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    icon: Package,
  },
  completed: {
    label: 'เสร็จสิ้น',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/20',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'ยกเลิก',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/20',
    icon: XCircle,
  },
};

export default function PurchaseTimeline({ orders }: PurchaseTimelineProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">ยังไม่มีประวัติการสั่งซื้อ</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        ประวัติการสั่งซื้อ
      </h3>

      <div className="space-y-6">
        {orders.map((order, index) => {
          const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || {
            label: order.status,
            color: 'text-gray-600',
            bg: 'bg-gray-100',
            icon: AlertCircle,
          };
          const Icon = config.icon;

          return (
            <div key={order.id} className="relative">
              {/* Timeline line */}
              {index < orders.length - 1 && (
                <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              )}

              <div className="flex gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center relative z-10`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          คำสั่งซื้อ #{order.id}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {order.items.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700 dark:text-gray-300">
                              {item.product_name} x{item.quantity}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            และอีก {order.items.length - 3} รายการ
                          </p>
                        )}
                      </div>
                    )}

                    {/* Total */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        ยอดรวม
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
