import type { Express } from "express";
import { createServer, type Server } from "http";

// Import modular routes
import { router as salesRouter } from "./modules/sales/routes";
import { router as projectsRouter } from "./modules/projects/routes";
import { router as productionRouter } from "./modules/production/routes";
import { router as warehouseRouter } from "./modules/warehouse/routes";
import { router as financeRouter } from "./modules/finance/routes";
import { router as installationRouter } from "./modules/installation/routes";
import { router as tasksRouter } from "./modules/tasks/routes";
import { router as documentsRouter } from "./modules/documents/routes";
import { router as usersRouter } from "./modules/users/routes";
import { router as settingsRouter } from "./modules/settings/routes";
import { router as attachmentsRouter } from "./modules/attachments/routes";
import { router as customFieldsRouter } from "./modules/custom-fields/routes";
import { router as templatesRouter } from "./modules/templates/routes";
import aiRouter from "./modules/ai/routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all modular routes (они уже содержат префикс /api)
  app.use(salesRouter);
  app.use(projectsRouter);
  app.use(productionRouter);
  app.use(warehouseRouter);
  app.use(financeRouter);
  app.use(installationRouter);
  app.use(tasksRouter);
  app.use(documentsRouter);
  app.use(usersRouter);
  app.use(settingsRouter);
  app.use(attachmentsRouter);
  app.use(customFieldsRouter);
  app.use(templatesRouter);
  app.use(aiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
