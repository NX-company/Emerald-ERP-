import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import { users, roles, role_permissions } from "@shared/schema";
import type { RolePermission } from "@shared/schema";

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface UserPermissions {
  userId: string;
  roleId: string | null;
  roleName: string | null;
  isActive: boolean;
  permissions: Map<string, {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    view_all: boolean;
  }>;
}

export class PermissionsService {
  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    // Get user with role
    const userResult = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult[0]) {
      return null;
    }

    const user = userResult[0];

    // If user has no role, return empty permissions
    if (!user.role_id) {
      return {
        userId: user.id,
        roleId: null,
        roleName: null,
        isActive: user.is_active ?? true,
        permissions: new Map(),
      };
    }

    // Get role
    const roleResult = await db.select()
      .from(roles)
      .where(eq(roles.id, user.role_id))
      .limit(1);

    if (!roleResult[0]) {
      return {
        userId: user.id,
        roleId: user.role_id,
        roleName: null,
        isActive: user.is_active ?? true,
        permissions: new Map(),
      };
    }

    const role = roleResult[0];

    // Get all permissions for this role
    const permissionsResult = await db.select()
      .from(role_permissions)
      .where(eq(role_permissions.role_id, user.role_id));

    const permissionsMap = new Map();
    for (const perm of permissionsResult) {
      permissionsMap.set(perm.module, {
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
        view_all: perm.view_all,
      });
    }

    return {
      userId: user.id,
      roleId: role.id,
      roleName: role.name,
      isActive: user.is_active ?? true,
      permissions: permissionsMap,
    };
  }

  /**
   * Check if user has specific permission for a module
   */
  async hasPermission(
    userId: string,
    module: string,
    action: PermissionAction
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    if (!userPermissions || !userPermissions.isActive) {
      return false;
    }

    const modulePermissions = userPermissions.permissions.get(module);
    if (!modulePermissions) {
      return false;
    }

    switch (action) {
      case 'view':
        return modulePermissions.can_view;
      case 'create':
        return modulePermissions.can_create;
      case 'edit':
        return modulePermissions.can_edit;
      case 'delete':
        return modulePermissions.can_delete;
      default:
        return false;
    }
  }

  /**
   * Check if user can view all data for a module or only their own
   */
  async canViewAll(userId: string, module: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    if (!userPermissions || !userPermissions.isActive) {
      return false;
    }

    const modulePermissions = userPermissions.permissions.get(module);
    if (!modulePermissions) {
      return false;
    }

    return modulePermissions.view_all;
  }

  /**
   * Get the permission level for a module
   */
  async getModulePermissions(userId: string, module: string) {
    const userPermissions = await this.getUserPermissions(userId);

    if (!userPermissions || !userPermissions.isActive) {
      return {
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        view_all: false,
      };
    }

    return userPermissions.permissions.get(module) || {
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
      view_all: false,
    };
  }
}

export const permissionsService = new PermissionsService();
