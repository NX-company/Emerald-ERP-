import { Router } from "express";
import { storage } from "../../storage";
import { insertDealSchema, insertDealStageSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export const router = Router();

async function initializeDefaultDealStages() {
  try {
    const existingStages = await storage.getAllDealStages();
    
    if (existingStages.length === 0) {
      const defaultStages = [
        { key: "new", name: "Новые", color: "#6366f1", order: 1 },
        { key: "meeting", name: "Встреча назначена", color: "#8b5cf6", order: 2 },
        { key: "proposal", name: "КП отправлено", color: "#0ea5e9", order: 3 },
        { key: "contract", name: "Договор", color: "#f59e0b", order: 4 },
        { key: "won", name: "Выиграна", color: "#10b981", order: 5 },
        { key: "lost", name: "Проиграна", color: "#ef4444", order: 6 },
      ];
      
      await Promise.all(
        defaultStages.map(stage => storage.createDealStage(stage))
      );
      
      console.log("Default deal stages created successfully");
    }
  } catch (error) {
    console.error("Error initializing default deal stages:", error);
  }
}

initializeDefaultDealStages();

// ========== Deals Endpoints ==========

// GET /api/deals - Get all deals or filter by stage
router.get("/api/deals", async (req, res) => {
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
router.get("/api/deals/:id", async (req, res) => {
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
router.post("/api/deals", async (req, res) => {
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
router.put("/api/deals/:id", async (req, res) => {
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
router.delete("/api/deals/:id", async (req, res) => {
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

// ========== Deal Stages Endpoints ==========

// GET /api/deal-stages - Get all deal stages
router.get("/api/deal-stages", async (req, res) => {
  try {
    const stages = await storage.getAllDealStages();
    res.json(stages);
  } catch (error) {
    console.error("Error fetching deal stages:", error);
    res.status(500).json({ error: "Failed to fetch deal stages" });
  }
});

// GET /api/deal-stages/:stageKey/count - Count deals by stage key
router.get("/api/deal-stages/:stageKey/count", async (req, res) => {
  try {
    const { stageKey } = req.params;
    const count = await storage.countDealsByStage(stageKey);
    res.json({ count });
  } catch (error) {
    console.error("Error counting deals:", error);
    res.status(500).json({ error: "Failed to count deals" });
  }
});

// POST /api/deal-stages - Create new deal stage
router.post("/api/deal-stages", async (req, res) => {
  try {
    const validationResult = insertDealStageSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newStage = await storage.createDealStage(validationResult.data);
    res.status(201).json(newStage);
  } catch (error) {
    console.error("Error creating deal stage:", error);
    res.status(500).json({ error: "Failed to create deal stage" });
  }
});

// PUT /api/deal-stages/:id - Update deal stage
router.put("/api/deal-stages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const validationResult = insertDealStageSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const updatedStage = await storage.updateDealStage(id, validationResult.data);
    
    if (!updatedStage) {
      res.status(404).json({ error: "Deal stage not found" });
      return;
    }
    
    res.json(updatedStage);
  } catch (error) {
    console.error("Error updating deal stage:", error);
    res.status(500).json({ error: "Failed to update deal stage" });
  }
});

// DELETE /api/deal-stages/:id - Delete deal stage
router.delete("/api/deal-stages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { targetStageKey } = req.query;
    
    const stage = await storage.getDealStageById(id);
    if (!stage) {
      res.status(404).json({ error: "Deal stage not found" });
      return;
    }
    
    const dealsCount = await storage.countDealsByStage(stage.key);
    
    if (dealsCount > 0) {
      if (!targetStageKey || typeof targetStageKey !== "string") {
        res.status(400).json({ 
          error: "Stage has deals. Provide targetStageKey to move them.",
          dealsCount 
        });
        return;
      }
      
      await storage.updateDealsStage(stage.key, targetStageKey);
    }
    
    const deleted = await storage.deleteDealStage(id);
    
    if (!deleted) {
      res.status(404).json({ error: "Deal stage not found" });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting deal stage:", error);
    res.status(500).json({ error: "Failed to delete deal stage" });
  }
});

// PUT /api/deal-stages/reorder - Reorder deal stages
router.put("/api/deal-stages/reorder", async (req, res) => {
  try {
    const { stages } = req.body;
    
    if (!Array.isArray(stages)) {
      res.status(400).json({ error: "stages must be an array" });
      return;
    }
    
    await storage.reorderDealStages(stages);
    res.status(204).send();
  } catch (error) {
    console.error("Error reordering deal stages:", error);
    res.status(500).json({ error: "Failed to reorder deal stages" });
  }
});
