import { NextRequest, NextResponse } from "next/server";
import { forecastSales } from "@/lib/services/forecasting";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    const forecast = await forecastSales(days);

    if (!forecast) {
      return NextResponse.json(
        { error: "Not enough data for forecast" },
        { status: 400 }
      );
    }

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Forecast error:", error);
    return NextResponse.json(
      { error: "Forecast failed" },
      { status: 500 }
    );
  }
}
