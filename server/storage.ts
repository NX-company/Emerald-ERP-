import { 
  type User, 
  type InsertUser, 
  type Deal, 
  type InsertDeal, 
  type Project,
  type InsertProject,
  type ProjectStage,
  type InsertProjectStage,
  deals, 
  users,
  projects,
  project_stages
} from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Deal methods
  getAllDeals(): Promise<Deal[]>;
  getDealById(id: string): Promise<Deal | undefined>;
  createDeal(data: InsertDeal): Promise<Deal>;
  updateDeal(id: string, data: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: string): Promise<boolean>;
  getDealsByStage(stage: string): Promise<Deal[]>;

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
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
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
    const filteredProjects = await db.select().from(projects).where(eq(projects.status, status));
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
}

export const storage = new DbStorage();
