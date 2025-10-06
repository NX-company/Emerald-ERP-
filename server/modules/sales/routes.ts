import { Router } from "express";
import { salesRepository } from "./repository";
import { insertDealSchema, insertDealStageSchema, insertDealMessageSchema, insertDealDocumentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export const router = Router();

async function initializeDefaultDealStages() {
  try {
    const existingStages = await salesRepository.getAllDealStages();
    
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
        defaultStages.map(stage => salesRepository.createDealStage(stage))
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
      const deals = await salesRepository.getDealsByStage(stage);
      res.json(deals);
    } else {
      const deals = await salesRepository.getAllDeals();
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
    const deal = await salesRepository.getDealById(id);
    
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
    
    const newDeal = await salesRepository.createDeal(validationResult.data);
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
    
    const updatedDeal = await salesRepository.updateDeal(id, validationResult.data);
    
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
    const deleted = await salesRepository.deleteDeal(id);
    
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
    const stages = await salesRepository.getAllDealStages();
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
    const count = await salesRepository.countDealsByStage(stageKey);
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
    
    const newStage = await salesRepository.createDealStage(validationResult.data);
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
    
    const updatedStage = await salesRepository.updateDealStage(id, validationResult.data);
    
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
    
    const stage = await salesRepository.getDealStageById(id);
    if (!stage) {
      res.status(404).json({ error: "Deal stage not found" });
      return;
    }
    
    const dealsCount = await salesRepository.countDealsByStage(stage.key);
    
    if (dealsCount > 0) {
      if (!targetStageKey || typeof targetStageKey !== "string") {
        res.status(400).json({ 
          error: "Stage has deals. Provide targetStageKey to move them.",
          dealsCount 
        });
        return;
      }
      
      await salesRepository.updateDealsStage(stage.key, targetStageKey);
    }
    
    const deleted = await salesRepository.deleteDealStage(id);
    
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
    
    await salesRepository.reorderDealStages(stages);
    res.status(204).send();
  } catch (error) {
    console.error("Error reordering deal stages:", error);
    res.status(500).json({ error: "Failed to reorder deal stages" });
  }
});

// ========== Deal Messages Endpoints ==========

// GET /api/deals/:id/messages - получить все сообщения по сделке
router.get("/api/deals/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await salesRepository.getDealMessages(id);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching deal messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/deals/:id/messages - создать новое сообщение
router.post("/api/deals/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    
    const validationResult = insertDealMessageSchema.safeParse({
      ...req.body,
      deal_id: id
    });
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newMessage = await salesRepository.createDealMessage(validationResult.data);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating deal message:", error);
    res.status(500).json({ error: "Failed to create message" });
  }
});

// ========== Deal Documents Endpoints ==========

// GET /api/deals/:id/documents - получить все документы по сделке
router.get("/api/deals/:id/documents", async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await salesRepository.getDealDocuments(id);
    res.json(documents);
  } catch (error) {
    console.error("Error fetching deal documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// GET /api/deals/:dealId/documents/:docId - получить документ по ID
router.get("/api/deals/:dealId/documents/:docId", async (req, res) => {
  try {
    const { docId } = req.params;
    const document = await salesRepository.getDealDocumentById(docId);
    
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

// POST /api/deals/:id/documents - создать новый документ (КП, счет, договор)
router.post("/api/deals/:id/documents", async (req, res) => {
  try {
    const { id } = req.params;
    
    const validationResult = insertDealDocumentSchema.safeParse({
      ...req.body,
      deal_id: id
    });
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const newDocument = await salesRepository.createDealDocument(validationResult.data);
    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Error creating deal document:", error);
    res.status(500).json({ error: "Failed to create document" });
  }
});

// PUT /api/deals/:dealId/documents/:docId - обновить документ
router.put("/api/deals/:dealId/documents/:docId", async (req, res) => {
  try {
    const { docId } = req.params;
    
    const validationResult = insertDealDocumentSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    const updated = await salesRepository.updateDealDocument(docId, validationResult.data);
    
    if (!updated) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// DELETE /api/deals/:dealId/documents/:docId - удалить документ
router.delete("/api/deals/:dealId/documents/:docId", async (req, res) => {
  try {
    const { docId } = req.params;
    await salesRepository.deleteDealDocument(docId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});
