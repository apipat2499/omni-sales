import { jsPDF } from 'jspdf';
import { formatCurrency } from '../utils';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceData {
  orderId: string;
  orderDate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
}

export async function generateInvoicePDF(invoiceData: InvoiceData) {
  const doc = new jsPDF();

  // Set font
  doc.setFont('helvetica');

  // Header - Company Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('OMNI SALES', 105, 20, { align: 'center' });

  // Invoice Title
  doc.setFontSize(16);
  doc.text('ใบแจ้งหนี้ / INVOICE', 105, 30, { align: 'center' });

  // Invoice Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoiceData.orderId.toUpperCase()}`, 20, 45);
  doc.text(`Date: ${invoiceData.orderDate}`, 20, 52);
  doc.text(`Status: ${invoiceData.status.toUpperCase()}`, 20, 59);

  // Customer Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Bill To:', 20, 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoiceData.customer.name, 20, 82);
  doc.text(invoiceData.customer.email, 20, 89);
  doc.text(invoiceData.customer.phone, 20, 96);
  if (invoiceData.customer.address) {
    const addressLines = doc.splitTextToSize(invoiceData.customer.address, 80);
    doc.text(addressLines, 20, 103);
  }

  // Shipping Address (if different)
  if (invoiceData.shippingAddress) {
    doc.setFont('helvetica', 'bold');
    doc.text('Ship To:', 120, 75);
    doc.setFont('helvetica', 'normal');
    const shippingLines = doc.splitTextToSize(invoiceData.shippingAddress, 70);
    doc.text(shippingLines, 120, 82);
  }

  // Items Table Header
  let yPos = 125;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Item', 22, yPos);
  doc.text('Qty', 120, yPos, { align: 'right' });
  doc.text('Price', 145, yPos, { align: 'right' });
  doc.text('Total', 185, yPos, { align: 'right' });

  // Items
  doc.setFont('helvetica', 'normal');
  yPos += 8;

  invoiceData.items.forEach((item) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(item.name, 22, yPos);
    doc.text(item.quantity.toString(), 120, yPos, { align: 'right' });
    doc.text(formatCurrency(item.price), 145, yPos, { align: 'right' });
    doc.text(formatCurrency(item.total), 185, yPos, { align: 'right' });
    yPos += 7;
  });

  // Separator line
  yPos += 3;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  yPos += 8;

  // Subtotals
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 145, yPos);
  doc.text(formatCurrency(invoiceData.subtotal), 185, yPos, { align: 'right' });
  yPos += 7;

  doc.text('Tax (7%):', 145, yPos);
  doc.text(formatCurrency(invoiceData.tax), 185, yPos, { align: 'right' });
  yPos += 7;

  doc.text('Shipping:', 145, yPos);
  doc.text(formatCurrency(invoiceData.shipping), 185, yPos, { align: 'right' });
  yPos += 7;

  // Total
  doc.setLineWidth(0.5);
  doc.line(135, yPos, 190, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', 145, yPos);
  doc.text(formatCurrency(invoiceData.total), 185, yPos, { align: 'right' });

  // Payment Method
  if (invoiceData.paymentMethod) {
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: ${invoiceData.paymentMethod}`, 20, yPos);
  }

  // Notes
  if (invoiceData.notes) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(invoiceData.notes, 170);
    doc.text(notesLines, 20, yPos);
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
    doc.text(
      'Thank you for your business!',
      105,
      290,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`invoice-${invoiceData.orderId}.pdf`);
}
