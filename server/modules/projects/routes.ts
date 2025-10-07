import { Router } from "express";
import { projectsRepository } from "./repository";
import { 
  insertProjectSchema, insertProjectStageSchema, insertProjectItemSchema,
  insertStageDependencySchema, insertProcessTemplateSchema, insertTemplateStageSchema,
  insertTemplateDependencySchema, insertStageMessageSchema
} from "@shared/schema";
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
      selectedPositions: z.array(z.number()).optional(),
      editedPositions: z.array(z.any()).optional(),
      positionStagesData: z.record(z.object({
        stages: z.array(z.object({
          id: z.string(),
          name: z.string(),
          order_index: z.number(),
        })),
        dependencies: z.array(z.object({
          stage_id: z.string(),
          depends_on_stage_id: z.string(),
        })),
      })).optional(),
    });

    const validationResult = requestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { dealId, invoiceId, selectedPositions, editedPositions, positionStagesData } = validationResult.data;

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

    const project = await projectsRepository.createProjectFromInvoice(
      dealId, 
      invoiceId, 
      deal, 
      invoice,
      selectedPositions,
      editedPositions,
      positionStagesData
    );
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

// GET /api/my-tasks/:userId - Get stages assigned to user
router.get("/api/my-tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const stages = await projectsRepository.getStagesByAssignee(userId);
    res.json(stages);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(500).json({ error: "Failed to fetch user tasks" });
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

// ===== Project Items Routes =====

// GET /api/projects/:projectId/items - Get all items for a project
router.get("/api/projects/:projectId/items", async (req, res) => {
  try {
    const { projectId } = req.params;
    const items = await projectsRepository.getProjectItems(projectId);
    res.json(items);
  } catch (error) {
    console.error("Error fetching project items:", error);
    res.status(500).json({ error: "Failed to fetch project items" });
  }
});

// POST /api/projects/:projectId/items - Create new item
router.post("/api/projects/:projectId/items", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const validationResult = insertProjectItemSchema.safeParse({
      ...req.body,
      project_id: projectId
    });
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newItem = await projectsRepository.createProjectItem(validationResult.data);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating project item:", error);
    res.status(500).json({ error: "Failed to create project item" });
  }
});

// PUT /api/projects/:projectId/items/:itemId - Update item
router.put("/api/projects/:projectId/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const validationResult = insertProjectItemSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const updatedItem = await projectsRepository.updateProjectItem(itemId, validationResult.data);
    
    if (!updatedItem) {
      res.status(404).json({ error: "Project item not found" });
      return;
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating project item:", error);
    res.status(500).json({ error: "Failed to update project item" });
  }
});

// DELETE /api/projects/:projectId/items/:itemId - Delete item
router.delete("/api/projects/:projectId/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const deleted = await projectsRepository.deleteProjectItem(itemId);
    
    if (!deleted) {
      res.status(404).json({ error: "Project item not found" });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting project item:", error);
    res.status(500).json({ error: "Failed to delete project item" });
  }
});

// POST /api/projects/:projectId/items/:itemId/stages - Create stage for specific item
router.post("/api/projects/:projectId/items/:itemId/stages", async (req, res) => {
  try {
    const { projectId, itemId } = req.params;
    
    const validationResult = insertProjectStageSchema.safeParse({
      ...req.body,
      project_id: projectId,
      item_id: itemId
    });
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newStage = await projectsRepository.createProjectStage(validationResult.data);
    res.status(201).json(newStage);
  } catch (error) {
    console.error("Error creating stage for item:", error);
    res.status(500).json({ error: "Failed to create stage for item" });
  }
});

// GET /api/projects/:projectId/items/:itemId/stages - Get stages for specific item
router.get("/api/projects/:projectId/items/:itemId/stages", async (req, res) => {
  try {
    const { itemId } = req.params;
    const stages = await projectsRepository.getItemStages(itemId);
    res.json(stages);
  } catch (error) {
    console.error("Error fetching item stages:", error);
    res.status(500).json({ error: "Failed to fetch item stages" });
  }
});

