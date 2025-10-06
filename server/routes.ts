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

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all modular routes
  app.use("/api", salesRouter);
  app.use("/api", projectsRouter);
  app.use("/api", productionRouter);
  app.use("/api", warehouseRouter);
  app.use("/api", financeRouter);
  app.use("/api", installationRouter);
  app.use("/api", tasksRouter);
  app.use("/api", documentsRouter);
  app.use("/api", usersRouter);
  app.use("/api", settingsRouter);

  const httpServer = createServer(app);

  return httpServer;
}
