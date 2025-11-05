import { Router } from "express";
import { warehouseRepository } from "./repository";
import { reservationsRepository } from "./reservations.repository";
import { shipmentsRepository } from "./shipments.repository";
import { notificationsRepository } from "./notifications.repository";
import { insertWarehouseItemSchema, insertWarehouseTransactionSchema, insertWarehouseReservationSchema, insertShipmentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export const router = Router();

// ========== Warehouse Items Endpoints ==========

// GET /api/warehouse/items - Get all warehouse items
router.get("/api/warehouse/items", async (req, res) => {
  try {
    const { category, status } = req.query;
    const items = await warehouseRepository.getAllWarehouseItems(
      category as string | undefined,
      status as string | undefined
    );
    res.json(items);
  } catch (error) {
    console.error("Error fetching warehouse items:", error);
    res.status(500).json({ error: "Failed to fetch warehouse items" });
  }
});

// GET /api/warehouse - Get all warehouse items (alias)
router.get("/api/warehouse", async (req, res) => {
  try {
    const { category, status } = req.query;
    const items = await warehouseRepository.getAllWarehouseItems(
      category as string | undefined,
      status as string | undefined
    );
    res.json(items);
  } catch (error) {
    console.error("Error fetching warehouse items:", error);
    res.status(500).json({ error: "Failed to fetch warehouse items" });
  }
});

// GET /api/warehouse/items/:id - Get warehouse item by ID
router.get("/api/warehouse/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await warehouseRepository.getWarehouseItemById(id);

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

// GET /api/warehouse/:id - Get warehouse item by ID (alias)
router.get("/api/warehouse/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await warehouseRepository.getWarehouseItemById(id);

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

// POST /api/warehouse/items - Create new warehouse item
router.post("/api/warehouse/items", async (req, res) => {
  try {
    const validationResult = insertWarehouseItemSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }

    const newItem = await warehouseRepository.createWarehouseItem(validationResult.data);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating warehouse item:", error);
    res.status(500).json({ error: "Failed to create warehouse item" });
  }
});

// POST /api/warehouse - Create new warehouse item (alias)
router.post("/api/warehouse", async (req, res) => {
  try {
    const validationResult = insertWarehouseItemSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }

    const newItem = await warehouseRepository.createWarehouseItem(validationResult.data);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating warehouse item:", error);
    res.status(500).json({ error: "Failed to create warehouse item" });
  }
});

// PUT /api/warehouse/items/:id - Update warehouse item
router.put("/api/warehouse/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validationResult = insertWarehouseItemSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }

    const updatedItem = await warehouseRepository.updateWarehouseItem(id, validationResult.data);

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

// PUT /api/warehouse/:id - Update warehouse item (alias)
router.put("/api/warehouse/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validationResult = insertWarehouseItemSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }

    const updatedItem = await warehouseRepository.updateWarehouseItem(id, validationResult.data);

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

// DELETE /api/warehouse/items/:id - Delete warehouse item
router.delete("/api/warehouse/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await warehouseRepository.deleteWarehouseItem(id);

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

// DELETE /api/warehouse/:id - Delete warehouse item (alias)
router.delete("/api/warehouse/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await warehouseRepository.deleteWarehouseItem(id);

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

// ========== Warehouse Transactions Endpoints ==========

// POST /api/warehouse/items/:id/transactions - Create warehouse transaction
router.post("/api/warehouse/items/:id/transactions", async (req, res) => {
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

    const newTransaction = await warehouseRepository.createTransaction(validationResult.data);
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating warehouse transaction:", error);
    res.status(500).json({ error: "Failed to create warehouse transaction" });
  }
});

// POST /api/warehouse/:id/transactions - Create warehouse transaction (alias)
router.post("/api/warehouse/:id/transactions", async (req, res) => {
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

    const newTransaction = await warehouseRepository.createTransaction(validationResult.data);
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating warehouse transaction:", error);
    res.status(500).json({ error: "Failed to create warehouse transaction" });
  }
});

// GET /api/warehouse/items/:id/transactions - Get warehouse transactions
router.get("/api/warehouse/items/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    const transactions = await warehouseRepository.getWarehouseTransactions(id);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching warehouse transactions:", error);
    res.status(500).json({ error: "Failed to fetch warehouse transactions" });
  }
});

