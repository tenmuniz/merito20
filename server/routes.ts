import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type InsertEvent } from "@shared/schema";
import { db } from './db';
import { teams, events } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
  // Rota raiz para verificação básica
  app.get("/", (req, res) => {
    res.status(200).send(`
      <html>
        <head>
          <title>Sistema de Meritocracia 20ª CIPM - API</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #3b82f6; }
            .message { background-color: #f0f9ff; padding: 15px; border-radius: 5px; }
            .nav { margin-top: 20px; }
            .nav a { display: inline-block; margin-right: 10px; background-color: #3b82f6; color: white; 
                    padding: 8px 16px; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Sistema de Meritocracia 20ª CIPM</h1>
          <div class="message">
            <p>👋 A API está funcionando corretamente.</p>
            <p>Versão: 1.0.0</p>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div class="nav">
            <a href="/health">Verificar Status</a>
            <a href="/api/teams">Ver Equipes</a>
          </div>
        </body>
      </html>
    `);
  });

  // Rota de healthcheck para o Railway
  app.get("/health", async (req, res) => {
    try {
      // Fazer uma consulta simples para verificar a conexão com o banco de dados
      const result = await db.select().from(teams).limit(1);
      res.status(200).json({ 
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      console.error("Erro na verificação de saúde:", error);
      res.status(500).json({ 
        status: "error",
        message: "Não foi possível estabelecer conexão com o banco de dados"
      });
    }
  });

  // API Routes
  // Teams
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      // Convertendo para o formato esperado pelo cliente
      const formattedTeams = teams.map(team => ({
        id: team.id,
        name: team.name,
        colorCode: team.colorCode,
        points: team.points
      }));
      res.json(formattedTeams);
    } catch (error: any) {
      console.error("Erro ao buscar equipes:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar equipes" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Equipe não encontrada" });
      }
      
      res.json({
        id: team.id,
        name: team.name,
        colorCode: team.colorCode,
        points: team.points
      });
    } catch (error: any) {
      console.error("Erro ao buscar equipe por ID:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar equipe" });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      const formattedEvents = events.map(event => ({
        id: event.id,
        teamId: event.teamId,
        type: event.type,
        description: event.description,
        points: event.points,
        officersInvolved: event.officersInvolved,
        createdBy: event.createdBy,
        eventDate: event.eventDate,
        createdAt: event.createdAt
      }));
      res.json(formattedEvents);
    } catch (error: any) {
      console.error("Erro ao buscar eventos:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar eventos" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      res.json({
        id: event.id,
        teamId: event.teamId,
        type: event.type,
        description: event.description,
        points: event.points,
        officersInvolved: event.officersInvolved,
        createdBy: event.createdBy,
        eventDate: event.eventDate,
        createdAt: event.createdAt
      });
    } catch (error: any) {
      console.error("Erro ao buscar evento por ID:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar evento" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const { teamId, type, description, points, createdBy, eventDate } = req.body;
      
      // Validações básicas
      if (!teamId || !type || !description || !points) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }
      
      // Verificar se a equipe existe
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Equipe não encontrada" });
      }
      
      // Criar o evento com a data do evento
      console.log('Data recebida do cliente:', eventDate);
      const eventDateObj = eventDate ? new Date(eventDate) : new Date();
      console.log('Data convertida para objeto:', eventDateObj);
      
      const newEvent = await storage.createEvent({
        teamId,
        type,
        description,
        points,
        officersInvolved: "Guarnição", // Valor padrão para manter compatibilidade com o banco de dados
        createdBy: createdBy || "Admin",
        eventDate: eventDateObj
      });
      
      // Removido: não atualizar os pontos da equipe aqui
      // Os pontos já são atualizados dentro do método createEvent
      // Isso estava causando dupla contagem dos pontos
      
      res.status(201).json(newEvent);
    } catch (error: any) {
      console.error("Erro ao criar evento:", error);
      res.status(500).json({ message: error.message || "Erro ao criar evento" });
    }
  });
  
  app.put("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      // Verificar se o evento existe
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      const { teamId, type, description, points, eventDate } = req.body;
      
      // Validações básicas
      if (teamId) {
        // Verificar se a equipe existe
        const team = await storage.getTeam(teamId);
        if (!team) {
          return res.status(404).json({ message: "Equipe não encontrada" });
        }
      }
      
      // Dados para atualização
      const updateData: Partial<InsertEvent> = {};
      if (teamId !== undefined) updateData.teamId = teamId;
      if (type !== undefined) updateData.type = type;
      if (description !== undefined) updateData.description = description;
      if (points !== undefined) updateData.points = points;
      updateData.officersInvolved = "Guarnição"; // Valor padrão para manter compatibilidade
      if (eventDate !== undefined) {
        console.log('Data de edição recebida do cliente:', eventDate);
        updateData.eventDate = new Date(eventDate);
        console.log('Data de edição convertida para objeto:', updateData.eventDate);
      }
      
      // Atualizar o evento
      const updatedEvent = await storage.updateEvent(id, updateData);
      
      res.json(updatedEvent);
    } catch (error: any) {
      console.error("Erro ao atualizar evento:", error);
      res.status(500).json({ message: error.message || "Erro ao atualizar evento" });
    }
  });

  // Reset API - para zerar todos os eventos e pontos
  app.post("/api/reset", async (req, res) => {
    try {
      // Usar o método da interface de storage para resetar os dados
      await storage.resetAllData();
      
      res.json({ success: true, message: "Todos os eventos foram excluídos e os pontos zerados." });
    } catch (error: any) {
      console.error("Erro ao resetar dados:", error);
      res.status(500).json({ message: error.message || "Erro ao resetar dados" });
    }
  });

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Não enviar a senha na resposta
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Erro no login:", error);
      res.status(500).json({ message: error.message || "Erro no login" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
