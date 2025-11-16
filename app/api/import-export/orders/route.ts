import { NextRequest, NextResponse } from "next/server";
import { importOrdersFromExcel } from "@/lib/services/excel";
import { supabase } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export orders" },
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

    const orders = await importOrdersFromExcel(file);

    // Insert orders into database
    const { data, error } = await supabase
      .from("orders")
      .insert(
        orders.map((o) => ({
          ...o,
          created_at: new Date().toISOString(),
        }))
      );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Imported ${orders.length} orders`,
      count: orders.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import orders" },
      { status: 500 }
    );
  }
}
