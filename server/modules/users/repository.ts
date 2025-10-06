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

  async updateUserPermissions(
    id: string, 
    permissions: {
      can_create_deals?: boolean;
      can_edit_deals?: boolean;
      can_delete_deals?: boolean;
    }
  ): Promise<User | undefined> {
    const result = await db.update(users)
      .set(permissions)
      .where(eq(users.id, id))
      .returning();
    if (!result[0]) return undefined;
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }
}

export const usersRepository = new UsersRepository();
