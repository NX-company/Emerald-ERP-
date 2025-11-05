import { db } from "../../db";
import { eq, asc, desc, sql, inArray } from "drizzle-orm";
import type { Deal, InsertDeal, DealStage, InsertDealStage, DealMessage, InsertDealMessage, DealDocument, InsertDealDocument, DealAttachment, InsertDealAttachment } from "@shared/schema";
import { deals, dealStages, deal_messages, deal_documents, deal_attachments, users } from "@shared/schema";

export class SalesRepository {
  async getAllDeals(): Promise<any[]> {
    const result = await db
      .select()
      .from(deals)
      .leftJoin(users, eq(deals.manager_id, users.id));

    return result.map(r => ({
      ...r.deals,
      manager_user: r.users ? {
        id: r.users.id,
        username: r.users.username,
        full_name: r.users.full_name,
        email: r.users.email,
      } : null,
    }));
  }

  async getDealById(id: string): Promise<any | undefined> {
    const result = await db
      .select()
      .from(deals)
      .leftJoin(users, eq(deals.manager_id, users.id))
      .where(eq(deals.id, id));

    if (!result[0]) return undefined;

    return {
      ...result[0].deals,
      manager_user: result[0].users ? {
        id: result[0].users.id,
        username: result[0].users.username,
        full_name: result[0].users.full_name,
        email: result[0].users.email,
      } : null,
    };
  }

  async getNextOrderNumber(): Promise<string> {
    // Generate order number in format: ORD-YYYY-MM-NNNNN
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `ORD-${year}-${month}-`;

    // Get all deals with current month prefix
    const allDeals = await db.select({ order_number: deals.order_number }).from(deals);

    const currentMonthNumbers = allDeals
      .map(d => d.order_number)
      .filter(n => n && n.startsWith(prefix))
      .map(n => {
        const parts = n!.split('-');
        return parts.length === 4 ? parseInt(parts[3]) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNumber = currentMonthNumbers.length > 0
      ? Math.max(...currentMonthNumbers)
      : 0;

    const nextNumber = String(maxNumber + 1).padStart(5, '0');
    return `${prefix}${nextNumber}`;
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

  async bulkDeleteDeals(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const result = await db.delete(deals).where(inArray(deals.id, ids)).returning();
    return result.length;
  }

  async bulkUpdateStage(ids: string[], newStage: string): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const result = await db.update(deals)
      .set({ stage: newStage, updated_at: new Date() })
      .where(inArray(deals.id, ids))
      .returning();
    return result.length;
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

  async getDealMessages(dealId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(deal_messages)
      .leftJoin(users, eq(deal_messages.author_id, users.id))
      .where(eq(deal_messages.deal_id, dealId))
      .orderBy(desc(deal_messages.created_at));

    return result.map(r => ({
      ...r.deal_messages,
      author: r.users ? {
        id: r.users.id,
        username: r.users.username,
        full_name: r.users.full_name,
      } : null,
    }));
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

  async getDealDocument(id: string): Promise<DealDocument | undefined> {
    const [document] = await db
      .select()
      .from(deal_documents)
      .where(eq(deal_documents.id, id));
    return document;
  }

  // Document Attachments
  async getDocumentAttachments(documentId: string): Promise<DealAttachment[]> {
    return await db
      .select()
      .from(deal_attachments)
      .where(eq(deal_attachments.document_id, documentId))
      .orderBy(desc(deal_attachments.created_at));
  }

  async createDocumentAttachment(data: InsertDealAttachment): Promise<DealAttachment> {
    const [attachment] = await db
      .insert(deal_attachments)
      .values(data)
      .returning();
    return attachment;
  }

  async getAttachmentById(id: string): Promise<DealAttachment | undefined> {
    const [attachment] = await db
      .select()
      .from(deal_attachments)
      .where(eq(deal_attachments.id, id));
    return attachment;
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(deal_attachments).where(eq(deal_attachments.id, id));
  }
}

export const salesRepository = new SalesRepository();
