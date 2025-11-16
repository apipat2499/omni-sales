import { NextRequest, NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/services/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = "usd", description, customerId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const result = await createPaymentIntent(
      amount,
      currency,
      description,
      customerId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Payment intent creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
