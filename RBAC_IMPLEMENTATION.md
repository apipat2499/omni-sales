# Role-Based Access Control (RBAC) Implementation

This document describes the Role-Based Access Control (RBAC) system implemented in Omni-Sales.

## Overview

The RBAC system provides multi-user role-based access control with the following features:

- **4 User Roles**: Owner, Manager, Staff, Viewer
- **5 Permission Types**: create, read, update, delete, bulk_edit
- **Database-level enforcement**: RLS policies on Supabase
- **API-level protection**: Middleware for Next.js API routes
- **UI-level control**: React components and hooks for conditional rendering

## Architecture

### 1. Database Schema

The RBAC system consists of 4 main tables:

#### `roles` Table
```sql
- id (UUID)
- name (VARCHAR) - owner, manager, staff, viewer
- description (TEXT)
- permissions (JSONB)
- created_at, updated_at (TIMESTAMP)
```

#### `permissions` Table
```sql
- id (UUID)
- name (VARCHAR) - e.g., "products:create"
- resource (VARCHAR) - e.g., "products", "orders"
- action (VARCHAR) - create, read, update, delete, bulk_edit
- description (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### `user_roles` Table
```sql
- id (UUID)
- user_id (UUID) - References auth.users
- role_id (UUID) - References roles
- assigned_by (UUID)
- assigned_at (TIMESTAMP)
- expires_at (TIMESTAMP) - Optional expiration
- metadata (JSONB)
```

#### `role_permissions` Table
```sql
- id (UUID)
- role_id (UUID) - References roles
- permission_id (UUID) - References permissions
```

### 2. Role Hierarchy

Roles are hierarchical with the following privilege levels (highest to lowest):

1. **Owner** - Full system access
   - All permissions (create, read, update, delete, bulk_edit)
   - Can manage users and assign roles
   - Can access all system settings
   - Cannot be restricted

2. **Manager** - Management-level access
   - All CRUD operations on products, orders, customers
   - Can perform bulk operations
   - Can view reports and analytics
   - Cannot manage users or critical system settings

3. **Staff** - Standard operational access
   - Can create, read, and update products, orders, customers
   - Cannot delete records
   - Cannot perform bulk operations
   - Read-only access to settings

4. **Viewer** - Read-only access
   - Can only view products, orders, customers
   - Can view reports
   - No modification permissions

## Installation & Setup

### Step 1: Run Database Migrations

Execute the migrations in order:

```bash
# 1. Create roles table
psql -f supabase/migrations/add_rbac_roles.sql

# 2. Create user_roles table
psql -f supabase/migrations/add_rbac_user_roles.sql

# 3. Create permissions and role_permissions tables
psql -f supabase/migrations/add_rbac_permissions.sql

# 4. Update RLS policies
psql -f supabase/migrations/update_rls_policies_for_rbac.sql
```

Or using Supabase CLI:
```bash
supabase db push
```

### Step 2: Seed Default Roles and Permissions

```bash
psql -f supabase/seed-rbac.sql
```

This creates:
- 4 default roles (owner, manager, staff, viewer)
- All necessary permissions for products, orders, customers, etc.
- Role-permission mappings

### Step 3: Assign Owner Role to First User

Update the seed script `supabase/seed-rbac.sql` to assign the owner role:

```sql
-- Uncomment and modify this section in seed-rbac.sql
SELECT id INTO v_user_id
FROM auth.users
WHERE email = 'your-email@example.com'
LIMIT 1;

-- Assign owner role
INSERT INTO user_roles (user_id, role_id)
SELECT v_user_id, id FROM roles WHERE name = 'owner';
```

## Usage

### Backend: Protecting API Routes

#### Method 1: Using Middleware Helper

```typescript
import { withRBAC } from '@/lib/auth/rbac-middleware';

export async function DELETE(request: NextRequest) {
  // Require minimum role of manager
  const authCheck = await withRBAC(request, { requiredRole: 'manager' });
  if (authCheck) return authCheck;

  // User is authorized, proceed with deletion
  // ...
}
```

#### Method 2: Using Permission Check

```typescript
import { withRBAC } from '@/lib/auth/rbac-middleware';

