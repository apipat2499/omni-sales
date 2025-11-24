'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { AdminGuard } from '@/components/RouteGuard';
import {
  Megaphone,
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  Target,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  BarChart3,
  Gift,
  Percent,
  Send,
  Eye,
  MousePointerClick,
} from 'lucide-react';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'notification';
  status: 'active' | 'paused' | 'completed' | 'draft';
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  startDate: string;
  endDate?: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'ลดราคา Flash Sale สิ้นปี',
    type: 'email',
    status: 'active',
    sent: 5420,
    opened: 2834,
    clicked: 1243,
    converted: 342,
    revenue: 1250000,
    startDate: '2024-11-15',
    endDate: '2024-12-31',
  },
  {
    id: '2',
    name: 'โปรโมชั่น Black Friday',
    type: 'sms',
    status: 'completed',
    sent: 3200,
    opened: 2980,
    clicked: 1560,
    converted: 428,
    revenue: 856000,
    startDate: '2024-11-20',
    endDate: '2024-11-25',
  },
  {
    id: '3',
    name: 'แจ้งเตือนสินค้าใหม่',
    type: 'notification',
    status: 'active',
    sent: 8900,
    opened: 4230,
    clicked: 892,
    converted: 156,
    revenue: 234000,
    startDate: '2024-11-10',
  },
  {
    id: '4',
    name: 'คูปองส่วนลดวันเกิด',
    type: 'email',
    status: 'paused',
    sent: 1240,
    opened: 986,
    clicked: 534,
    converted: 234,
    revenue: 345000,
    startDate: '2024-11-01',
  },
];

const summaryCards = [
  {
    title: 'แคมเปญทั้งหมด',
    value: '24',
    change: '+4 เดือนนี้',
    icon: Megaphone,
    color: 'blue',
  },
  {
    title: 'ผู้รับทั้งหมด',
    value: '18,760',
    change: '+2,340 จากเดือนก่อน',
    icon: Users,
    color: 'purple',
  },
  {
    title: 'อัตราเปิด',
    value: '62.5%',
    change: '+5.2% จากเดือนก่อน',
    icon: Eye,
    color: 'green',
  },
  {
    title: 'รายได้จากแคมเปญ',
    value: '฿2.69M',
    change: '+18.4% จากเดือนก่อน',
    icon: TrendingUp,
    color: 'yellow',
  },
];

const segmentData = [
  { name: 'ลูกค้า VIP', value: 1240, color: '#3B82F6' },
  { name: 'ลูกค้าประจำ', value: 3420, color: '#10B981' },
  { name: 'ลูกค้าใหม่', value: 5680, color: '#F59E0B' },
  { name: 'ไม่ active', value: 2340, color: '#EF4444' },
];

const performanceData = [
  { channel: 'Email', sent: 12000, opened: 7200, clicked: 3600 },
  { channel: 'SMS', sent: 8000, opened: 7200, clicked: 4000 },
  { channel: 'Push', sent: 15000, opened: 9000, clicked: 2250 },
  { channel: 'Line', sent: 6000, opened: 4800, clicked: 1800 },
];

const coupons = [
  { code: 'WELCOME2024', discount: '20%', used: 234, total: 1000, expires: '2024-12-31' },
  { code: 'FLASH50', discount: '฿50', used: 567, total: 2000, expires: '2024-11-30' },
  { code: 'VIP100', discount: '฿100', used: 89, total: 500, expires: '2024-12-15' },
];

export default function MarketingPage() {
  const [selectedTab, setSelectedTab] = useState<'campaigns' | 'coupons' | 'segments'>('campaigns');

  const getCampaignTypeBadge = (type: string) => {
    const styles = {
      email: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      sms: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      notification: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };

    const icons = {
      email: Mail,
      sms: MessageSquare,
      notification: Megaphone,
    };

    const labels = {
      email: 'อีเมล',
      sms: 'SMS',
      notification: 'การแจ้งเตือน',
    };

    const Icon = icons[type as keyof typeof icons];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${styles[type as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      paused: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
      draft: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
    };

    const labels = {
      active: 'ทำงานอยู่',
      paused: 'หยุดชั่วคราว',
      completed: 'เสร็จสิ้น',
      draft: 'แบบร่าง',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketing Campaigns</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการแคมเปญการตลาดและโปรโมชั่น
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              สร้างแคมเปญ
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-${card.color}-100 dark:bg-${card.color}-900/30 rounded-lg`}>
                    <Icon className={`h-6 w-6 text-${card.color}-600 dark:text-${card.color}-400`} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {card.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{card.change}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedTab('campaigns')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'campaigns'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              แคมเปญ
            </button>
            <button
              onClick={() => setSelectedTab('coupons')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'coupons'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              คูปอง
            </button>
            <button
              onClick={() => setSelectedTab('segments')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'segments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              กลุ่มลูกค้า
            </button>
          </div>
        </div>

        {/* Campaigns Tab */}
        {selectedTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Campaign List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        แคมเปญ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ประเภท
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ส่ง
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        เปิด
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        คลิก
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        แปลง
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        รายได้
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        การกระทำ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockCampaigns.map((campaign) => {
                      const openRate = ((campaign.opened / campaign.sent) * 100).toFixed(1);
                      const clickRate = ((campaign.clicked / campaign.opened) * 100).toFixed(1);
                      const conversionRate = ((campaign.converted / campaign.clicked) * 100).toFixed(1);

                      return (
                        <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {campaign.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {campaign.startDate} {campaign.endDate && `- ${campaign.endDate}`}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getCampaignTypeBadge(campaign.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {campaign.sent.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {campaign.opened.toLocaleString()}
                              </span>
                              <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                                {openRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {campaign.clicked.toLocaleString()}
                              </span>
                              <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                                {clickRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {campaign.converted}
                              </span>
                              <span className="text-xs text-purple-600 dark:text-purple-400 ml-2">
                                {conversionRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              ฿{campaign.revenue.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(campaign.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                <Edit className="h-4 w-4" />
                              </button>
                              {campaign.status === 'active' ? (
                                <button className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400">
                                  <Pause className="h-4 w-4" />
                                </button>
                              ) : (
                                <button className="text-green-600 hover:text-green-800 dark:text-green-400">
                                  <Play className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Channel Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                ประสิทธิภาพตามช่องทาง
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="channel" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sent" fill="#3B82F6" name="ส่ง" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="opened" fill="#10B981" name="เปิด" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="clicked" fill="#F59E0B" name="คลิก" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {selectedTab === 'coupons' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">คูปองส่วนลด</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  สร้างคูปอง
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {coupons.map((coupon, index) => {
                  const usagePercent = (coupon.used / coupon.total) * 100;
                  return (
                    <div key={index} className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <Gift className="h-8 w-8 text-blue-600" />
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-bold">
                          {coupon.discount}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
                        {coupon.code}
                      </h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">ใช้แล้ว</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {coupon.used} / {coupon.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        หมดอายุ: {coupon.expires}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Segments Tab */}
        {selectedTab === 'segments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                การกระจายกลุ่มลูกค้า
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                รายละเอียดกลุ่มลูกค้า
              </h2>
              <div className="space-y-4">
                {segmentData.map((segment, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {segment.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {segment.value.toLocaleString()}
                      </span>
                    </div>
                    <button className="w-full mt-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Send className="h-4 w-4 inline mr-2" />
                      ส่งแคมเปญ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
