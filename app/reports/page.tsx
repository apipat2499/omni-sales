'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AdminGuard } from '@/components/RouteGuard';
import { useReports } from '@/lib/hooks/useReports';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Download, FileText, Calendar, TrendingUp, Package, Users, ShoppingCart, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'products' | 'customers'>('sales');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '3months'>('30days');

  // Fetch reports data
  const { data: reportsData, isLoading, error } = useReports(dateRange);

  // Extract data from the hook
  const totalRevenue = reportsData?.summary.totalRevenue || 0;
  const totalOrders = reportsData?.summary.totalOrders || 0;
  const totalProducts = reportsData?.summary.totalProducts || 0;
  const totalCustomers = reportsData?.summary.totalCustomers || 0;
  const topProducts = reportsData?.topProducts || [];
  const topCustomers = reportsData?.topCustomers || [];
  const chartData = reportsData?.chartData || [];
  const orders = reportsData?.orders || [];

  const handleExportPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Sales Report', 20, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: th })}`, 20, 30);

    doc.setFontSize(14);
    doc.text('Summary', 20, 45);

    doc.setFontSize(11);
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 20, 55);
    doc.text(`Total Orders: ${totalOrders}`, 20, 62);
    doc.text(`Total Products: ${totalProducts}`, 20, 69);
    doc.text(`Total Customers: ${totalCustomers}`, 20, 76);

    doc.save('sales-report.pdf');
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');

    // Sales data
    const salesData = orders.map((order) => ({
      'Order ID': order.id,
      'Customer': order.customerName,
      'Channel': order.channel,
      'Status': order.status,
      'Subtotal': order.subtotal,
      'Tax': order.tax,
      'Shipping': order.shipping,
      'Total': order.total,
      'Date': format(order.createdAt, 'dd MMM yyyy', { locale: th }),
    }));

    const ws = XLSX.utils.json_to_sheet(salesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');

    XLSX.writeFile(wb, 'sales-report.xlsx');
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">รายงาน</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">วิเคราะห์ข้อมูลและส่งออกรายงาน</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isLoading || !reportsData}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-5 w-5" />
              ส่งออก PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isLoading || !reportsData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5" />
              ส่งออก Excel
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">เกิดข้อผิดพลาด: {error}</p>
          </div>
        )}

        {/* Report Type Selector */}
        <div className="flex gap-4">
          <button
            onClick={() => setReportType('sales')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              reportType === 'sales'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-500" />
            <p className="font-semibold text-gray-900 dark:text-white">รายงานยอดขาย</p>
          </button>
          <button
            onClick={() => setReportType('products')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              reportType === 'products'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <Package className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-500" />
            <p className="font-semibold text-gray-900 dark:text-white">รายงานสินค้า</p>
          </button>
          <button
            onClick={() => setReportType('customers')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              reportType === 'customers'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-500" />
            <p className="font-semibold text-gray-900 dark:text-white">รายงานลูกค้า</p>
          </button>
        </div>

        {/* Date Range */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
            >
              <option value="7days">7 วันล่าสุด</option>
              <option value="30days">30 วันล่าสุด</option>
              <option value="3months">3 เดือนล่าสุด</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">รายได้รวม</p>
                {isLoading ? (
                  <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalRevenue)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ออเดอร์</p>
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(totalOrders)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">สินค้า</p>
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(totalProducts)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ลูกค้า</p>
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(totalCustomers)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        {reportType === 'sales' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              ยอดขายรายวัน
            </h2>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="รายได้" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Top Products */}
        {reportType === 'products' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                สินค้าขายดี Top 5
              </h2>
            </div>
            {isLoading ? (
              <div className="p-6 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</div>
              </div>
            ) : topProducts.length === 0 ? (
              <div className="p-6 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">ไม่มีข้อมูลสินค้า</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        อันดับ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ชื่อสินค้า
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        จำนวนที่ขาย
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        รายได้
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topProducts.map((product: any, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {product.quantity} ชิ้น
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-500">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Top Customers */}
        {reportType === 'customers' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                ลูกค้าใช้จ่ายสูงสุด Top 5
              </h2>
            </div>
            {isLoading ? (
              <div className="p-6 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</div>
              </div>
            ) : topCustomers.length === 0 ? (
              <div className="p-6 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">ไม่มีข้อมูลลูกค้า</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        อันดับ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ชื่อลูกค้า
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        จำนวนออเดอร์
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ยอดรวม
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topCustomers.map((customer, index) => (
                      <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {customer.totalOrders} ออเดอร์
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-500">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
