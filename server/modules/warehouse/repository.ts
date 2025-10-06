import { db } from "../../db";
import { eq, and, asc } from "drizzle-orm";
import type { WarehouseItem, InsertWarehouseItem, WarehouseTransaction, InsertWarehouseTransaction } from "@shared/schema";
import { warehouse_items, warehouse_transactions } from "@shared/schema";

export class WarehouseRepository {
  async getAllWarehouseItems(category?: string, status?: string): Promise<WarehouseItem[]> {
    let conditions = [];
    
    if (category) {
      conditions.push(eq(warehouse_items.category, category as any));
    }
    
    if (status) {
      conditions.push(eq(warehouse_items.status, status as any));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(warehouse_items).where(and(...conditions));
    }
    
    return await db.select().from(warehouse_items);
  }

  async getWarehouseItemById(id: string): Promise<WarehouseItem | undefined> {
    const result = await db.select().from(warehouse_items).where(eq(warehouse_items.id, id));
    return result[0];
  }

  async createWarehouseItem(data: InsertWarehouseItem): Promise<WarehouseItem> {
    const result = await db.insert(warehouse_items).values(data).returning();
    await this.updateItemStatus(result[0].id);
    return result[0];
  }

  async updateWarehouseItem(id: string, data: Partial<InsertWarehouseItem>): Promise<WarehouseItem | undefined> {
    const result = await db.update(warehouse_items)
      .set({ ...data, updated_at: new Date() })
      .where(eq(warehouse_items.id, id))
      .returning();
    
    if (result[0]) {
      await this.updateItemStatus(id);
    }
    
    return result[0];
  }

  async deleteWarehouseItem(id: string): Promise<boolean> {
    await db.delete(warehouse_transactions).where(eq(warehouse_transactions.item_id, id));
    const result = await db.delete(warehouse_items).where(eq(warehouse_items.id, id)).returning();
    return result.length > 0;
  }

  async createTransaction(data: InsertWarehouseTransaction): Promise<WarehouseTransaction> {
    const item = await this.getWarehouseItemById(data.item_id);
    
    if (!item) {
      throw new Error("Warehouse item not found");
    }
    
    const currentQuantity = parseFloat(item.quantity);
    const transactionQuantity = parseFloat(data.quantity);
    const newQuantity = data.type === "in" 
      ? currentQuantity + transactionQuantity 
      : currentQuantity - transactionQuantity;
    
    await this.updateWarehouseItem(data.item_id, { quantity: newQuantity.toString() });
    
    const result = await db.insert(warehouse_transactions).values(data).returning();
    return result[0];
  }

  async getWarehouseTransactions(itemId: string): Promise<WarehouseTransaction[]> {
    return await db.select()
      .from(warehouse_transactions)
      .where(eq(warehouse_transactions.item_id, itemId))
      .orderBy(asc(warehouse_transactions.created_at));
  }

  async updateItemStatus(itemId: string): Promise<WarehouseItem | undefined> {
    const item = await this.getWarehouseItemById(itemId);
    
    if (!item) {
      return undefined;
    }
    
    const quantity = parseFloat(item.quantity);
    const minStock = parseFloat(item.min_stock || "0");
    
    let newStatus: "normal" | "low" | "critical";
    
    if (quantity === 0) {
      newStatus = "critical";
    } else if (quantity <= minStock) {
      newStatus = "low";
    } else {
      newStatus = "normal";
    }
    
    if (newStatus !== item.status) {
      const result = await db.update(warehouse_items)
        .set({ status: newStatus, updated_at: new Date() })
        .where(eq(warehouse_items.id, itemId))
        .returning();
      return result[0];
    }
    
    return item;
  }
}

export const warehouseRepository = new WarehouseRepository();
