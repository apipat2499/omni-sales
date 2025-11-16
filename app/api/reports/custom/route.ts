import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * GET /api/reports/custom
 * List all saved custom reports for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const { data: reports, error } = await supabase
      .from("custom_reports")
      .select("*")
      .eq("user_id", userId)
      .eq("is_template", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports: reports || [] });
  } catch (error) {
    console.error("Error in GET /api/reports/custom:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/custom
 * Create a new custom report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      description,
      dimensions,
      metrics,
      filters,
      sorting,
      grouping,
      chartType,
      chartConfig,
      isTemplate,
      templateCategory,
      tags,
    } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "userId and name are required" },
        { status: 400 }
      );
    }

    if (!dimensions || dimensions.length === 0) {
      if (!metrics || metrics.length === 0) {
        return NextResponse.json(
          { error: "At least one dimension or metric is required" },
          { status: 400 }
        );
      }
    }

    const { data: report, error } = await supabase
      .from("custom_reports")
      .insert({
        user_id: userId,
        name,
        description,
        dimensions: dimensions || [],
        metrics: metrics || [],
        filters: filters || [],
        sorting: sorting || [],
        grouping: grouping || [],
        chart_type: chartType || "table",
        chart_config: chartConfig || {},
        is_template: isTemplate || false,
        template_category: templateCategory,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating report:", error);
      return NextResponse.json(
        { error: "Failed to create report" },
        { status: 500 }
      );
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/reports/custom:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
