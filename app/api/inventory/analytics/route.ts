import { NextRequest, NextResponse } from "next/server";
import { getInventoryAnalytics, exportInventoryReport } from "@/lib/services/inventory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const exportData = searchParams.get("export") === "true";

    if (exportData) {
      const data = await exportInventoryReport();
      return NextResponse.json({ data });
    }

    const analytics = await getInventoryAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
