import { NextRequest, NextResponse } from 'next/server';
import { resend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/email/resend';
import {
  orderConfirmationEmail,
  lowStockAlertEmail,
  welcomeEmail,
} from '@/lib/email/templates';
import type { Order } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, order, product, oldStatus, newStatus } = body;

    if (!type || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to' },
        { status: 400 }
      );
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'order_created':
        if (!order) {
          return NextResponse.json(
            { error: 'Order data is required for order_created emails' },
            { status: 400 }
          );
        }
        const orderTemplate = orderConfirmationEmail(order as Order, { email: to });
        subject = orderTemplate.subject;
        html = orderTemplate.html;
        break;

      case 'order_status_update':
        if (!order || !oldStatus || !newStatus) {
          return NextResponse.json(
            { error: 'Order, oldStatus, and newStatus are required for status update emails' },
            { status: 400 }
          );
        }
        const updateTemplate = orderConfirmationEmail(order as Order, { email: to });
        subject = `Order Update - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`;
        html = updateTemplate.html;
        break;

      case 'low_stock':
        if (!product) {
          return NextResponse.json(
            { error: 'Product data is required for low_stock emails' },
            { status: 400 }
          );
        }
        const lowStockTemplate = lowStockAlertEmail([product]);
        subject = lowStockTemplate.subject;
        html = lowStockTemplate.html;
        break;

      case 'out_of_stock':
        if (!product) {
          return NextResponse.json(
            { error: 'Product data is required for out_of_stock emails' },
            { status: 400 }
          );
        }
        const outOfStockTemplate = lowStockAlertEmail([product]);
        subject = `🚨 Out of Stock Alert - ${product.name}`;
        html = outOfStockTemplate.html;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email would have been sent:', { type, to, subject });
      return NextResponse.json(
        {
          success: true,
          message: 'Email queued (Resend not configured)',
          debug: { type, to, subject }
        },
        { status: 200 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: type.includes('stock') ? ADMIN_EMAIL : to,
      subject,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, emailId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/notifications/email:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
