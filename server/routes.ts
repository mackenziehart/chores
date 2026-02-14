import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChoreSchema, insertPartnerSchema } from "@shared/schema";
import { checkAndSendReminders } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Partners
  app.get("/api/partners", async (_req, res) => {
    const partners = await storage.getPartners();
    res.json(partners);
  });

  app.post("/api/partners", async (req, res) => {
    const parsed = insertPartnerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const partner = await storage.createPartner(parsed.data);
    res.json(partner);
  });

  app.patch("/api/partners/:id", async (req, res) => {
    const partner = await storage.updatePartner(req.params.id, req.body);
    if (!partner) return res.status(404).json({ message: "Partner not found" });
    res.json(partner);
  });

  app.delete("/api/partners/:id", async (req, res) => {
    await storage.deletePartner(req.params.id);
    res.json({ success: true });
  });

  // Chores
  app.get("/api/chores", async (_req, res) => {
    const chores = await storage.getChores();
    res.json(chores);
  });

  app.post("/api/chores", async (req, res) => {
    const body = {
      ...req.body,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    };
    const parsed = insertChoreSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const chore = await storage.createChore(parsed.data);
    res.json(chore);
  });

  app.patch("/api/chores/:id", async (req, res) => {
    const body = {
      ...req.body,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    };
    const chore = await storage.updateChore(req.params.id, body);
    if (!chore) return res.status(404).json({ message: "Chore not found" });
    res.json(chore);
  });

  app.patch("/api/chores/:id/toggle", async (req, res) => {
    const chore = await storage.toggleChore(req.params.id);
    if (!chore) return res.status(404).json({ message: "Chore not found" });
    res.json(chore);
  });

  app.delete("/api/chores/:id", async (req, res) => {
    await storage.deleteChore(req.params.id);
    res.json({ success: true });
  });

  // History
  app.get("/api/history", async (_req, res) => {
    const history = await storage.getHistory();
    res.json(history);
  });

  // Settings
  app.get("/api/settings", async (_req, res) => {
    const s = await storage.getSettings();
    res.json(s);
  });

  app.patch("/api/settings", async (req, res) => {
    const s = await storage.updateSettings(req.body);
    res.json(s);
  });

  // Email reminders - manual trigger
  app.post("/api/reminders/send", async (_req, res) => {
    await checkAndSendReminders();
    res.json({ success: true, message: "Reminder check completed" });
  });

  // Schedule daily reminder check (runs every hour to catch upcoming chores)
  setInterval(() => {
    checkAndSendReminders().catch(console.error);
  }, 60 * 60 * 1000);

  return httpServer;
}
