import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * GET /api/reports/templates
 * Get all available report templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");

    let query = supabase
      .from("report_templates")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("use_count", { ascending: false });

    // Filter by category if provided
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by featured if provided
    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error("Error in GET /api/reports/templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/templates/:id/use
 * Increment use count when a template is used
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    // Increment use count
    const { error } = await supabase.rpc("increment_template_use_count", {
      template_id: templateId,
    });

    if (error) {
      // If the RPC doesn't exist, we can do a manual update
      const { data: template } = await supabase
        .from("report_templates")
        .select("use_count")
        .eq("id", templateId)
        .single();

      if (template) {
        await supabase
          .from("report_templates")
          .update({ use_count: (template.use_count || 0) + 1 })
          .eq("id", templateId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/reports/templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
