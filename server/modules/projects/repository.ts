import { db } from "../../db";
import { eq, asc } from "drizzle-orm";
import type { Project, InsertProject, ProjectStage, InsertProjectStage, ProjectItem, InsertProjectItem } from "@shared/schema";
import { projects, project_stages, project_items } from "@shared/schema";

export class ProjectsRepository {
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

  async getProjectByDealId(dealId: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.deal_id, dealId));
    return result[0];
  }

  async createProjectFromInvoice(dealId: string, invoiceId: string, deal: any, invoice: any): Promise<Project> {
    const projectData: InsertProject = {
      name: `Проект №${invoice.name}`,
      client_name: deal.client_name,
      deal_id: dealId,
      invoice_id: invoiceId,
      deadline: deal.deadline,
      manager_id: deal.manager_id,
      status: "pending",
      progress: 0,
    };

    const project = await this.createProject(projectData);

    if (invoice.data?.positions && Array.isArray(invoice.data.positions)) {
      const itemsData: InsertProjectItem[] = invoice.data.positions.map((position: any, index: number) => ({
        project_id: project.id,
        name: position.name,
        quantity: position.quantity || 1,
        price: position.price,
        source_document_id: invoiceId,
        order: index,
      }));

      await db.insert(project_items).values(itemsData);
    }

    return project;
  }
}

export const projectsRepository = new ProjectsRepository();
