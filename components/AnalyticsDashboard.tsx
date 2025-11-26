'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  MessageSquare,
  Activity,
  Home,
  Settings,
  ChevronLeft,
  BarChart3,
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  orders: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  customers: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  products: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  aiConversations: {
    total: number;
    change: number;
    trend: 'up' | 'down';
    satisfaction: number;
  };
  conversionRate: {
    rate: number;
    change: number;
    trend: 'up' | 'down';
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percent';
}

function MetricCard({ title, value, change, trend, icon, format = 'number' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `฿${Number(val).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
    } else if (format === 'percent') {
      return `${val}%`;
    }
    return Number(val).toLocaleString('th-TH');
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-700 hover:border-blue-500 transition-all">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center text-blue-400">
          {icon}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-3xl font-bold text-white">{formatValue(value)}</p>
        <div className="flex items-center gap-2">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span
            className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {Math.abs(change)}%
          </span>
          <span className="text-sm text-gray-400">จากเดือนที่แล้ว</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: { total: 0, change: 0, trend: 'up' },
    orders: { total: 0, change: 0, trend: 'up' },
    customers: { total: 0, change: 0, trend: 'up' },
    products: { total: 0, change: 0, trend: 'up' },
    aiConversations: { total: 0, change: 0, trend: 'up', satisfaction: 0 },
    conversionRate: { rate: 0, change: 0, trend: 'up' },
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/overview?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // Use mock data if API not available
        setAnalytics({
          revenue: { total: 248750, change: 12.5, trend: 'up' },
          orders: { total: 156, change: 8.3, trend: 'up' },
          customers: { total: 892, change: 15.2, trend: 'up' },
          products: { total: 234, change: 5.1, trend: 'up' },
          aiConversations: { total: 1247, change: 23.4, trend: 'up', satisfaction: 92.5 },
          conversionRate: { rate: 3.8, change: -2.1, trend: 'down' },
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Use mock data
      setAnalytics({
        revenue: { total: 248750, change: 12.5, trend: 'up' },
        orders: { total: 156, change: 8.3, trend: 'up' },
        customers: { total: 892, change: 15.2, trend: 'up' },
        products: { total: 234, change: 5.1, trend: 'up' },
        aiConversations: { total: 1247, change: 23.4, trend: 'up', satisfaction: 92.5 },
        conversionRate: { rate: 3.8, change: -2.1, trend: 'down' },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-gray-300 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">กลับไปหน้าหลัก</span>
        </Link>

        <Link
          href="/admin/products"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-gray-300 hover:text-white"
        >
          <Package className="w-4 h-4" />
          <span className="text-sm font-medium">สินค้า</span>
        </Link>

        <Link
          href="/admin/settings/advanced"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-gray-300 hover:text-white"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">ตั้งค่า</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">ภาพรวมประสิทธิภาพของร้านค้า</p>
          <p className="text-xs text-yellow-500 mt-2">⚠️ ข้อมูลนี้เป็น Mock Data สำหรับทดสอบ (ยังไม่ได้เชื่อมกับฐานข้อมูลจริง)</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
          {[
            { value: '7d', label: '7 วัน' },
            { value: '30d', label: '30 วัน' },
            { value: '90d', label: '90 วัน' },
            { value: '1y', label: '1 ปี' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="รายได้รวม"
          value={analytics.revenue.total}
          change={analytics.revenue.change}
          trend={analytics.revenue.trend}
          icon={<DollarSign className="w-5 h-5" />}
          format="currency"
        />

        <MetricCard
          title="คำสั่งซื้อ"
          value={analytics.orders.total}
          change={analytics.orders.change}
          trend={analytics.orders.trend}
          icon={<ShoppingCart className="w-5 h-5" />}
        />

        <MetricCard
          title="ลูกค้า"
          value={analytics.customers.total}
          change={analytics.customers.change}
          trend={analytics.customers.trend}
          icon={<Users className="w-5 h-5" />}
        />

        <MetricCard
          title="สินค้า"
          value={analytics.products.total}
          change={analytics.products.change}
          trend={analytics.products.trend}
          icon={<Package className="w-5 h-5" />}
        />

        <MetricCard
          title="บทสนทนา AI"
          value={analytics.aiConversations.total}
          change={analytics.aiConversations.change}
          trend={analytics.aiConversations.trend}
          icon={<MessageSquare className="w-5 h-5" />}
        />

        <MetricCard
          title="Conversion Rate"
          value={analytics.conversionRate.rate}
          change={analytics.conversionRate.change}
          trend={analytics.conversionRate.trend}
          icon={<Activity className="w-5 h-5" />}
          format="percent"
        />
      </div>

      {/* AI Satisfaction Score */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">AI Agent Satisfaction Score</p>
            <p className="text-4xl font-bold mt-2">{analytics.aiConversations.satisfaction}%</p>
            <p className="text-sm text-blue-100 mt-1">จากลูกค้า {analytics.aiConversations.total} คน</p>
          </div>
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-white">รายงานเพิ่มเติม</h2>
          <span className="px-3 py-1 bg-yellow-500 bg-opacity-20 text-yellow-500 text-xs font-medium rounded-full">
            Coming Soon
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg cursor-not-allowed opacity-60">
            <h3 className="font-semibold text-gray-300">รายงานการขาย</h3>
            <p className="text-sm text-gray-500 mt-1">ดูรายละเอียดยอดขายและรายได้</p>
            <p className="text-xs text-yellow-500 mt-2">🚧 กำลังพัฒนา...</p>
          </div>

          <div className="p-4 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg cursor-not-allowed opacity-60">
            <h3 className="font-semibold text-gray-300">สินค้ายอดนิยม</h3>
            <p className="text-sm text-gray-500 mt-1">สินค้าที่ขายดีที่สุด</p>
            <p className="text-xs text-yellow-500 mt-2">🚧 กำลังพัฒนา...</p>
          </div>

          <div className="p-4 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg cursor-not-allowed opacity-60">
            <h3 className="font-semibold text-gray-300">AI Conversations</h3>
            <p className="text-sm text-gray-500 mt-1">วิเคราะห์บทสนทนาและ feedback</p>
            <p className="text-xs text-yellow-500 mt-2">🚧 กำลังพัฒนา...</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-4 text-center">
          💡 รายงานเหล่านี้จะพร้อมใช้งานในเวอร์ชันถัดไป
        </p>
      </div>
    </div>
  );
}
