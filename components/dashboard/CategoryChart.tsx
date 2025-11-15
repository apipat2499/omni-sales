'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useCategorySales } from '@/lib/hooks/useDashboard';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280'];

export default function CategoryChart() {
  const { categorySales, loading } = useCategorySales(30);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          ยอดขายตามหมวดหมู่
        </h2>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (categorySales.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          ยอดขายตามหมวดหมู่
        </h2>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">ยังไม่มีข้อมูลยอดขาย</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        ยอดขายตามหมวดหมู่
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categorySales}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percentage }) => `${category} ${percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categorySales.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
