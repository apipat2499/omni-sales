'use client';

import { X, Printer, Package, MapPin, CreditCard, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useState } from 'react';
import type { Order } from '@/types';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
}: OrderDetailsModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true);

      // Fetch invoice data
      const response = await fetch(`/api/orders/${order.id}/invoice`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice data');
      }

      const invoiceData = await response.json();

      // Generate PDF
      await generateInvoicePDF(invoiceData);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดใบแจ้งหนี้');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                รายละเอียดออเดอร์ #{order.id.toUpperCase().slice(0, 8)}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {format(order.createdAt, 'dd MMMM yyyy HH:mm', { locale: th })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="ดาวน์โหลดใบแจ้งหนี้ PDF"
              >
                <Download className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {isDownloading ? 'กำลังสร้าง...' : 'ใบแจ้งหนี้'}
                </span>
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="พิมพ์"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Timeline */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    สถานะปัจจุบัน
                  </p>
                  <span
                    className={`px-3 py-1.5 text-sm font-medium rounded-md border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                {order.deliveredAt && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      วันที่จัดส่งสำเร็จ
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(order.deliveredAt, 'dd MMM yyyy HH:mm', { locale: th })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    ข้อมูลลูกค้า
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">ชื่อ:</span> {order.customerName}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">รหัสลูกค้า:</span>{' '}
                    {order.customerId.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    การชำระเงิน
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">วิธีชำระเงิน:</span>{' '}
                    {order.paymentMethod || 'ไม่ระบุ'}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">ช่องทาง:</span> {order.channel}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    ที่อยู่จัดส่ง
                  </h3>
                </div>
                <p className="text-sm text-gray-900 dark:text-white">
                  {order.shippingAddress}
                </p>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">หมายเหตุ</h3>
                </div>
                <p className="text-sm text-gray-900 dark:text-white">{order.notes}</p>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                รายการสินค้า
              </h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        สินค้า
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ราคา/หน่วย
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        จำนวน
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        ยอดรวม
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {order.items.map((item, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-center">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ยอดรวมสินค้า:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                {order.discountAmount && order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      ส่วนลด{order.couponCode ? ` (${order.couponCode})` : ''}:
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      -{formatCurrency(order.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ภาษี (7%):</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(order.tax)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ค่าจัดส่ง:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(order.shipping)}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ยอดรวมทั้งหมด:
                  </span>
                  <span className="font-bold text-lg text-blue-600 dark:text-blue-500">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
