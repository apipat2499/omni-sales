'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockChartData } from '@/lib/data/mock-data';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function RevenueChart() {
  const data = mockChartData.slice(-14).map(item => ({
    ...item,
    dateFormatted: format(new Date(item.date), 'dd MMM', { locale: th }),
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        รายได้ 14 วันล่าสุด
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="dateFormatted"
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'revenue' ? 'รายได้' : 'ออเดอร์'
              ]}
            />
            <Legend
              formatter={(value) => value === 'revenue' ? 'รายได้' : 'ออเดอร์'}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
