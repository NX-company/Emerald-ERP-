import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDealSchema, 
  insertProjectSchema, 
  insertProjectStageSchema,
  insertProductionTaskSchema,
  insertProductionStageSchema,
  insertWarehouseItemSchema,
  insertWarehouseTransactionSchema,
  insertFinancialTransactionSchema,
  insertInstallationSchema,
  insertTaskSchema,
  insertDocumentSchema,
  insertCompanySettingsSchema,
  insertUserSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET /api/deals - Get all deals or filter by stage
  app.get("/api/deals", async (req, res) => {
    try {
      const { stage } = req.query;
      
      if (stage && typeof stage === "string") {
        const deals = await storage.getDealsByStage(stage);
        res.json(deals);
      } else {
        const deals = await storage.getAllDeals();
        res.json(deals);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  // GET /api/deals/:id - Get deal by ID
  app.get("/api/deals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deal = await storage.getDealById(id);
      
      if (!deal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ error: "Failed to fetch deal" });
    }
  });

  // POST /api/deals - Create new deal
  app.post("/api/deals", async (req, res) => {
    try {
      const validationResult = insertDealSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newDeal = await storage.createDeal(validationResult.data);
      res.status(201).json(newDeal);
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  // PUT /api/deals/:id - Update deal
  app.put("/api/deals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate the update data using the same schema (partial is handled by the storage layer)
      const validationResult = insertDealSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedDeal = await storage.updateDeal(id, validationResult.data);
      
      if (!updatedDeal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      
      res.json(updatedDeal);
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  // DELETE /api/deals/:id - Delete deal
  app.delete("/api/deals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteDeal(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  // GET /api/projects - Get all projects or filter by status
  app.get("/api/projects", async (req, res) => {
    try {
      const { status } = req.query;
      
      if (status && typeof status === "string") {
        const projects = await storage.getProjectsByStatus(status);
        res.json(projects);
      } else {
        const projects = await storage.getAllProjects();
        res.json(projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // GET /api/projects/:id - Get project by ID with stages
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProjectById(id);
      
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // POST /api/projects - Create new project
  app.post("/api/projects", async (req, res) => {
    try {
      const validationResult = insertProjectSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      if (validationResult.data.deal_id) {
        const deal = await storage.getDealById(validationResult.data.deal_id);
        if (!deal) {
          res.status(400).json({ error: "Deal not found" });
          return;
        }
      }
      
      const newProject = await storage.createProject(validationResult.data);
      res.status(201).json(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // PUT /api/projects/:id - Update project
  app.put("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const validationResult = insertProjectSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      if (validationResult.data.deal_id) {
        const deal = await storage.getDealById(validationResult.data.deal_id);
        if (!deal) {
          res.status(400).json({ error: "Deal not found" });
          return;
        }
      }
      
      const updatedProject = await storage.updateProject(id, validationResult.data);
      
      if (!updatedProject) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // DELETE /api/projects/:id - Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProject(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // GET /api/projects/:id/stages - Get all stages for a project
  app.get("/api/projects/:id/stages", async (req, res) => {
    try {
      const { id } = req.params;
      
      const project = await storage.getProjectById(id);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      
      const stages = await storage.getProjectStages(id);
      res.json(stages);
    } catch (error) {
      console.error("Error fetching project stages:", error);
      res.status(500).json({ error: "Failed to fetch project stages" });
    }
  });

  // POST /api/projects/:id/stages - Create stage for project
  app.post("/api/projects/:id/stages", async (req, res) => {
    try {
      const { id } = req.params;
      
      const project = await storage.getProjectById(id);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      
      const validationResult = insertProjectStageSchema.safeParse({
        ...req.body,
        project_id: id
      });
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newStage = await storage.createProjectStage(validationResult.data);
      res.status(201).json(newStage);
    } catch (error) {
      console.error("Error creating project stage:", error);
      res.status(500).json({ error: "Failed to create project stage" });
    }
  });

  // PUT /api/projects/stages/:stageId - Update stage
  app.put("/api/projects/stages/:stageId", async (req, res) => {
    try {
      const { stageId } = req.params;
      
      const validationResult = insertProjectStageSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedStage = await storage.updateProjectStage(stageId, validationResult.data);
      
      if (!updatedStage) {
        res.status(404).json({ error: "Project stage not found" });
        return;
      }
      
      res.json(updatedStage);
    } catch (error) {
      console.error("Error updating project stage:", error);
      res.status(500).json({ error: "Failed to update project stage" });
    }
  });

  // DELETE /api/projects/stages/:stageId - Delete stage
  app.delete("/api/projects/stages/:stageId", async (req, res) => {
    try {
      const { stageId } = req.params;
      const deleted = await storage.deleteProjectStage(stageId);
      
      if (!deleted) {
        res.status(404).json({ error: "Project stage not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project stage:", error);
      res.status(500).json({ error: "Failed to delete project stage" });
    }
  });

  // ========== Production Endpoints ==========

  // GET /api/production - Get all production tasks
  app.get("/api/production", async (req, res) => {
    try {
      const { status } = req.query;
      const tasks = await storage.getAllProductionTasks(status as string | undefined);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching production tasks:", error);
      res.status(500).json({ error: "Failed to fetch production tasks" });
    }
  });

  // GET /api/production/:id - Get production task by ID with stages
  app.get("/api/production/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getProductionTaskById(id);
      
      if (!task) {
        res.status(404).json({ error: "Production task not found" });
        return;
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching production task:", error);
      res.status(500).json({ error: "Failed to fetch production task" });
    }
  });

  // POST /api/production - Create new production task
  app.post("/api/production", async (req, res) => {
    try {
      const validationResult = insertProductionTaskSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newTask = await storage.createProductionTask(validationResult.data);
      res.status(201).json(newTask);
    } catch (error) {
      console.error("Error creating production task:", error);
      res.status(500).json({ error: "Failed to create production task" });
    }
  });

  // PUT /api/production/:id - Update production task
  app.put("/api/production/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = insertProductionTaskSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedTask = await storage.updateProductionTask(id, validationResult.data);
      
      if (!updatedTask) {
        res.status(404).json({ error: "Production task not found" });
        return;
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating production task:", error);
      res.status(500).json({ error: "Failed to update production task" });
    }
  });

  // DELETE /api/production/:id - Delete production task
  app.delete("/api/production/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProductionTask(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Production task not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting production task:", error);
      res.status(500).json({ error: "Failed to delete production task" });
    }
  });

  // POST /api/production/:id/stages - Create stage for production task
  app.post("/api/production/:id/stages", async (req, res) => {
    try {
      const { id } = req.params;
      
      const task = await storage.getProductionTaskById(id);
      if (!task) {
        res.status(404).json({ error: "Production task not found" });
        return;
      }
      
      const validationResult = insertProductionStageSchema.safeParse({
        ...req.body,
        task_id: id
      });
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newStage = await storage.createProductionStage(validationResult.data);
      res.status(201).json(newStage);
    } catch (error) {
      console.error("Error creating production stage:", error);
      res.status(500).json({ error: "Failed to create production stage" });
    }
  });

  // PUT /api/production/stages/:stageId - Update production stage
  app.put("/api/production/stages/:stageId", async (req, res) => {
    try {
      const { stageId } = req.params;
      const validationResult = insertProductionStageSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedStage = await storage.updateProductionStage(stageId, validationResult.data);
      
      if (!updatedStage) {
        res.status(404).json({ error: "Production stage not found" });
        return;
      }
      
      res.json(updatedStage);
    } catch (error) {
      console.error("Error updating production stage:", error);
      res.status(500).json({ error: "Failed to update production stage" });
    }
  });

  // DELETE /api/production/stages/:stageId - Delete production stage
  app.delete("/api/production/stages/:stageId", async (req, res) => {
    try {
      const { stageId } = req.params;
      const deleted = await storage.deleteProductionStage(stageId);
      
      if (!deleted) {
        res.status(404).json({ error: "Production stage not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting production stage:", error);
      res.status(500).json({ error: "Failed to delete production stage" });
    }
  });

  // ========== Warehouse Endpoints ==========

  // GET /api/warehouse - Get all warehouse items
  app.get("/api/warehouse", async (req, res) => {
    try {
      const { category, status } = req.query;
      const items = await storage.getAllWarehouseItems(
        category as string | undefined,
        status as string | undefined
      );
      res.json(items);
    } catch (error) {
      console.error("Error fetching warehouse items:", error);
      res.status(500).json({ error: "Failed to fetch warehouse items" });
    }
  });

  // GET /api/warehouse/:id - Get warehouse item by ID
  app.get("/api/warehouse/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getWarehouseItemById(id);
      
      if (!item) {
        res.status(404).json({ error: "Warehouse item not found" });
        return;
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching warehouse item:", error);
      res.status(500).json({ error: "Failed to fetch warehouse item" });
    }
  });

  // POST /api/warehouse - Create new warehouse item
  app.post("/api/warehouse", async (req, res) => {
    try {
      const validationResult = insertWarehouseItemSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newItem = await storage.createWarehouseItem(validationResult.data);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating warehouse item:", error);
      res.status(500).json({ error: "Failed to create warehouse item" });
    }
  });

  // PUT /api/warehouse/:id - Update warehouse item
  app.put("/api/warehouse/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = insertWarehouseItemSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedItem = await storage.updateWarehouseItem(id, validationResult.data);
      
      if (!updatedItem) {
        res.status(404).json({ error: "Warehouse item not found" });
        return;
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating warehouse item:", error);
      res.status(500).json({ error: "Failed to update warehouse item" });
    }
  });

  // DELETE /api/warehouse/:id - Delete warehouse item
  app.delete("/api/warehouse/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWarehouseItem(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Warehouse item not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting warehouse item:", error);
      res.status(500).json({ error: "Failed to delete warehouse item" });
    }
  });

  // POST /api/warehouse/:id/transactions - Create warehouse transaction
  app.post("/api/warehouse/:id/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      
      const validationResult = insertWarehouseTransactionSchema.safeParse({
        ...req.body,
        item_id: id
      });
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newTransaction = await storage.createTransaction(validationResult.data);
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error("Error creating warehouse transaction:", error);
      res.status(500).json({ error: "Failed to create warehouse transaction" });
    }
  });

  // GET /api/warehouse/:id/transactions - Get warehouse transactions
  app.get("/api/warehouse/:id/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const transactions = await storage.getWarehouseTransactions(id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching warehouse transactions:", error);
      res.status(500).json({ error: "Failed to fetch warehouse transactions" });
    }
  });

  // ========== Finance Endpoints ==========

  // GET /api/finance/transactions - Get all financial transactions
  app.get("/api/finance/transactions", async (req, res) => {
    try {
      const { type, from, to } = req.query;
      
      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;
      
      const transactions = await storage.getAllFinancialTransactions(
        type as string | undefined,
        fromDate,
        toDate
      );
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching financial transactions:", error);
      res.status(500).json({ error: "Failed to fetch financial transactions" });
    }
  });

  // POST /api/finance/transactions - Create financial transaction
  app.post("/api/finance/transactions", async (req, res) => {
    try {
      const validationResult = insertFinancialTransactionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newTransaction = await storage.createFinancialTransaction(validationResult.data);
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error("Error creating financial transaction:", error);
      res.status(500).json({ error: "Failed to create financial transaction" });
    }
  });

  // GET /api/finance/stats - Get financial statistics
  app.get("/api/finance/stats", async (req, res) => {
    try {
      const stats = await storage.getFinancialStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching financial stats:", error);
      res.status(500).json({ error: "Failed to fetch financial stats" });
    }
  });

  // GET /api/finance/projects/:projectId - Get project financials
  app.get("/api/finance/projects/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const financials = await storage.getProjectFinancials(projectId);
      res.json(financials);
    } catch (error) {
      console.error("Error fetching project financials:", error);
      res.status(500).json({ error: "Failed to fetch project financials" });
    }
  });

  // ========== Installation Endpoints ==========

  // GET /api/installations - Get all installations
  app.get("/api/installations", async (req, res) => {
    try {
      const { status } = req.query;
      const installations = await storage.getAllInstallations(status as string | undefined);
      res.json(installations);
    } catch (error) {
      console.error("Error fetching installations:", error);
      res.status(500).json({ error: "Failed to fetch installations" });
    }
  });

  // GET /api/installations/:id - Get installation by ID
  app.get("/api/installations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const installation = await storage.getInstallationById(id);
      
      if (!installation) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }
      
      res.json(installation);
    } catch (error) {
      console.error("Error fetching installation:", error);
      res.status(500).json({ error: "Failed to fetch installation" });
    }
  });

  // POST /api/installations - Create new installation
  app.post("/api/installations", async (req, res) => {
    try {
      const validationResult = insertInstallationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newInstallation = await storage.createInstallation(validationResult.data);
      res.status(201).json(newInstallation);
    } catch (error) {
      console.error("Error creating installation:", error);
      res.status(500).json({ error: "Failed to create installation" });
    }
  });

  // PUT /api/installations/:id - Update installation
  app.put("/api/installations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = insertInstallationSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedInstallation = await storage.updateInstallation(id, validationResult.data);
      
      if (!updatedInstallation) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }
      
      res.json(updatedInstallation);
    } catch (error) {
      console.error("Error updating installation:", error);
      res.status(500).json({ error: "Failed to update installation" });
    }
  });

  // DELETE /api/installations/:id - Delete installation
  app.delete("/api/installations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteInstallation(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Installation not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting installation:", error);
      res.status(500).json({ error: "Failed to delete installation" });
    }
  });

  // ========== Task Endpoints ==========

  // GET /api/tasks - Get all tasks
  app.get("/api/tasks", async (req, res) => {
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
  app.get("/api/tasks/:id", async (req, res) => {
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
  app.post("/api/tasks", async (req, res) => {
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
  app.put("/api/tasks/:id", async (req, res) => {
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
  app.delete("/api/tasks/:id", async (req, res) => {
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

  // ========== Document Endpoints ==========

  // GET /api/documents - Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const { type, project_id } = req.query;
      const documents = await storage.getAllDocuments(
        type as string | undefined,
        project_id as string | undefined
      );
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // GET /api/documents/:id - Get document by ID
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // POST /api/documents - Create new document
  app.post("/api/documents", async (req, res) => {
    try {
      const validationResult = insertDocumentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newDocument = await storage.createDocument(validationResult.data);
      res.status(201).json(newDocument);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  // PUT /api/documents/:id - Update document
  app.put("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = insertDocumentSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedDocument = await storage.updateDocument(id, validationResult.data);
      
      if (!updatedDocument) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
      
      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  // DELETE /api/documents/:id - Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteDocument(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // ========== Settings Endpoints ==========

  // GET /api/settings/company - Get company settings
  app.get("/api/settings/company", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      
      if (!settings) {
        res.status(404).json({ error: "Company settings not found" });
        return;
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ error: "Failed to fetch company settings" });
    }
  });

  // PUT /api/settings/company - Update company settings
  app.put("/api/settings/company", async (req, res) => {
    try {
      const validationResult = insertCompanySettingsSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedSettings = await storage.updateCompanySettings(validationResult.data);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ error: "Failed to update company settings" });
    }
  });

  // GET /api/users - Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // GET /api/users/:id - Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // PUT /api/users/:id - Update user
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = insertUserSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedUser = await storage.updateUser(id, validationResult.data);
      
      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // DELETE /api/users/:id - Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
