import { db } from "../../db";
import { eq, asc, desc, sql } from "drizzle-orm";
import type { Deal, InsertDeal, DealStage, InsertDealStage, DealMessage, InsertDealMessage, DealDocument, InsertDealDocument } from "@shared/schema";
import { deals, dealStages, deal_messages, deal_documents } from "@shared/schema";

export class SalesRepository {
  async getAllDeals(): Promise<Deal[]> {
    return await db.select().from(deals);
  }

  async getDealById(id: string): Promise<Deal | undefined> {
    const result = await db.select().from(deals).where(eq(deals.id, id));
    return result[0];
  }

  async getNextOrderNumber(): Promise<string> {
    const result = await db.select({ 
      maxOrderNumber: sql<string>`COALESCE(MAX(CAST(order_number AS INTEGER)), 0)` 
    })
    .from(deals)
    .where(sql`order_number ~ '^[0-9]+$'`);
    
    const maxNumber = parseInt(result[0]?.maxOrderNumber || "0");
    return String(maxNumber + 1);
  }

  async createDeal(data: InsertDeal): Promise<Deal> {
    if (!data.order_number) {
      data.order_number = await this.getNextOrderNumber();
    }
    const result = await db.insert(deals).values(data).returning();
    return result[0];
  }

  async updateDeal(id: string, data: Partial<InsertDeal>): Promise<Deal | undefined> {
    const result = await db.update(deals)
      .set({ ...data, updated_at: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return result[0];
  }

  async deleteDeal(id: string): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id)).returning();
    return result.length > 0;
  }

  async getDealsByStage(stage: string): Promise<Deal[]> {
    return await db.select().from(deals).where(eq(deals.stage, stage));
  }

  async countDealsByStage(stage: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(deals)
      .where(eq(deals.stage, stage));
    return result[0]?.count || 0;
  }

  async updateDealsStage(oldStage: string, newStage: string): Promise<number> {
    const result = await db.update(deals)
      .set({ stage: newStage, updated_at: new Date() })
      .where(eq(deals.stage, oldStage))
      .returning();
    return result.length;
  }

  async getAllDealStages(): Promise<DealStage[]> {
    return await db.select().from(dealStages).orderBy(asc(dealStages.order));
  }

  async getDealStageById(id: string): Promise<DealStage | undefined> {
    const result = await db.select().from(dealStages).where(eq(dealStages.id, id));
    return result[0];
  }

  async createDealStage(data: InsertDealStage): Promise<DealStage> {
    const result = await db.insert(dealStages).values(data).returning();
    return result[0];
  }

  async updateDealStage(id: string, data: Partial<InsertDealStage>): Promise<DealStage | undefined> {
    const result = await db.update(dealStages)
      .set(data)
      .where(eq(dealStages.id, id))
      .returning();
    return result[0];
  }

  async deleteDealStage(id: string): Promise<boolean> {
    const result = await db.delete(dealStages).where(eq(dealStages.id, id)).returning();
    return result.length > 0;
  }

  async reorderDealStages(stages: Array<{ id: string; order: number }>): Promise<void> {
    await Promise.all(
      stages.map(stage =>
        db.update(dealStages)
          .set({ order: stage.order })
          .where(eq(dealStages.id, stage.id))
      )
    );
  }

  async getDealMessages(dealId: string): Promise<DealMessage[]> {
    return await db
      .select()
      .from(deal_messages)
      .where(eq(deal_messages.deal_id, dealId))
      .orderBy(desc(deal_messages.created_at));
  }

  async createDealMessage(data: InsertDealMessage): Promise<DealMessage> {
    const [message] = await db
      .insert(deal_messages)
      .values(data)
      .returning();
    return message;
  }

  async getDealDocuments(dealId: string): Promise<DealDocument[]> {
    return await db
      .select()
      .from(deal_documents)
      .where(eq(deal_documents.deal_id, dealId))
      .orderBy(desc(deal_documents.created_at));
  }

  async getDealDocumentById(id: string): Promise<DealDocument | undefined> {
    const [document] = await db
      .select()
      .from(deal_documents)
      .where(eq(deal_documents.id, id));
    return document;
  }

  async createDealDocument(data: InsertDealDocument): Promise<DealDocument> {
    const [document] = await db
      .insert(deal_documents)
      .values(data)
      .returning();
    return document;
  }

  async updateDealDocument(id: string, data: Partial<InsertDealDocument>): Promise<DealDocument | undefined> {
    const [updated] = await db
      .update(deal_documents)
      .set({ ...data, updated_at: new Date() })
      .where(eq(deal_documents.id, id))
      .returning();
    return updated;
  }

  async deleteDealDocument(id: string): Promise<void> {
    await db.delete(deal_documents).where(eq(deal_documents.id, id));
  }
}

export const salesRepository = new SalesRepository();
