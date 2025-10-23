import { Router } from "express";
import { salesRepository } from "./repository";
import { insertDealSchema, insertDealStageSchema, insertDealMessageSchema, insertDealDocumentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { checkPermission } from "../../middleware/permissions";
import { permissionsService } from "../permissions/service";
import { activityLogsRepository } from "../tasks/repository";
import { generateSimplePDF } from "./pdfGenerator";

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
      
      console.log("✓ Default deal stages created successfully");
    }
  } catch (error) {
    console.warn("⚠️  Could not initialize default deal stages:", error.message);
  }
}

// Initialize stages asynchronously, don't block module loading
initializeDefaultDealStages().catch(err => 
  console.warn("⚠️  Failed to initialize deal stages:", err.message)
);

// ========== Deals Endpoints ==========

// GET /api/deals - Get all deals or filter by stage
router.get("/api/deals", async (req, res) => {
  try {
    const { stage } = req.query;
    const userId = req.headers["x-user-id"] as string;

    let deals;
    if (stage && typeof stage === "string") {
      deals = await salesRepository.getDealsByStage(stage);
    } else {
      deals = await salesRepository.getAllDeals();
    }

    // Filter deals based on user permissions
    if (userId) {
      const canViewAll = await permissionsService.canViewAll(userId, "deals");

      // If user cannot view all deals, filter to show only their deals
      if (!canViewAll) {
        deals = deals.filter(deal => deal.created_by === userId);
      }
    }

    res.json(deals);
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
router.post("/api/deals", checkPermission("can_create_deals"), async (req, res) => {
  try {
    console.log("Received deal data:", JSON.stringify(req.body, null, 2));
    const userId = req.headers["x-user-id"] as string;

    const validationResult = insertDealSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      console.error("Validation error:", errorMessage);
      res.status(400).json({ error: errorMessage });
      return;
    }

    console.log("Validated deal data:", JSON.stringify(validationResult.data, null, 2));
    const newDeal = await salesRepository.createDeal(validationResult.data);

    // Log activity
    await activityLogsRepository.logActivity({
      entity_type: "deal",
      entity_id: newDeal.id,
      action_type: "created",
      user_id: userId,
      description: `Создана сделка "${newDeal.client_name}"`,
    });

    res.status(201).json(newDeal);
  } catch (error) {
    console.error("Error creating deal:", error);
    res.status(500).json({ error: "Failed to create deal" });
  }
});

// PUT /api/deals/:id - Update deal
router.put("/api/deals/:id", checkPermission("can_edit_deals"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string;

    // Get old deal data for comparison
    const oldDeal = await salesRepository.getDealById(id);

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

    // Log changes to activity log
    const changedFields = Object.keys(validationResult.data);
    for (const field of changedFields) {
      const oldValue = oldDeal[field];
      const newValue = validationResult.data[field];

      if (oldValue !== newValue) {
        let description = `Изменено поле "${field}"`;

        // Custom descriptions for specific fields
        if (field === "stage") {
          // Get stage names from database
          const stages = await salesRepository.getAllDealStages();
          const stageMap = stages.reduce((acc, stage) => {
            acc[stage.key] = stage.name;
            return acc;
          }, {} as Record<string, string>);

          const oldStageName = stageMap[oldValue] || oldValue;
          const newStageName = stageMap[newValue] || newValue;
          description = `Изменен этап сделки с "${oldStageName}" на "${newStageName}"`;
        } else if (field === "amount") {
          description = `Изменена сумма сделки с ${oldValue} ₽ на ${newValue} ₽`;
        } else if (field === "client_name") {
          description = `Изменено имя клиента с "${oldValue}" на "${newValue}"`;
        } else if (field === "currency") {
          description = `Изменена валюта с "${oldValue}" на "${newValue}"`;
        } else if (field === "assigned_to") {
          description = `Изменен ответственный менеджер`;
        } else if (field === "expected_close_date") {
          description = `Изменена ожидаемая дата закрытия`;
        } else if (field === "source") {
          description = `Изменен источник сделки с "${oldValue}" на "${newValue}"`;
        } else if (field === "contact_phone") {
          description = `Изменен телефон контакта`;
        } else if (field === "contact_email") {
          description = `Изменен email контакта`;
        } else if (field === "description") {
          description = `Изменено описание сделки`;
        }

        await activityLogsRepository.logActivity({
          entity_type: "deal",
          entity_id: id,
          action_type: "updated",
          user_id: userId,
          field_changed: field,
          old_value: String(oldValue || ""),
          new_value: String(newValue || ""),
          description,
        });
      }
    }

    res.json(updatedDeal);
  } catch (error) {
    console.error("Error updating deal:", error);
    res.status(500).json({ error: "Failed to update deal" });
  }
});

// DELETE /api/deals/:id - Delete deal
router.delete("/api/deals/:id", checkPermission("can_delete_deals"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string;

    // Get deal info before deleting for logging
    const deal = await salesRepository.getDealById(id);

    const deleted = await salesRepository.deleteDeal(id);

    if (!deleted) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    // Log activity (this will remain in the database even after deal is deleted)
    if (deal) {
      await activityLogsRepository.logActivity({
        entity_type: "deal",
        entity_id: id,
        action_type: "deleted",
        user_id: userId,
        description: `Удалена сделка "${deal.client_name}"`,
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting deal:", error);
    res.status(500).json({ error: "Failed to delete deal" });
  }
});

// POST /api/deals/bulk-delete - Bulk delete deals
router.post("/api/deals/bulk-delete", checkPermission("can_delete_deals"), async (req, res) => {
  try {
    const { dealIds } = req.body;
    
    if (!Array.isArray(dealIds) || dealIds.length === 0) {
      res.status(400).json({ error: "dealIds must be a non-empty array" });
      return;
    }
    
    const deletedCount = await salesRepository.bulkDeleteDeals(dealIds);
    res.json({ deletedCount, message: `Удалено ${deletedCount} сделок` });
  } catch (error) {
    console.error("Error bulk deleting deals:", error);
    res.status(500).json({ error: "Failed to bulk delete deals" });
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
    const userId = req.headers["x-user-id"] as string;

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

    // Log activity
    const messageTypeNames: Record<string, string> = {
      'note': 'Заметка',
      'call': 'Звонок',
      'email': 'Email',
      'task': 'Задача'
    };
    const messageTypeName = messageTypeNames[newMessage.message_type] || 'Сообщение';

    await activityLogsRepository.logActivity({
      entity_type: "deal",
      entity_id: id,
      action_type: "created",
      user_id: userId,
      description: `Добавлено: ${messageTypeName}`,
    });

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
    const { dealId, docId } = req.params;
    console.log(`📄 [Documents] GET /api/deals/${dealId}/documents/${docId}`);

    const document = await salesRepository.getDealDocumentById(docId);

    if (!document) {
      console.log(`❌ [Documents] Document ${docId} not found`);
      res.status(404).json({ error: "Document not found" });
      return;
    }

    console.log(`✅ [Documents] Found document:`, {
      id: document.id,
      name: document.name,
      document_type: document.document_type,
      file_url: document.file_url,
      is_signed: document.is_signed
    });

    res.json(document);
  } catch (error) {
    console.error("[Documents] Error fetching document:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// GET /api/deals/:dealId/documents/:docId/pdf - сгенерировать PDF для документа
router.get("/api/deals/:dealId/documents/:docId/pdf", async (req, res) => {
  try {
    const { docId } = req.params;
    const document = await salesRepository.getDealDocumentById(docId);

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Only generate PDF for quotes and invoices
    if (document.document_type !== 'quote' && document.document_type !== 'invoice') {
      res.status(400).json({ error: "PDF generation only available for quotes and invoices" });
      return;
    }

    const html = generateSimplePDF(document);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// POST /api/deals/:id/documents - создать новый документ (КП, счет, договор)
router.post("/api/deals/:id/documents", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string;

    console.log(`📄 [Documents] Creating document for deal ${id}, type: ${req.body.document_type}`);
    console.log(`📄 [Documents] Request body:`, JSON.stringify(req.body, null, 2));

    const validationResult = insertDealDocumentSchema.safeParse({
      ...req.body,
      deal_id: id
    });

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      console.error("[Documents] Validation error for deal document:", errorMessage);
      console.error("[Documents] Request body:", JSON.stringify(req.body, null, 2));
      res.status(400).json({ error: errorMessage });
      return;
    }

    console.log(`📄 [Documents] Validated data:`, JSON.stringify(validationResult.data, null, 2));

    const newDocument = await salesRepository.createDealDocument(validationResult.data);
    console.log(`✅ [Documents] Created document ${newDocument.id}, type: ${newDocument.document_type}, file_url: ${newDocument.file_url}`);

    // Log activity
    const docTypeNames: Record<string, string> = {
      'quote': 'Коммерческое предложение',
      'invoice': 'Счет',
      'contract': 'Договор',
      'other': 'Документ'
    };
    const docTypeName = docTypeNames[newDocument.document_type] || 'Документ';

    await activityLogsRepository.logActivity({
      entity_type: "deal",
      entity_id: id,
      action_type: "created",
      user_id: userId,
      description: `Добавлен документ: ${docTypeName} "${newDocument.title}"`,
    });

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
    const { dealId, docId } = req.params;
    const userId = req.headers["x-user-id"] as string;

    // Get document info before deleting
    const document = await salesRepository.getDealDocument(docId);

    if (document) {
      await salesRepository.deleteDealDocument(docId);

      // Log activity
      const docTypeNames: Record<string, string> = {
        'quote': 'Коммерческое предложение',
        'invoice': 'Счет',
        'contract': 'Договор',
        'other': 'Документ'
      };
      const docTypeName = docTypeNames[document.document_type] || 'Документ';

      await activityLogsRepository.logActivity({
        entity_type: "deal",
        entity_id: dealId,
        action_type: "deleted",
        user_id: userId,
        description: `Удален документ: ${docTypeName} "${document.title}"`,
      });
    } else {
      await salesRepository.deleteDealDocument(docId);
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// ========== Document Attachments Endpoints ==========

// GET /api/deals/:dealId/documents/:docId/attachments - получить все вложения документа
router.get("/api/deals/:dealId/documents/:docId/attachments", async (req, res) => {
  try {
    const { docId } = req.params;
    const attachments = await salesRepository.getDocumentAttachments(docId);
    res.json(attachments);
  } catch (error) {
    console.error("Error fetching document attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
});

// POST /api/deals/:dealId/documents/:docId/attachments - загрузить вложение к документу
router.post("/api/deals/:dealId/documents/:docId/attachments", async (req, res) => {
  try {
    const { dealId, docId } = req.params;
    const userId = req.headers["x-user-id"] as string;
    const { file_name, file_path, file_size, mime_type } = req.body;

    const attachment = await salesRepository.createDocumentAttachment({
      deal_id: dealId,
      document_id: docId,
      file_name,
      file_path,
      file_size,
      mime_type,
      uploaded_by: userId,
    });

    // Log activity
    await activityLogsRepository.logActivity({
      entity_type: "deal",
      entity_id: dealId,
      action_type: "created",
      user_id: userId,
      description: `Добавлено вложение к документу: ${file_name}`,
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error("Error creating document attachment:", error);
    res.status(500).json({ error: "Failed to create attachment" });
  }
});

// DELETE /api/deals/:dealId/documents/:docId/attachments/:attachmentId - удалить вложение
router.delete("/api/deals/:dealId/documents/:docId/attachments/:attachmentId", async (req, res) => {
  try {
    const { dealId, attachmentId } = req.params;
    const userId = req.headers["x-user-id"] as string;

    // Get attachment info before deleting
    const attachment = await salesRepository.getAttachmentById(attachmentId);

    if (attachment) {
      await salesRepository.deleteAttachment(attachmentId);

      // Log activity
      await activityLogsRepository.logActivity({
        entity_type: "deal",
        entity_id: dealId,
        action_type: "deleted",
        user_id: userId,
        description: `Удалено вложение документа: ${attachment.file_name}`,
      });
    } else {
      await salesRepository.deleteAttachment(attachmentId);
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
});
