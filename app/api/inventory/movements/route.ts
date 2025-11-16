import { NextRequest, NextResponse } from "next/server";
import { getStockMovementHistory, transferStock } from "@/lib/services/inventory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const movements = await getStockMovementHistory(productId, limit);
    return NextResponse.json({ movements });
  } catch (error) {
    console.error("Error fetching movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch movements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, fromWarehouse, toWarehouse, quantity } = body;

    if (!productId || !fromWarehouse || !toWarehouse || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await transferStock(
      productId,
      fromWarehouse,
      toWarehouse,
      quantity
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error transferring stock:", error);
    return NextResponse.json(
      { error: "Failed to transfer stock" },
      { status: 500 }
    );
  }
}
