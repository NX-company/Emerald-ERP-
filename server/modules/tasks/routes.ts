import { Router } from "express";
import { storage } from "../../storage";
import { insertTaskSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export const router = Router();

// ========== Task Endpoints ==========

// GET /api/tasks - Get all tasks
router.get("/api/tasks", async (req, res) => {
  try {
    const { status, priority, assignee_id } = req.query;
    const tasks = await storage.getAllTasks(
      status as string | undefined,
      priority as string | undefined,
      assignee_id as string | undefined
    );
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await storage.getTaskById(id);
    
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    
    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// POST /api/tasks - Create new task
router.post("/api/tasks", async (req, res) => {
  try {
    const validationResult = insertTaskSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newTask = await storage.createTask(validationResult.data);
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PUT /api/tasks/:id - Update task
router.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validationResult = insertTaskSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const updatedTask = await storage.updateTask(id, validationResult.data);
    
    if (!updatedTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    
    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteTask(id);
    
    if (!deleted) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});
