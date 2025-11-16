import { NextRequest, NextResponse } from 'next/server';
import { getEmailCampaignManager } from '@/lib/email/campaigns/campaign-manager';

/**
 * POST /api/email/campaign
 * Create and optionally send a new email campaign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      templateId,
      subject,
      htmlContent,
      textContent,
      segmentId,
      segmentFilters,
      scheduledAt,
      sendFrom,
      abTest,
      sendImmediately,
    } = body;

    // Validate required fields
    if (!userId || !name || !sendFrom) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name, sendFrom' },
        { status: 400 }
      );
    }

    if (!templateId && !subject && !htmlContent) {
      return NextResponse.json(
        { error: 'Either templateId or subject/htmlContent is required' },
        { status: 400 }
      );
    }

    const campaignManager = getEmailCampaignManager();

    // Create campaign
    const campaign = await campaignManager.createCampaign({
      user_id: userId,
      name,
      template_id: templateId,
      subject,
      html_content: htmlContent,
      text_content: textContent,
      segment_id: segmentId,
      segment_filters: segmentFilters,
      scheduled_at: scheduledAt,
      send_from: sendFrom,
      status: sendImmediately ? 'draft' : scheduledAt ? 'scheduled' : 'draft',
      ab_test: abTest,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    // Send immediately if requested
    if (sendImmediately && campaign.id) {
      const sent = await campaignManager.sendCampaign(campaign.id, userId);

      if (!sent) {
        return NextResponse.json(
          {
            campaign,
            warning: 'Campaign created but failed to send immediately',
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    console.error('Error in /api/email/campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/campaign
 * List campaigns for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const campaignManager = getEmailCampaignManager();
    const campaigns = await campaignManager.listCampaigns(
      userId,
      status || undefined
    );

    return NextResponse.json({
      success: true,
      campaigns,
    });
  } catch (error: any) {
    console.error('Error in /api/email/campaign GET:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
