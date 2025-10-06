import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dealStageEnum = pgEnum("deal_stage", ["new", "meeting", "proposal", "contract", "won", "lost"]);
export const statusEnum = pgEnum("status", ["pending", "in_progress", "completed"]);
export const warehouseCategoryEnum = pgEnum("warehouse_category", ["materials", "products"]);
export const warehouseStatusEnum = pgEnum("warehouse_status", ["normal", "low", "critical"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["in", "out"]);
export const financialTypeEnum = pgEnum("financial_type", ["income", "expense"]);
export const installationStatusEnum = pgEnum("installation_status", ["scheduled", "in_progress", "completed"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "critical"]);
export const documentTypeEnum = pgEnum("document_type", ["proposal", "contract", "invoice", "drawing", "other"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  full_name: text("full_name"),
  role: text("role"),
  phone: text("phone"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserWithPassword = typeof users.$inferSelect;
export type User = Omit<UserWithPassword, 'password'>;

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_name: text("client_name").notNull(),
  company: text("company"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  stage: dealStageEnum("stage").notNull().default("new"),
  deadline: timestamp("deadline"),
  manager_id: varchar("manager_id").references(() => users.id),
  tags: text("tags").array(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  client_name: text("client_name").notNull(),
  deal_id: varchar("deal_id").references(() => deals.id),
  status: statusEnum("status").notNull().default("pending"),
  progress: integer("progress").default(0),
  deadline: timestamp("deadline"),
  manager_id: varchar("manager_id").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const project_stages = pgTable("project_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  status: statusEnum("status").notNull().default("pending"),
  order: integer("order").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectStageSchema = createInsertSchema(project_stages).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertProjectStage = z.infer<typeof insertProjectStageSchema>;
export type ProjectStage = typeof project_stages.$inferSelect;

export const production_tasks = pgTable("production_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id),
  item_name: text("item_name").notNull(),
  worker_id: varchar("worker_id").references(() => users.id),
  payment: numeric("payment", { precision: 12, scale: 2 }),
  deadline: timestamp("deadline"),
  progress: integer("progress").default(0),
  qr_code: text("qr_code"),
  status: statusEnum("status").notNull().default("pending"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductionTaskSchema = createInsertSchema(production_tasks).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertProductionTask = z.infer<typeof insertProductionTaskSchema>;
export type ProductionTask = typeof production_tasks.$inferSelect;

export const production_stages = pgTable("production_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id").references(() => production_tasks.id).notNull(),
  name: text("name").notNull(),
  status: statusEnum("status").notNull().default("pending"),
  order: integer("order").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductionStageSchema = createInsertSchema(production_stages).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertProductionStage = z.infer<typeof insertProductionStageSchema>;
export type ProductionStage = typeof production_stages.$inferSelect;

export const warehouse_items = pgTable("warehouse_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull(),
  location: text("location"),
  category: warehouseCategoryEnum("category").notNull(),
  min_stock: numeric("min_stock", { precision: 12, scale: 2 }).default("0"),
  status: warehouseStatusEnum("status").notNull().default("normal"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWarehouseItemSchema = createInsertSchema(warehouse_items).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertWarehouseItem = z.infer<typeof insertWarehouseItemSchema>;
export type WarehouseItem = typeof warehouse_items.$inferSelect;

export const warehouse_transactions = pgTable("warehouse_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  item_id: varchar("item_id").references(() => warehouse_items.id).notNull(),
  type: transactionTypeEnum("type").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  project_id: varchar("project_id").references(() => projects.id),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertWarehouseTransactionSchema = createInsertSchema(warehouse_transactions).omit({
  id: true,
  created_at: true,
});

export type InsertWarehouseTransaction = z.infer<typeof insertWarehouseTransactionSchema>;
export type WarehouseTransaction = typeof warehouse_transactions.$inferSelect;

export const financial_transactions = pgTable("financial_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: financialTypeEnum("type").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  project_id: varchar("project_id").references(() => projects.id),
  description: text("description"),
  date: timestamp("date").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertFinancialTransactionSchema = createInsertSchema(financial_transactions).omit({
  id: true,
  created_at: true,
});

export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financial_transactions.$inferSelect;

export const installations = pgTable("installations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id),
  client_name: text("client_name").notNull(),
  address: text("address").notNull(),
  installer_id: varchar("installer_id").references(() => users.id),
  phone: text("phone"),
  date: timestamp("date"),
  status: installationStatusEnum("status").notNull().default("scheduled"),
  payment: numeric("payment", { precision: 12, scale: 2 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInstallationSchema = createInsertSchema(installations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertInstallation = z.infer<typeof insertInstallationSchema>;
export type Installation = typeof installations.$inferSelect;

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  assignee_id: varchar("assignee_id").references(() => users.id),
  priority: priorityEnum("priority").notNull().default("medium"),
  deadline: timestamp("deadline"),
  status: statusEnum("status").notNull().default("pending"),
  attachments_count: integer("attachments_count").default(0),
  comments_count: integer("comments_count").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: documentTypeEnum("type").notNull(),
  project_id: varchar("project_id").references(() => projects.id),
  file_path: text("file_path").notNull(),
  size: integer("size"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const company_settings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  company_name: text("company_name").notNull(),
  inn: text("inn"),
  address: text("address"),
  phone: text("phone"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySettingsSchema = createInsertSchema(company_settings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof company_settings.$inferSelect;
