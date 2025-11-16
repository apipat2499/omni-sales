import type { OrderItem } from '@/types';

/**
 * Export order items to CSV format
 */
export function exportOrderItemsToCSV(
  items: OrderItem[],
  orderId: string = 'Order'
): void {
  if (items.length === 0) {
    alert('ไม่มีรายการที่จะส่งออก');
    return;
  }

  // Prepare CSV content
  const headers = ['ลำดับ', 'สินค้า', 'ราคา', 'จำนวน', 'ส่วนลด', 'รวม', 'หมายเหตุ'];
  const rows = items.map((item, index) => {
    const discount = item.discount || 0;
    const total = (item.quantity * item.price - discount).toFixed(2);

    return [
      (index + 1).toString(),
      item.productName,
      item.price.toFixed(2),
      item.quantity.toString(),
      discount.toFixed(2),
      total,
      item.notes || '',
    ];
  });

  // Add summary row
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalAmount = subtotal - totalDiscount;

  rows.push(['', '', '', '', '', '', '']);
  rows.push(['รวมทั้งสิ้น', '', '', '', '', subtotal.toFixed(2), '']);
  rows.push(['ส่วนลด', '', '', '', '', totalDiscount.toFixed(2), '']);
  rows.push(['ยอดรวมสุดท้าย', '', '', '', '', totalAmount.toFixed(2), '']);

  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(cell).replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        })
        .join(',')
    ),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const filename = `order-${orderId}-items-${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export order items to JSON format
 */
export function exportOrderItemsToJSON(
  items: OrderItem[],
  orderId: string = 'Order'
): void {
  if (items.length === 0) {
    alert('ไม่มีรายการที่จะส่งออก');
    return;
  }

  const data = {
    orderId,
    exportDate: new Date().toISOString(),
    itemCount: items.length,
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount || 0,
      total: item.quantity * item.price - (item.discount || 0),
      notes: item.notes,
    })),
    summary: {
      subtotal: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
      totalDiscount: items.reduce((sum, item) => sum + (item.discount || 0), 0),
      total: items.reduce(
        (sum, item) => sum + (item.quantity * item.price - (item.discount || 0)),
        0
      ),
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const filename = `order-${orderId}-items-${new Date().toISOString().split('T')[0]}.json`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print order items
 */
export function printOrderItems(items: OrderItem[], orderId: string = 'Order'): void {
  const printWindow = window.open('', '', 'height=600,width=800');
  if (!printWindow) {
    alert('ไม่สามารถเปิดหน้าต่างพิมพ์ได้');
    return;
  }

  const now = new Date().toLocaleString('th-TH');
  const itemsHTML = items
    .map(
      (item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.productName}</td>
      <td style="text-align: right">฿${item.price.toFixed(2)}</td>
      <td style="text-align: center">${item.quantity}</td>
      <td style="text-align: right">฿${(item.discount || 0).toFixed(2)}</td>
      <td style="text-align: right">฿${(item.quantity * item.price - (item.discount || 0)).toFixed(2)}</td>
      <td>${item.notes || '-'}</td>
    </tr>
  `
    )
    .join('');

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const total = subtotal - totalDiscount;

  const html = `
    <!DOCTYPE html>
    <html dir="ltr">
    <head>
      <meta charset="utf-8">
      <title>ออเดอร์ ${orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .summary { margin-top: 20px; text-align: right; }
        .summary-row { padding: 8px 0; }
        .total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>รายละเอียดออเดอร์ #${orderId}</h1>
      <p>วันที่: ${now}</p>
      <table>
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>สินค้า</th>
            <th>ราคา</th>
            <th>จำนวน</th>
            <th>ส่วนลด</th>
            <th>รวม</th>
            <th>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      <div class="summary">
        <div class="summary-row">ยอดรวม: ฿${subtotal.toFixed(2)}</div>
        <div class="summary-row">ส่วนลด: ฿${totalDiscount.toFixed(2)}</div>
        <div class="summary-row total">รวมทั้งสิ้น: ฿${total.toFixed(2)}</div>
      </div>
      <div class="footer">
        <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}
