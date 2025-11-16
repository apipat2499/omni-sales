/**
 * Workflow Templates API
 * GET /api/workflows/templates - Get all workflow templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { WORKFLOW_TEMPLATES, getTemplateCategories } from '@/lib/automation/workflow-templates';

/**
 * GET /api/workflows/templates
 * List all workflow templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let templates = WORKFLOW_TEMPLATES;

    if (category) {
      templates = templates.filter((t) => t.category === category);
    }

    const categories = getTemplateCategories();

    return NextResponse.json({
      templates,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
