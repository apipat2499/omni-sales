import { NextRequest, NextResponse } from "next/server";
import { getTotalStock, adjustStock, getInventoryLevels } from "@/lib/services/inventory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const levels = await getInventoryLevels(productId);
    const total = await getTotalStock(productId);

    return NextResponse.json({
      productId,
      levels,
      totalStock: total,
    });
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantityChange, reason, warehouseId } = body;

    if (!productId || quantityChange === undefined || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await adjustStock(
      productId,
      quantityChange,
      reason,
      warehouseId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
