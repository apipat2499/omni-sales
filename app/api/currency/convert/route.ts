import { NextRequest, NextResponse } from "next/server";
import { convertCurrency } from "@/lib/services/multi-currency";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const amount = parseFloat(searchParams.get("amount") || "0");
    const from = searchParams.get("from")?.toUpperCase() || "USD";
    const to = searchParams.get("to")?.toUpperCase() || "USD";

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const result = await convertCurrency(amount, from, to);

    if (result === null) {
      return NextResponse.json(
        { error: "Currency conversion not available" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      original: { amount, currency: from },
      converted: { amount: result, currency: to },
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Conversion failed" },
      { status: 500 }
    );
  }
}
