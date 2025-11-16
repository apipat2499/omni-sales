import { NextRequest, NextResponse } from "next/server";
import { batchInsertProducts, importProductsFromExcel } from "@/lib/services/excel";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".xlsx")) {
      return NextResponse.json(
        { error: "Only Excel files (.xlsx) are supported" },
        { status: 400 }
      );
    }

    const products = await importProductsFromExcel(file);
    const result = await batchInsertProducts(products);

    return NextResponse.json({
      success: true,
      message: `Imported ${result.count} products`,
      count: result.count,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import products" },
      { status: 500 }
    );
  }
}
