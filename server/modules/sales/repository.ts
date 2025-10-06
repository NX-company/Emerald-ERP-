import { db } from "../../db";
import { eq, asc, sql } from "drizzle-orm";
import type { Deal, InsertDeal, DealStage, InsertDealStage } from "@shared/schema";
import { deals, dealStages } from "@shared/schema";

export class SalesRepository {
  async getAllDeals(): Promise<Deal[]> {
    return await db.select().from(deals);
  }

  async getDealById(id: string): Promise<Deal | undefined> {
    const result = await db.select().from(deals).where(eq(deals.id, id));
    return result[0];
  }

  async createDeal(data: InsertDeal): Promise<Deal> {
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
}

export const salesRepository = new SalesRepository();
