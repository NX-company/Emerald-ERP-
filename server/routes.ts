import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDealSchema, insertProjectSchema, insertProjectStageSchema } from "@shared/schema";
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

  const httpServer = createServer(app);

  return httpServer;
}
