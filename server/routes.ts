import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type InsertEvent } from "@shared/schema";
import { db } from './db';
import { teams, events } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
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
      // Extrair o mês da query string, se fornecido
      const month = req.query.month as string | undefined;
      
      let events;
      if (month) {
        try {
          // Obter o ano atual
          const year = new Date().getFullYear();
          // Montar o formato month_year esperado
          const monthYearFilter = `${month.toUpperCase()}_${year}`;
          
          console.log(`Filtrando eventos por mês/ano: ${monthYearFilter}`);
          
          // Buscar todos os eventos e filtrar pelo monthYear
          const allEvents = await storage.getEvents();
          events = allEvents.filter(event => event.monthYear === monthYearFilter);
          
          console.log(`Encontrados ${events.length} eventos para ${monthYearFilter}`);
        } catch (error) {
          console.error('Erro ao filtrar eventos por mês:', error);
          // Em caso de erro na filtragem, retorne todos os eventos
          events = await storage.getEvents();
        }
      } else {
        // Se nenhum mês for especificado, retorne todos os eventos
        events = await storage.getEvents();
      }
      
      const formattedEvents = events.map(event => ({
        id: event.id,
        teamId: event.teamId,
        type: event.type,
        description: event.description,
        points: event.points,
        officersInvolved: event.officersInvolved,
        createdBy: event.createdBy,
        eventDate: event.eventDate,
        monthYear: event.monthYear,
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
      const { teamId, type, description, points, createdBy, eventDate, monthYear } = req.body;
      
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
      
      // Determinar o mês e ano do evento
      let monthYearValue = monthYear;
      if (!monthYearValue) {
        // Se não foi fornecido, calcular com base na data do evento
        const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
                        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
        const month = months[eventDateObj.getMonth()];
        const year = eventDateObj.getFullYear();
        monthYearValue = `${month}_${year}`;
      }
      
      console.log('Mês/ano do evento:', monthYearValue);
      
      const newEvent = await storage.createEvent({
        teamId,
        type,
        description,
        points,
        officersInvolved: "Guarnição", // Valor padrão para manter compatibilidade com o banco de dados
        createdBy: createdBy || "Admin",
        eventDate: eventDateObj,
        monthYear: monthYearValue
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

  // Reset API - para zerar eventos e pontos
  app.post("/api/reset", async (req, res) => {
    try {
      const { month } = req.body;
      
      if (month) {
        // Se um mês foi especificado, zerar apenas os eventos desse mês
        console.log(`Zerando dados apenas para o mês: ${month}`);
        const year = new Date().getFullYear();
        const monthYear = `${month.toUpperCase()}_${year}`;
        
        // Buscar todos os eventos deste mês
        const events = await storage.getEvents();
        const eventsToDelete = events.filter(event => event.monthYear === monthYear);
        
        // Excluir os eventos um por um
        for (const event of eventsToDelete) {
          await storage.deleteEvent(event.id);
        }
        
        // Não vamos zerar os pontos diretamente no banco, mas sim
        // recalcular os pontos a partir dos eventos restantes
        // Isso garante que os pontos de outros meses permaneçam intactos
        
        res.json({ 
          success: true, 
          message: `Todos os eventos do mês de ${month} foram excluídos e os pontos zerados.`,
          monthReset: month
        });
      } else {
        // Se nenhum mês foi especificado, resetar todos os dados
        await storage.resetAllData();
        res.json({ success: true, message: "Todos os eventos foram excluídos e os pontos zerados." });
      }
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
  
  // Logout
  app.post("/api/auth/logout", (req, res) => {
    try {
      // Como estamos usando localStorage no cliente e não sessions no servidor,
      // apenas respondemos com sucesso
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro no logout:", error);
      res.status(500).json({ message: error.message || "Erro no logout" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