export async function POST(request: NextRequest) {
  // Check specific permission
  const authCheck = await withRBAC(request, {
    requiredPermission: { resource: 'products', action: 'create' }
  });
  if (authCheck) return authCheck;

  // User has permission to create products
  // ...
}
```

#### Method 3: Using Convenience Functions

```typescript
import { requireOwner, requireManager, requireStaff } from '@/lib/auth/rbac-middleware';

// Owner-only route
export async function DELETE(request: NextRequest) {
  const authCheck = await requireOwner(request);
  if (authCheck) return authCheck;
  // ...
}

// Manager-level route
export async function PUT(request: NextRequest) {
  const authCheck = await requireManager(request);
  if (authCheck) return authCheck;
  // ...
}

// Staff-level route
export async function POST(request: NextRequest) {
  const authCheck = await requireStaff(request);
  if (authCheck) return authCheck;
  // ...
}
```

### Frontend: React Components

#### Using Permission Gate

```typescript
import { PermissionGate, OwnerOnly, AdminOnly, StaffOnly } from '@/components/PermissionGate';

// Hide button for users without delete permission
<PermissionGate
  permission={{ resource: 'products', action: 'delete' }}
  hideOnUnauthorized
>
  <button>Delete Product</button>
</PermissionGate>

// Show fallback for unauthorized users
<PermissionGate
  minimumRole="manager"
  fallback={<p>Access Denied: Manager role required</p>}
>
  <AdminPanel />
</PermissionGate>

// Convenience components
<OwnerOnly>
  <button>System Settings</button>
</OwnerOnly>

<AdminOnly>
  <button>User Management</button>
</AdminOnly>

<StaffOnly>
  <button>Create Order</button>
</StaffOnly>
```

#### Using Hooks

```typescript
import { useUserRole, usePermission, useMinimumRole } from '@/lib/hooks/useUserRole';

function MyComponent() {
  const { role, isOwner, isAdmin, hasPermission } = useUserRole();

  // Check role
  if (isOwner) {
    return <OwnerDashboard />;
  }

  // Check permission asynchronously
  const canDelete = await hasPermission('products', 'delete');

  return (
    <div>
      <p>Your role: {role}</p>
      {canDelete && <button>Delete</button>}
    </div>
  );
}

// Using individual hooks
function DeleteButton() {
  const { hasPermission, loading } = usePermission('products', 'delete');

  if (loading) return <Spinner />;
  if (!hasPermission) return null;

  return <button>Delete Product</button>;
}
```

#### Disabling Elements

```typescript
import { PermissionDisable } from '@/components/PermissionGate';

<PermissionDisable
  permission={{ resource: 'products', action: 'bulk_edit' }}
  disabledClassName="opacity-50 cursor-not-allowed"
  disabledTitle="You need bulk_edit permission"
>
  <button>Bulk Edit</button>
</PermissionDisable>
```

#### Role-based Rendering

```typescript
import { RoleSwitch } from '@/components/PermissionGate';

<RoleSwitch
  owner={<FullDashboard />}
  manager={<ManagerDashboard />}
  staff={<StaffDashboard />}
  viewer={<ViewerDashboard />}
  fallback={<LoginPrompt />}
/>
```

## User Management

### Admin Interface

Access the user management interface (Owner only):

```typescript
import UserManagement from '@/components/UserManagement';

