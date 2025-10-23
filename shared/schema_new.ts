import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Helper function to generate IDs
const genId = () => nanoid();

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => genId()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  full_name: text("full_name"),
  role: text("role"),
  phone: text("phone"),
  can_create_deals: integer("can_create_deals", { mode: "boolean" }).default(true).notNull(),
  can_edit_deals: integer("can_edit_deals", { mode: "boolean" }).default(true).notNull(),
  can_delete_deals: integer("can_delete_deals", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
