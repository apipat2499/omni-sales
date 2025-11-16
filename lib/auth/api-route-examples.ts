/**
 * RBAC API Route Protection Examples
 *
 * This file contains examples of how to protect API routes using the RBAC middleware.
 * Copy these patterns to your actual API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withRBAC, requireOwner, requireManager, requireStaff } from '@/lib/auth/rbac-middleware';
import { checkPermission } from '@/lib/auth/checkPermission';

// ========================================
// EXAMPLE 1: Protect route with minimum role
// ========================================

export async function exampleRequireRole(request: NextRequest) {
  // Check if user has at least 'staff' role
  const authCheck = await withRBAC(request, { requiredRole: 'staff' });
  if (authCheck) return authCheck; // Returns 401 or 403 if unauthorized

  // User is authorized, proceed with route logic
  return NextResponse.json({ message: 'Authorized as staff or higher' });
}

// ========================================
// EXAMPLE 2: Protect route with specific permission
// ========================================

export async function exampleRequirePermission(request: NextRequest) {
  // Check if user has permission to delete products
  const authCheck = await withRBAC(request, {
    requiredPermission: { resource: 'products', action: 'delete' }
  });
  if (authCheck) return authCheck;

  // User has permission, proceed with route logic
  return NextResponse.json({ message: 'Authorized to delete products' });
}

// ========================================
// EXAMPLE 3: Use convenience middleware functions
// ========================================

export async function exampleOwnerOnly(request: NextRequest) {
  const authCheck = await requireOwner(request);
  if (authCheck) return authCheck;

  return NextResponse.json({ message: 'Owner-only route' });
}

export async function exampleManagerOnly(request: NextRequest) {
  const authCheck = await requireManager(request);
  if (authCheck) return authCheck;

  return NextResponse.json({ message: 'Manager-level route' });
}

export async function exampleStaffOnly(request: NextRequest) {
  const authCheck = await requireStaff(request);
  if (authCheck) return authCheck;

  return NextResponse.json({ message: 'Staff-level route' });
}

// ========================================
// EXAMPLE 4: Different permissions for different HTTP methods
// ========================================

export async function GET_Example(request: NextRequest) {
  // Anyone authenticated can read
  const authCheck = await withRBAC(request, {
    requiredPermission: { resource: 'products', action: 'read' }
  });
  if (authCheck) return authCheck;

  return NextResponse.json({ message: 'Reading products' });
}

export async function POST_Example(request: NextRequest) {
  // Only staff and above can create
  const authCheck = await withRBAC(request, {
    requiredPermission: { resource: 'products', action: 'create' }
  });
  if (authCheck) return authCheck;

  return NextResponse.json({ message: 'Creating product' });
}

export async function PUT_Example(request: NextRequest) {
  // Only staff and above can update
  const authCheck = await withRBAC(request, {
    requiredPermission: { resource: 'products', action: 'update' }
  });
  if (authCheck) return authCheck;

  return NextResponse.json({ message: 'Updating product' });
}

export async function DELETE_Example(request: NextRequest) {
  // Only manager and owner can delete
  const authCheck = await withRBAC(request, {
    requiredPermission: { resource: 'products', action: 'delete' }
  });
  if (authCheck) return authCheck;

  return NextResponse.json({ message: 'Deleting product' });
}

// ========================================
// EXAMPLE 5: Manual permission checking
// ========================================

export async function exampleManualCheck(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Manually check permission
    const hasPermission = await checkPermission(
      supabase,
      user.id,
      'products',
      'bulk_edit'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission for bulk operations' },
        { status: 403 }
      );
    }

    // User has permission, proceed
    return NextResponse.json({ message: 'Bulk operation authorized' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ========================================
// EXAMPLE 6: Custom error handling
// ========================================

export async function exampleCustomError(request: NextRequest) {
  const authCheck = await withRBAC(request, {
    requiredRole: 'manager',
    onUnauthorized: (reason) => {
      // Custom error response
      return NextResponse.json({
        error: 'Access Denied',
        message: 'This feature is only available to managers and owners.',
        reason,
        contact: 'admin@example.com'
      }, { status: 403 });
    }
  });

  if (authCheck) return authCheck;

  return NextResponse.json({ message: 'Authorized' });
}

// ========================================
// EXAMPLE 7: Protecting a complete API route file
// ========================================

/**
 * Complete example: /app/api/products/[id]/route.ts
 */

export async function GET_ProductById(request: NextRequest, { params }: { params: { id: string } }) {
  // Anyone can read products
  const authCheck = await withRBAC(request, {
    requiredPermission: { resource: 'products', action: 'read' }
  });
  if (authCheck) return authCheck;

  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT_ProductById(request: NextRequest, { params }: { params: { id: string } }) {
  // Staff and above can update
  const authCheck = await withRBAC(request, {
    requiredPermission: { resource: 'products', action: 'update' }
  });
  if (authCheck) return authCheck;

  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();

  const { data, error } = await supabase
    .from('products')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE_ProductById(request: NextRequest, { params }: { params: { id: string } }) {
  // Manager and owner can delete
  const authCheck = await withRBAC(request, {
    requiredPermission: { resource: 'products', action: 'delete' }
  });
  if (authCheck) return authCheck;

  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Product deleted successfully' });
}
