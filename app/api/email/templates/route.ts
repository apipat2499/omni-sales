import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const templates = [
      {
        id: "order_confirmation",
        name: "Order Confirmation",
        description: "Sent when an order is placed",
        required_fields: ["customerName", "orderNumber", "items", "total"],
      },
      {
        id: "order_shipped",
        name: "Order Shipped",
        description: "Sent when an order is shipped",
        required_fields: [
          "customerName",
          "orderNumber",
          "trackingNumber",
          "carrier",
        ],
      },
      {
        id: "low_stock_alert",
        name: "Low Stock Alert",
        description: "Sent when inventory is low",
        required_fields: ["productName", "currentStock", "reorderPoint"],
      },
      {
        id: "payment_reminder",
        name: "Payment Reminder",
        description: "Sent as payment reminder",
        required_fields: ["customerName", "invoiceNumber", "dueDate", "amount"],
      },
    ];

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
