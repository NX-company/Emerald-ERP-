import { Router } from "express";
import { attachmentsRepository } from "./repository";
import { salesRepository } from "../sales/repository";
import { insertDealAttachmentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ObjectStorageService, ObjectNotFoundError } from "../../objectStorage";
import { ObjectPermission } from "../../objectAcl";

export const router = Router();

// POST /api/objects/upload - получение presigned URL для загрузки
router.post("/api/objects/upload", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const objectStorageService = new ObjectStorageService();
    const result = await objectStorageService.getObjectEntityUploadURL();
    
    // Return both uploadURL for client upload and objectPath for metadata storage
    res.json({ 
      uploadURL: result.uploadURL,
      objectPath: result.objectPath 
    });
  } catch (error) {
    console.error("Error getting upload URL:", error);
    res.status(500).json({ error: "Failed to get upload URL" });
  }
});

// GET /objects/:objectPath(*) - скачивание файла с ACL проверкой
router.get("/objects/:objectPath(*)", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const objectStorageService = new ObjectStorageService();
    
    const objectFile = await objectStorageService.getObjectEntityFile(req.path);
    
    const canAccess = await objectStorageService.canAccessObjectEntity({
      objectFile,
      userId: userId,
      requestedPermission: ObjectPermission.READ,
    });
    
    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    objectStorageService.downloadObject(objectFile, res);
  } catch (error) {
    console.error("Error downloading object:", error);
    if (error instanceof ObjectNotFoundError) {
      return res.status(404).json({ error: "File not found" });
    }
    return res.status(500).json({ error: "Failed to download file" });
  }
});

// POST /api/deals/:dealId/attachments - сохранение метаданных после загрузки
router.post("/api/deals/:dealId/attachments", async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.headers["x-user-id"] as string;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Проверяем, существует ли сделка
    const deal = await salesRepository.getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Валидация данных
    const validationResult = insertDealAttachmentSchema.safeParse({
      ...req.body,
      deal_id: dealId,
      uploaded_by: userId,
    });

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      return res.status(400).json({ error: errorMessage });
    }

    // Устанавливаем ACL политику для файла
    const objectStorageService = new ObjectStorageService();
    
    if (!req.body.file_path) {
      return res.status(400).json({ error: "file_path is required" });
    }

    const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
      req.body.file_path,
      {
        owner: userId,
        visibility: "private",
      }
    );

    // Сохраняем метаданные в БД
    const attachmentData = {
      ...validationResult.data,
      file_path: objectPath,
    };

    const newAttachment = await attachmentsRepository.createDealAttachment(attachmentData);
    
    res.status(201).json(newAttachment);
  } catch (error) {
    console.error("Error creating deal attachment:", error);
    res.status(500).json({ error: "Failed to create attachment" });
  }
});

// GET /api/deals/:dealId/attachments - получение списка файлов
router.get("/api/deals/:dealId/attachments", async (req, res) => {
  try {
    const { dealId } = req.params;
    
    // Проверяем, существует ли сделка
    const deal = await salesRepository.getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    const attachments = await attachmentsRepository.getDealAttachments(dealId);
    res.json(attachments);
  } catch (error) {
    console.error("Error fetching deal attachments:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
});

// DELETE /api/deals/:dealId/attachments/:id - удаление файла
router.delete("/api/deals/:dealId/attachments/:id", async (req, res) => {
  try {
    const { dealId, id } = req.params;
    const userId = req.headers["x-user-id"] as string;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Получаем вложение
    const attachment = await attachmentsRepository.getDealAttachmentById(id);
    
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    if (attachment.deal_id !== dealId) {
      return res.status(404).json({ error: "Attachment not found for this deal" });
    }

    // Проверяем, что пользователь является владельцем файла
    if (attachment.uploaded_by !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Удаляем запись из БД
    const deleted = await attachmentsRepository.deleteDealAttachment(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Примечание: физическое удаление файла из object storage можно добавить здесь при необходимости
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting deal attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
});
