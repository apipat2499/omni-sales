import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, customerId, items, totalAmount } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Create invoice in database
    const invoiceNumber = `INV-${Date.now()}`;
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        order_id: orderId,
        customer_id: customerId,
        items: items,
        total_amount: totalAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Generate PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.text('INVOICE', 20, yPosition);

    yPosition += 15;
    pdf.setFontSize(10);
    pdf.text(`Invoice Number: ${invoiceNumber}`, 20, yPosition);
    yPosition += 5;
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 5;
    pdf.text(`Order ID: ${orderId}`, 20, yPosition);

    yPosition += 15;
    pdf.setFontSize(12);
    pdf.text('Items:', 20, yPosition);
    yPosition += 10;

    // Items table header
    pdf.setFontSize(10);
    pdf.text('Description', 20, yPosition);
    pdf.text('Qty', 100, yPosition);
    pdf.text('Price', 130, yPosition);
    pdf.text('Total', 160, yPosition);
    yPosition += 7;

    // Items
    items.forEach((item: any) => {
      const itemTotal = item.quantity * item.price;
      pdf.text(item.description, 20, yPosition);
      pdf.text(item.quantity.toString(), 100, yPosition);
      pdf.text(`$${item.price.toFixed(2)}`, 130, yPosition);
      pdf.text(`$${itemTotal.toFixed(2)}`, 160, yPosition);
      yPosition += 7;

      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
    });

    // Total
    yPosition += 5;
    pdf.setFontSize(12);
    pdf.text(`Total: $${totalAmount.toFixed(2)}`, 160, yPosition);

    // Footer
    yPosition = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.text('Thank you for your business!', pageWidth / 2, yPosition, {
      align: 'center',
    });

    const pdfData = pdf.output('arraybuffer');

    return NextResponse.json({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      pdf: Buffer.from(pdfData).toString('base64'),
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
