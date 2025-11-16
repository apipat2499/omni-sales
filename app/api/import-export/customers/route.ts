import { NextRequest, NextResponse } from "next/server";
import { batchInsertCustomers, importCustomersFromExcel } from "@/lib/services/excel";
import { supabase } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";

    const { data, error } = await supabase
      .from("customers")
      .select("*");

    if (error) throw error;

    if (format === "json") {
      return NextResponse.json(data);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export customers" },
      { status: 500 }
    );
  }
}

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

    const customers = await importCustomersFromExcel(file);
    const result = await batchInsertCustomers(customers);

    return NextResponse.json({
      success: true,
      message: `Imported ${result.count} customers`,
      count: result.count,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import customers" },
      { status: 500 }
    );
  }
}
