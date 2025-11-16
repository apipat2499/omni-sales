# RBAC Quick Start Guide

Get started with Role-Based Access Control in 5 minutes!

## 1. Setup Database (First Time Only)

Run the migrations:

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Run SQL files directly
psql -f supabase/migrations/add_rbac_roles.sql
psql -f supabase/migrations/add_rbac_user_roles.sql
psql -f supabase/migrations/add_rbac_permissions.sql
psql -f supabase/migrations/update_rls_policies_for_rbac.sql
psql -f supabase/seed-rbac.sql
```

## 2. Assign Owner Role to Yourself

Edit `supabase/seed-rbac.sql` and uncomment the section at the bottom:

```sql
-- Replace 'admin@example.com' with your email
SELECT id INTO v_user_id
FROM auth.users
WHERE email = 'your-email@example.com'
LIMIT 1;

-- Assign owner role
INSERT INTO user_roles (user_id, role_id)
SELECT v_user_id, id FROM roles WHERE name = 'owner';
```

Then run:
```bash
psql -f supabase/seed-rbac.sql
```

## 3. Protect an API Route

```typescript
import { withRBAC } from '@/lib/auth/rbac-middleware';

export async function DELETE(request: NextRequest) {
  // Only managers and owners can delete
  const authCheck = await withRBAC(request, { requiredRole: 'manager' });
  if (authCheck) return authCheck;

  // Your deletion logic here
  return NextResponse.json({ message: 'Deleted' });
}
```

## 4. Hide UI Elements

```typescript
import { PermissionGate } from '@/components/PermissionGate';

<PermissionGate
  permission={{ resource: 'products', action: 'delete' }}
  hideOnUnauthorized
>
  <button>Delete Product</button>
</PermissionGate>
```

## 5. Check Role in Component

```typescript
import { useUserRole } from '@/lib/hooks/useUserRole';

function MyComponent() {
  const { role, isOwner, isAdmin } = useUserRole();

  return (
    <div>
      <p>Your role: {role}</p>
      {isOwner && <button>System Settings</button>}
      {isAdmin && <button>User Management</button>}
    </div>
  );
}
```

## Common Patterns

### Owner-Only Features
```typescript
import { OwnerOnly } from '@/components/PermissionGate';

<OwnerOnly>
  <UserManagement />
</OwnerOnly>
```

### Admin-Only (Manager + Owner)
```typescript
import { AdminOnly } from '@/components/PermissionGate';

<AdminOnly>
  <BulkOperations />
</AdminOnly>
```

### Staff and Above
```typescript
import { StaffOnly } from '@/components/PermissionGate';

<StaffOnly>
  <CreateOrderButton />
</StaffOnly>
```

### Different Content per Role
```typescript
import { RoleSwitch } from '@/components/PermissionGate';

<RoleSwitch
  owner={<FullDashboard />}
  manager={<ManagerDashboard />}
  staff={<StaffDashboard />}
  viewer={<ViewOnlyDashboard />}
/>
```

## Role Capabilities

| Feature | Owner | Manager | Staff | Viewer |
|---------|-------|---------|-------|--------|
| Create Products/Orders | ✓ | ✓ | ✓ | ✗ |
| View Products/Orders | ✓ | ✓ | ✓ | ✓ |
| Update Products/Orders | ✓ | ✓ | ✓ | ✗ |
| Delete Products/Orders | ✓ | ✓ | ✗ | ✗ |
| Bulk Operations | ✓ | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ | ✗ |
| System Settings | ✓ | ✗ | ✗ | ✗ |

## Manage Users

Access the user management interface (owner only):

```typescript
import UserManagement from '@/components/UserManagement';

<UserManagement />
```

Or use the API:

```typescript
// Assign role
await fetch('/api/users/roles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    roleId: 'role-uuid',
  })
});

// Remove role
await fetch(`/api/users/roles?id=${userRoleId}`, {
  method: 'DELETE'
});
```

## Troubleshooting

**"Access Denied" errors?**
- Check if you have a role assigned
- Run the seed script to create default roles
- Verify your email matches in the seed script

**UI not updating?**
- Clear browser cache and cookies
- Check browser console for errors
- Verify RLS policies are enabled in Supabase

**API routes not protected?**
- Make sure you're using `withRBAC()` in your route handlers
- Check that authentication is working
- Verify database migrations ran successfully

## Next Steps

- Read full documentation: `RBAC_IMPLEMENTATION.md`
- Check examples: `lib/auth/api-route-examples.ts`
- Customize permissions in `supabase/seed-rbac.sql`

## Support

For detailed documentation, see:
- `RBAC_IMPLEMENTATION.md` - Full documentation
- `lib/auth/api-route-examples.ts` - API route examples
- `types/rbac.ts` - TypeScript types
