import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDealSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET /api/deals - Get all deals or filter by stage
  app.get("/api/deals", async (req, res) => {
    try {
      const { stage } = req.query;
      
      if (stage && typeof stage === "string") {
        const deals = await storage.getDealsByStage(stage);
        res.json(deals);
      } else {
        const deals = await storage.getAllDeals();
        res.json(deals);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  // GET /api/deals/:id - Get deal by ID
  app.get("/api/deals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deal = await storage.getDealById(id);
      
      if (!deal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ error: "Failed to fetch deal" });
    }
  });

  // POST /api/deals - Create new deal
  app.post("/api/deals", async (req, res) => {
    try {
      const validationResult = insertDealSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const newDeal = await storage.createDeal(validationResult.data);
      res.status(201).json(newDeal);
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  // PUT /api/deals/:id - Update deal
  app.put("/api/deals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate the update data using the same schema (partial is handled by the storage layer)
      const validationResult = insertDealSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        res.status(400).json({ error: errorMessage });
        return;
      }
      
      const updatedDeal = await storage.updateDeal(id, validationResult.data);
      
      if (!updatedDeal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      
      res.json(updatedDeal);
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  // DELETE /api/deals/:id - Delete deal
  app.delete("/api/deals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteDeal(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
