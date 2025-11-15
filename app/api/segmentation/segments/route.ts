import { NextRequest, NextResponse } from 'next/server';
import { createSegment, getSegments, updateSegment } from '@/lib/segmentation/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const segments = await getSegments(userId);
    return NextResponse.json({ data: segments, total: segments.length });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, description, segmentType, criteria } = await req.json();

    if (!userId || !name || !segmentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const segment = await createSegment(userId, {
      name,
      description,
      segmentType,
      criteria: criteria || {},
    });

    if (!segment) {
      return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
    }

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
  }
}
