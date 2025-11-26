'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  MessageSquare,
  Activity,
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
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
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
          <span className="text-sm text-gray-500">จากเดือนที่แล้ว</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">ภาพรวมประสิทธิภาพของร้านค้า</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
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
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
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
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/admin/analytics/sales"
          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-gray-900">รายงานการขาย</h3>
          <p className="text-sm text-gray-600 mt-1">ดูรายละเอียดยอดขายและรายได้</p>
        </a>

        <a
          href="/admin/analytics/products"
          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-gray-900">สินค้ายอดนิยม</h3>
          <p className="text-sm text-gray-600 mt-1">สินค้าที่ขายดีที่สุด</p>
        </a>

        <a
          href="/admin/analytics/ai-conversations"
          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-gray-900">AI Conversations</h3>
          <p className="text-sm text-gray-600 mt-1">วิเคราะห์บทสนทนาและ feedback</p>
        </a>
      </div>
    </div>
  );
}
