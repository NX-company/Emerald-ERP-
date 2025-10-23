import { Router } from "express";
import multer from "multer";
import { attachmentsRepository } from "./repository";
import { salesRepository } from "../sales/repository";
import { insertDealAttachmentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ObjectStorageService, ObjectNotFoundError } from "../../objectStorage";
import { ObjectPermission } from "../../objectAcl";
import { localFileStorage } from "../../localFileStorage";
import { activityLogsRepository } from "../tasks/repository";

export const router = Router();

// Configure multer for memory storage with 500MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 524288000, // 500MB limit
  },
});

// POST /api/objects/upload - direct file upload to local storage
router.post("/api/objects/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      // Multer error handling
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: `File too large. Maximum size is 50MB. Please reduce file size and try again.`
        });
      }
      console.error("Multer error:", err);
      return res.status(400).json({ error: err.message || "Failed to upload file" });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('[Upload] POST /api/objects/upload - Starting upload');
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      console.log('[Upload] No user ID in headers');
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log('[Upload] User ID:', userId);

    if (!req.file) {
      console.log('[Upload] No file in request');
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('[Upload] Received file:', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Save file to local storage
    const objectPath = await localFileStorage.saveFile(req.file.buffer, req.file.originalname);

    console.log(`✅ [Upload] File saved successfully: ${req.file.originalname} -> ${objectPath}`);

    // Return objectPath for metadata storage
    const response = {
      objectPath,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    console.log('[Upload] Returning response:', response);

    res.json(response);
  } catch (error) {
    console.error("[Upload] Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// GET /objects/:objectPath(*) - скачивание файла из локального хранилища
router.get("/objects/:objectPath(*)", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Download file from local storage
    await localFileStorage.downloadFile(req.path, res);
  } catch (error) {
    console.error("Error downloading object:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to download file" });
    }
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

    if (!req.body.file_path) {
      return res.status(400).json({ error: "file_path is required" });
    }

    // Verify file exists in local storage
    const { exists } = await localFileStorage.getFile(req.body.file_path);
    if (!exists) {
      return res.status(404).json({ error: "Uploaded file not found" });
    }

    // Сохраняем метаданные в БД
    const newAttachment = await attachmentsRepository.createDealAttachment(validationResult.data);

    // Log activity
    await activityLogsRepository.logActivity({
      entity_type: "deal",
      entity_id: dealId,
      action_type: "created",
      user_id: userId,
      description: `Добавлено вложение: ${newAttachment.file_name}`,
    });

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

    // Log activity
    await activityLogsRepository.logActivity({
      entity_type: "deal",
      entity_id: dealId,
      action_type: "deleted",
      user_id: userId,
      description: `Удалено вложение: ${attachment.file_name}`,
    });

    // Удаляем физический файл из локального хранилища
    try {
      await localFileStorage.deleteFile(attachment.file_path);
    } catch (error) {
      console.warn("Failed to delete physical file:", error);
      // Continue even if file deletion fails
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting deal attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
});