// PATCH /api/projects/:projectId/items/:itemId/stages/reorder - Reorder stages atomically
router.patch("/api/projects/:projectId/items/:itemId/stages/reorder", async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const requestSchema = z.object({
      stageIds: z.array(z.string()).min(1, "stageIds array must not be empty")
    });
    
    const validationResult = requestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const { stageIds } = validationResult.data;
    
    // Validate that all stageIds belong to this item
    const itemStages = await projectsRepository.getItemStages(itemId);
    const itemStageIds = itemStages.map(s => s.id);
    
    // Check if count matches
    if (stageIds.length !== itemStages.length) {
      res.status(400).json({ 
        error: `Invalid stageIds count. Expected ${itemStages.length}, got ${stageIds.length}` 
      });
      return;
    }
    
    // Check if all stageIds belong to this item
    const invalidIds = stageIds.filter(id => !itemStageIds.includes(id));
    if (invalidIds.length > 0) {
      res.status(400).json({ 
        error: `Some stage IDs do not belong to this item: ${invalidIds.join(', ')}` 
      });
      return;
    }
    
    // Perform atomic reorder
    await projectsRepository.reorderItemStages(itemId, stageIds);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error reordering item stages:", error);
    res.status(500).json({ error: "Failed to reorder item stages" });
  }
});

// ===== Stage Dependencies Routes =====

// GET /api/projects/:projectId/dependencies - Get all dependencies for a project
router.get("/api/projects/:projectId/dependencies", async (req, res) => {
  try {
    const { projectId } = req.params;
    const dependencies = await projectsRepository.getProjectDependencies(projectId);
    res.json(dependencies);
  } catch (error) {
    console.error("Error fetching project dependencies:", error);
    res.status(500).json({ error: "Failed to fetch project dependencies" });
  }
});

// POST /api/stages/:stageId/dependencies - Create dependency
router.post("/api/stages/:stageId/dependencies", async (req, res) => {
  try {
    const { stageId } = req.params;
    
    const validationResult = insertStageDependencySchema.safeParse({
      stage_id: stageId,
      depends_on_stage_id: req.body.depends_on_stage_id
    });
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newDependency = await projectsRepository.createStageDependency(validationResult.data);
    res.status(201).json(newDependency);
  } catch (error) {
    console.error("Error creating stage dependency:", error);
    res.status(500).json({ error: "Failed to create stage dependency" });
  }
});

// DELETE /api/stages/dependencies/:dependencyId - Delete dependency
router.delete("/api/stages/dependencies/:dependencyId", async (req, res) => {
  try {
    const { dependencyId } = req.params;
    const deleted = await projectsRepository.deleteStageDependency(dependencyId);
    
    if (!deleted) {
      res.status(404).json({ error: "Stage dependency not found" });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting stage dependency:", error);
    res.status(500).json({ error: "Failed to delete stage dependency" });
  }
});

// ===== Process Templates Routes =====

// GET /api/process-templates - Get all templates
router.get("/api/process-templates", async (req, res) => {
  try {
    const templates = await projectsRepository.getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching process templates:", error);
    res.status(500).json({ error: "Failed to fetch process templates" });
  }
});

// POST /api/process-templates - Create template
router.post("/api/process-templates", async (req, res) => {
  try {
    const validationResult = insertProcessTemplateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newTemplate = await projectsRepository.createTemplate(validationResult.data);
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error("Error creating process template:", error);
    res.status(500).json({ error: "Failed to create process template" });
  }
});

// GET /api/process-templates/:templateId - Get template with stages and dependencies
router.get("/api/process-templates/:templateId", async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const template = await projectsRepository.getTemplateById(templateId);
    if (!template) {
      res.status(404).json({ error: "Process template not found" });
      return;
    }
    
    const stages = await projectsRepository.getTemplateStages(templateId);
    const dependencies = await projectsRepository.getTemplateDependencies(templateId);
    
    res.json({ ...template, stages, dependencies });
  } catch (error) {
    console.error("Error fetching process template:", error);
    res.status(500).json({ error: "Failed to fetch process template" });
  }
});

// PUT /api/process-templates/:templateId - Update template
router.put("/api/process-templates/:templateId", async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const validationResult = insertProcessTemplateSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const updatedTemplate = await projectsRepository.updateTemplate(templateId, validationResult.data);
    
    if (!updatedTemplate) {
      res.status(404).json({ error: "Process template not found" });
      return;
    }
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating process template:", error);
    res.status(500).json({ error: "Failed to update process template" });
  }
});

