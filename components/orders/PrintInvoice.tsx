'use client';

import { Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Order {
  id: number;
  total: number;
  discount: number;
  tax: number;
  status: string;
  created_at: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

interface PrintInvoiceProps {
  order: Order;
}

export default function PrintInvoice({ order }: PrintInvoiceProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal - order.discount + order.tax;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>ใบแจ้งหนี้ #${order.id}</title>
          <style>
            @media print {
              @page { margin: 0.5cm; }
              body { margin: 1cm; }
            }
            body {
              font-family: 'Sarabun', Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #000;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
            }
            .company-info {
              font-size: 18px;
              font-weight: bold;
            }
            .invoice-info {
              text-align: right;
            }
            .customer-info {
              margin-bottom: 30px;
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            table th {
              background-color: #000;
              color: #fff;
              padding: 10px;
              text-align: left;
            }
            table td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            .text-right {
              text-align: right;
            }
            .totals {
              margin-left: auto;
              width: 300px;
            }
            .totals tr td {
              padding: 8px;
              border: none;
            }
            .totals .grand-total {
              font-size: 18px;
              font-weight: bold;
              border-top: 2px solid #000;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="company-info">
                <div>OMNI SALES</div>
                <div style="font-size: 12px; font-weight: normal; margin-top: 5px;">
                  ระบบจัดการร้านค้า
                </div>
              </div>
              <div class="invoice-info">
                <h2 style="margin: 0;">ใบแจ้งหนี้</h2>
                <div>เลขที่: #${order.id}</div>
                <div>วันที่: ${new Date(order.created_at).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</div>
                <div>สถานะ: ${order.status}</div>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="customer-info">
              <h3 style="margin: 0 0 10px 0;">ข้อมูลลูกค้า</h3>
              <div><strong>ชื่อ:</strong> ${order.customer.name}</div>
              <div><strong>อีเมล:</strong> ${order.customer.email}</div>
              <div><strong>เบอร์โทร:</strong> ${order.customer.phone}</div>
              ${order.customer.address ? `<div><strong>ที่อยู่:</strong> ${order.customer.address}</div>` : ''}
            </div>

            <!-- Items Table -->
            <table>
              <thead>
                <tr>
                  <th style="width: 60%;">รายการ</th>
                  <th class="text-right">จำนวน</th>
                  <th class="text-right">ราคา/หน่วย</th>
                  <th class="text-right">รวม</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.price)}</td>
                    <td class="text-right">${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <!-- Totals -->
            <table class="totals">
              <tr>
                <td>ยอดรวม:</td>
                <td class="text-right">${formatCurrency(subtotal)}</td>
              </tr>
              ${
                order.discount > 0
                  ? `
              <tr>
                <td>ส่วนลด:</td>
                <td class="text-right">-${formatCurrency(order.discount)}</td>
              </tr>
              `
                  : ''
              }
              ${
                order.tax > 0
                  ? `
              <tr>
                <td>ภาษี (${((order.tax / subtotal) * 100).toFixed(0)}%):</td>
                <td class="text-right">${formatCurrency(order.tax)}</td>
              </tr>
              `
                  : ''
              }
              <tr class="grand-total">
                <td>ยอดรวมทั้งสิ้น:</td>
                <td class="text-right">${formatCurrency(total)}</td>
              </tr>
            </table>

            <!-- Footer -->
            <div class="footer">
              <p>ขอบคุณที่ใช้บริการ!</p>
              <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              // Auto-close after print dialog is closed (optional)
              // setTimeout(function() { window.close(); }, 100);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <Printer className="h-4 w-4" />
      พิมพ์ใบแจ้งหนี้
    </button>
  );
}
