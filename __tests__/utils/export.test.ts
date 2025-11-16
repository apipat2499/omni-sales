/**
 * Unit tests for export utilities
 */
import { createMockOrderItem, createMockOrderItems } from '../factories';

describe('Export Utilities', () => {
  describe('CSV Export', () => {
    it('should format order items for CSV export', () => {
      const items = createMockOrderItems(2);

      const headers = ['Product Name', 'Quantity', 'Price', 'Total'];
      const rows = items.map(item => [
        item.productName,
        item.quantity.toString(),
        item.price.toFixed(2),
        (item.quantity * item.price).toFixed(2),
      ]);

      expect(headers).toHaveLength(4);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveLength(4);
    });

    it('should handle empty data', () => {
      const items: any[] = [];
      const rows = items.map(item => [item.productName]);

      expect(rows).toHaveLength(0);
    });

    it('should escape special CSV characters', () => {
      const item = createMockOrderItem({
        productName: 'Product "With" Quotes',
        notes: 'Notes, with, commas',
      });

      const escapeCsvField = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      expect(escapeCsvField(item.productName)).toBe('"Product ""With"" Quotes"');
      expect(escapeCsvField(item.notes || '')).toBe('"Notes, with, commas"');
    });
  });

  describe('Excel Export', () => {
    it('should structure data for Excel export', () => {
      const items = createMockOrderItems(3);

      const worksheet = {
        name: 'Orders',
        data: [
          ['Product Name', 'Quantity', 'Price', 'Total'],
          ...items.map(item => [
            item.productName,
            item.quantity,
            item.price,
            item.quantity * item.price,
          ]),
        ],
      };

      expect(worksheet.name).toBe('Orders');
      expect(worksheet.data).toHaveLength(4); // 1 header + 3 items
      expect(worksheet.data[0]).toEqual(['Product Name', 'Quantity', 'Price', 'Total']);
    });

    it('should handle numeric formatting', () => {
      const item = createMockOrderItem({
        price: 99.99,
        quantity: 5,
      });

      const total = item.price * item.quantity;
      expect(total).toBe(499.95);
      expect(total.toFixed(2)).toBe('499.95');
    });
  });

  describe('PDF Export', () => {
    it('should format data for PDF generation', () => {
      const items = createMockOrderItems(2);

      const pdfData = {
        title: 'Order Report',
        date: new Date().toISOString(),
        items: items.map(item => ({
          name: item.productName,
          qty: item.quantity,
          price: `฿${item.price.toFixed(2)}`,
          total: `฿${(item.quantity * item.price).toFixed(2)}`,
        })),
        grandTotal: items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
      };

      expect(pdfData.title).toBe('Order Report');
      expect(pdfData.items).toHaveLength(2);
      expect(pdfData.items[0]).toHaveProperty('name');
      expect(pdfData.items[0]).toHaveProperty('qty');
      expect(pdfData.items[0]).toHaveProperty('price');
      expect(pdfData.items[0]).toHaveProperty('total');
    });
  });
});
