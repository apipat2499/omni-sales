import { NextRequest, NextResponse } from "next/server";
import { createCharge } from "@/lib/services/stripe";
import { supabase } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentMethodId, orderId, description, customerId } = body;

    // Validate input
    if (!amount || !paymentMethodId || !orderId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Process payment
    const chargeResult = await createCharge(
      amount,
      paymentMethodId,
      description || `Order #${orderId}`,
      { orderId, customerId }
    );

    // Update order payment status in Supabase
    if (chargeResult.success) {
      const { data, error } = await supabase
        .from("order_payments")
        .insert({
          order_id: orderId,
          payment_method: "stripe",
          amount: amount,
          currency: "usd",
          status: chargeResult.status === "succeeded" ? "completed" : "pending",
          gateway_response: {
            charge_id: chargeResult.chargeId,
            status: chargeResult.status,
          },
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        chargeId: chargeResult.chargeId,
        orderId,
        amount,
      });
    }

    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
