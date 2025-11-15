import type { Product, Order, Customer, Discount } from '@/types';

// Generic CSV export function
export function exportToCSV(data: any[], filename: string, columns: { key: string; header: string }[]) {
  if (data.length === 0) {
    alert('ไม่มีข้อมูลให้ export');
    return;
  }

  // Create CSV header
  const headers = columns.map((col) => col.header).join(',');

  // Create CSV rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let value = item[col.key];

        // Handle nested objects
        if (col.key.includes('.')) {
          const keys = col.key.split('.');
          value = keys.reduce((obj, key) => obj?.[key], item);
        }

        // Handle dates
        if (value instanceof Date) {
          value = value.toLocaleString('th-TH');
        }

        // Handle arrays
        if (Array.isArray(value)) {
          value = value.join('; ');
        }

        // Handle null/undefined
        if (value === null || value === undefined) {
          value = '';
        }

        // Escape commas and quotes
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }

        return value;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Add BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Products export
export function exportProducts(products: Product[]) {
  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'ชื่อสินค้า' },
    { key: 'category', header: 'หมวดหมู่' },
    { key: 'price', header: 'ราคา' },
    { key: 'cost', header: 'ต้นทุน' },
    { key: 'stock', header: 'สต็อก' },
    { key: 'description', header: 'รายละเอียด' },
    { key: 'createdAt', header: 'วันที่สร้าง' },
  ];

  exportToCSV(products, 'products', columns);
}

// Orders export
export function exportOrders(orders: Order[]) {
  const columns = [
    { key: 'id', header: 'รหัสคำสั่งซื้อ' },
    { key: 'customerName', header: 'ลูกค้า' },
    { key: 'subtotal', header: 'ยอดรวม' },
    { key: 'discountCode', header: 'โค้ดส่วนลด' },
    { key: 'discountAmount', header: 'ส่วนลด' },
    { key: 'tax', header: 'ภาษี' },
    { key: 'shipping', header: 'ค่าจัดส่ง' },
    { key: 'total', header: 'รวมทั้งสิ้น' },
    { key: 'status', header: 'สถานะ' },
    { key: 'channel', header: 'ช่องทาง' },
    { key: 'paymentMethod', header: 'วิธีชำระเงิน' },
    { key: 'createdAt', header: 'วันที่สั่งซื้อ' },
    { key: 'deliveredAt', header: 'วันที่จัดส่ง' },
  ];

  exportToCSV(orders, 'orders', columns);
}

// Customers export
export function exportCustomers(customers: Customer[]) {
  const columns = [
    { key: 'name', header: 'ชื่อ' },
    { key: 'email', header: 'อีเมล' },
    { key: 'phone', header: 'เบอร์โทร' },
    { key: 'address', header: 'ที่อยู่' },
    { key: 'tags', header: 'แท็ก' },
    { key: 'totalOrders', header: 'จำนวนคำสั่งซื้อ' },
    { key: 'totalSpent', header: 'ยอดซื้อทั้งหมด' },
    { key: 'lastOrderDate', header: 'คำสั่งซื้อล่าสุด' },
    { key: 'createdAt', header: 'วันที่สร้าง' },
  ];

  exportToCSV(customers, 'customers', columns);
}

// Discounts export
export function exportDiscounts(discounts: Discount[]) {
  const columns = [
    { key: 'code', header: 'โค้ด' },
    { key: 'name', header: 'ชื่อ' },
    { key: 'type', header: 'ประเภท' },
    { key: 'value', header: 'มูลค่า' },
    { key: 'minPurchaseAmount', header: 'ซื้อขั้นต่ำ' },
    { key: 'usageCount', header: 'ใช้แล้ว' },
    { key: 'usageLimit', header: 'จำกัดการใช้' },
    { key: 'startDate', header: 'เริ่มต้น' },
    { key: 'endDate', header: 'สิ้นสุด' },
    { key: 'active', header: 'สถานะ' },
    { key: 'createdAt', header: 'วันที่สร้าง' },
  ];

  exportToCSV(discounts, 'discounts', columns);
}
