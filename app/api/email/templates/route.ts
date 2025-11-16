import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplateManager } from '@/lib/email/templates/template-manager';

/**
 * GET /api/email/templates
 * List email templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const templateManager = getEmailTemplateManager();
    const templates = await templateManager.listTemplates(
      userId,
      category || undefined
    );

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('Error in /api/email/templates GET:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/templates
 * Create a new email template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, subject, htmlContent, textContent, category } = body;

    // Validate required fields
    if (!userId || !name || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name, subject, htmlContent' },
        { status: 400 }
      );
    }

    const templateManager = getEmailTemplateManager();
    const template = await templateManager.createTemplate({
      user_id: userId,
      name,
      subject,
      html_content: htmlContent,
      text_content: textContent,
      category: category || 'custom',
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Error in /api/email/templates POST:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email/templates
 * Update an email template
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, userId, name, subject, htmlContent, textContent, isActive } =
      body;

    if (!templateId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, userId' },
        { status: 400 }
      );
    }

    const templateManager = getEmailTemplateManager();
    const template = await templateManager.updateTemplate(templateId, userId, {
      name,
      subject,
      html_content: htmlContent,
      text_content: textContent,
      is_active: isActive,
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('Error in /api/email/templates PUT:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email/templates
 * Delete an email template
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const userId = searchParams.get('userId');

    if (!templateId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: templateId, userId' },
        { status: 400 }
      );
    }

    const templateManager = getEmailTemplateManager();
    const success = await templateManager.deleteTemplate(templateId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error in /api/email/templates DELETE:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
