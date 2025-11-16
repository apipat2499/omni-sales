import { NextRequest, NextResponse } from "next/server";
import { notifyOrderStatus } from "@/lib/services/integrations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, slackWebhook, discordWebhook } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await notifyOrderStatus(orderId, status, slackWebhook, discordWebhook);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook notification failed" },
      { status: 500 }
    );
  }
}