// GET /api/warehouse/:id/transactions - Get warehouse transactions (alias)
router.get("/api/warehouse/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    const transactions = await warehouseRepository.getWarehouseTransactions(id);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching warehouse transactions:", error);
    res.status(500).json({ error: "Failed to fetch warehouse transactions" });
  }
});

// ========== Warehouse Reservations Endpoints ==========

// POST /api/warehouse/reservations - Create new reservation
router.post("/api/warehouse/reservations", async (req, res) => {
  try {
    const validationResult = insertWarehouseReservationSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }

    const newReservation = await reservationsRepository.createReservation(validationResult.data);
    res.status(201).json(newReservation);
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    res.status(400).json({ error: error.message || "Failed to create reservation" });
  }
});

// GET /api/warehouse/items/:id/reservations - Get reservations for item
router.get("/api/warehouse/items/:id/reservations", async (req, res) => {
  try {
    const { id } = req.params;
    const reservations = await reservationsRepository.getReservationsByItem(id);
    res.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

// GET /api/warehouse/projects/:projectId/reservations - Get reservations for project
router.get("/api/warehouse/projects/:projectId/reservations", async (req, res) => {
  try {
    const { projectId } = req.params;
    const reservations = await reservationsRepository.getReservationsByProject(projectId);
    res.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

// GET /api/warehouse/reservations/:id - Get reservation by ID
router.get("/api/warehouse/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await reservationsRepository.getReservationById(id);

    if (!reservation) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    res.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    res.status(500).json({ error: "Failed to fetch reservation" });
  }
});

// PATCH /api/warehouse/reservations/:id/confirm - Confirm reservation
router.patch("/api/warehouse/reservations/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedReservation = await reservationsRepository.confirmReservation(id);

    if (!updatedReservation) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    res.json(updatedReservation);
  } catch (error) {
    console.error("Error confirming reservation:", error);
    res.status(500).json({ error: "Failed to confirm reservation" });
  }
});

// PATCH /api/warehouse/reservations/:id/release - Release reservation
router.patch("/api/warehouse/reservations/:id/release", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedReservation = await reservationsRepository.releaseReservation(id);

    if (!updatedReservation) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    res.json(updatedReservation);
  } catch (error) {
    console.error("Error releasing reservation:", error);
    res.status(500).json({ error: "Failed to release reservation" });
  }
});

// PATCH /api/warehouse/reservations/:id/cancel - Cancel reservation
router.patch("/api/warehouse/reservations/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedReservation = await reservationsRepository.cancelReservation(id);

    if (!updatedReservation) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    res.json(updatedReservation);
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ error: "Failed to cancel reservation" });
  }
});

// DELETE /api/warehouse/reservations/:id - Delete reservation
router.delete("/api/warehouse/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await reservationsRepository.deleteReservation(id);

    if (!deleted) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting reservation:", error);
    res.status(500).json({ error: "Failed to delete reservation" });
  }
});

// GET /api/warehouse/items/:id/available - Get available quantity for item
router.get("/api/warehouse/items/:id/available", async (req, res) => {
  try {
    const { id } = req.params;
    const available = await reservationsRepository.getAvailableQuantity(id);
    res.json({ available });
  } catch (error) {
    console.error("Error fetching available quantity:", error);
    res.status(500).json({ error: "Failed to fetch available quantity" });
  }
});

// ========== НАКЛАДНЫЕ / ОТГРУЗКИ ==========

/**
 * Создать накладную
 */
router.post("/api/shipments", async (req, res) => {
  try {
    const validationResult = insertShipmentSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }

    const shipment = await shipmentsRepository.createShipment(validationResult.data);
    res.status(201).json(shipment);
  } catch (error: any) {
    console.error("Error creating shipment:", error);
    res.status(500).json({ error: error.message || "Failed to create shipment" });
  }
});

