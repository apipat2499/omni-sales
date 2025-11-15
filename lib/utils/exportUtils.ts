import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ======================================
// EXPORT TO EXCEL
// ======================================

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  fileName: string,
  sheetName: string = 'Sheet1'
) {
  try {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate file
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}

// ======================================
// EXPORT TO CSV
// ======================================

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  fileName: string
) {
  try {
    // Convert data to CSV format
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Generate CSV file
    XLSX.writeFile(wb, `${fileName}.csv`, { bookType: 'csv' });

    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
}

// ======================================
// EXPORT TO PDF (TABLE)
// ======================================

export function exportTableToPDF<T extends Record<string, any>>(
  data: T[],
  columns: { header: string; dataKey: keyof T }[],
  fileName: string,
  title?: string
) {
  try {
    // Create PDF document
    const doc = new jsPDF();

    // Add title if provided
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 15);
    }

    // Prepare table data
    const tableData = data.map(item =>
      columns.map(col => {
        const value = item[col.dataKey];
        // Format dates
        if (value instanceof Date) {
          return value.toLocaleDateString('th-TH');
        }
        // Format numbers
        if (typeof value === 'number') {
          return value.toLocaleString('th-TH');
        }
        return value?.toString() || '';
      })
    );

    // Generate table
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: tableData,
      startY: title ? 25 : 10,
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    // Save PDF
    doc.save(`${fileName}.pdf`);

    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
}

// ======================================
// PRODUCT EXPORT FUNCTIONS
// ======================================

export function exportProductsToExcel(products: any[]) {
  const formattedData = products.map(product => ({
    'SKU': product.sku,
    'ชื่อสินค้า': product.name,
    'หมวดหมู่': product.category,
    'ราคาขาย': product.price,
    'ต้นทุน': product.cost,
    'กำไร': product.price - product.cost,
    'คงเหลือ': product.stock,
    'คะแนน': product.rating || '-',
    'บาร์โค้ด': product.barcode || '-',
  }));

  return exportToExcel(formattedData, `products_${Date.now()}`, 'Products');
}

export function exportProductsToPDF(products: any[]) {
  const columns = [
    { header: 'SKU', dataKey: 'sku' },
    { header: 'ชื่อสินค้า', dataKey: 'name' },
    { header: 'หมวดหมู่', dataKey: 'category' },
    { header: 'ราคาขาย', dataKey: 'price' },
    { header: 'คงเหลือ', dataKey: 'stock' },
  ];

  return exportTableToPDF(
    products,
    columns as any,
    `products_${Date.now()}`,
    'รายงานสินค้า'
  );
}

export function exportProductsToCSV(products: any[]) {
  const formattedData = products.map(product => ({
    'SKU': product.sku,
    'Name': product.name,
    'Category': product.category,
    'Price': product.price,
    'Cost': product.cost,
    'Stock': product.stock,
    'Rating': product.rating || '',
    'Barcode': product.barcode || '',
  }));

  return exportToCSV(formattedData, `products_${Date.now()}`);
}

// ======================================
// ORDER EXPORT FUNCTIONS
// ======================================

export function exportOrdersToExcel(orders: any[]) {
  const formattedData = orders.map(order => ({
    'เลขที่ออเดอร์': order.id.slice(0, 8),
    'ลูกค้า': order.customerName,
    'ยอดรวม': order.total,
    'ส่วนลด': order.discountAmount || 0,
    'สถานะ': order.status,
    'ช่องทาง': order.channel,
    'วันที่สั่ง': new Date(order.createdAt).toLocaleDateString('th-TH'),
  }));

  return exportToExcel(formattedData, `orders_${Date.now()}`, 'Orders');
}

export function exportOrdersToPDF(orders: any[]) {
  const formattedOrders = orders.map(order => ({
    id: order.id.slice(0, 8),
    customerName: order.customerName,
    total: `฿${order.total.toLocaleString('th-TH')}`,
    status: order.status,
    channel: order.channel,
    createdAt: new Date(order.createdAt).toLocaleDateString('th-TH'),
  }));

  const columns = [
    { header: 'เลขที่', dataKey: 'id' },
    { header: 'ลูกค้า', dataKey: 'customerName' },
    { header: 'ยอดรวม', dataKey: 'total' },
    { header: 'สถานะ', dataKey: 'status' },
    { header: 'ช่องทาง', dataKey: 'channel' },
    { header: 'วันที่', dataKey: 'createdAt' },
  ];

  return exportTableToPDF(
    formattedOrders,
    columns as any,
    `orders_${Date.now()}`,
    'รายงานออเดอร์'
  );
}

export function exportOrdersToCSV(orders: any[]) {
  const formattedData = orders.map(order => ({
    'Order ID': order.id,
    'Customer': order.customerName,
    'Total': order.total,
    'Discount': order.discountAmount || 0,
    'Status': order.status,
    'Channel': order.channel,
    'Date': new Date(order.createdAt).toISOString(),
  }));

  return exportToCSV(formattedData, `orders_${Date.now()}`);
}

// ======================================
// CUSTOMER EXPORT FUNCTIONS
// ======================================

export function exportCustomersToExcel(customers: any[]) {
  const formattedData = customers.map(customer => ({
    'ชื่อลูกค้า': customer.name,
    'อีเมล': customer.email,
    'เบอร์โทร': customer.phone || '-',
    'ยอดซื้อรวม': customer.totalSpent,
    'จำนวนออเดอร์': customer.totalOrders,
    'แท็ก': customer.tags?.join(', ') || '-',
    'สถานะ': customer.lifecycleStage || 'new',
    'วันที่สมัคร': new Date(customer.createdAt).toLocaleDateString('th-TH'),
  }));

  return exportToExcel(formattedData, `customers_${Date.now()}`, 'Customers');
}

export function exportCustomersToPDF(customers: any[]) {
  const formattedCustomers = customers.map(customer => ({
    name: customer.name,
    email: customer.email,
    phone: customer.phone || '-',
    totalSpent: `฿${customer.totalSpent?.toLocaleString('th-TH') || 0}`,
    totalOrders: customer.totalOrders || 0,
    tags: customer.tags?.join(', ') || '-',
  }));

  const columns = [
    { header: 'ชื่อ', dataKey: 'name' },
    { header: 'อีเมล', dataKey: 'email' },
    { header: 'เบอร์โทร', dataKey: 'phone' },
    { header: 'ยอดซื้อ', dataKey: 'totalSpent' },
    { header: 'ออเดอร์', dataKey: 'totalOrders' },
  ];

  return exportTableToPDF(
    formattedCustomers,
    columns as any,
    `customers_${Date.now()}`,
    'รายงานลูกค้า'
  );
}

export function exportCustomersToCSV(customers: any[]) {
  const formattedData = customers.map(customer => ({
    'Name': customer.name,
    'Email': customer.email,
    'Phone': customer.phone || '',
    'Total Spent': customer.totalSpent || 0,
    'Total Orders': customer.totalOrders || 0,
    'Tags': customer.tags?.join(', ') || '',
    'Lifecycle Stage': customer.lifecycleStage || 'new',
    'Created At': new Date(customer.createdAt).toISOString(),
  }));

  return exportToCSV(formattedData, `customers_${Date.now()}`);
}
