import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * GET /api/reports/:id
 * Get a specific report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: report, error } = await supabase
      .from("custom_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching report:", error);
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error in GET /api/reports/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reports/:id
 * Update a report
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      dimensions,
      metrics,
      filters,
      sorting,
      grouping,
      chartType,
      chartConfig,
      isFavorite,
      tags,
    } = body;

    const updates: any = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (dimensions !== undefined) updates.dimensions = dimensions;
    if (metrics !== undefined) updates.metrics = metrics;
    if (filters !== undefined) updates.filters = filters;
    if (sorting !== undefined) updates.sorting = sorting;
    if (grouping !== undefined) updates.grouping = grouping;
    if (chartType !== undefined) updates.chart_type = chartType;
    if (chartConfig !== undefined) updates.chart_config = chartConfig;
    if (isFavorite !== undefined) updates.is_favorite = isFavorite;
    if (tags !== undefined) updates.tags = tags;

    const { data: report, error } = await supabase
      .from("custom_reports")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating report:", error);
      return NextResponse.json(
        { error: "Failed to update report" },
        { status: 500 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error in PUT /api/reports/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/:id
 * Delete a report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from("custom_reports")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting report:", error);
      return NextResponse.json(
        { error: "Failed to delete report" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/reports/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
