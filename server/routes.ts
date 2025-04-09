import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { FirebaseService } from "./services/firebase-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Firebase connection
  const firebaseService = FirebaseService.getInstance();
  
  // API Routes
  // Teams
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await firebaseService.getTeams();
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await firebaseService.getTeamById(req.params.id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const newTeam = await firebaseService.createTeam(req.body);
      res.status(201).json(newTeam);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await firebaseService.getEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await firebaseService.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const newEvent = await firebaseService.createEvent(req.body);
      res.status(201).json(newEvent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      await firebaseService.deleteEvent(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await firebaseService.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Analytics
  app.get("/api/analytics/performance", async (req, res) => {
    try {
      const { timeRange } = req.query;
      const performanceData = await firebaseService.getPerformanceData(timeRange as string);
      res.json(performanceData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
