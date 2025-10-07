import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
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
export const messageTypeEnum = pgEnum("message_type", ["note", "call", "email", "task", "status_change"]);
export const dealDocumentTypeEnum = pgEnum("deal_document_type", ["quote", "invoice", "contract", "other"]);
export const customFieldTypeEnum = pgEnum("custom_field_type", ["text", "number", "date", "checkbox", "file", "select"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  full_name: text("full_name"),
  role: text("role"),
  phone: text("phone"),
  can_create_deals: boolean("can_create_deals").default(true).notNull(),
  can_edit_deals: boolean("can_edit_deals").default(true).notNull(),
  can_delete_deals: boolean("can_delete_deals").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserWithPassword = typeof users.$inferSelect;
export type User = Omit<UserWithPassword, 'password'>;

export const dealStages = pgTable("deal_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  color: text("color").default("#6366f1"),
  order: integer("order").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealStageSchema = createInsertSchema(dealStages).omit({
  id: true,
  created_at: true,
});

export type InsertDealStage = z.infer<typeof insertDealStageSchema>;
export type DealStage = typeof dealStages.$inferSelect;

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_name: text("client_name").notNull(),
  company: text("company"),
  contact_phone: text("contact_phone"),
  contact_email: text("contact_email"),
  order_number: text("order_number").unique(),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  stage: text("stage").notNull().default("new"),
  deadline: timestamp("deadline"),
  manager_id: varchar("manager_id").references(() => users.id),
  production_days_count: integer("production_days_count"),
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
  invoice_id: varchar("invoice_id").references(() => deal_documents.id),
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

export const project_items = pgTable("project_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  article: text("article"),
  quantity: integer("quantity").notNull().default(1),
  price: numeric("price", { precision: 12, scale: 2 }),
  source_document_id: varchar("source_document_id").references(() => deal_documents.id),
  order: integer("order").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectItemSchema = createInsertSchema(project_items).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertProjectItem = z.infer<typeof insertProjectItemSchema>;
export type ProjectItem = typeof project_items.$inferSelect;

export const project_stages = pgTable("project_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: varchar("project_id").references(() => projects.id).notNull(),
  item_id: varchar("item_id").references(() => project_items.id),
  name: text("name").notNull(),
  status: statusEnum("status").notNull().default("pending"),
  assignee_id: varchar("assignee_id").references(() => users.id),
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  cost: numeric("cost", { precision: 12, scale: 2 }),
  description: text("description"),
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
  project_stage_id: varchar("project_stage_id").references(() => project_stages.id, { onDelete: "cascade" }),
  template_stage_id: varchar("template_stage_id").references(() => template_stages.id, { onDelete: "cascade" }),
  file_path: text("file_path").notNull(),
  size: integer("size"),
  uploaded_by: varchar("uploaded_by").references(() => users.id),
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

export const deal_messages = pgTable("deal_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deal_id: varchar("deal_id").references(() => deals.id, { onDelete: "cascade" }).notNull(),
  message_type: messageTypeEnum("message_type").notNull(),
  content: text("content").notNull(),
  author_id: varchar("author_id").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealMessageSchema = createInsertSchema(deal_messages).omit({
  id: true,
  created_at: true,
});

export type InsertDealMessage = z.infer<typeof insertDealMessageSchema>;
export type DealMessage = typeof deal_messages.$inferSelect;

export const deal_documents = pgTable("deal_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deal_id: varchar("deal_id").references(() => deals.id, { onDelete: "cascade" }).notNull(),
  document_type: dealDocumentTypeEnum("document_type").notNull(),
  name: text("name").notNull(),
  version: integer("version").default(1),
  file_url: text("file_url").notNull(),
  data: jsonb("data"),
  total_amount: numeric("total_amount", { precision: 12, scale: 2 }),
  is_signed: boolean("is_signed").default(false),
  parent_id: varchar("parent_id").references((): any => deal_documents.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealDocumentSchema = createInsertSchema(deal_documents).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertDealDocument = z.infer<typeof insertDealDocumentSchema>;
export type DealDocument = typeof deal_documents.$inferSelect;

export const deal_attachments = pgTable("deal_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deal_id: varchar("deal_id").references(() => deals.id, { onDelete: "cascade" }).notNull(),
  file_name: text("file_name").notNull(),
  file_path: text("file_path").notNull(),
  file_size: integer("file_size"),
  mime_type: text("mime_type"),
  uploaded_by: varchar("uploaded_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealAttachmentSchema = createInsertSchema(deal_attachments).omit({
  id: true,
  created_at: true,
});

export type InsertDealAttachment = z.infer<typeof insertDealAttachmentSchema>;
export type DealAttachment = typeof deal_attachments.$inferSelect;

export const custom_field_definitions = pgTable("custom_field_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  field_type: customFieldTypeEnum("field_type").notNull(),
  options: text("options").array(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomFieldDefinitionSchema = createInsertSchema(custom_field_definitions).omit({
  id: true,
  created_at: true,
});

export type InsertCustomFieldDefinition = z.infer<typeof insertCustomFieldDefinitionSchema>;
export type CustomFieldDefinition = typeof custom_field_definitions.$inferSelect;

export const deal_custom_fields = pgTable("deal_custom_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deal_id: varchar("deal_id").references(() => deals.id, { onDelete: "cascade" }).notNull(),
  field_definition_id: varchar("field_definition_id").references(() => custom_field_definitions.id).notNull(),
  value: text("value"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealCustomFieldSchema = createInsertSchema(deal_custom_fields).omit({
  id: true,
  created_at: true,
});

export type InsertDealCustomField = z.infer<typeof insertDealCustomFieldSchema>;
export type DealCustomField = typeof deal_custom_fields.$inferSelect;

export const stage_dependencies = pgTable("stage_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stage_id: varchar("stage_id").references(() => project_stages.id, { onDelete: "cascade" }).notNull(),
  depends_on_stage_id: varchar("depends_on_stage_id").references(() => project_stages.id, { onDelete: "cascade" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertStageDependencySchema = createInsertSchema(stage_dependencies).omit({
  id: true,
  created_at: true,
});

export type InsertStageDependency = z.infer<typeof insertStageDependencySchema>;
export type StageDependency = typeof stage_dependencies.$inferSelect;

export const process_templates = pgTable("process_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  created_by: varchar("created_by").references(() => users.id),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProcessTemplateSchema = createInsertSchema(process_templates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertProcessTemplate = z.infer<typeof insertProcessTemplateSchema>;
export type ProcessTemplate = typeof process_templates.$inferSelect;

export const template_stages = pgTable("template_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  template_id: varchar("template_id").references(() => process_templates.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  duration_days: integer("duration_days"),
  assignee_id: varchar("assignee_id").references(() => users.id),
  cost: numeric("cost", { precision: 12, scale: 2 }),
  order: integer("order").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTemplateStageSchema = createInsertSchema(template_stages).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertTemplateStage = z.infer<typeof insertTemplateStageSchema>;
export type TemplateStage = typeof template_stages.$inferSelect;

export const template_dependencies = pgTable("template_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  template_stage_id: varchar("template_stage_id").references(() => template_stages.id, { onDelete: "cascade" }).notNull(),
  depends_on_template_stage_id: varchar("depends_on_template_stage_id").references(() => template_stages.id, { onDelete: "cascade" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertTemplateDependencySchema = createInsertSchema(template_dependencies).omit({
  id: true,
  created_at: true,
});

export type InsertTemplateDependency = z.infer<typeof insertTemplateDependencySchema>;
export type TemplateDependency = typeof template_dependencies.$inferSelect;

export const stage_messages = pgTable("stage_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stage_id: varchar("stage_id").references(() => project_stages.id, { onDelete: "cascade" }).notNull(),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertStageMessageSchema = createInsertSchema(stage_messages).omit({
  id: true,
  created_at: true,
});

export type InsertStageMessage = z.infer<typeof insertStageMessageSchema>;
export type StageMessage = typeof stage_messages.$inferSelect;
