import { NextRequest, NextResponse } from 'next/server';
import { createEmailCampaign, getEmailCampaigns } from '@/lib/email/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const status = req.nextUrl.searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const campaigns = await getEmailCampaigns(userId, status || undefined);
    return NextResponse.json({ data: campaigns, total: campaigns.length });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      campaignName,
      description,
      campaignType,
      templateId,
      subjectLine,
      preheaderText,
      htmlContent,
      plainTextContent,
      targetAudience,
      targetSegmentId,
      recipientCount,
      scheduledFor,
      budgetLimit,
    } = await req.json();

    if (!userId || !campaignName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const campaign = await createEmailCampaign(userId, {
      campaignName,
      description,
      campaignType: campaignType || 'promotional',
      templateId,
      subjectLine,
      preheaderText,
      htmlContent,
      plainTextContent,
      targetAudience: targetAudience || 'all',
      targetSegmentId,
      recipientCount: recipientCount || 0,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      budgetLimit,
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
