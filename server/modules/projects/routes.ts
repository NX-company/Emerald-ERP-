import { Router } from "express";
import { projectsRepository } from "./repository";
import { insertProjectSchema, insertProjectStageSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { salesRepository } from "../sales/repository";
import { z } from "zod";

export const router = Router();

// GET /api/projects - Get all projects or filter by status
router.get("/api/projects", async (req, res) => {
  try {
    const { status } = req.query;
    
    if (status && typeof status === "string") {
      const projects = await projectsRepository.getProjectsByStatus(status);
      res.json(projects);
    } else {
      const projects = await projectsRepository.getAllProjects();
      res.json(projects);
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET /api/projects/by-deal/:dealId - Get project by deal ID
router.get("/api/projects/by-deal/:dealId", async (req, res) => {
  try {
    const { dealId } = req.params;
    const project = await projectsRepository.getProjectByDealId(dealId);
    
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    
    res.json(project);
  } catch (error) {
    console.error("Error fetching project by deal:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// GET /api/projects/:id - Get project by ID with stages
router.get("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectsRepository.getProjectById(id);
    
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
router.post("/api/projects", async (req, res) => {
  try {
    const validationResult = insertProjectSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newProject = await projectsRepository.createProject(validationResult.data);
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// POST /api/projects/from-invoice - Create project from invoice
router.post("/api/projects/from-invoice", async (req, res) => {
  try {
    const requestSchema = z.object({
      dealId: z.string(),
      invoiceId: z.string(),
    });

    const validationResult = requestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { dealId, invoiceId } = validationResult.data;

    const deal = await salesRepository.getDealById(dealId);
    if (!deal) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    const invoice = await salesRepository.getDealDocumentById(invoiceId);
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    if (invoice.document_type !== "invoice") {
      res.status(400).json({ error: "Document is not an invoice" });
      return;
    }

    const existingProject = await projectsRepository.getProjectByDealId(dealId);
    if (existingProject) {
      res.status(400).json({ error: "Project already exists for this deal" });
      return;
    }

    const project = await projectsRepository.createProjectFromInvoice(dealId, invoiceId, deal, invoice);
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project from invoice:", error);
    res.status(500).json({ error: "Failed to create project from invoice" });
  }
});

// PUT /api/projects/:id - Update project
router.put("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const validationResult = insertProjectSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const updatedProject = await projectsRepository.updateProject(id, validationResult.data);
    
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
router.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await projectsRepository.deleteProject(id);
    
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
router.get("/api/projects/:id/stages", async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await projectsRepository.getProjectById(id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    
    const stages = await projectsRepository.getProjectStages(id);
    res.json(stages);
  } catch (error) {
    console.error("Error fetching project stages:", error);
    res.status(500).json({ error: "Failed to fetch project stages" });
  }
});

// POST /api/projects/:id/stages - Create stage for project
router.post("/api/projects/:id/stages", async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await projectsRepository.getProjectById(id);
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
    
    const newStage = await projectsRepository.createProjectStage(validationResult.data);
    res.status(201).json(newStage);
  } catch (error) {
    console.error("Error creating project stage:", error);
    res.status(500).json({ error: "Failed to create project stage" });
  }
});

// PUT /api/projects/stages/:stageId - Update stage
router.put("/api/projects/stages/:stageId", async (req, res) => {
  try {
    const { stageId } = req.params;
    
    const validationResult = insertProjectStageSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const updatedStage = await projectsRepository.updateProjectStage(stageId, validationResult.data);
    
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
router.delete("/api/projects/stages/:stageId", async (req, res) => {
  try {
    const { stageId } = req.params;
    const deleted = await projectsRepository.deleteProjectStage(stageId);
    
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
