import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  sendCustomEmail,
  orderConfirmationTemplate,
  orderShippedTemplate,
  lowStockAlertTemplate,
  paymentReminderTemplate,
} from "@/lib/services/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, templateType, data, subject, html } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      );
    }

    let emailTemplate;

    // Use predefined template
    if (templateType) {
      switch (templateType) {
        case "order_confirmation":
          emailTemplate = orderConfirmationTemplate(
            data.customerName,
            data.orderNumber,
            data.items,
            data.total
          );
          break;
        case "order_shipped":
          emailTemplate = orderShippedTemplate(
            data.customerName,
            data.orderNumber,
            data.trackingNumber,
            data.carrier
          );
          break;
        case "low_stock_alert":
          emailTemplate = lowStockAlertTemplate(
            data.productName,
            data.currentStock,
            data.reorderPoint
          );
          break;
        case "payment_reminder":
          emailTemplate = paymentReminderTemplate(
            data.customerName,
            data.invoiceNumber,
            data.dueDate,
            data.amount
          );
          break;
        default:
          return NextResponse.json(
            { error: "Unknown template type" },
            { status: 400 }
          );
      }

      const result = await sendEmail(to, emailTemplate);
      return NextResponse.json(result);
    }

    // Use custom email
    if (subject && html) {
      const result = await sendCustomEmail(to, subject, html);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Either templateType or subject/html is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
