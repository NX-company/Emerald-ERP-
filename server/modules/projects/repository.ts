import { db } from "../../db";
import { eq, asc } from "drizzle-orm";
import type { 
  Project, InsertProject, 
  ProjectStage, InsertProjectStage, 
  ProjectItem, InsertProjectItem,
  StageDependency, InsertStageDependency,
  ProcessTemplate, InsertProcessTemplate,
  TemplateStage, InsertTemplateStage,
  TemplateDependency, InsertTemplateDependency,
  StageMessage, InsertStageMessage,
  Document
} from "@shared/schema";
import { 
  projects, project_stages, project_items,
  stage_dependencies, process_templates, template_stages,
  template_dependencies, stage_messages, documents, users
} from "@shared/schema";

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
      return this.updateProject(projectId, { progress: 0, duration_days: 0 });
    }
    
    const completedStages = stages.filter(stage => stage.status === "completed").length;
    const progress = Math.round((completedStages / stages.length) * 100);
    const durationDays = stages.reduce((sum, stage) => sum + (stage.duration_days || 0), 0);
    
    return this.updateProject(projectId, { progress, duration_days: durationDays });
  }

  // Project stage methods
  async getProjectStages(projectId: string): Promise<ProjectStage[]> {
    return await db.select()
      .from(project_stages)
      .where(eq(project_stages.project_id, projectId))
      .orderBy(asc(project_stages.order));
  }

  async getStagesByAssignee(assigneeId: string): Promise<Array<ProjectStage & { project: Project }>> {
    const stages = await db.select()
      .from(project_stages)
      .where(eq(project_stages.assignee_id, assigneeId))
      .orderBy(asc(project_stages.created_at));

    const stagesWithProjects = await Promise.all(
      stages.map(async (stage) => {
        const project = await this.getProjectById(stage.project_id);
        return { ...stage, project: project! };
      })
    );

    return stagesWithProjects.filter(s => s.project);
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

  async startStage(id: string): Promise<ProjectStage | undefined> {
    const result = await db.update(project_stages)
      .set({ 
        actual_start_date: new Date(),
        status: 'in_progress',
        updated_at: new Date() 
      })
      .where(eq(project_stages.id, id))
      .returning();
    return result[0];
  }

  async completeStage(id: string): Promise<ProjectStage | undefined> {
    const result = await db.update(project_stages)
      .set({ 
        actual_end_date: new Date(),
        status: 'completed',
        updated_at: new Date() 
      })
      .where(eq(project_stages.id, id))
      .returning();
    
    if (result[0]) {
      await this.updateProjectProgress(result[0].project_id);
    }
    
    return result[0];
  }

  async getProjectTimeline(projectId: string): Promise<any> {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const stages = await db.select().from(project_stages)
      .where(eq(project_stages.project_id, projectId))
      .orderBy(asc(project_stages.order));

    const timeline = stages.map(stage => {
      const delay = stage.actual_end_date && stage.planned_end_date 
        ? Math.ceil((new Date(stage.actual_end_date).getTime() - new Date(stage.planned_end_date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...stage,
        delay_days: delay,
      };
    });

    const completedStages = stages.filter(s => s.status === 'completed');
    const inProgressStages = stages.filter(s => s.status === 'in_progress');
    const pendingStages = stages.filter(s => s.status === 'pending');

    const finalDeadline = stages.reduce((latest, stage) => {
      const endDate = stage.actual_end_date || stage.planned_end_date;
      if (!endDate) return latest;
      const date = new Date(endDate);
      return date > latest ? date : latest;
    }, new Date(0));

    return {
      project,
      stages: timeline,
      stats: {
        total: stages.length,
        completed: completedStages.length,
        in_progress: inProgressStages.length,
        pending: pendingStages.length,
        final_deadline: finalDeadline.getTime() > 0 ? finalDeadline : null,
      },
    };
  }

  async getProjectByDealId(dealId: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.deal_id, dealId));
    return result[0];
  }

  async createProjectFromInvoice(
    dealId: string, 
    invoiceId: string, 
    deal: any, 
    invoice: any, 
    selectedPositionIndices?: number[],
    editedPositions?: any[],
    positionStagesData?: Record<string, { 
      stages: { id: string; name: string; order_index: number }[]; 
      dependencies: { stage_id: string; depends_on_stage_id: string }[] 
    }>
  ): Promise<Project> {
    const projectData: InsertProject = {
      name: `Проект №${invoice.name}`,
      client_name: deal.client_name,
      deal_id: dealId,
      invoice_id: invoiceId,
      duration_days: 0,
      manager_id: deal.manager_id,
      status: "pending",
      progress: 0,
    };

    const project = await this.createProject(projectData);

    // Если переданы отредактированные позиции, используем их
    if (editedPositions && editedPositions.length > 0 && selectedPositionIndices && selectedPositionIndices.length > 0) {
      const positionsToAdd = selectedPositionIndices.map(index => editedPositions[index]).filter(p => p);
      
      const itemsData: InsertProjectItem[] = positionsToAdd.map((position: any, index: number) => ({
        project_id: project.id,
        name: position.name,
        article: position.article || undefined,
        quantity: position.quantity || 1,
        price: position.price,
        source_document_id: invoiceId,
        order: index,
      }));

      if (itemsData.length > 0) {
        const createdItems = await db.insert(project_items).values(itemsData).returning();
        
        // Создать этапы и зависимости для каждой позиции, если они есть
        if (positionStagesData && selectedPositionIndices) {
          for (let i = 0; i < selectedPositionIndices.length; i++) {
            const positionIndex = selectedPositionIndices[i];
            const itemId = createdItems[i]?.id;
            const stagesData = positionStagesData[positionIndex.toString()];
            
            if (itemId && stagesData?.stages && stagesData.stages.length > 0) {
              await this.createStagesWithDependencies(
                project.id, 
                itemId, 
                stagesData.stages, 
                stagesData.dependencies
              );
            }
          }
        }
      }
    } 
    // Иначе используем оригинальные позиции из счета
    else if (invoice.data?.positions && Array.isArray(invoice.data.positions)) {
      let positionsToAdd = invoice.data.positions;
      
      // Если указаны индексы позиций, фильтруем только выбранные
      if (selectedPositionIndices && selectedPositionIndices.length > 0) {
        positionsToAdd = invoice.data.positions.filter((_: any, index: number) => 
          selectedPositionIndices.includes(index)
        );
      }

      const itemsData: InsertProjectItem[] = positionsToAdd.map((position: any, index: number) => ({
        project_id: project.id,
        name: position.name,
        article: position.article || undefined,
        quantity: position.quantity || 1,
        price: position.price,
        source_document_id: invoiceId,
        order: index,
      }));

      if (itemsData.length > 0) {
        const createdItems = await db.insert(project_items).values(itemsData).returning();
        
        // Создать этапы и зависимости для каждой позиции, если они есть
        if (positionStagesData && selectedPositionIndices) {
          for (let i = 0; i < selectedPositionIndices.length; i++) {
            const positionIndex = selectedPositionIndices[i];
            const itemId = createdItems[i]?.id;
            const stagesData = positionStagesData[positionIndex.toString()];
            
            if (itemId && stagesData?.stages && stagesData.stages.length > 0) {
              await this.createStagesWithDependencies(
                project.id, 
                itemId, 
                stagesData.stages, 
                stagesData.dependencies
              );
            }
          }
        }
      }
    }

    return project;
  }

  private async createStagesWithDependencies(
    projectId: string, 
    itemId: string, 
    stages: { id: string; name: string; order_index: number }[],
    dependencies: { stage_id: string; depends_on_stage_id: string }[]
  ): Promise<void> {
    // Карта для сопоставления временных ID с реальными ID этапов
    const stageIdMap = new Map<string, string>();
    
    // Создать все этапы
    for (const stage of stages) {
      const newStage = await this.createProjectStage({
        project_id: projectId,
        item_id: itemId,
        name: stage.name,
        status: "pending",
        order: stage.order_index,
      });
      
      stageIdMap.set(stage.id, newStage.id);
    }
    
    // Создать зависимости между этапами
    if (dependencies && dependencies.length > 0) {
      for (const dep of dependencies) {
        const realStageId = stageIdMap.get(dep.stage_id);
        const realDependsOnStageId = stageIdMap.get(dep.depends_on_stage_id);
        
        if (realStageId && realDependsOnStageId) {
          await this.createStageDependency({
            stage_id: realStageId,
            depends_on_stage_id: realDependsOnStageId,
          });
        }
      }
    }
  }

  // Project Items methods
  async getProjectItems(projectId: string): Promise<ProjectItem[]> {
    return await db.select()
      .from(project_items)
      .where(eq(project_items.project_id, projectId))
      .orderBy(asc(project_items.order));
  }

  async getProjectItemById(itemId: string): Promise<ProjectItem | undefined> {
    const result = await db.select().from(project_items).where(eq(project_items.id, itemId));
    return result[0];
  }

  async createProjectItem(data: InsertProjectItem): Promise<ProjectItem> {
    const result = await db.insert(project_items).values(data).returning();
    return result[0];
  }

  async updateProjectItem(itemId: string, data: Partial<InsertProjectItem>): Promise<ProjectItem | undefined> {
    const result = await db.update(project_items)
      .set({ ...data, updated_at: new Date() })
      .where(eq(project_items.id, itemId))
      .returning();
    return result[0];
  }

  async deleteProjectItem(itemId: string): Promise<boolean> {
    await db.delete(project_stages).where(eq(project_stages.item_id, itemId));
    const result = await db.delete(project_items).where(eq(project_items.id, itemId)).returning();
    return result.length > 0;
  }

  async getItemStages(itemId: string): Promise<ProjectStage[]> {
    return await db.select()
      .from(project_stages)
      .where(eq(project_stages.item_id, itemId))
      .orderBy(asc(project_stages.order));
  }

  // Stage Dependencies methods
  async getProjectDependencies(projectId: string): Promise<StageDependency[]> {
    const stages = await this.getProjectStages(projectId);
    const stageIds = stages.map(s => s.id);
    
    if (stageIds.length === 0) {
      return [];
    }

    const dependencies: StageDependency[] = [];
    for (const stageId of stageIds) {
      const deps = await db.select()
        .from(stage_dependencies)
        .where(eq(stage_dependencies.stage_id, stageId));
      dependencies.push(...deps);
    }
    
    return dependencies;
  }

  async createStageDependency(data: InsertStageDependency): Promise<StageDependency> {
    const result = await db.insert(stage_dependencies).values(data).returning();
    return result[0];
  }

  async deleteStageDependency(dependencyId: string): Promise<boolean> {
    const result = await db.delete(stage_dependencies)
      .where(eq(stage_dependencies.id, dependencyId))
      .returning();
    return result.length > 0;
  }

  // Process Templates methods
  async getAllTemplates(): Promise<ProcessTemplate[]> {
    return await db.select().from(process_templates).orderBy(asc(process_templates.created_at));
  }

  async getTemplateById(templateId: string): Promise<ProcessTemplate | undefined> {
    const result = await db.select().from(process_templates).where(eq(process_templates.id, templateId));
    return result[0];
  }

  async createTemplate(data: InsertProcessTemplate): Promise<ProcessTemplate> {
    const result = await db.insert(process_templates).values(data).returning();
    return result[0];
  }

  async updateTemplate(templateId: string, data: Partial<InsertProcessTemplate>): Promise<ProcessTemplate | undefined> {
    const result = await db.update(process_templates)
      .set({ ...data, updated_at: new Date() })
      .where(eq(process_templates.id, templateId))
      .returning();
    return result[0];
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const result = await db.delete(process_templates)
      .where(eq(process_templates.id, templateId))
      .returning();
    return result.length > 0;
  }

  // Template Stages methods
  async getTemplateStages(templateId: string): Promise<TemplateStage[]> {
    return await db.select()
      .from(template_stages)
      .where(eq(template_stages.template_id, templateId))
      .orderBy(asc(template_stages.order));
  }

  async createTemplateStage(data: InsertTemplateStage): Promise<TemplateStage> {
    const result = await db.insert(template_stages).values(data).returning();
    return result[0];
  }

  async updateTemplateStage(stageId: string, data: Partial<InsertTemplateStage>): Promise<TemplateStage | undefined> {
    const result = await db.update(template_stages)
      .set({ ...data, updated_at: new Date() })
      .where(eq(template_stages.id, stageId))
      .returning();
    return result[0];
  }

  async deleteTemplateStage(stageId: string): Promise<boolean> {
    const result = await db.delete(template_stages)
      .where(eq(template_stages.id, stageId))
      .returning();
    return result.length > 0;
  }

  // Template Dependencies methods
  async getTemplateDependencies(templateId: string): Promise<TemplateDependency[]> {
    const stages = await this.getTemplateStages(templateId);
    const stageIds = stages.map(s => s.id);
    
    if (stageIds.length === 0) {
      return [];
    }

    const dependencies: TemplateDependency[] = [];
    for (const stageId of stageIds) {
      const deps = await db.select()
        .from(template_dependencies)
        .where(eq(template_dependencies.template_stage_id, stageId));
      dependencies.push(...deps);
    }
    
    return dependencies;
  }

  async createTemplateDependency(data: InsertTemplateDependency): Promise<TemplateDependency> {
    const result = await db.insert(template_dependencies).values(data).returning();
    return result[0];
  }

  async deleteTemplateDependency(dependencyId: string): Promise<boolean> {
    const result = await db.delete(template_dependencies)
      .where(eq(template_dependencies.id, dependencyId))
      .returning();
    return result.length > 0;
  }

  // Apply Template to Item
  async applyTemplateToItem(templateId: string, itemId: string): Promise<{ stages: ProjectStage[], dependencies: StageDependency[] }> {
    const item = await this.getProjectItemById(itemId);
    if (!item) {
      throw new Error("Project item not found");
    }

    const templateStages = await this.getTemplateStages(templateId);
    const templateDeps = await this.getTemplateDependencies(templateId);

    const stageIdMap = new Map<string, string>();
    const createdStages: ProjectStage[] = [];

    for (const templateStage of templateStages) {
      const newStage = await this.createProjectStage({
        project_id: item.project_id,
        item_id: itemId,
        name: templateStage.name,
        description: templateStage.description || undefined,
        cost: templateStage.cost || undefined,
        status: "pending",
        order: templateStage.order,
      });
      stageIdMap.set(templateStage.id, newStage.id);
      createdStages.push(newStage);
    }

    const createdDependencies: StageDependency[] = [];

    for (const templateDep of templateDeps) {
      const newStageId = stageIdMap.get(templateDep.template_stage_id);
      const dependsOnStageId = stageIdMap.get(templateDep.depends_on_template_stage_id);

      if (newStageId && dependsOnStageId) {
        const newDep = await this.createStageDependency({
          stage_id: newStageId,
          depends_on_stage_id: dependsOnStageId,
        });
        createdDependencies.push(newDep);
      }
    }

    return { stages: createdStages, dependencies: createdDependencies };
  }

  // Stage Messages methods
  async getStageMessages(stageId: string) {
    return await db.select({
      id: stage_messages.id,
      stage_id: stage_messages.stage_id,
      user_id: stage_messages.user_id,
      message: stage_messages.message,
      created_at: stage_messages.created_at,
      user_name: users.username,
    })
      .from(stage_messages)
      .leftJoin(users, eq(stage_messages.user_id, users.id))
      .where(eq(stage_messages.stage_id, stageId))
      .orderBy(asc(stage_messages.created_at));
  }

  async createStageMessage(data: InsertStageMessage): Promise<StageMessage> {
    const result = await db.insert(stage_messages).values(data).returning();
    return result[0];
  }

  // Stage Documents methods
  async getStageDocuments(stageId: string): Promise<Document[]> {
    return await db.select()
      .from(documents)
      .where(eq(documents.project_stage_id, stageId))
      .orderBy(asc(documents.created_at));
  }

  async getProjectDocuments(projectId: string) {
    const stages = await this.getProjectStages(projectId);
    const stageIds = stages.map(s => s.id);
    
    if (stageIds.length === 0) return [];
    
    const allDocs = [];
    for (const stageId of stageIds) {
      const docs = await db.select({
        id: documents.id,
        name: documents.name,
        type: documents.type,
        file_path: documents.file_path,
        size: documents.size,
        project_stage_id: documents.project_stage_id,
        uploaded_by: documents.uploaded_by,
        created_at: documents.created_at,
        stage_name: project_stages.name,
        user_name: users.username,
      })
        .from(documents)
        .leftJoin(project_stages, eq(documents.project_stage_id, project_stages.id))
        .leftJoin(users, eq(documents.uploaded_by, users.id))
        .where(eq(documents.project_stage_id, stageId))
        .orderBy(asc(documents.created_at));
      allDocs.push(...docs);
    }
    
    return allDocs;
  }

  // Reorder item stages atomically
  async reorderItemStages(itemId: string, stageIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < stageIds.length; i++) {
        await tx.update(project_stages)
          .set({ order: i })
          .where(eq(project_stages.id, stageIds[i]));
      }
    });
  }
}

export const projectsRepository = new ProjectsRepository();
