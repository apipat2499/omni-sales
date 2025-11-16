/**
 * GET /api/chat/analytics - Get chat analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatAnalyticsService } from '@/lib/chat/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overall';
    const agentId = searchParams.get('agentId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

    const analyticsService = getChatAnalyticsService();

    let data;

    switch (type) {
      case 'agent':
        if (!agentId) {
          return NextResponse.json({ error: 'agentId required for agent analytics' }, { status: 400 });
        }
        data = await analyticsService.getAgentMetrics(agentId, startDate, endDate);
        break;

      case 'all-agents':
        data = await analyticsService.getAllAgentsMetrics(startDate, endDate);
        break;

      case 'team':
        if (!teamId) {
          return NextResponse.json({ error: 'teamId required for team analytics' }, { status: 400 });
        }
        data = await analyticsService.getTeamMetrics(teamId, startDate, endDate);
        break;

      case 'time-based':
        const granularity = (searchParams.get('granularity') as 'hour' | 'day') || 'day';
        data = await analyticsService.getTimeBasedAnalytics(startDate, endDate, granularity);
        break;

      case 'common-issues':
        data = await analyticsService.getCommonIssues(startDate, endDate);
        break;

      case 'overall':
      default:
        data = await analyticsService.getOverallStats(startDate, endDate);
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      data,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
