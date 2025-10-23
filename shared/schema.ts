import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const genId = () => nanoid();

// Roles
export const roles = sqliteTable('roles', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  is_system: integer('is_system', { mode: 'boolean' }).default(0).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, created_at: true, updated_at: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// Role Permissions
export const role_permissions = sqliteTable('role_permissions', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  role_id: text('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  module: text('module').notNull(), // deals, projects, warehouse, finance, etc.
  can_view: integer('can_view', { mode: 'boolean' }).default(0).notNull(),
  can_create: integer('can_create', { mode: 'boolean' }).default(0).notNull(),
  can_edit: integer('can_edit', { mode: 'boolean' }).default(0).notNull(),
  can_delete: integer('can_delete', { mode: 'boolean' }).default(0).notNull(),
  view_all: integer('view_all', { mode: 'boolean' }).default(0).notNull(), // видеть все данные или только свои
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertRolePermissionSchema = createInsertSchema(role_permissions).omit({ id: true, created_at: true, updated_at: true });
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof role_permissions.$inferSelect;

// Users
export const users = sqliteTable('users', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
  full_name: text('full_name'),
  role_id: text('role_id').references(() => roles.id),
  phone: text('phone'),
  is_active: integer('is_active', { mode: 'boolean' }).default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, created_at: true, updated_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserWithPassword = typeof users.$inferSelect;
export type User = Omit<UserWithPassword, 'password'>;

// Sales Pipelines (Воронки продаж)
export const salesPipelines = sqliteTable('sales_pipelines', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  is_default: integer('is_default', { mode: 'boolean' }).default(0).notNull(),
  order: integer('order').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertSalesPipelineSchema = createInsertSchema(salesPipelines).omit({ id: true, created_at: true, updated_at: true });
export type InsertSalesPipeline = z.infer<typeof insertSalesPipelineSchema>;
export type SalesPipeline = typeof salesPipelines.$inferSelect;

// Deal Stages
export const dealStages = sqliteTable('deal_stages', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  pipeline_id: text('pipeline_id').references(() => salesPipelines.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  key: text('key').notNull(),
  color: text('color').default('#6366f1'),
  order: integer('order').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertDealStageSchema = createInsertSchema(dealStages).omit({ id: true, created_at: true });
export type InsertDealStage = z.infer<typeof insertDealStageSchema>;
export type DealStage = typeof dealStages.$inferSelect;

// Deals
export const deals = sqliteTable('deals', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  pipeline_id: text('pipeline_id').references(() => salesPipelines.id),
  client_name: text('client_name').notNull(),
  company: text('company'),
  contact_phone: text('contact_phone'),
  contact_email: text('contact_email'),
  order_number: text('order_number').unique(),
  amount: real('amount'),
  stage: text('stage').notNull().default('new'),
  deadline: integer('deadline', { mode: 'timestamp' }),
  manager_id: text('manager_id').references(() => users.id),
  production_days_count: integer('production_days_count'),
  tags: text('tags'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertDealSchema = createInsertSchema(deals)
  .omit({ id: true, created_at: true, updated_at: true })
  .extend({
    company: z.string().nullable().optional().transform((val) => val === '' ? null : val),
    amount: z.union([z.number(), z.string(), z.null()]).optional().transform((val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
    manager_id: z.string().nullable().optional().transform((val) => val === '' ? null : val),
    production_days_count: z.union([z.number(), z.string(), z.null()]).optional().transform((val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = typeof val === 'string' ? parseInt(val) : val;
      return isNaN(num) ? null : num;
    }),
    tags: z.union([z.array(z.string()), z.string(), z.null()]).optional().transform((val) => {
      if (!val || (Array.isArray(val) && val.length === 0)) return null;
      if (Array.isArray(val)) return JSON.stringify(val);
      return val;
    }),
  });

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

// Deal Contacts
export const deal_contacts = sqliteTable('deal_contacts', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  deal_id: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  position: text('position'),
  phone: text('phone'),
  email: text('email'),
  is_primary: integer('is_primary', { mode: 'boolean' }).default(0).notNull(),
  order: integer('order').notNull().default(0),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertDealContactSchema = createInsertSchema(deal_contacts).omit({ id: true, created_at: true });
export type InsertDealContact = z.infer<typeof insertDealContactSchema>;
export type DealContact = typeof deal_contacts.$inferSelect;

// Deal Messages
export const deal_messages = sqliteTable('deal_messages', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  deal_id: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  message_type: text('message_type').notNull(),
  content: text('content').notNull(),
  author_id: text('author_id').references(() => users.id).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertDealMessageSchema = createInsertSchema(deal_messages).omit({ id: true, created_at: true });
export type InsertDealMessage = z.infer<typeof insertDealMessageSchema>;
export type DealMessage = typeof deal_messages.$inferSelect;

// Deal Documents
export const deal_documents = sqliteTable('deal_documents', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  deal_id: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  document_type: text('document_type').notNull(),
  name: text('name').notNull(),
  version: integer('version').default(1),
  file_url: text('file_url').notNull(),
  data: text('data'),
  total_amount: real('total_amount'),
  is_signed: integer('is_signed', { mode: 'boolean' }).default(0),
  parent_id: text('parent_id').references((): any => deal_documents.id, { onDelete: 'cascade' }),
  comment: text('comment'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertDealDocumentSchema = createInsertSchema(deal_documents).omit({ id: true, created_at: true, updated_at: true });
export type InsertDealDocument = z.infer<typeof insertDealDocumentSchema>;
export type DealDocument = typeof deal_documents.$inferSelect;

// Deal Attachments
export const deal_attachments = sqliteTable('deal_attachments', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  deal_id: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  document_id: text('document_id').references(() => deal_documents.id, { onDelete: 'cascade' }),
  file_name: text('file_name').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size'),
  mime_type: text('mime_type'),
  uploaded_by: text('uploaded_by').references(() => users.id),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertDealAttachmentSchema = createInsertSchema(deal_attachments).omit({ id: true, created_at: true });
export type InsertDealAttachment = z.infer<typeof insertDealAttachmentSchema>;
export type DealAttachment = typeof deal_attachments.$inferSelect;

// Projects
export const projects = sqliteTable('projects', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  name: text('name').notNull(),
  client_name: text('client_name').notNull(),
  deal_id: text('deal_id').references(() => deals.id),
  invoice_id: text('invoice_id').references(() => deal_documents.id),
  status: text('status').notNull().default('pending'),
  progress: integer('progress').default(0),
  duration_days: integer('duration_days'),
  started_at: integer('started_at', { mode: 'timestamp' }),
  manager_id: text('manager_id').references(() => users.id),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, created_at: true, updated_at: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project Items
export const project_items = sqliteTable('project_items', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  project_id: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  article: text('article'),
  quantity: integer('quantity').notNull().default(1),
  price: real('price'),
  source_document_id: text('source_document_id').references(() => deal_documents.id),
  order: integer('order').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertProjectItemSchema = createInsertSchema(project_items).omit({ id: true, created_at: true, updated_at: true });
export type InsertProjectItem = z.infer<typeof insertProjectItemSchema>;
export type ProjectItem = typeof project_items.$inferSelect;

// Project Stages
export const project_stages = sqliteTable('project_stages', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  project_id: text('project_id').references(() => projects.id).notNull(),
  item_id: text('item_id').references(() => project_items.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('pending'),
  assignee_id: text('assignee_id').references(() => users.id),
  duration_days: integer('duration_days'),
  planned_start_date: integer('planned_start_date', { mode: 'timestamp' }),
  planned_end_date: integer('planned_end_date', { mode: 'timestamp' }),
  actual_start_date: integer('actual_start_date', { mode: 'timestamp' }),
  actual_end_date: integer('actual_end_date', { mode: 'timestamp' }),
  cost: real('cost'),
  description: text('description'),
  order: integer('order').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertProjectStageSchema = createInsertSchema(project_stages).omit({ id: true, created_at: true, updated_at: true });
export type InsertProjectStage = z.infer<typeof insertProjectStageSchema>;
export type ProjectStage = typeof project_stages.$inferSelect;

// Stage Dependencies
export const stage_dependencies = sqliteTable('stage_dependencies', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  stage_id: text('stage_id').references(() => project_stages.id, { onDelete: 'cascade' }).notNull(),
  depends_on_stage_id: text('depends_on_stage_id').references(() => project_stages.id, { onDelete: 'cascade' }).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertStageDependencySchema = createInsertSchema(stage_dependencies).omit({ id: true, created_at: true });
export type InsertStageDependency = z.infer<typeof insertStageDependencySchema>;
export type StageDependency = typeof stage_dependencies.$inferSelect;

// Stage Messages
export const stage_messages = sqliteTable('stage_messages', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  stage_id: text('stage_id').references(() => project_stages.id, { onDelete: 'cascade' }).notNull(),
  user_id: text('user_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertStageMessageSchema = createInsertSchema(stage_messages).omit({ id: true, created_at: true });
export type InsertStageMessage = z.infer<typeof insertStageMessageSchema>;
export type StageMessage = typeof stage_messages.$inferSelect;

// Production Tasks
export const production_tasks = sqliteTable('production_tasks', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  project_id: text('project_id').references(() => projects.id),
  item_name: text('item_name').notNull(),
  worker_id: text('worker_id').references(() => users.id),
  payment: real('payment'),
  deadline: integer('deadline', { mode: 'timestamp' }),
  progress: integer('progress').default(0),
  qr_code: text('qr_code'),
  status: text('status').notNull().default('pending'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertProductionTaskSchema = createInsertSchema(production_tasks).omit({ id: true, created_at: true, updated_at: true });
export type InsertProductionTask = z.infer<typeof insertProductionTaskSchema>;
export type ProductionTask = typeof production_tasks.$inferSelect;

// Production Stages
export const production_stages = sqliteTable('production_stages', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  task_id: text('task_id').references(() => production_tasks.id).notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('pending'),
  order: integer('order').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertProductionStageSchema = createInsertSchema(production_stages).omit({ id: true, created_at: true, updated_at: true });
export type InsertProductionStage = z.infer<typeof insertProductionStageSchema>;
export type ProductionStage = typeof production_stages.$inferSelect;

// Warehouse Items
export const warehouse_items = sqliteTable('warehouse_items', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  name: text('name').notNull(),
  quantity: real('quantity').notNull().default(0),
  unit: text('unit').notNull(),
  location: text('location'),
  category: text('category').notNull(),
  min_stock: real('min_stock').default(0),
  status: text('status').notNull().default('normal'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertWarehouseItemSchema = createInsertSchema(warehouse_items).omit({ id: true, created_at: true, updated_at: true });
export type InsertWarehouseItem = z.infer<typeof insertWarehouseItemSchema>;
export type WarehouseItem = typeof warehouse_items.$inferSelect;

// Warehouse Transactions
export const warehouse_transactions = sqliteTable('warehouse_transactions', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  item_id: text('item_id').references(() => warehouse_items.id).notNull(),
  type: text('type').notNull(),
  quantity: real('quantity').notNull(),
  user_id: text('user_id').references(() => users.id).notNull(),
  project_id: text('project_id').references(() => projects.id),
  notes: text('notes'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertWarehouseTransactionSchema = createInsertSchema(warehouse_transactions).omit({ id: true, created_at: true });
export type InsertWarehouseTransaction = z.infer<typeof insertWarehouseTransactionSchema>;
export type WarehouseTransaction = typeof warehouse_transactions.$inferSelect;

// Financial Transactions
export const financial_transactions = sqliteTable('financial_transactions', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  project_id: text('project_id').references(() => projects.id),
  description: text('description'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertFinancialTransactionSchema = createInsertSchema(financial_transactions).omit({ id: true, created_at: true });
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financial_transactions.$inferSelect;

// Installations
export const installations = sqliteTable('installations', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  project_id: text('project_id').references(() => projects.id),
  client_name: text('client_name').notNull(),
  address: text('address').notNull(),
  installer_id: text('installer_id').references(() => users.id),
  phone: text('phone'),
  date: integer('date', { mode: 'timestamp' }),
  status: text('status').notNull().default('scheduled'),
  payment: real('payment'),
  notes: text('notes'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertInstallationSchema = createInsertSchema(installations).omit({ id: true, created_at: true, updated_at: true });
export type InsertInstallation = z.infer<typeof insertInstallationSchema>;
export type Installation = typeof installations.$inferSelect;

// Tasks
export const tasks = sqliteTable('tasks', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  assignee_id: text('assignee_id').references(() => users.id),
  created_by: text('created_by').references(() => users.id),
  priority: text('priority').notNull().default('normal'), // low, normal, high, urgent
  deadline: integer('deadline', { mode: 'timestamp' }),
  start_date: integer('start_date', { mode: 'timestamp' }),
  completed_at: integer('completed_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('new'), // new, in_progress, completed, cancelled, on_hold
  related_entity_type: text('related_entity_type'), // deal, project, client, contact, etc.
  related_entity_id: text('related_entity_id'),
  estimated_hours: real('estimated_hours'),
  actual_hours: real('actual_hours'),
  tags: text('tags'), // JSON array
  attachments_count: integer('attachments_count').default(0),
  comments_count: integer('comments_count').default(0),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, created_at: true, updated_at: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Documents
export const documents = sqliteTable('documents', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  project_id: text('project_id').references(() => projects.id),
  project_stage_id: text('project_stage_id').references(() => project_stages.id, { onDelete: 'cascade' }),
  template_stage_id: text('template_stage_id').references(() => template_stages.id, { onDelete: 'cascade' }),
  file_path: text('file_path').notNull(),
  size: integer('size'),
  uploaded_by: text('uploaded_by').references(() => users.id),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, created_at: true, updated_at: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Company Settings
export const company_settings = sqliteTable('company_settings', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  company_name: text('company_name').notNull(),
  inn: text('inn'),
  address: text('address'),
  phone: text('phone'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertCompanySettingsSchema = createInsertSchema(company_settings).omit({ id: true, created_at: true, updated_at: true });
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof company_settings.$inferSelect;

// AI Chat Messages
export const ai_chat_messages = sqliteTable('ai_chat_messages', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  deal_id: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }),
  user_id: text('user_id').references(() => users.id).notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertAiChatMessageSchema = createInsertSchema(ai_chat_messages).omit({ id: true, created_at: true });
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type AiChatMessage = typeof ai_chat_messages.$inferSelect;

// AI Corrections
export const ai_corrections = sqliteTable('ai_corrections', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  deal_id: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }),
  user_id: text('user_id').references(() => users.id).notNull(),
  original_data: text('original_data').notNull(),
  corrected_data: text('corrected_data').notNull(),
  correction_type: text('correction_type').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertAiCorrectionSchema = createInsertSchema(ai_corrections).omit({ id: true, created_at: true });
export type InsertAiCorrection = z.infer<typeof insertAiCorrectionSchema>;
export type AiCorrection = typeof ai_corrections.$inferSelect;

// Material Prices
export const material_prices = sqliteTable('material_prices', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  unit: text('unit').notNull(),
  price: real('price').notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertMaterialPriceSchema = createInsertSchema(material_prices).omit({ id: true, updated_at: true });
export type InsertMaterialPrice = z.infer<typeof insertMaterialPriceSchema>;
export type MaterialPrice = typeof material_prices.$inferSelect;

// Custom Field Definitions
export const custom_field_definitions = sqliteTable('custom_field_definitions', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  pipeline_id: text('pipeline_id').references(() => salesPipelines.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  field_type: text('field_type').notNull(),
  options: text('options'),
  is_required: integer('is_required', { mode: 'boolean' }).default(0).notNull(),
  order: integer('order').notNull().default(0),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertCustomFieldDefinitionSchema = createInsertSchema(custom_field_definitions).omit({ id: true, created_at: true });
export type InsertCustomFieldDefinition = z.infer<typeof insertCustomFieldDefinitionSchema>;
export type CustomFieldDefinition = typeof custom_field_definitions.$inferSelect;

// Deal Custom Fields
export const deal_custom_fields = sqliteTable('deal_custom_fields', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  deal_id: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  field_definition_id: text('field_definition_id').references(() => custom_field_definitions.id).notNull(),
  value: text('value'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertDealCustomFieldSchema = createInsertSchema(deal_custom_fields).omit({ id: true, created_at: true });
export type InsertDealCustomField = z.infer<typeof insertDealCustomFieldSchema>;
export type DealCustomField = typeof deal_custom_fields.$inferSelect;

// Process Templates
export const process_templates = sqliteTable('process_templates', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_by: text('created_by').references(() => users.id),
  is_active: integer('is_active', { mode: 'boolean' }).default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertProcessTemplateSchema = createInsertSchema(process_templates).omit({ id: true, created_at: true, updated_at: true });
export type InsertProcessTemplate = z.infer<typeof insertProcessTemplateSchema>;
export type ProcessTemplate = typeof process_templates.$inferSelect;

// Template Stages
export const template_stages = sqliteTable('template_stages', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  template_id: text('template_id').references(() => process_templates.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  duration_days: integer('duration_days'),
  assignee_id: text('assignee_id').references(() => users.id),
  cost: real('cost'),
  order: integer('order').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertTemplateStageSchema = createInsertSchema(template_stages).omit({ id: true, created_at: true, updated_at: true });
export type InsertTemplateStage = z.infer<typeof insertTemplateStageSchema>;
export type TemplateStage = typeof template_stages.$inferSelect;

// Template Dependencies
export const template_dependencies = sqliteTable('template_dependencies', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  template_stage_id: text('template_stage_id').references(() => template_stages.id, { onDelete: 'cascade' }).notNull(),
  depends_on_template_stage_id: text('depends_on_template_stage_id').references(() => template_stages.id, { onDelete: 'cascade' }).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertTemplateDependencySchema = createInsertSchema(template_dependencies).omit({ id: true, created_at: true });
export type InsertTemplateDependency = z.infer<typeof insertTemplateDependencySchema>;
export type TemplateDependency = typeof template_dependencies.$inferSelect;

// Template Stage Attachments
export const template_stage_attachments = sqliteTable('template_stage_attachments', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  template_stage_id: text('template_stage_id').references(() => template_stages.id, { onDelete: 'cascade' }).notNull(),
  file_name: text('file_name').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size'),
  mime_type: text('mime_type'),
  uploaded_by: text('uploaded_by').references(() => users.id),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertTemplateStageAttachmentSchema = createInsertSchema(template_stage_attachments).omit({ id: true, created_at: true, updated_at: true });
export type InsertTemplateStageAttachment = z.infer<typeof insertTemplateStageAttachmentSchema>;
export type TemplateStageAttachment = typeof template_stage_attachments.$inferSelect;

// Task Comments
export const task_comments = sqliteTable('task_comments', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  task_id: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  author_id: text('author_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertTaskCommentSchema = createInsertSchema(task_comments).omit({ id: true, created_at: true });
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof task_comments.$inferSelect;

// Task Checklist Items
export const task_checklist_items = sqliteTable('task_checklist_items', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  task_id: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  item_text: text('item_text').notNull(),
  is_completed: integer('is_completed', { mode: 'boolean' }).default(0).notNull(),
  order: integer('order').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertTaskChecklistItemSchema = createInsertSchema(task_checklist_items).omit({ id: true, created_at: true });
export type InsertTaskChecklistItem = z.infer<typeof insertTaskChecklistItemSchema>;
export type TaskChecklistItem = typeof task_checklist_items.$inferSelect;

// Activity Logs (unified logging for all entities)
export const activity_logs = sqliteTable('activity_logs', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  entity_type: text('entity_type').notNull(), // deal, project, task, etc.
  entity_id: text('entity_id').notNull(),
  action_type: text('action_type').notNull(), // created, updated, status_changed, assigned, completed, etc.
  user_id: text('user_id').references(() => users.id),
  field_changed: text('field_changed'), // which field was changed
  old_value: text('old_value'),
  new_value: text('new_value'),
  description: text('description'), // human-readable description
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activity_logs).omit({ id: true, created_at: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activity_logs.$inferSelect;
