import { supabase } from "@/lib/supabase/client";

export interface UserRole {
  id: string;
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface UserWithRole {
  userId: string;
  role: string;
  permissions: string[];
}

// Get user permissions
export async function getUserPermissions(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", userId)
      .single();

    if (error || !data) return [];

    const { data: permissions, error: permError } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .eq("role_id", data.role_id);

    if (permError) return [];

    return permissions?.map((p: any) => p.permission_id) || [];
  } catch (error) {
    console.error("Get permissions error:", error);
    return [];
  }
}

// Check if user has permission
export async function hasPermission(userId: string, permission: string) {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

// Assign role to user
export async function assignRoleToUser(userId: string, roleId: string) {
  try {
    const { error } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role_id: roleId,
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Assign role error:", error);
    throw error;
  }
}

// Get all roles
export async function getAllRoles() {
  try {
    const { data, error } = await supabase
      .from("roles")
      .select("*");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get roles error:", error);
    throw error;
  }
}

// Create role
export async function createRole(name: string, description: string) {
  try {
    const { data, error } = await supabase
      .from("roles")
      .insert({ name, description });

    if (error) throw error;
    return { success: true, role: data };
  } catch (error) {
    console.error("Create role error:", error);
    throw error;
  }
}

export default {
  getUserPermissions,
  hasPermission,
  assignRoleToUser,
  getAllRoles,
  createRole,
};
