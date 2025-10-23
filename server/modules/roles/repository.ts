import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import type { Role, InsertRole, RolePermission, InsertRolePermission } from "@shared/schema";
import { roles, role_permissions } from "@shared/schema";

export class RolesRepository {
  // Roles
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getRoleById(id: string): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.id, id));
    return result[0];
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.name, name));
    return result[0];
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const result = await db.insert(roles).values(insertRole).returning();
    return result[0];
  }

  async updateRole(id: string, data: Partial<InsertRole>): Promise<Role | undefined> {
    const result = await db.update(roles)
      .set({ ...data, updated_at: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return result[0];
  }

  async deleteRole(id: string): Promise<boolean> {
    // Check if role is system role
    const role = await this.getRoleById(id);
    if (role?.is_system) {
      throw new Error('Cannot delete system role');
    }

    const result = await db.delete(roles).where(eq(roles.id, id)).returning();
    return result.length > 0;
  }

  // Role Permissions
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return await db.select()
      .from(role_permissions)
      .where(eq(role_permissions.role_id, roleId));
  }

  async getPermissionForModule(roleId: string, module: string): Promise<RolePermission | undefined> {
    const result = await db.select()
      .from(role_permissions)
      .where(and(
        eq(role_permissions.role_id, roleId),
        eq(role_permissions.module, module)
      ));
    return result[0];
  }

  async createPermission(insertPermission: InsertRolePermission): Promise<RolePermission> {
    const result = await db.insert(role_permissions)
      .values(insertPermission)
      .returning();
    return result[0];
  }

  async updatePermission(
    id: string,
    data: Partial<InsertRolePermission>
  ): Promise<RolePermission | undefined> {
    const result = await db.update(role_permissions)
      .set({ ...data, updated_at: new Date() })
      .where(eq(role_permissions.id, id))
      .returning();
    return result[0];
  }

  async deletePermission(id: string): Promise<boolean> {
    const result = await db.delete(role_permissions)
      .where(eq(role_permissions.id, id))
      .returning();
    return result.length > 0;
  }

  async upsertPermission(
    roleId: string,
    module: string,
    permissions: {
      can_view?: boolean;
      can_create?: boolean;
      can_edit?: boolean;
      can_delete?: boolean;
      view_all?: boolean;
    }
  ): Promise<RolePermission> {
    const existing = await this.getPermissionForModule(roleId, module);

    if (existing) {
      const result = await db.update(role_permissions)
        .set({ ...permissions, updated_at: new Date() })
        .where(eq(role_permissions.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(role_permissions)
        .values({
          role_id: roleId,
          module,
          can_view: permissions.can_view ?? false,
          can_create: permissions.can_create ?? false,
          can_edit: permissions.can_edit ?? false,
          can_delete: permissions.can_delete ?? false,
          view_all: permissions.view_all ?? false,
        })
        .returning();
      return result[0];
    }
  }

  // Get role with permissions
  async getRoleWithPermissions(roleId: string): Promise<{
    role: Role;
    permissions: RolePermission[];
  } | undefined> {
    const role = await this.getRoleById(roleId);
    if (!role) return undefined;

    const permissions = await this.getRolePermissions(roleId);
    return { role, permissions };
  }
}

export const rolesRepository = new RolesRepository();
