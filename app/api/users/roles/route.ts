import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { isOwner } from '@/lib/auth/checkPermission';

/**
 * GET /api/users/roles - Get all user role assignments
 * Only accessible by owners
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is owner
    const isUserOwner = await isOwner(supabase, user.id);
    if (!isUserOwner) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only owners can view user roles' },
        { status: 403 }
      );
    }

    // Fetch all user roles with user and role information
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role_id,
        assigned_at,
        expires_at,
        roles (
          id,
          name,
          description
        )
      `)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user roles', details: error.message },
        { status: 500 }
      );
    }

    // Fetch user details from auth.users for each user_id
    const userIds = [...new Set(data.map(ur => ur.user_id))];
    const usersMap = new Map();

    for (const userId of userIds) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (userData?.user) {
        usersMap.set(userId, {
          id: userData.user.id,
          email: userData.user.email,
          created_at: userData.user.created_at,
        });
      }
    }

    // Combine user roles with user info
    const userRoles = data.map(ur => ({
      ...ur,
      user: usersMap.get(ur.user_id) || { id: ur.user_id, email: 'Unknown', created_at: null },
    }));

    return NextResponse.json(userRoles, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/users/roles:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/roles - Assign a role to a user
 * Only accessible by owners
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is owner
    const isUserOwner = await isOwner(supabase, user.id);
    if (!isUserOwner) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only owners can assign roles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, roleId, expiresAt } = body;

    // Validate required fields
    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, roleId' },
        { status: 400 }
      );
    }

    // Check if role exists
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    // Remove existing role assignments for this user (ensure one role per user)
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Assign new role
    const { data, error } = await supabase
      .from('user_roles')
      .insert([{
        user_id: userId,
        role_id: roleId,
        assigned_by: user.id,
        expires_at: expiresAt || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error assigning role:', error);
      return NextResponse.json(
        { error: 'Failed to assign role', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/users/roles:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/roles - Remove a role from a user
 * Only accessible by owners
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is owner
    const isUserOwner = await isOwner(supabase, user.id);
    if (!isUserOwner) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only owners can remove roles' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userRoleId = searchParams.get('id');

    if (!userRoleId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Delete the user role assignment
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', userRoleId);

    if (error) {
      console.error('Error removing role:', error);
      return NextResponse.json(
        { error: 'Failed to remove role', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Role removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/users/roles:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
