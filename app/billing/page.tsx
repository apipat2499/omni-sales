'use client';

import DashboardLayout from '@/components/DashboardLayout';
import {
  Receipt,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Download,
  Send,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  items: number;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    customer: 'บริษัท ABC จำกัด',
    amount: 125000,
    dueDate: '2024-12-15',
    issueDate: '2024-11-15',
    status: 'paid',
    paymentMethod: 'โอนเงิน',
    items: 5,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    customer: 'ร้าน XYZ',
    amount: 85000,
    dueDate: '2024-11-25',
    issueDate: '2024-11-10',
    status: 'pending',
    items: 3,
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    customer: 'คุณสมชาย ใจดี',
    amount: 45000,
    dueDate: '2024-11-10',
    issueDate: '2024-10-25',
    status: 'overdue',
    items: 2,
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    customer: 'บริษัท DEF จำกัด',
    amount: 250000,
    dueDate: '2024-12-01',
    issueDate: '2024-11-01',
    status: 'paid',
    paymentMethod: 'บัตรเครดิต',
    items: 8,
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-005',
    customer: 'ร้าน MNO',
    amount: 30000,
    dueDate: '2024-11-20',
    issueDate: '2024-11-12',
    status: 'cancelled',
    items: 1,
  },
];

const summaryCards = [
  {
    title: 'รายได้รวม',
    value: '฿535,000',
    subtext: 'จากใบแจ้งหนี้ทั้งหมด',
    icon: DollarSign,
    color: 'blue',
  },
  {
    title: 'ชำระแล้ว',
    value: '฿375,000',
    subtext: '70% ของทั้งหมด',
    icon: CheckCircle,
    color: 'green',
  },
  {
    title: 'รอชำระ',
    value: '฿85,000',
    subtext: '1 ใบแจ้งหนี้',
    icon: Clock,
    color: 'yellow',
  },
  {
    title: 'เกินกำหนด',
    value: '฿45,000',
    subtext: 'ควรติดตาม',
    icon: AlertCircle,
    color: 'red',
  },
];

const recentPayments = [
  {
    date: '2024-11-16',
    invoice: 'INV-2024-001',
    customer: 'บริษัท ABC จำกัด',
    amount: 125000,
    method: 'โอนเงิน',
  },
  {
    date: '2024-11-15',
    invoice: 'INV-2024-004',
    customer: 'บริษัท DEF จำกัด',
    amount: 250000,
    method: 'บัตรเครดิต',
  },
];

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
      overdue: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
    };

    const labels = {
      paid: 'ชำระแล้ว',
      pending: 'รอชำระ',
      overdue: 'เกินกำหนด',
      cancelled: 'ยกเลิก',
    };

    const icons = {
      paid: CheckCircle,
      pending: Clock,
      overdue: AlertCircle,
      cancelled: XCircle,
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Invoices</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการใบแจ้งหนี้และติดตามการชำระเงิน
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              สร้างใบแจ้งหนี้
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
                <p className="text-xs text-gray-500 dark:text-gray-500">{card.subtext}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาใบแจ้งหนี้, ลูกค้า..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="paid">ชำระแล้ว</option>
                  <option value="pending">รอชำระ</option>
                  <option value="overdue">เกินกำหนด</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ใบแจ้งหนี้
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ลูกค้า
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        จำนวนเงิน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ครบกำหนด
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
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {invoice.issueDate}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {invoice.customer}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ฿{invoice.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {invoice.dueDate}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-3">
                            ดูรายละเอียด
                          </button>
                          {invoice.status === 'pending' && (
                            <button className="text-green-600 hover:text-green-800 dark:text-green-400">
                              <Send className="h-4 w-4 inline mr-1" />
                              ส่ง
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Payments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                การชำระล่าสุด
              </h2>
              <div className="space-y-4">
                {recentPayments.map((payment, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {payment.invoice}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {payment.customer}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        ฿{payment.amount.toLocaleString()}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                        {payment.method}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ช่องทางชำระเงิน
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      บัตรเครดิต
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Visa, Mastercard, JCB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      โอนเงิน
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ธนาคารไทยพาณิชย์
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      เงินสด
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ชำระที่หน้าร้าน
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
