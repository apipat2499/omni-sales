import { NextRequest, NextResponse } from "next/server";
import { getStripeWebhookEvent } from "@/lib/services/stripe";
import { supabase } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 401 }
    );
  }

  try {
    const body = await request.text();
    const event = await getStripeWebhookEvent(body, signature);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          // Update payment status
          const { error } = await supabase
            .from("order_payments")
            .update({
              status: "completed",
              gateway_response: paymentIntent,
            })
            .eq("order_id", orderId);

          if (error) console.error("Database update error:", error);

          // Update order status to processing
          await supabase
            .from("orders")
            .update({ status: "processing" })
            .eq("id", orderId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          const { error } = await supabase
            .from("order_payments")
            .update({
              status: "failed",
              gateway_response: paymentIntent,
            })
            .eq("order_id", orderId);

          if (error) console.error("Database update error:", error);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as any;
        const metadata = charge.metadata;

        if (metadata?.orderId) {
          // Record refund
          const { error } = await supabase
            .from("refunds")
            .insert({
              order_id: metadata.orderId,
              amount: (charge.amount_refunded || 0) / 100,
              reason: "webhook_refund",
              status: "completed",
              gateway_response: charge,
            });

          if (error) console.error("Database insert error:", error);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
