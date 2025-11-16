import { NextRequest, NextResponse } from 'next/server';
import { createSMSTemplate, getSMSTemplates } from '@/lib/sms/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const templates = await getSMSTemplates(userId);
    return NextResponse.json({ data: templates, total: templates.length });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, templateType, content, variables } = await req.json();

    if (!userId || !name || !templateType || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const template = await createSMSTemplate(userId, {
      name,
      templateType,
      content,
      variables,
    });

    if (!template) {
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
