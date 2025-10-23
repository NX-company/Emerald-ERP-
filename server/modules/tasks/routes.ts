import { Router } from "express";
import { tasksRepository, activityLogsRepository } from "./repository";
import { insertTaskSchema, insertActivityLogSchema } from "@shared/schema";

export const router = Router();

// Get all tasks
router.get("/api/tasks", async (_req, res) => {
  try {
    const tasks = await tasksRepository.getAllTasks();
    res.json(tasks);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get tasks by entity (deal, project, etc.)
router.get("/api/tasks/entity/:entityType/:entityId", async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const tasks = await tasksRepository.getTasksByEntity(entityType, entityId);
    res.json(tasks);
  } catch (error: any) {
    console.error("Error fetching tasks by entity:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Create task
router.post("/api/tasks", async (req, res) => {
  try {
    const validatedData = insertTaskSchema.parse(req.body);
    const task = await tasksRepository.createTask(validatedData);

    // Log activity
    if (validatedData.related_entity_type && validatedData.related_entity_id) {
      await activityLogsRepository.logActivity({
        entity_type: validatedData.related_entity_type,
        entity_id: validatedData.related_entity_id,
        action_type: "task_created",
        user_id: validatedData.created_by,
        description: `!>740=0 7040G0: ${validatedData.title}`,
      });
    }

    res.status(201).json(task);
  } catch (error: any) {
    console.error("Error creating task:", error);
    res.status(400).json({ error: error.message || "Failed to create task" });
  }
});

// Update task
router.put("/api/tasks/:id", async (req, res) => {
  try {
    const task = await tasksRepository.updateTask(req.params.id, req.body);

    // Log activity if status changed
    if (req.body.status && task.related_entity_type && task.related_entity_id) {
      await activityLogsRepository.logActivity({
        entity_type: task.related_entity_type,
        entity_id: task.related_entity_id,
        action_type: "task_status_changed",
        user_id: req.body.updated_by || task.assignee_id,
        field_changed: "status",
        new_value: req.body.status,
        description: `040G0 "${task.title}" 87<5=8;0 AB0BCA =0: ${req.body.status}`,
      });
    }

    res.json(task);
  } catch (error: any) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Get activity logs for an entity
router.get("/api/activity-logs/:entityType/:entityId", async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const logs = await activityLogsRepository.getActivityLogs(entityType, entityId);
    res.json(logs);
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// Create activity log
router.post("/api/activity-logs", async (req, res) => {
  try {
    const validatedData = insertActivityLogSchema.parse(req.body);
    const log = await activityLogsRepository.logActivity(validatedData);
    res.status(201).json(log);
  } catch (error: any) {
    console.error("Error creating activity log:", error);
    res.status(400).json({ error: error.message || "Failed to create activity log" });
  }
});
