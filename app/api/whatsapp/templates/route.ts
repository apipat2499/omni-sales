import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initWhatsAppClient } from '@/lib/integrations/whatsapp';
import { getAllThaiTemplates } from '@/lib/integrations/whatsapp/templates';

/**
 * GET - Get all WhatsApp templates
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status');
    const language = searchParams.get('language');

    // Build query
    let query = supabase
      .from('whatsapp_templates')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (language) {
      query = query.eq('language', language);
    }

    const { data: templates, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error('Get WhatsApp templates error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get WhatsApp templates',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create WhatsApp template
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      name,
      language = 'th',
      category,
      components,
      exampleValues,
      createOnWhatsApp = false,
    } = body;

    if (!name || !category || !components) {
      return NextResponse.json(
        { error: 'Name, category, and components are required' },
        { status: 400 }
      );
    }

    // Get active WhatsApp connection
    const { data: connection, error: connectionError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'WhatsApp connection not configured' },
        { status: 500 }
      );
    }

    let whatsappTemplateId = null;
    let status = 'PENDING';

    // Create template on WhatsApp if requested
    if (createOnWhatsApp) {
      const client = initWhatsAppClient({
        businessAccountId: connection.business_account_id,
        phoneNumberId: connection.phone_number_id,
        accessToken: connection.access_token,
      });

      try {
        const result = await client.createTemplate({
          name,
          language,
          category,
          components,
        });

        whatsappTemplateId = result.id;
        status = result.status || 'PENDING';
      } catch (error: any) {
        console.error('Failed to create template on WhatsApp:', error);
        // Continue to save in database even if WhatsApp creation fails
      }
    }

    // Save template to database
    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .insert({
        connection_id: connection.id,
        name,
        language,
        category,
        status,
        template_data: {
          name,
          language,
          category,
          components,
          whatsapp_template_id: whatsappTemplateId,
        },
        components,
        example_values: exampleValues,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Create WhatsApp template error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create WhatsApp template',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update template status
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { templateId, status, rejectionReason } = body;

    if (!templateId || !status) {
      return NextResponse.json(
        { error: 'Template ID and status are required' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .update({
        status,
        rejection_reason: rejectionReason,
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Update WhatsApp template error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update WhatsApp template',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete template
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Get template
    const { data: template } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (template) {
      // Delete from WhatsApp if it exists there
      const { data: connection } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('id', template.connection_id)
        .single();

      if (connection) {
        const client = initWhatsAppClient({
          businessAccountId: connection.business_account_id,
          phoneNumberId: connection.phone_number_id,
          accessToken: connection.access_token,
        });

        try {
          await client.deleteTemplate(template.name);
        } catch (error) {
          console.error('Failed to delete template from WhatsApp:', error);
          // Continue to delete from database even if WhatsApp deletion fails
        }
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('whatsapp_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Delete WhatsApp template error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete WhatsApp template',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
