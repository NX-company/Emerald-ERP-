import { db } from "../../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { User, InsertUser } from "@shared/schema";
import { users } from "@shared/schema";

export class UsersRepository {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    if (!result[0]) return undefined;
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    if (!result[0]) return undefined;
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async validatePassword(username: string, password: string): Promise<boolean> {
    const result = await db.select().from(users).where(eq(users.username, username));
    if (!result[0]) return false;
    return await bcrypt.compare(password, result[0].password);
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    if (!result[0]) return undefined;
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getUsersWithRoles(): Promise<Array<User & { role?: any }>> {
    const allUsers = await this.getAllUsers();
    const { roles } = await import("@shared/schema");

    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        if (!user.role_id) {
          return { ...user, role: null };
        }
        const roleResult = await db.select().from(roles).where(eq(roles.id, user.role_id));
        return {
          ...user,
          role: roleResult[0] || null,
        };
      })
    );

    return usersWithRoles;
  }

  async assignRole(userId: string, roleId: string | null): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ role_id: roleId, updated_at: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!result[0]) return undefined;
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async setUserStatus(userId: string, isActive: boolean): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ is_active: isActive, updated_at: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!result[0]) return undefined;
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async getUserPermissions(roleId: string | null): Promise<any[]> {
    if (!roleId) return [];

    const { role_permissions } = await import("@shared/schema");
    const permissions = await db.select().from(role_permissions).where(eq(role_permissions.role_id, roleId));
    return permissions;
  }
}

export const usersRepository = new UsersRepository();
