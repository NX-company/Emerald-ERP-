import { db } from "../../db";
import { deal_attachments, type InsertDealAttachment, type DealAttachment } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export const attachmentsRepository = {
  async getDealAttachments(dealId: string): Promise<DealAttachment[]> {
    return await db.select().from(deal_attachments).where(eq(deal_attachments.deal_id, dealId));
  },

  async getDealAttachmentById(id: string): Promise<DealAttachment | undefined> {
    const [attachment] = await db.select().from(deal_attachments).where(eq(deal_attachments.id, id));
    return attachment;
  },

  async createDealAttachment(data: InsertDealAttachment): Promise<DealAttachment> {
    const [newAttachment] = await db.insert(deal_attachments).values(data).returning();
    return newAttachment;
  },

  async deleteDealAttachment(id: string): Promise<boolean> {
    const result = await db.delete(deal_attachments).where(eq(deal_attachments.id, id)).returning();
    return result.length > 0;
  },

  async getDealAttachmentsByDealAndUser(dealId: string, userId: string): Promise<DealAttachment[]> {
    return await db.select()
      .from(deal_attachments)
      .where(
        and(
          eq(deal_attachments.deal_id, dealId),
          eq(deal_attachments.uploaded_by, userId)
        )
      );
  }
};
