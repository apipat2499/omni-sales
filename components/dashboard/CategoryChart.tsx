'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { mockCategorySales } from '@/lib/data/mock-data';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280'];

export default function CategoryChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        ยอดขายตามหมวดหมู่
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mockCategorySales}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const { category, percentage } = props.payload || {};
                return category && percentage ? `${category} ${percentage.toFixed(1)}%` : '';
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {mockCategorySales.map((entry, index) => (
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
