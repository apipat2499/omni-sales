'use client';

import DashboardLayout from '@/components/DashboardLayout';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
  Award
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Sample data for charts
const revenueData = [
  { month: 'ม.ค.', revenue: 45000, orders: 120, customers: 89 },
  { month: 'ก.พ.', revenue: 52000, orders: 142, customers: 105 },
  { month: 'มี.ค.', revenue: 48000, orders: 135, customers: 98 },
  { month: 'เม.ย.', revenue: 61000, orders: 168, customers: 127 },
  { month: 'พ.ค.', revenue: 55000, orders: 156, customers: 118 },
  { month: 'มิ.ย.', revenue: 67000, orders: 189, customers: 142 },
  { month: 'ก.ค.', revenue: 72000, orders: 205, customers: 156 },
];

const categoryData = [
  { name: 'เสื้อผ้า', value: 35, amount: 245000 },
  { name: 'อิเล็กทรอนิกส์', value: 28, amount: 196000 },
  { name: 'อาหาร', value: 20, amount: 140000 },
  { name: 'เครื่องสำอาง', value: 12, amount: 84000 },
  { name: 'อื่นๆ', value: 5, amount: 35000 },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

const topProducts = [
  { name: 'iPhone 15 Pro', sales: 156, revenue: 7800000, growth: 23.5 },
  { name: 'Samsung Galaxy S24', sales: 134, revenue: 5360000, growth: 18.2 },
  { name: 'MacBook Air M3', sales: 89, revenue: 5340000, growth: 31.4 },
  { name: 'AirPods Pro 2', sales: 245, revenue: 2450000, growth: 12.8 },
  { name: 'iPad Air', sales: 178, revenue: 3560000, growth: -5.3 },
];

const kpiData = [
  {
    title: 'รายได้รวม',
    value: '฿2,450,000',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'blue',
    description: 'เทียบกับเดือนที่แล้ว'
  },
  {
    title: 'คำสั่งซื้อทั้งหมด',
    value: '1,547',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'green',
    description: 'เพิ่มขึ้นจากเดือนก่อน'
  },
  {
    title: 'ลูกค้าใหม่',
    value: '342',
    change: '+23.1%',
    trend: 'up',
    icon: Users,
    color: 'purple',
    description: 'ลูกค้าใหม่ในเดือนนี้'
  },
  {
    title: 'มูลค่าเฉลี่ย/คำสั่งซื้อ',
    value: '฿1,584',
    change: '-3.2%',
    trend: 'down',
    icon: Activity,
    color: 'orange',
    description: 'AOV ลดลงเล็กน้อย'
  },
  {
    title: 'อัตราแปลง',
    value: '3.8%',
    change: '+0.5%',
    trend: 'up',
    icon: Target,
    color: 'indigo',
    description: 'เปอร์เซ็นต์การซื้อ'
  },
  {
    title: 'ผลิตภัณฑ์ขายดี',
    value: '234',
    change: '+15.7%',
    trend: 'up',
    icon: Award,
    color: 'pink',
    description: 'สินค้ายอดนิยม'
  },
];

const performanceMetrics = [
  { metric: 'อัตราการเติบโตรายได้', current: 12.5, target: 15.0, status: 'good' },
  { metric: 'Customer Lifetime Value', current: 8500, target: 10000, status: 'good' },
  { metric: 'อัตราการกลับมาซื้อซ้ำ', current: 45, target: 50, status: 'warning' },
  { metric: 'Net Promoter Score', current: 72, target: 80, status: 'good' },
  { metric: 'Cart Abandonment Rate', current: 68, target: 50, status: 'danger' },
];

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              วิเคราะห์ข้อมูลเชิงลึกและแนวโน้มธุรกิจ
            </p>
          </div>
          <div className="flex gap-3">
            <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
              <option>30 วันที่แล้ว</option>
              <option>7 วันที่แล้ว</option>
              <option>90 วันที่แล้ว</option>
              <option>ปีนี้</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : ArrowDownRight;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-${kpi.color}-100 dark:bg-${kpi.color}-900/30 rounded-lg`}>
                    <Icon className={`h-6 w-6 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                    kpi.trend === 'up'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <TrendIcon className="h-4 w-4" />
                    {kpi.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {kpi.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{kpi.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{kpi.description}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">แนวโน้มรายได้</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">รายได้รายเดือน 7 เดือนที่ผ่านมา</p>
              </div>
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sales by Category */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ยอดขายตามหมวดหมู่</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">สัดส่วนการขายแต่ละประเภท</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products & Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">สินค้าขายดี Top 5</h2>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ขายไป {product.sales} ชิ้น</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ฿{product.revenue.toLocaleString()}
                    </p>
                    <div className={`flex items-center gap-1 text-sm ${
                      product.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.growth > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {Math.abs(product.growth)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">เมตริกประสิทธิภาพ</h2>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => {
                const percentage = (metric.current / metric.target) * 100;
                const statusColor =
                  metric.status === 'good' ? 'bg-green-500' :
                  metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500';

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.metric}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {metric.current}{typeof metric.current === 'number' && metric.current < 100 ? '%' : ''} / {metric.target}{typeof metric.target === 'number' && metric.target < 100 ? '%' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${statusColor} transition-all`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Orders & Customers Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">คำสั่งซื้อและลูกค้า</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="orders" fill="#3B82F6" name="คำสั่งซื้อ" radius={[8, 8, 0, 0]} />
              <Bar dataKey="customers" fill="#10B981" name="ลูกค้าใหม่" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