/**
 * Получить все накладные
 */
router.get("/api/shipments", async (req, res) => {
  try {
    const { status } = req.query;
    const shipments = await shipmentsRepository.getAllShipments(status as string);
    res.json(shipments);
  } catch (error: any) {
    console.error("Error fetching shipments:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Получить накладную по ID
 */
router.get("/api/shipments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await shipmentsRepository.getShipmentById(id);

    if (!shipment) {
      res.status(404).json({ error: "Накладная не найдена" });
      return;
    }

    res.json(shipment);
  } catch (error: any) {
    console.error("Error fetching shipment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Обновить накладную
 */
router.put("/api/shipments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validationResult = insertShipmentSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }

    const updated = await shipmentsRepository.updateShipment(id, validationResult.data);
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating shipment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Добавить позицию в накладную (сканирование QR)
 */
router.post("/api/shipments/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const { item_id, quantity } = req.body;

    if (!item_id || !quantity) {
      res.status(400).json({ error: "item_id и quantity обязательны" });
      return;
    }

    const item = await shipmentsRepository.addItemToShipment(id, item_id, parseFloat(quantity));
    res.status(201).json(item);
  } catch (error: any) {
    console.error("Error adding item to shipment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Удалить позицию из накладной
 */
router.delete("/api/shipments/:shipmentId/items/:itemId", async (req, res) => {
  try {
    const { shipmentId, itemId } = req.params;
    await shipmentsRepository.removeItemFromShipment(shipmentId, itemId);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error removing item from shipment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Подтвердить отгрузку
 */
router.post("/api/shipments/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ error: "user_id обязателен" });
      return;
    }

    const updated = await shipmentsRepository.confirmShipment(id, user_id);
    res.json(updated);
  } catch (error: any) {
    console.error("Error confirming shipment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Отменить отгрузку (возврат)
 */
router.post("/api/shipments/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ error: "user_id обязателен" });
      return;
    }

    const updated = await shipmentsRepository.cancelShipment(id, user_id);
    res.json(updated);
  } catch (error: any) {
    console.error("Error cancelling shipment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Удалить накладную
 */
router.delete("/api/shipments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await shipmentsRepository.deleteShipment(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting shipment:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========== УПАКОВКИ ==========

/**
 * Создать упаковку
 */
router.post("/api/warehouse/packages", async (req, res) => {
  try {
    const { name, project_name, package_details, location, notes } = req.body;

    if (!name || !project_name || !package_details) {
      res.status(400).json({ error: "name, project_name и package_details обязательны" });
      return;
    }

    const packageItem = await warehouseRepository.createPackage({
      name,
      project_name,
      package_details,
      location,
      notes,
    });

    res.status(201).json(packageItem);
  } catch (error: any) {
    console.error("Error creating package:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Stock Notifications Endpoints ==========

/**
 * GET /api/warehouse/notifications/:userId
 * Get unread notifications for a user
 */
router.get("/api/warehouse/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await notificationsRepository.getUnreadNotifications(userId);
    res.json(notifications);
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/warehouse/notifications/:notificationId/read
 * Mark a notification as read
 */
router.post("/api/warehouse/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    await notificationsRepository.markAsRead(notificationId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/warehouse/notifications/mark-all-read
 * Mark all notifications as read for a user
 */
router.post("/api/warehouse/notifications/mark-all-read", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ error: "user_id is required" });
      return;
    }

    await notificationsRepository.markAllAsRead(user_id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/warehouse/items/:itemId/notifications
 * Get notification history for a specific item
 */
router.get("/api/warehouse/items/:itemId/notifications", async (req, res) => {
  try {
    const { itemId } = req.params;
    const notifications = await notificationsRepository.getItemNotifications(itemId);
    res.json(notifications);
  } catch (error: any) {
    console.error("Error fetching item notifications:", error);
    res.status(500).json({ error: error.message });
  }
});
