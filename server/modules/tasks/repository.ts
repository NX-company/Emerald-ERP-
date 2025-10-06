import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import type { Task, InsertTask } from "@shared/schema";
import { tasks } from "@shared/schema";

export class TasksRepository {
  async getAllTasks(status?: string, priority?: string, assigneeId?: string): Promise<Task[]> {
    let conditions = [];
    
    if (status) {
      conditions.push(eq(tasks.status, status as any));
    }
    
    if (priority) {
      conditions.push(eq(tasks.priority, priority as any));
    }
    
    if (assigneeId) {
      conditions.push(eq(tasks.assignee_id, assigneeId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(tasks).where(and(...conditions));
    }
    
    return await db.select().from(tasks);
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async createTask(data: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(data).returning();
    return result[0];
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set({ ...data, updated_at: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }
}

export const tasksRepository = new TasksRepository();
