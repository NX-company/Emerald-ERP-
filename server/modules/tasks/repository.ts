import { db } from "../../db";
import { tasks, users, task_comments, task_checklist_items, activity_logs } from "@shared/schema";
import type { InsertTask, InsertTaskComment, InsertTaskChecklistItem, InsertActivityLog } from "@shared/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { nanoid } from "nanoid";

export class TasksRepository {
  // Get all tasks
  async getAllTasks(): Promise<any[]> {
    const result = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assignee_id, users.id))
      .orderBy(desc(tasks.created_at));

    return result.map(r => ({
      ...r.tasks,
      assignee: r.users ? {
        id: r.users.id,
        username: r.users.username,
        full_name: r.users.full_name,
        email: r.users.email,
      } : null,
    }));
  }

  // Get tasks by assignee
  async getTasksByAssignee(assigneeId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assignee_id, users.id))
      .where(eq(tasks.assignee_id, assigneeId))
      .orderBy(desc(tasks.created_at));

    return result.map(r => ({
      ...r.tasks,
      assignee: r.users ? {
        id: r.users.id,
        username: r.users.username,
        full_name: r.users.full_name,
        email: r.users.email,
      } : null,
    }));
  }

  // Get tasks related to an entity (deal, project, etc.)
  async getTasksByEntity(entityType: string, entityId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assignee_id, users.id))
      .where(
        and(
          eq(tasks.related_entity_type, entityType),
          eq(tasks.related_entity_id, entityId)
        )
      )
      .orderBy(desc(tasks.created_at));

    return result.map(r => ({
      ...r.tasks,
      assignee: r.users ? {
        id: r.users.id,
        username: r.users.username,
        full_name: r.users.full_name,
        email: r.users.email,
      } : null,
    }));
  }

  // Get task by ID
  async getTaskById(taskId: string): Promise<any> {
    const result = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assignee_id, users.id))
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const r = result[0];
    return {
      ...r.tasks,
      assignee: r.users ? {
        id: r.users.id,
        username: r.users.username,
        full_name: r.users.full_name,
        email: r.users.email,
      } : null,
    };
  }

  // Create task
  async createTask(taskData: InsertTask): Promise<any> {
    const newTask = {
      id: nanoid(),
      ...taskData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.insert(tasks).values(newTask);
    return this.getTaskById(newTask.id);
  }

  // Update task
  async updateTask(taskId: string, taskData: Partial<InsertTask>): Promise<any> {
    await db
      .update(tasks)
      .set({ ...taskData, updated_at: new Date() })
      .where(eq(tasks.id, taskId));

    return this.getTaskById(taskId);
  }

  // Delete task
  async deleteTask(taskId: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, taskId));
  }

  // Task Comments
  async getTaskComments(taskId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(task_comments)
      .leftJoin(users, eq(task_comments.author_id, users.id))
      .where(eq(task_comments.task_id, taskId))
      .orderBy(desc(task_comments.created_at));

    return result.map(r => ({
      ...r.task_comments,
      author: r.users ? {
        id: r.users.id,
        username: r.users.username,
        full_name: r.users.full_name,
      } : null,
    }));
  }

  async createTaskComment(commentData: InsertTaskComment): Promise<any> {
    const newComment = {
      id: nanoid(),
      ...commentData,
      created_at: new Date(),
    };

    await db.insert(task_comments).values(newComment);
    return newComment;
  }

  // Task Checklist
  async getTaskChecklist(taskId: string): Promise<any[]> {
    return db
      .select()
      .from(task_checklist_items)
      .where(eq(task_checklist_items.task_id, taskId))
      .orderBy(task_checklist_items.order);
  }

  async createChecklistItem(itemData: InsertTaskChecklistItem): Promise<any> {
    const newItem = {
      id: nanoid(),
      ...itemData,
      created_at: new Date(),
    };

    await db.insert(task_checklist_items).values(newItem);
    return newItem;
  }

  async updateChecklistItem(itemId: string, itemData: Partial<InsertTaskChecklistItem>): Promise<any> {
    await db
      .update(task_checklist_items)
      .set(itemData)
      .where(eq(task_checklist_items.id, itemId));

    return db.select().from(task_checklist_items).where(eq(task_checklist_items.id, itemId)).limit(1);
  }

  async deleteChecklistItem(itemId: string): Promise<void> {
    await db.delete(task_checklist_items).where(eq(task_checklist_items.id, itemId));
  }
}

// Activity Logs Repository
export class ActivityLogsRepository {
  // Log an activity
  async logActivity(activityData: InsertActivityLog): Promise<any> {
    const newLog = {
      id: nanoid(),
      ...activityData,
      created_at: new Date(),
    };

    await db.insert(activity_logs).values(newLog);
    return newLog;
  }

  // Get activity logs for an entity
  async getActivityLogs(entityType: string, entityId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(activity_logs)
      .leftJoin(users, eq(activity_logs.user_id, users.id))
      .where(
        and(
          eq(activity_logs.entity_type, entityType),
          eq(activity_logs.entity_id, entityId)
        )
      )
      .orderBy(desc(activity_logs.created_at));

    return result.map(r => ({
      ...r.activity_logs,
      user: r.users ? {
        id: r.users.id,
        username: r.users.username,
        full_name: r.users.full_name,
      } : null,
    }));
  }

  // Get all activity logs for a user
  async getActivityLogsByUser(userId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(activity_logs)
      .leftJoin(users, eq(activity_logs.user_id, users.id))
      .where(eq(activity_logs.user_id, userId))
      .orderBy(desc(activity_logs.created_at));

    return result.map(r => ({
      ...r.activity_logs,
      user: r.users ? {
        id: r.users.id,
        username: r.users.username,
        full_name: r.users.full_name,
      } : null,
    }));
  }
}

export const tasksRepository = new TasksRepository();
export const activityLogsRepository = new ActivityLogsRepository();