<UserManagement />
```

This component allows owners to:
- View all user role assignments
- Assign roles to users
- Remove role assignments
- Set role expiration dates

### API Endpoints

#### GET /api/users/roles
Get all user role assignments (Owner only)

```typescript
const response = await fetch('/api/users/roles');
const userRoles = await response.json();
```

#### POST /api/users/roles
Assign a role to a user (Owner only)

```typescript
await fetch('/api/users/roles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    roleId: 'role-uuid',
    expiresAt: '2024-12-31T23:59:59Z' // Optional
  })
});
```

#### DELETE /api/users/roles?id={userRoleId}
Remove a role assignment (Owner only)

```typescript
await fetch(`/api/users/roles?id=${userRoleId}`, {
  method: 'DELETE'
});
```

## Database Helper Functions

### `has_permission(user_id, required_permission)`
Check if a user has a specific permission.

```sql
SELECT has_permission('user-uuid', 'products:delete');
-- Returns: true/false
```

### `get_user_role(user_id)`
Get a user's highest priority role.

```sql
SELECT * FROM get_user_role('user-uuid');
-- Returns: { role_name: 'manager', role_id: 'uuid' }
```

## Permission Matrix

| Resource  | Owner | Manager | Staff | Viewer |
|-----------|-------|---------|-------|--------|
| **Products** |
| Create    | ✓     | ✓       | ✓     | ✗      |
| Read      | ✓     | ✓       | ✓     | ✓      |
| Update    | ✓     | ✓       | ✓     | ✗      |
| Delete    | ✓     | ✓       | ✗     | ✗      |
| Bulk Edit | ✓     | ✓       | ✗     | ✗      |
| **Orders** |
| Create    | ✓     | ✓       | ✓     | ✗      |
| Read      | ✓     | ✓       | ✓     | ✓      |
| Update    | ✓     | ✓       | ✓     | ✗      |
| Delete    | ✓     | ✓       | ✗     | ✗      |
| Bulk Edit | ✓     | ✓       | ✗     | ✗      |
| **Customers** |
| Create    | ✓     | ✓       | ✓     | ✗      |
| Read      | ✓     | ✓       | ✓     | ✓      |
| Update    | ✓     | ✓       | ✓     | ✗      |
| Delete    | ✓     | ✓       | ✗     | ✗      |
| Bulk Edit | ✓     | ✓       | ✗     | ✗      |
| **Users** |
| Manage    | ✓     | ✗       | ✗     | ✗      |
| **Settings** |
| Read      | ✓     | ✓       | ✓     | ✓      |
| Update    | ✓     | ✓       | ✗     | ✗      |

## Security Considerations

1. **RLS Enforcement**: All tables have Row Level Security enabled
2. **Server-side Validation**: Always validate permissions server-side
3. **Client-side UI**: Use permission gates for better UX
4. **Role Expiration**: Support for temporary role assignments
5. **Audit Trail**: Track who assigned roles and when

## Testing

Run tests to verify RBAC implementation:

```bash
npm test -- rbac
```

## Troubleshooting

### User has no role
- Check if user_roles table has an entry for the user
- Run seeding script to create default roles
- Assign a role through the admin interface

### Permission denied errors
- Verify RLS policies are enabled
- Check role-permission mappings
- Ensure user's role hasn't expired

### Middleware not working
- Verify @supabase/auth-helpers-nextjs is installed
- Check that cookies() is properly imported
- Ensure user is authenticated

## Files Reference

### Database
- `/supabase/migrations/add_rbac_roles.sql` - Roles table
- `/supabase/migrations/add_rbac_user_roles.sql` - User roles table
- `/supabase/migrations/add_rbac_permissions.sql` - Permissions tables
- `/supabase/migrations/update_rls_policies_for_rbac.sql` - RLS policies
- `/supabase/seed-rbac.sql` - Default roles and permissions

### Backend
- `/lib/auth/getRoleFromSession.ts` - Role retrieval helpers
- `/lib/auth/checkPermission.ts` - Permission checking helpers
- `/lib/auth/rbac-middleware.ts` - API route middleware
- `/lib/auth/api-route-examples.ts` - Usage examples

### Frontend
- `/lib/hooks/useUserRole.ts` - React hooks for roles/permissions
- `/components/PermissionGate.tsx` - Permission gate components
- `/components/UserManagement.tsx` - User management interface

### API
- `/app/api/users/roles/route.ts` - User role management endpoints

## Support

For issues or questions about RBAC:
1. Check this documentation
2. Review example files
3. Check RLS policies in Supabase dashboard
4. Verify database migrations ran successfully