// DELETE /api/process-templates/:templateId - Delete template
router.delete("/api/process-templates/:templateId", async (req, res) => {
  try {
    const { templateId } = req.params;
    const deleted = await projectsRepository.deleteTemplate(templateId);
    
    if (!deleted) {
      res.status(404).json({ error: "Process template not found" });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting process template:", error);
    res.status(500).json({ error: "Failed to delete process template" });
  }
});

// POST /api/process-templates/:templateId/apply - Apply template to item
router.post("/api/process-templates/:templateId/apply", async (req, res) => {
  try {
    const { templateId } = req.params;
    const { item_id } = req.body;
    
    if (!item_id) {
      res.status(400).json({ error: "item_id is required" });
      return;
    }
    
    const result = await projectsRepository.applyTemplateToItem(templateId, item_id);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error applying template:", error);
    res.status(500).json({ error: "Failed to apply template" });
  }
});

// ===== Template Stages Routes =====

// GET /api/process-templates/:templateId/stages - Get template stages
router.get("/api/process-templates/:templateId/stages", async (req, res) => {
  try {
    const { templateId } = req.params;
    const stages = await projectsRepository.getTemplateStages(templateId);
    res.json(stages);
  } catch (error) {
    console.error("Error fetching template stages:", error);
    res.status(500).json({ error: "Failed to fetch template stages" });
  }
});

// POST /api/process-templates/:templateId/stages - Create template stage
router.post("/api/process-templates/:templateId/stages", async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const validationResult = insertTemplateStageSchema.safeParse({
      ...req.body,
      template_id: templateId
    });
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newStage = await projectsRepository.createTemplateStage(validationResult.data);
    res.status(201).json(newStage);
  } catch (error) {
    console.error("Error creating template stage:", error);
    res.status(500).json({ error: "Failed to create template stage" });
  }
});

// PUT /api/template-stages/:stageId - Update template stage
router.put("/api/template-stages/:stageId", async (req, res) => {
  try {
    const { stageId } = req.params;
    
    const validationResult = insertTemplateStageSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const updatedStage = await projectsRepository.updateTemplateStage(stageId, validationResult.data);
    
    if (!updatedStage) {
      res.status(404).json({ error: "Template stage not found" });
      return;
    }
    
    res.json(updatedStage);
  } catch (error) {
    console.error("Error updating template stage:", error);
    res.status(500).json({ error: "Failed to update template stage" });
  }
});

// DELETE /api/template-stages/:stageId - Delete template stage
router.delete("/api/template-stages/:stageId", async (req, res) => {
  try {
    const { stageId } = req.params;
    const deleted = await projectsRepository.deleteTemplateStage(stageId);
    
    if (!deleted) {
      res.status(404).json({ error: "Template stage not found" });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting template stage:", error);
    res.status(500).json({ error: "Failed to delete template stage" });
  }
});

// ===== Template Dependencies Routes =====

// POST /api/template-stages/:stageId/dependencies - Create template dependency
router.post("/api/template-stages/:stageId/dependencies", async (req, res) => {
  try {
    const { stageId } = req.params;
    
    const validationResult = insertTemplateDependencySchema.safeParse({
      template_stage_id: stageId,
      depends_on_template_stage_id: req.body.depends_on_template_stage_id
    });
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newDependency = await projectsRepository.createTemplateDependency(validationResult.data);
    res.status(201).json(newDependency);
  } catch (error) {
    console.error("Error creating template dependency:", error);
    res.status(500).json({ error: "Failed to create template dependency" });
  }
});

// DELETE /api/template-dependencies/:dependencyId - Delete template dependency
router.delete("/api/template-dependencies/:dependencyId", async (req, res) => {
  try {
    const { dependencyId } = req.params;
    const deleted = await projectsRepository.deleteTemplateDependency(dependencyId);
    
    if (!deleted) {
      res.status(404).json({ error: "Template dependency not found" });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting template dependency:", error);
    res.status(500).json({ error: "Failed to delete template dependency" });
  }
});

// ===== Stage Messages Routes =====

// GET /api/stages/:stageId/messages - Get stage messages
router.get("/api/stages/:stageId/messages", async (req, res) => {
  try {
    const { stageId } = req.params;
    const messages = await projectsRepository.getStageMessages(stageId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching stage messages:", error);
    res.status(500).json({ error: "Failed to fetch stage messages" });
  }
});

// POST /api/stages/:stageId/messages - Create stage message
router.post("/api/stages/:stageId/messages", async (req, res) => {
  try {
    const { stageId } = req.params;
    
    const validationResult = insertStageMessageSchema.safeParse({
      stage_id: stageId,
      user_id: req.body.user_id,
      message: req.body.message
    });
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newMessage = await projectsRepository.createStageMessage(validationResult.data);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating stage message:", error);
    res.status(500).json({ error: "Failed to create stage message" });
  }
});
