import { NextRequest, NextResponse } from 'next/server';
import { tenantManager } from '@/lib/tenant/tenant-manager';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/tenants - Create new tenant
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, subdomain, ownerEmail, ownerId, plan } = body;

    // Validate required fields
    if (!name || !slug || !subdomain || !ownerEmail || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      );
    }

    // Create tenant
    const tenant = await tenantManager.createTenant({
      name,
      slug,
      subdomain,
      ownerEmail,
      ownerId,
      plan: plan || 'starter',
    });

    return NextResponse.json({
      success: true,
      tenant,
      message: 'Tenant created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tenant' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenants - List user's tenants
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Get user from auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's tenants
    const { data: tenants, error } = await supabase.rpc('get_user_tenants', {
      user_id: user.id,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      tenants,
    });
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}
