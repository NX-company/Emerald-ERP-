import { Router } from "express";
import { warehouseRepository } from "./repository";
import { insertWarehouseItemSchema, insertWarehouseTransactionSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export const router = Router();

// ========== Warehouse Items Endpoints ==========

// GET /api/warehouse - Get all warehouse items
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

// GET /api/warehouse/:id - Get warehouse item by ID
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

// POST /api/warehouse - Create new warehouse item
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

// PUT /api/warehouse/:id - Update warehouse item
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

// DELETE /api/warehouse/:id - Delete warehouse item
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

// POST /api/warehouse/:id/transactions - Create warehouse transaction
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

// GET /api/warehouse/:id/transactions - Get warehouse transactions
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
