import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTelegrafConfigSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get all telegraf configurations
  app.get("/api/configs", async (_req, res) => {
    try {
      const configs = await storage.getTelegrafConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configurations" });
    }
  });

  // Get a specific telegraf configuration
  app.get("/api/configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const config = await storage.getTelegrafConfig(id);
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }

      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  // Create a new telegraf configuration
  app.post("/api/configs", async (req, res) => {
    try {
      const validatedData = insertTelegrafConfigSchema.parse(req.body);
      const config = await storage.createTelegrafConfig(validatedData);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create configuration" });
      }
    }
  });

  // Update an existing telegraf configuration
  app.put("/api/configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validatedData = insertTelegrafConfigSchema.partial().parse(req.body);
      const updatedConfig = await storage.updateTelegrafConfig(id, validatedData);

      if (!updatedConfig) {
        return res.status(404).json({ message: "Configuration not found" });
      }

      res.json(updatedConfig);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to update configuration" });
      }
    }
  });

  // Delete a telegraf configuration
  app.delete("/api/configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteTelegrafConfig(id);
      if (!success) {
        return res.status(404).json({ message: "Configuration not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete configuration" });
    }
  });

  return httpServer;
}
