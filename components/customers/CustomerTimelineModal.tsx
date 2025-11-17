'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingCart, Mail, MessageSquare, DollarSign, Package, TrendingUp, Calendar, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import type { Customer } from '@/types';

interface TimelineEvent {
  id: string;
  type: 'order' | 'communication' | 'note';
  date: Date;
  title: string;
  description: string;
  metadata?: any;
}

interface CustomerTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function CustomerTimelineModal({
  isOpen,
  onClose,
  customer,
}: CustomerTimelineModalProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'communications'>('all');

  useEffect(() => {
    if (isOpen && customer) {
      fetchTimeline();
    }
  }, [isOpen, customer]);

  const fetchTimeline = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}/timeline`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      const data = await response.json();

      // Convert date strings to Date objects
      const events = data.map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }));

      setTimeline(events);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  const filteredTimeline = timeline.filter((event) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'orders') return event.type === 'order';
    if (activeTab === 'communications') return event.type === 'communication';
    return true;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-5 h-5" />;
      case 'communication':
        return <Mail className="w-5 h-5" />;
      case 'note':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700';
      case 'communication':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700';
      case 'note':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              ประวัติลูกค้า: {customer.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ข้อมูลและกิจกรรมทั้งหมดของลูกค้า
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Customer Summary */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">ออเดอร์</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {customer.totalOrders}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">มูลค่ารวม</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(customer.totalSpent)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">ค่าเฉลี่ย</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">ซื้อล่าสุด</p>
                <p className="text-xs font-medium text-gray-900 dark:text-white">
                  {customer.lastOrderDate
                    ? format(customer.lastOrderDate, 'dd MMM yy', { locale: th })
                    : 'ไม่มี'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4" />
              <span>{customer.phone}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            ทั้งหมด ({timeline.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            ออเดอร์ ({timeline.filter((e) => e.type === 'order').length})
          </button>
          <button
            onClick={() => setActiveTab('communications')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'communications'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            การติดต่อ ({timeline.filter((e) => e.type === 'communication').length})
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent" />
              <p className="ml-3 text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">ไม่มีข้อมูล</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

              {/* Timeline Events */}
              <div className="space-y-6">
                {filteredTimeline.map((event) => (
                  <div key={event.id} className="relative pl-16">
                    {/* Event Icon */}
                    <div
                      className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 ${getEventColor(
                        event.type
                      )}`}
                    >
                      {getEventIcon(event.type)}
                    </div>

                    {/* Event Content */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {event.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(event.date, 'dd MMM yyyy HH:mm', { locale: th })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.description}
                      </p>

                      {/* Order Metadata */}
                      {event.type === 'order' && event.metadata && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">รหัส:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              #{event.metadata.orderId?.slice(0, 8)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">มูลค่า:</span>
                            <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(event.metadata.total)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">สินค้า:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {event.metadata.itemCount} รายการ
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">สถานะ:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {event.metadata.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Communication Metadata */}
                      {event.type === 'communication' && event.metadata && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-sm">
                          <span className="text-gray-500 dark:text-gray-400">ช่องทาง:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {event.metadata.channel === 'email' ? 'อีเมล' : 'SMS'}
                          </span>
                          {event.metadata.subject && (
                            <>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="text-gray-900 dark:text-white">
                                {event.metadata.subject}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
