import { NextRequest, NextResponse } from "next/server";
import { executeReport, type ReportConfig } from "@/lib/analytics/custom-report-engine";
import { supabase } from "@/lib/supabase/client";

/**
 * POST /api/reports/execute
 * Execute a report and optionally save the export
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      reportId,
      config,
      saveExport,
      exportFormat,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { error: "config is required" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Execute the report
    const result = await executeReport(config as ReportConfig, userId, true);

    const executionTime = Date.now() - startTime;

    // Save export if requested
    if (saveExport) {
      try {
        const { data: exportRecord, error: exportError } = await supabase
          .from("report_exports")
          .insert({
            user_id: userId,
            report_id: reportId || null,
            export_format: exportFormat || "json",
            data_preview: result.data.slice(0, 100), // Save first 100 rows
            row_count: result.data.length,
            execution_time: executionTime,
            status: "completed",
            filters_applied: config.filters || [],
            date_range: config.dateRange || null,
          })
          .select()
          .single();

        if (exportError) {
          console.error("Error saving export:", exportError);
        }

        return NextResponse.json({
          result,
          exportId: exportRecord?.id,
        });
      } catch (error) {
        console.error("Error saving export:", error);
      }
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error in POST /api/reports/execute:", error);
    return NextResponse.json(
      { error: "Failed to execute report: " + (error as Error).message },
      { status: 500 }
    );
  }
}
