import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Campaign Management
export async function getCampaigns(userId: string) {
  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return error ? [] : data || [];
}

// Alias for compatibility
export async function getEmailCampaigns(userId: string, status?: string | null) {
  const campaigns = await getCampaigns(userId);
  if (status) {
    return campaigns.filter((c: any) => c.status === status);
  }
  return campaigns;
}

export async function createCampaign(userId: string, campaignData: any) {
  const { data, error } = await supabase
    .from("email_campaigns")
    .insert([{ user_id: userId, ...campaignData }])
    .select()
    .single();
  return error ? null : data;
}

// Alias for compatibility
export async function createEmailCampaign(userId: string, campaignData: any) {
  return createCampaign(userId, campaignData);
}

export async function updateCampaign(userId: string, campaignId: string, updates: any) {
  const { data, error } = await supabase
    .from("email_campaigns")
    .update(updates)
    .eq("id", campaignId)
    .eq("user_id", userId)
    .select()
    .single();
  return error ? null : data;
}

// Template Management
export async function getTemplates(userId: string) {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);
  return error ? [] : data || [];
}

// Segment Management
export async function getSegments(userId: string) {
  const { data, error } = await supabase
    .from("email_segments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);
  return error ? [] : data || [];
}

// Automation Management
export async function getAutomations(userId: string) {
  const { data, error } = await supabase
    .from("email_automations")
    .select("*")
    .eq("user_id", userId);
  return error ? [] : data || [];
}

// Analytics
export async function getAnalytics(userId: string) {
  const { data, error } = await supabase
    .from("email_analytics")
    .select("*")
    .eq("user_id", userId)
    .order("analytics_date", { ascending: false });
  return error ? [] : data || [];
}

// Dashboard Data
export async function getEmailMarketingDashboardData(userId: string) {
  const [campaigns, templates, segments, automations, analytics] = await Promise.all([
    getCampaigns(userId),
    getTemplates(userId),
    getSegments(userId),
    getAutomations(userId),
    getAnalytics(userId),
  ]);

  const activeCampaigns = campaigns.filter(
    (c: any) => c.status === "sending" || c.status === "scheduled"
  ).length;
  const totalSubscribers = campaigns.reduce((sum: number, c: any) => sum + c.totalRecipients, 0);

  let avgOpenRate = 0, avgClickRate = 0, avgConversionRate = 0;
  if (analytics.length > 0) {
    avgOpenRate = analytics.reduce((sum: number, a: any) => sum + a.openRate, 0) / analytics.length;
    avgClickRate = analytics.reduce((sum: number, a: any) => sum + a.clickRate, 0) / analytics.length;
    avgConversionRate = analytics.reduce((sum: number, a: any) => sum + a.conversionRate, 0) / analytics.length;
  }

  const campaignsByStatus: Record<string, number> = {};
  campaigns.forEach((c: any) => {
    campaignsByStatus[c.status] = (campaignsByStatus[c.status] || 0) + 1;
  });

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    totalSubscribers,
    suppressed: 0,
    avgOpenRate: Math.round(avgOpenRate * 100) / 100,
    avgClickRate: Math.round(avgClickRate * 100) / 100,
    avgConversionRate: Math.round(avgConversionRate * 100) / 100,
    recentCampaigns: campaigns.slice(0, 5),
    topPerformingCampaigns: campaigns.sort((a: any, b: any) => b.clickCount - a.clickCount).slice(0, 5),
    automationCount: automations.length,
    templateCount: templates.length,
    segmentCount: segments.length,
    campaignsByStatus,
  };
}
