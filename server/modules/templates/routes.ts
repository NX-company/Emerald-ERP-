import { Router } from "express";
import { templatesRepository } from "./repository";
import { 
  insertProcessTemplateSchema, 
  insertTemplateStageSchema,
  insertTemplateDependencySchema 
} from "@shared/schema";

export const router = Router();

// Get all templates
router.get("/api/templates", async (req, res) => {
  try {
    const templates = await templatesRepository.getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Get active templates only
router.get("/api/templates/active", async (req, res) => {
  try {
    const templates = await templatesRepository.getActiveTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching active templates:", error);
    res.status(500).json({ error: "Failed to fetch active templates" });
  }
});

// Get template by ID with details
router.get("/api/templates/:id", async (req, res) => {
  try {
    const template = await templatesRepository.getTemplateWithDetails(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// Create template
router.post("/api/templates", async (req, res) => {
  try {
    const validatedData = insertProcessTemplateSchema.parse(req.body);
    const template = await templatesRepository.createTemplate(validatedData);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(400).json({ error: "Failed to create template" });
  }
});

// Update template
router.put("/api/templates/:id", async (req, res) => {
  try {
    const validatedData = insertProcessTemplateSchema.partial().parse(req.body);
    const template = await templatesRepository.updateTemplate(req.params.id, validatedData);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(400).json({ error: "Failed to update template" });
  }
});

// Delete template
router.delete("/api/templates/:id", async (req, res) => {
  try {
    const deleted = await templatesRepository.deleteTemplate(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

// Template stages routes
router.get("/api/templates/:templateId/stages", async (req, res) => {
  try {
    const stages = await templatesRepository.getTemplateStages(req.params.templateId);
    res.json(stages);
  } catch (error) {
    console.error("Error fetching template stages:", error);
    res.status(500).json({ error: "Failed to fetch template stages" });
  }
});

router.post("/api/templates/:templateId/stages", async (req, res) => {
  try {
    const validatedData = insertTemplateStageSchema.parse({
      ...req.body,
      template_id: req.params.templateId
    });
    const stage = await templatesRepository.createTemplateStage(validatedData);
    res.status(201).json(stage);
  } catch (error) {
    console.error("Error creating template stage:", error);
    res.status(400).json({ error: "Failed to create template stage" });
  }
});

router.put("/api/templates/stages/:id", async (req, res) => {
  try {
    const validatedData = insertTemplateStageSchema.partial().parse(req.body);
    const stage = await templatesRepository.updateTemplateStage(req.params.id, validatedData);
    if (!stage) {
      return res.status(404).json({ error: "Template stage not found" });
    }
    res.json(stage);
  } catch (error) {
    console.error("Error updating template stage:", error);
    res.status(400).json({ error: "Failed to update template stage" });
  }
});

router.delete("/api/templates/stages/:id", async (req, res) => {
  try {
    await templatesRepository.deleteTemplateDependenciesByStageId(req.params.id);
    const deleted = await templatesRepository.deleteTemplateStage(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Template stage not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting template stage:", error);
    res.status(500).json({ error: "Failed to delete template stage" });
  }
});

// Template dependencies routes
router.get("/api/templates/:templateId/dependencies", async (req, res) => {
  try {
    const dependencies = await templatesRepository.getTemplateDependencies(req.params.templateId);
    res.json(dependencies);
  } catch (error) {
    console.error("Error fetching template dependencies:", error);
    res.status(500).json({ error: "Failed to fetch template dependencies" });
  }
});

router.post("/api/templates/:templateId/dependencies", async (req, res) => {
  try {
    const validatedData = insertTemplateDependencySchema.parse(req.body);
    const dependency = await templatesRepository.createTemplateDependency(validatedData);
    res.status(201).json(dependency);
  } catch (error) {
    console.error("Error creating template dependency:", error);
    res.status(400).json({ error: "Failed to create template dependency" });
  }
});

router.delete("/api/templates/dependencies/:id", async (req, res) => {
  try {
    const deleted = await templatesRepository.deleteTemplateDependency(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Template dependency not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting template dependency:", error);
    res.status(500).json({ error: "Failed to delete template dependency" });
  }
});
