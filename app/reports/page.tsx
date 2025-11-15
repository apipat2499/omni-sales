'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { mockOrders, mockProducts, mockCustomers, mockChartData } from '@/lib/data/mock-data';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Download, FileText, Calendar, TrendingUp, Package, Users, ShoppingCart, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'products' | 'customers'>('sales');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '3months'>('30days');

  // Calculate stats
  const totalRevenue = mockOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = mockOrders.length;
  const totalProducts = mockProducts.length;
  const totalCustomers = mockCustomers.length;

  // Top selling products
  const productSales = mockOrders.flatMap((order) =>
    order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      revenue: item.price * item.quantity,
    }))
  );

  const topProducts = Object.values(
    productSales.reduce((acc: any, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      acc[item.productId].quantity += item.quantity;
      acc[item.productId].revenue += item.revenue;
      return acc;
    }, {})
  )
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top customers
  const topCustomers = [...mockCustomers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

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
    const salesData = mockOrders.map((order) => ({
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
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รายงาน</h1>
            <p className="text-gray-600 mt-1">วิเคราะห์ข้อมูลและส่งออกรายงาน</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="h-5 w-5" />
              ส่งออก PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              ส่งออก Excel
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="flex gap-4">
          <button
            onClick={() => setReportType('sales')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              reportType === 'sales'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="font-semibold">รายงานยอดขาย</p>
          </button>
          <button
            onClick={() => setReportType('products')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              reportType === 'products'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="font-semibold">รายงานสินค้า</p>
          </button>
          <button
            onClick={() => setReportType('customers')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              reportType === 'customers'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="font-semibold">รายงานลูกค้า</p>
          </button>
        </div>

        {/* Date Range */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">รายได้รวม</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ออเดอร์</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(totalOrders)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">สินค้า</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(totalProducts)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ลูกค้า</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(totalCustomers)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        {reportType === 'sales' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              ยอดขายรายวัน
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockChartData.slice(-30)}>
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
          </div>
        )}

        {/* Top Products */}
        {reportType === 'products' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                สินค้าขายดี Top 5
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      อันดับ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ชื่อสินค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      จำนวนที่ขาย
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      รายได้
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topProducts.map((product: any, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.quantity} ชิ้น
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Customers */}
        {reportType === 'customers' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                ลูกค้าใช้จ่ายสูงสุด Top 5
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      อันดับ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ชื่อลูกค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      จำนวนออเดอร์
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ยอดรวม
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {customer.totalOrders} ออเดอร์
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
