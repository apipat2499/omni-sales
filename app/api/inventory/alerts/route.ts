import { NextRequest, NextResponse } from "next/server";
import { getLowStockProducts } from "@/lib/services/inventory";

export async function GET(request: NextRequest) {
  try {
    const lowStockProducts = await getLowStockProducts();
    return NextResponse.json({
      alerts: lowStockProducts,
      totalAlerts: lowStockProducts.length,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
