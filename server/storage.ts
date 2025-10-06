import { 
  type User, 
  type UserWithPassword,
  type InsertUser, 
  type Deal, 
  type InsertDeal,
  type DealStage,
  type InsertDealStage,
  type Project,
  type InsertProject,
  type ProjectStage,
  type InsertProjectStage,
  type ProductionTask,
  type InsertProductionTask,
  type ProductionStage,
  type InsertProductionStage,
  type WarehouseItem,
  type InsertWarehouseItem,
  type WarehouseTransaction,
  type InsertWarehouseTransaction,
  type FinancialTransaction,
  type InsertFinancialTransaction,
  type Installation,
  type InsertInstallation,
  type Task,
  type InsertTask,
  type Document,
  type InsertDocument,
  type CompanySettings,
  type InsertCompanySettings,
  deals,
  dealStages,
  users,
  projects,
  project_stages,
  production_tasks,
  production_stages,
  warehouse_items,
  warehouse_transactions,
  financial_transactions,
  installations,
  tasks,
  documents,
  company_settings
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, and, gte, lte, or, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validatePassword(username: string, password: string): Promise<boolean>;
  
  // Deal methods
  getAllDeals(): Promise<Deal[]>;
  getDealById(id: string): Promise<Deal | undefined>;
  createDeal(data: InsertDeal): Promise<Deal>;
  updateDeal(id: string, data: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: string): Promise<boolean>;
  getDealsByStage(stage: string): Promise<Deal[]>;
  countDealsByStage(stage: string): Promise<number>;
  updateDealsStage(oldStage: string, newStage: string): Promise<number>;

  // Deal stage methods
  getAllDealStages(): Promise<DealStage[]>;
  getDealStageById(id: string): Promise<DealStage | undefined>;
  createDealStage(data: InsertDealStage): Promise<DealStage>;
  updateDealStage(id: string, data: Partial<InsertDealStage>): Promise<DealStage | undefined>;
  deleteDealStage(id: string): Promise<boolean>;
  reorderDealStages(stages: Array<{ id: string; order: number }>): Promise<void>;

  // Project methods
  getAllProjects(): Promise<Array<Project & { stages: ProjectStage[] }>>;
  getProjectById(id: string): Promise<(Project & { stages: ProjectStage[] }) | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  getProjectsByStatus(status: string): Promise<Array<Project & { stages: ProjectStage[] }>>;
  updateProjectProgress(projectId: string): Promise<Project | undefined>;

  // Project stage methods
  getProjectStages(projectId: string): Promise<ProjectStage[]>;
  createProjectStage(data: InsertProjectStage): Promise<ProjectStage>;
  updateProjectStage(id: string, data: Partial<InsertProjectStage>): Promise<ProjectStage | undefined>;
  deleteProjectStage(id: string): Promise<boolean>;

  // Production methods
  getAllProductionTasks(status?: string): Promise<Array<ProductionTask & { stages: ProductionStage[] }>>;
  getProductionTaskById(id: string): Promise<(ProductionTask & { stages: ProductionStage[] }) | undefined>;
  createProductionTask(data: InsertProductionTask): Promise<ProductionTask>;
  updateProductionTask(id: string, data: Partial<InsertProductionTask>): Promise<ProductionTask | undefined>;
  deleteProductionTask(id: string): Promise<boolean>;
  getProductionStages(taskId: string): Promise<ProductionStage[]>;
  createProductionStage(data: InsertProductionStage): Promise<ProductionStage>;
  updateProductionStage(id: string, data: Partial<InsertProductionStage>): Promise<ProductionStage | undefined>;
  deleteProductionStage(id: string): Promise<boolean>;
  updateTaskProgress(taskId: string): Promise<ProductionTask | undefined>;

  // Warehouse methods
  getAllWarehouseItems(category?: string, status?: string): Promise<WarehouseItem[]>;
  getWarehouseItemById(id: string): Promise<WarehouseItem | undefined>;
  createWarehouseItem(data: InsertWarehouseItem): Promise<WarehouseItem>;
  updateWarehouseItem(id: string, data: Partial<InsertWarehouseItem>): Promise<WarehouseItem | undefined>;
  deleteWarehouseItem(id: string): Promise<boolean>;
  createTransaction(data: InsertWarehouseTransaction): Promise<WarehouseTransaction>;
  getWarehouseTransactions(itemId: string): Promise<WarehouseTransaction[]>;
  updateItemStatus(itemId: string): Promise<WarehouseItem | undefined>;

  // Finance methods
  getAllFinancialTransactions(type?: string, from?: Date, to?: Date): Promise<FinancialTransaction[]>;
  createFinancialTransaction(data: InsertFinancialTransaction): Promise<FinancialTransaction>;
  getFinancialStats(): Promise<{
    totalIncome: number;
    totalExpense: number;
    profit: number;
    profitability: number;
  }>;
  getProjectFinancials(projectId: string): Promise<{
    totalIncome: number;
    totalExpense: number;
    profit: number;
  }>;

  // Installation methods
  getAllInstallations(status?: string): Promise<Installation[]>;
  getInstallationById(id: string): Promise<Installation | undefined>;
  createInstallation(data: InsertInstallation): Promise<Installation>;
  updateInstallation(id: string, data: Partial<InsertInstallation>): Promise<Installation | undefined>;
  deleteInstallation(id: string): Promise<boolean>;

  // Task methods
  getAllTasks(status?: string, priority?: string, assigneeId?: string): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Document methods
  getAllDocuments(type?: string, projectId?: string): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | undefined>;
  createDocument(data: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  // Settings methods
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(data: Partial<InsertCompanySettings>): Promise<CompanySettings | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    if (!result[0]) return undefined;
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    if (!result[0]) return undefined;
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async validatePassword(username: string, password: string): Promise<boolean> {
    const result = await db.select().from(users).where(eq(users.username, username));
    if (!result[0]) return false;
    return await bcrypt.compare(password, result[0].password);
  }

  // Deal methods
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

  // Project methods
  async getAllProjects(): Promise<Array<Project & { stages: ProjectStage[] }>> {
    const allProjects = await db.select().from(projects);
    const projectsWithStages = await Promise.all(
      allProjects.map(async (project) => {
        const stages = await this.getProjectStages(project.id);
        return { ...project, stages };
      })
    );
    return projectsWithStages;
  }

  async getProjectById(id: string): Promise<(Project & { stages: ProjectStage[] }) | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    const project = result[0];
    
    if (!project) {
      return undefined;
    }
    
    const stages = await this.getProjectStages(id);
    return { ...project, stages };
  }

  async createProject(data: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(data).returning();
    return result[0];
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set({ ...data, updated_at: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<boolean> {
    await db.delete(project_stages).where(eq(project_stages.project_id, id));
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  async getProjectsByStatus(status: string): Promise<Array<Project & { stages: ProjectStage[] }>> {
    const filteredProjects = await db.select().from(projects).where(eq(projects.status, status as any));
    const projectsWithStages = await Promise.all(
      filteredProjects.map(async (project) => {
        const stages = await this.getProjectStages(project.id);
        return { ...project, stages };
      })
    );
    return projectsWithStages;
  }

  async updateProjectProgress(projectId: string): Promise<Project | undefined> {
    const stages = await this.getProjectStages(projectId);
    
    if (stages.length === 0) {
      return this.updateProject(projectId, { progress: 0 });
    }
    
    const completedStages = stages.filter(stage => stage.status === "completed").length;
    const progress = Math.round((completedStages / stages.length) * 100);
    
    return this.updateProject(projectId, { progress });
  }

  // Project stage methods
  async getProjectStages(projectId: string): Promise<ProjectStage[]> {
    return await db.select()
      .from(project_stages)
      .where(eq(project_stages.project_id, projectId))
      .orderBy(asc(project_stages.order));
  }

  async createProjectStage(data: InsertProjectStage): Promise<ProjectStage> {
    const result = await db.insert(project_stages).values(data).returning();
    await this.updateProjectProgress(data.project_id);
    return result[0];
  }

  async updateProjectStage(id: string, data: Partial<InsertProjectStage>): Promise<ProjectStage | undefined> {
    const result = await db.update(project_stages)
      .set({ ...data, updated_at: new Date() })
      .where(eq(project_stages.id, id))
      .returning();
    
    if (result[0]) {
      await this.updateProjectProgress(result[0].project_id);
    }
    
    return result[0];
  }

  async deleteProjectStage(id: string): Promise<boolean> {
    const stage = await db.select().from(project_stages).where(eq(project_stages.id, id));
    
    if (stage.length === 0) {
      return false;
    }
    
    const projectId = stage[0].project_id;
    const result = await db.delete(project_stages).where(eq(project_stages.id, id)).returning();
    
    if (result.length > 0) {
      await this.updateProjectProgress(projectId);
    }
    
    return result.length > 0;
  }

  // Production methods
  async getAllProductionTasks(status?: string): Promise<Array<ProductionTask & { stages: ProductionStage[] }>> {
    let query = db.select().from(production_tasks);
    
    const allTasks = status 
      ? await query.where(eq(production_tasks.status, status as any))
      : await query;
    
    const tasksWithStages = await Promise.all(
      allTasks.map(async (task) => {
        const stages = await this.getProductionStages(task.id);
        return { ...task, stages };
      })
    );
    return tasksWithStages;
  }

  async getProductionTaskById(id: string): Promise<(ProductionTask & { stages: ProductionStage[] }) | undefined> {
    const result = await db.select().from(production_tasks).where(eq(production_tasks.id, id));
    const task = result[0];
    
    if (!task) {
      return undefined;
    }
    
    const stages = await this.getProductionStages(id);
    return { ...task, stages };
  }

  async createProductionTask(data: InsertProductionTask): Promise<ProductionTask> {
    const result = await db.insert(production_tasks).values(data).returning();
    return result[0];
  }

  async updateProductionTask(id: string, data: Partial<InsertProductionTask>): Promise<ProductionTask | undefined> {
    const result = await db.update(production_tasks)
      .set({ ...data, updated_at: new Date() })
      .where(eq(production_tasks.id, id))
      .returning();
    return result[0];
  }

  async deleteProductionTask(id: string): Promise<boolean> {
    await db.delete(production_stages).where(eq(production_stages.task_id, id));
    const result = await db.delete(production_tasks).where(eq(production_tasks.id, id)).returning();
    return result.length > 0;
  }

  async getProductionStages(taskId: string): Promise<ProductionStage[]> {
    return await db.select()
      .from(production_stages)
      .where(eq(production_stages.task_id, taskId))
      .orderBy(asc(production_stages.order));
  }

  async createProductionStage(data: InsertProductionStage): Promise<ProductionStage> {
    const result = await db.insert(production_stages).values(data).returning();
    await this.updateTaskProgress(data.task_id);
    return result[0];
  }

  async updateProductionStage(id: string, data: Partial<InsertProductionStage>): Promise<ProductionStage | undefined> {
    const result = await db.update(production_stages)
      .set({ ...data, updated_at: new Date() })
      .where(eq(production_stages.id, id))
      .returning();
    
    if (result[0]) {
      await this.updateTaskProgress(result[0].task_id);
    }
    
    return result[0];
  }

  async deleteProductionStage(id: string): Promise<boolean> {
    const stage = await db.select().from(production_stages).where(eq(production_stages.id, id));
    
    if (stage.length === 0) {
      return false;
    }
    
    const taskId = stage[0].task_id;
    const result = await db.delete(production_stages).where(eq(production_stages.id, id)).returning();
    
    if (result.length > 0) {
      await this.updateTaskProgress(taskId);
    }
    
    return result.length > 0;
  }

  async updateTaskProgress(taskId: string): Promise<ProductionTask | undefined> {
    const stages = await this.getProductionStages(taskId);
    
    if (stages.length === 0) {
      return this.updateProductionTask(taskId, { progress: 0 });
    }
    
    const completedStages = stages.filter(stage => stage.status === "completed").length;
    const progress = Math.round((completedStages / stages.length) * 100);
    
    return this.updateProductionTask(taskId, { progress });
  }

  // Warehouse methods
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

  // Finance methods
  async getAllFinancialTransactions(type?: string, from?: Date, to?: Date): Promise<FinancialTransaction[]> {
    let conditions = [];
    
    if (type) {
      conditions.push(eq(financial_transactions.type, type as any));
    }
    
    if (from) {
      conditions.push(gte(financial_transactions.date, from));
    }
    
    if (to) {
      conditions.push(lte(financial_transactions.date, to));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(financial_transactions).where(and(...conditions));
    }
    
    return await db.select().from(financial_transactions);
  }

  async createFinancialTransaction(data: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const result = await db.insert(financial_transactions).values(data).returning();
    return result[0];
  }

  async getFinancialStats(): Promise<{
    totalIncome: number;
    totalExpense: number;
    profit: number;
    profitability: number;
  }> {
    const allTransactions = await this.getAllFinancialTransactions();
    
    const totalIncome = allTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpense = allTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const profit = totalIncome - totalExpense;
    const profitability = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpense,
      profit,
      profitability
    };
  }

  async getProjectFinancials(projectId: string): Promise<{
    totalIncome: number;
    totalExpense: number;
    profit: number;
  }> {
    const transactions = await db.select()
      .from(financial_transactions)
      .where(eq(financial_transactions.project_id, projectId));
    
    const totalIncome = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpense = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const profit = totalIncome - totalExpense;
    
    return {
      totalIncome,
      totalExpense,
      profit
    };
  }

  // Installation methods
  async getAllInstallations(status?: string): Promise<Installation[]> {
    if (status) {
      return await db.select().from(installations).where(eq(installations.status, status as any));
    }
    return await db.select().from(installations);
  }

  async getInstallationById(id: string): Promise<Installation | undefined> {
    const result = await db.select().from(installations).where(eq(installations.id, id));
    return result[0];
  }

  async createInstallation(data: InsertInstallation): Promise<Installation> {
    const result = await db.insert(installations).values(data).returning();
    return result[0];
  }

  async updateInstallation(id: string, data: Partial<InsertInstallation>): Promise<Installation | undefined> {
    const result = await db.update(installations)
      .set({ ...data, updated_at: new Date() })
      .where(eq(installations.id, id))
      .returning();
    return result[0];
  }

  async deleteInstallation(id: string): Promise<boolean> {
    const result = await db.delete(installations).where(eq(installations.id, id)).returning();
    return result.length > 0;
  }

  // Task methods
  async getAllTasks(status?: string, priority?: string, assigneeId?: string): Promise<Task[]> {
    let conditions = [];
    
    if (status) {
      conditions.push(eq(tasks.status, status as any));
    }
    
    if (priority) {
      conditions.push(eq(tasks.priority, priority as any));
    }
    
    if (assigneeId) {
      conditions.push(eq(tasks.assignee_id, assigneeId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(tasks).where(and(...conditions));
    }
    
    return await db.select().from(tasks);
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async createTask(data: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(data).returning();
    return result[0];
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set({ ...data, updated_at: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  // Document methods
  async getAllDocuments(type?: string, projectId?: string): Promise<Document[]> {
    let conditions = [];
    
    if (type) {
      conditions.push(eq(documents.type, type as any));
    }
    
    if (projectId) {
      conditions.push(eq(documents.project_id, projectId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(documents).where(and(...conditions));
    }
    
    return await db.select().from(documents);
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(data).returning();
    return result[0];
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await db.update(documents)
      .set({ ...data, updated_at: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  // Settings methods
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const result = await db.select().from(company_settings).limit(1);
    return result[0];
  }

  async updateCompanySettings(data: Partial<InsertCompanySettings>): Promise<CompanySettings | undefined> {
    const existingSettings = await this.getCompanySettings();
    
    if (existingSettings) {
      const result = await db.update(company_settings)
        .set({ ...data, updated_at: new Date() })
        .where(eq(company_settings.id, existingSettings.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(company_settings).values(data as InsertCompanySettings).returning();
      return result[0];
    }
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    if (!result[0]) return undefined;
    const { password, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
