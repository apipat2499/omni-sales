/**
 * Report Scheduler
 * Handles automated report generation and delivery
 */

import { supabase } from "@/lib/supabase/client";
import { executeReport, type ReportConfig } from "./custom-report-engine";

export interface ScheduleConfig {
  id: string;
  userId: string;
  reportId: string;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  scheduleTime: string; // HH:MM format
  dayOfWeek?: number; // 0-6 (0 = Sunday)
  dayOfMonth?: number; // 1-31
  timezone: string;
  deliveryMethod: "email" | "slack" | "webhook";
  deliveryConfig: {
    email?: string[];
    slackWebhook?: string;
    webhookUrl?: string;
    format?: "pdf" | "excel" | "csv" | "json";
  };
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

/**
 * Check if a schedule should run now
 */
export function shouldRunSchedule(schedule: ScheduleConfig): boolean {
  if (!schedule.isActive) {
    return false;
  }

  if (!schedule.nextRunAt) {
    return true; // First run
  }

  const now = new Date();
  const nextRun = new Date(schedule.nextRunAt);

  return now >= nextRun;
}

/**
 * Calculate next run time for a schedule
 */
export function calculateNextRunTime(schedule: ScheduleConfig): Date {
  const now = new Date();
  const [hours, minutes] = schedule.scheduleTime.split(":").map(Number);

  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case "daily":
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case "weekly":
      const currentDay = next.getDay();
      const targetDay = schedule.dayOfWeek || 1; // Default Monday
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) {
        daysUntil += 7;
      }
      next.setDate(next.getDate() + daysUntil);
      if (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      break;

    case "monthly":
      next.setDate(schedule.dayOfMonth || 1);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;

    case "custom":
      // For custom schedules, assume daily for now
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;
  }

  return next;
}

/**
 * Execute a scheduled report
 */
export async function executeScheduledReport(
  schedule: ScheduleConfig
): Promise<boolean> {
  try {
    // Get the report configuration
    const { data: report, error: reportError } = await supabase
      .from("custom_reports")
      .select("*")
      .eq("id", schedule.reportId)
      .single();

    if (reportError || !report) {
      console.error("Error fetching report:", reportError);
      return false;
    }

    // Build report config
    const config: ReportConfig = {
      dimensions: report.dimensions || [],
      metrics: report.metrics || [],
      filters: report.filters || [],
      sorting: report.sorting || [],
      grouping: report.grouping || [],
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        end: new Date().toISOString().split("T")[0],
      },
    };

    // Execute the report
    const result = await executeReport(config, schedule.userId, false);

    if (!result || !result.data) {
      console.error("No data returned from report execution");
      return false;
    }

    // Save the export
    const { data: exportRecord, error: exportError } = await supabase
      .from("report_exports")
      .insert({
        user_id: schedule.userId,
        report_id: schedule.reportId,
        schedule_id: schedule.id,
        export_format: schedule.deliveryConfig.format || "pdf",
        data_preview: result.data.slice(0, 100),
        row_count: result.data.length,
        execution_time: result.metadata.executionTime,
        status: "completed",
        filters_applied: config.filters || [],
        date_range: config.dateRange,
      })
      .select()
      .single();

    if (exportError) {
      console.error("Error saving export:", exportError);
      return false;
    }

    // Deliver the report
    const delivered = await deliverReport(schedule, result.data, exportRecord);

    if (delivered) {
      // Update schedule with last run time and next run time
      const nextRunAt = calculateNextRunTime(schedule);

      await supabase
        .from("report_schedules")
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: nextRunAt.toISOString(),
        })
        .eq("id", schedule.id);
    }

    return delivered;
  } catch (error) {
    console.error("Error executing scheduled report:", error);
    return false;
  }
}

/**
 * Deliver report via configured method
 */
async function deliverReport(
  schedule: ScheduleConfig,
  data: any[],
  exportRecord: any
): Promise<boolean> {
  try {
    switch (schedule.deliveryMethod) {
      case "email":
        return await deliverViaEmail(schedule, data, exportRecord);

      case "slack":
        return await deliverViaSlack(schedule, data, exportRecord);

      case "webhook":
        return await deliverViaWebhook(schedule, data, exportRecord);

      default:
        console.error("Unknown delivery method:", schedule.deliveryMethod);
        return false;
    }
  } catch (error) {
    console.error("Error delivering report:", error);
    return false;
  }
}

/**
 * Deliver report via email
 */
async function deliverViaEmail(
  schedule: ScheduleConfig,
  data: any[],
  exportRecord: any
): Promise<boolean> {
  const emails = schedule.deliveryConfig.email || [];

  if (emails.length === 0) {
    console.error("No email addresses configured");
    return false;
  }

  // In a real implementation, this would use an email service
  console.log("Sending report via email to:", emails);
  console.log("Report data rows:", data.length);
  console.log("Export ID:", exportRecord.id);

  // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
  // For now, just log the delivery

  return true;
}

/**
 * Deliver report via Slack
 */
async function deliverViaSlack(
  schedule: ScheduleConfig,
  data: any[],
  exportRecord: any
): Promise<boolean> {
  const webhookUrl = schedule.deliveryConfig.slackWebhook;

  if (!webhookUrl) {
    console.error("No Slack webhook URL configured");
    return false;
  }

  // Prepare Slack message
  const message = {
    text: `Scheduled Report: ${exportRecord.id}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Scheduled Report Generated*\n${data.length} rows`,
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending to Slack:", error);
    return false;
  }
}

/**
 * Deliver report via webhook
 */
async function deliverViaWebhook(
  schedule: ScheduleConfig,
  data: any[],
  exportRecord: any
): Promise<boolean> {
  const webhookUrl = schedule.deliveryConfig.webhookUrl;

  if (!webhookUrl) {
    console.error("No webhook URL configured");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleId: schedule.id,
        reportId: schedule.reportId,
        exportId: exportRecord.id,
        rowCount: data.length,
        executionTime: exportRecord.execution_time,
        generatedAt: new Date().toISOString(),
        data: data.slice(0, 10), // Send first 10 rows as preview
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending to webhook:", error);
    return false;
  }
}

/**
 * Process all pending schedules
 */
export async function processPendingSchedules(): Promise<void> {
  try {
    // Get all active schedules that should run now
    const { data: schedules, error } = await supabase
      .from("report_schedules")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", new Date().toISOString());

    if (error) {
      console.error("Error fetching schedules:", error);
      return;
    }

    if (!schedules || schedules.length === 0) {
      console.log("No pending schedules to process");
      return;
    }

    console.log(`Processing ${schedules.length} pending schedules`);

    // Process each schedule
    for (const schedule of schedules) {
      const success = await executeScheduledReport(schedule as ScheduleConfig);
      console.log(
        `Schedule ${schedule.id}: ${success ? "SUCCESS" : "FAILED"}`
      );
    }
  } catch (error) {
    console.error("Error processing pending schedules:", error);
  }
}

/**
 * Get upcoming schedules for a user
 */
export async function getUpcomingSchedules(
  userId: string,
  limit: number = 10
): Promise<ScheduleConfig[]> {
  try {
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
      .eq("is_active", true)
      .order("next_run_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching upcoming schedules:", error);
      return [];
    }

    return (schedules || []) as ScheduleConfig[];
  } catch (error) {
    console.error("Error getting upcoming schedules:", error);
    return [];
  }
}
