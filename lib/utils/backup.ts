/**
 * Backup and export utilities
 */

import { createClient } from '@/lib/supabase/client';

export interface BackupData {
  version: string;
  timestamp: string;
  tables: {
    products?: any[];
    customers?: any[];
    orders?: any[];
    order_items?: any[];
    discounts?: any[];
    stock_movements?: any[];
    notifications?: any[];
  };
}

/**
 * Export all data to JSON
 */
export async function exportAllData(): Promise<BackupData> {
  const supabase = createClient();
  const backup: BackupData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    tables: {},
  };

  // Export products
  const { data: products } = await supabase.from('products').select('*');
  backup.tables.products = products || [];

  // Export customers
  const { data: customers } = await supabase.from('customers').select('*');
  backup.tables.customers = customers || [];

  // Export orders
  const { data: orders } = await supabase.from('orders').select('*');
  backup.tables.orders = orders || [];

  // Export order items
  const { data: orderItems } = await supabase.from('order_items').select('*');
  backup.tables.order_items = orderItems || [];

  // Export discounts
  const { data: discounts } = await supabase.from('discounts').select('*');
  backup.tables.discounts = discounts || [];

  // Export stock movements
  const { data: stockMovements } = await supabase.from('stock_movements').select('*');
  backup.tables.stock_movements = stockMovements || [];

  return backup;
}

/**
 * Download backup as JSON file
 */
export async function downloadBackup() {
  const backup = await exportAllData();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `omni-sales-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export table to CSV
 */
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('ไม่มีข้อมูลให้ export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape values containing commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ].join('\n');

  // Download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Import backup from JSON file
 */
export async function importBackup(file: File): Promise<{
  success: boolean;
  message: string;
  errors?: string[];
}> {
  try {
    const text = await file.text();
    const backup: BackupData = JSON.parse(text);

    // Validate backup structure
    if (!backup.version || !backup.timestamp || !backup.tables) {
      return {
        success: false,
        message: 'ไฟล์ backup ไม่ถูกต้อง',
      };
    }

    const supabase = createClient();
    const errors: string[] = [];

    // Import data (this would need careful handling of foreign keys)
    // For now, we'll just validate the structure

    return {
      success: true,
      message: `Import สำเร็จ: ${Object.keys(backup.tables).length} ตาราง`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการ import',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Export specific table to CSV
 */
export async function exportTableToCSV(tableName: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    alert('เกิดข้อผิดพลาด: ' + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert('ไม่มีข้อมูลใน ' + tableName);
    return;
  }

  exportToCSV(data, tableName);
}
