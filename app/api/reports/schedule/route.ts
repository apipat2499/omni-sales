import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * POST /api/reports/schedule
 * Schedule a report for automated delivery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      reportId,
      frequency,
      scheduleTime,
      dayOfWeek,
      dayOfMonth,
      timezone,
      deliveryMethod,
      deliveryConfig,
    } = body;

    if (!userId || !reportId || !frequency) {
      return NextResponse.json(
        { error: "userId, reportId, and frequency are required" },
        { status: 400 }
      );
    }

    // Calculate next run time
    const nextRunAt = calculateNextRun(
      frequency,
      scheduleTime,
      dayOfWeek,
      dayOfMonth,
      timezone || "UTC"
    );

    const { data: schedule, error } = await supabase
      .from("report_schedules")
      .insert({
        user_id: userId,
        report_id: reportId,
        frequency,
        schedule_time: scheduleTime,
        day_of_week: dayOfWeek,
        day_of_month: dayOfMonth,
        timezone: timezone || "UTC",
        delivery_method: deliveryMethod || "email",
        delivery_config: deliveryConfig || {},
        is_active: true,
        next_run_at: nextRunAt,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating schedule:", error);
      return NextResponse.json(
        { error: "Failed to create schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/reports/schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/schedule
 * List all schedules for a user
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

    const { data: schedules, error } = await supabase
      .from("report_schedules")
      .select(`
        *,
        custom_reports (
          name,
          description
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching schedules:", error);
      return NextResponse.json(
        { error: "Failed to fetch schedules" },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedules: schedules || [] });
  } catch (error) {
    console.error("Error in GET /api/reports/schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Calculate next run time for a schedule
 */
function calculateNextRun(
  frequency: string,
  scheduleTime?: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  timezone: string = "UTC"
): Date {
  const now = new Date();
  const next = new Date(now);

  // Parse schedule time (e.g., "09:00")
  const [hours, minutes] = (scheduleTime || "09:00").split(":").map(Number);

  switch (frequency) {
    case "daily":
      next.setHours(hours, minutes, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case "weekly":
      next.setHours(hours, minutes, 0, 0);
      const currentDay = next.getDay();
      const targetDay = dayOfWeek || 1; // Default to Monday
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      next.setDate(next.getDate() + daysUntilTarget);
      break;

    case "monthly":
      next.setHours(hours, minutes, 0, 0);
      next.setDate(dayOfMonth || 1);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;

    default:
      // Default to daily
      next.setDate(next.getDate() + 1);
      next.setHours(hours, minutes, 0, 0);
  }

  return next;
}
