/**
 * CSV import/export utilities for bulk operations
 */

import type { OrderItem } from '@/types';

export interface CSVImportResult {
  success: boolean;
  items: Omit<OrderItem, 'id'>[];
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    message: string;
  }>;
  totalRows: number;
  successCount: number;
  errorCount: number;
}

export interface ImportOptions {
  skipHeader?: boolean;
  skipErrors?: boolean;
  delimiter?: string;
  trimWhitespace?: boolean;
}

/**
 * Parse CSV string into rows
 */
export function parseCSV(
  csvString: string,
  options: ImportOptions = {}
): string[][] {
  const { delimiter = ',', trimWhitespace = true } = options;
  const lines = csvString.split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Simple CSV parser (handles quotes)
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator
        row.push(trimWhitespace ? current.trim() : current);
        current = '';
      } else {
        current += char;
      }
    }

    row.push(trimWhitespace ? current.trim() : current);
    rows.push(row);
  }

  return rows;
}

/**
 * Map CSV row to OrderItem
 */
function mapRowToItem(
  row: string[],
  headers: string[],
  rowNumber: number,
  errors: CSVImportResult['errors']
): Omit<OrderItem, 'id'> | null {
  const headerMap: Record<string, number> = {};

  // Map column headers
  const normalizedHeaders = [
    'productname',
    'productid',
    'quantity',
    'price',
    'discount',
    'notes',
  ];

  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().replace(/\s+/g, '');
    normalizedHeaders.forEach((expected) => {
      if (normalized.includes(expected)) {
        headerMap[expected] = index;
      }
    });
  });

  // Extract fields
  const productId = row[headerMap['productid']]?.trim();
  const productName = row[headerMap['productname']]?.trim();
  const quantityStr = row[headerMap['quantity']]?.trim();
  const priceStr = row[headerMap['price']]?.trim();
  const discountStr = row[headerMap['discount']]?.trim();
  const notes = row[headerMap['notes']]?.trim();

  // Validation
  if (!productName) {
    errors.push({
      row: rowNumber,
      field: 'productName',
      message: 'Product name is required',
    });
    return null;
  }

  const quantity = parseInt(quantityStr || '1', 10);
  if (isNaN(quantity) || quantity < 1) {
    errors.push({
      row: rowNumber,
      field: 'quantity',
      message: 'Quantity must be a positive number',
    });
    return null;
  }

  const price = parseFloat(priceStr || '0');
  if (isNaN(price) || price < 0) {
    errors.push({
      row: rowNumber,
      field: 'price',
      message: 'Price must be a non-negative number',
    });
    return null;
  }

  const discount = parseFloat(discountStr || '0');
  if (isNaN(discount) || discount < 0) {
    errors.push({
      row: rowNumber,
      field: 'discount',
      message: 'Discount must be a non-negative number',
    });
    return null;
  }

  return {
    productId: productId || `auto-${Date.now()}-${Math.random()}`,
    productName,
    quantity,
    price,
    discount: discount > 0 ? discount : undefined,
    notes: notes || undefined,
  };
}

/**
 * Import items from CSV
 */
export function importFromCSV(
  csvString: string,
  options: ImportOptions = {}
): CSVImportResult {
  const { skipHeader = true } = options;
  const errors: CSVImportResult['errors'] = [];
  const warnings: CSVImportResult['warnings'] = [];
  const items: Omit<OrderItem, 'id'>[] = [];

  try {
    const rows = parseCSV(csvString, options);

    if (rows.length === 0) {
      errors.push({
        row: 0,
        field: 'csv',
        message: 'CSV is empty',
      });

      return {
        success: false,
        items: [],
        errors,
        warnings,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
      };
    }

    // Extract headers
    let headers: string[] = [];
    let startRow = 0;

    if (skipHeader) {
      headers = rows[0];
      startRow = 1;
    } else {
      // Use default headers
      headers = ['productName', 'productId', 'quantity', 'price', 'discount', 'notes'];
    }

    // Validate headers
    if (
      !headers.some((h) =>
        h.toLowerCase().replace(/\s+/g, '').includes('productname')
      )
    ) {
      errors.push({
        row: 0,
        field: 'headers',
        message: 'Missing required column: productName',
      });

      return {
        success: false,
        items: [],
        errors,
        warnings,
        totalRows: rows.length,
        successCount: 0,
        errorCount: 1,
      };
    }

    // Process rows
    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];

      if (!row || row.every((cell) => !cell)) {
        // Skip empty rows
        continue;
      }

      const item = mapRowToItem(row, headers, i + 1, errors);

      if (item) {
        items.push(item);
      }
    }

    return {
      success: errors.length === 0,
      items,
      errors,
      warnings,
      totalRows: rows.length - (skipHeader ? 1 : 0),
      successCount: items.length,
      errorCount: errors.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    errors.push({
      row: 0,
      field: 'csv',
      message: `Failed to parse CSV: ${message}`,
    });

    return {
      success: false,
      items: [],
      errors,
      warnings,
      totalRows: 0,
      successCount: 0,
      errorCount: 1,
    };
  }
}

/**
 * Generate CSV from items
 */
export function exportToCSV(
  items: OrderItem[],
  orderId: string = ''
): string {
  const headers = ['Product Name', 'Product ID', 'Quantity', 'Price', 'Discount', 'Notes'];
  const rows: string[] = [];

  // Add headers
  rows.push(headers.map((h) => `"${h}"`).join(','));

  // Add items
  items.forEach((item) => {
    const row = [
      `"${item.productName}"`,
      `"${item.productId}"`,
      item.quantity.toString(),
      item.price.toFixed(2),
      (item.discount || 0).toFixed(2),
      `"${item.notes || ''}"`,
    ];

    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(
  csvString: string,
  filename: string = 'order.csv'
): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
  const headers = ['Product Name', 'Product ID', 'Quantity', 'Price', 'Discount', 'Notes'];
  const examples = [
    ['สินค้า A', 'prod-001', '2', '100.00', '10.00', 'หมายเหตุที่นี่'],
    ['สินค้า B', 'prod-002', '5', '50.50', '0', ''],
  ];

  let csv = headers.map((h) => `"${h}"`).join(',') + '\n';

  examples.forEach((row) => {
    csv +=
      row
        .map((cell) => `"${cell}"`)
        .join(',') + '\n';
  });

  return csv;
}

/**
 * Validate CSV file before import
 */
export function validateCSVFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
    return {
      valid: false,
      error: 'File must be CSV format',
    };
  }

  return { valid: true };
}

/**
 * Read CSV file
 */
export async function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
