import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type InsertEvent } from "@shared/schema";
import { db } from './db';
import { teams, events, teamMonthlyPoints } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint para salvar dados de pontuações mensais
  app.post("/api/salvar-dados", async (req, res) => {
    try {
      const { month, data } = req.body;
      if (!month || !data) {
        return res.status(400).json({ message: "Mês e dados são obrigatórios" });
      }
      
      console.log(`Salvando dados para o mês: ${month}`, data);
      
      // Formatar mês/ano como esperado pelo banco
      const year = new Date().getFullYear();
      const monthYear = `${month.toUpperCase()}_${year}`;
      
      // Obter todas as equipes primeiro
      const allTeams = await storage.getTeams();
      
      // Para cada equipe nos dados, atualizar seus pontos mensais no banco de dados
      for (const teamKey in data) {
        const teamName = teamKey.charAt(0).toUpperCase() + teamKey.slice(1); // Capitalizar primeira letra
        const team = allTeams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
        
        if (team) {
          const pontos = data[teamKey].pontos;
          console.log(`Salvando pontos da equipe ${teamName} (${team.id}) para o mês ${month}: ${pontos}`);
          
          // Verificar se já existe um registro para esta equipe neste mês
          const existingPoints = await db.select()
            .from(teamMonthlyPoints)
            .where(and(
              eq(teamMonthlyPoints.teamId, team.id),
              eq(teamMonthlyPoints.monthYear, monthYear)
            ));
          
          if (existingPoints.length > 0) {
            // Atualizar o registro existente
            const pointId = existingPoints[0].id;
            console.log(`Atualizando registro existente ${pointId} para equipe ${team.name} no mês ${month}`);
            
            await db.update(teamMonthlyPoints)
              .set({ points: pontos })
              .where(eq(teamMonthlyPoints.id, pointId));
          } else {
            // Criar um novo registro
            console.log(`Criando novo registro para equipe ${team.name} no mês ${month}`);
            
            await db.insert(teamMonthlyPoints).values({
              teamId: team.id,
              monthYear: monthYear,
              points: pontos
            });
          }
        } else {
          console.warn(`Equipe não encontrada para atualização: ${teamName}`);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Dados para o mês ${month} salvos com sucesso no banco de dados.` 
      });
    } catch (error: any) {
      console.error("Erro ao salvar dados:", error);
      res.status(500).json({ message: error.message || "Erro ao salvar dados" });
    }
  });
  // API Routes
  // Teams
  app.get("/api/teams", async (req, res) => {
    try {
      // Extrair o mês da query string, se fornecido
      const month = req.query.month as string | undefined;
      
      // Obter as equipes base primeiro
      const teams = await storage.getTeams();
      
      // Formatar os resultados de acordo com o cliente
      let formattedTeams = teams.map(team => ({
        id: team.id,
        name: team.name,
        colorCode: team.colorCode,
        points: 0 // Inicializa com zero, será preenchido de acordo com o mês
      }));
      
      // Se foi fornecido um mês, buscar os pontos específicos desse mês para cada equipe
      if (month) {
        try {
          // Obter o ano atual
          const year = new Date().getFullYear();
          // Montar o formato month_year esperado
          const monthYearFilter = `${month.toUpperCase()}_${year}`;
          
          console.log(`Buscando pontos das equipes para o mês/ano: ${monthYearFilter}`);
          
          // Para cada equipe, buscar seus pontos mensais
          for (const team of formattedTeams) {
            // Consultar pontos mensais desta equipe
            const monthlyPoints = await db.select()
              .from(teamMonthlyPoints)
              .where(and(
                eq(teamMonthlyPoints.teamId, team.id),
                eq(teamMonthlyPoints.monthYear, monthYearFilter)
              ));
            
            // Se houver pontos para este mês, atualizar os pontos da equipe na resposta
            if (monthlyPoints.length > 0) {
              team.points = monthlyPoints[0].points;
              console.log(`Equipe ${team.name} tem ${team.points} pontos no mês ${month}`);
            } else {
              console.log(`Equipe ${team.name} não tem pontos registrados no mês ${month}`);
            }
          }
        } catch (error) {
          console.error('Erro ao buscar pontos mensais das equipes:', error);
          // Em caso de erro, usar os pontos gerais das equipes (como fallback)
          formattedTeams = teams.map(team => ({
            id: team.id,
            name: team.name,
            colorCode: team.colorCode,
            points: team.points
          }));
        }
      } else {
        // Se nenhum mês for especificado, usar os pontos gerais das equipes
        formattedTeams = teams.map(team => ({
          id: team.id,
          name: team.name,
          colorCode: team.colorCode,
          points: team.points
        }));
      }
      
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
      
      // Atualizar pontuação mensal da equipe na nova tabela
      // Verificar se já existe um registro para esta equipe neste mês
      const existingPoints = await db.select()
        .from(teamMonthlyPoints)
        .where(and(
          eq(teamMonthlyPoints.teamId, teamId),
          eq(teamMonthlyPoints.monthYear, monthYearValue)
        ));
      
      if (existingPoints.length > 0) {
        // Atualizar o registro existente, somando os pontos
        const pointId = existingPoints[0].id;
        const currentPoints = existingPoints[0].points;
        const newPoints = currentPoints + points;
        
        console.log(`Atualizando pontos mensais da equipe ${teamId} para ${monthYearValue}: ${currentPoints} + ${points} = ${newPoints}`);
        
        await db.update(teamMonthlyPoints)
          .set({ points: newPoints })
          .where(eq(teamMonthlyPoints.id, pointId));
      } else {
        // Criar um novo registro com os pontos do evento
        console.log(`Criando novo registro mensal para equipe ${teamId} com ${points} pontos`);
        
        await db.insert(teamMonthlyPoints).values({
          teamId,
          monthYear: monthYearValue,
          points: points
        });
      }
      
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

  // Endpoint simplificado apenas para zerar os pontos das equipes
  app.post("/api/zero-points", async (req, res) => {
    try {
      const { month } = req.body;
      console.log(`Zerando pontos para o mês: ${month}`);
      
      if (!month) {
        return res.status(400).json({ message: "Mês é obrigatório" });
      }
      
      const year = new Date().getFullYear();
      const monthYear = `${month.toUpperCase()}_${year}`;
      
      // Obter todas as equipes
      const allTeams = await storage.getTeams();
      
      // Para cada equipe, atualizar ou criar o registro de pontos mensais
      for (const team of allTeams) {
        console.log(`Zerando pontos mensais da equipe ${team.name} (${team.id}) para ${monthYear}`);
        
        // Verificar se já existe um registro para esta equipe neste mês
        const existingPoints = await db.select()
          .from(teamMonthlyPoints)
          .where(and(
            eq(teamMonthlyPoints.teamId, team.id),
            eq(teamMonthlyPoints.monthYear, monthYear)
          ));
        
        if (existingPoints.length > 0) {
          // Atualizar o registro existente para pontos = 0
          const pointId = existingPoints[0].id;
          console.log(`Atualizando registro existente ${pointId} para pontos = 0`);
          
          await db.update(teamMonthlyPoints)
            .set({ points: 0 })
            .where(eq(teamMonthlyPoints.id, pointId));
        } else {
          // Criar um novo registro com pontos = 0
          console.log(`Criando novo registro mensal com pontos = 0`);
          
          await db.insert(teamMonthlyPoints).values({
            teamId: team.id,
            monthYear: monthYear,
            points: 0
          });
        }
      }
      
      // Buscar as equipes atualizadas com os pontos do mês específico
      // Usando o método getTeams com o parâmetro month
      let updatedTeams;
      try {
        updatedTeams = await storage.getTeams(month);
      } catch (err) {
        console.error("Erro ao buscar equipes atualizadas:", err);
        // Fallback para buscar todas as equipes sem filtragem
        updatedTeams = await storage.getTeams();
      }
      
      res.json({ 
        success: true, 
        message: `Pontos das equipes para o mês de ${month} zerados com sucesso.`,
        teams: updatedTeams
      });
    } catch (error: any) {
      console.error("Erro ao zerar pontos:", error);
      res.status(500).json({ message: error.message || "Erro ao zerar pontos" });
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
        const allEvents = await storage.getEvents();
        const eventsToDelete = allEvents.filter(event => event.monthYear === monthYear);
        
        console.log(`Encontrados ${eventsToDelete.length} eventos para excluir do mês ${month}`);
        
        // Excluir os eventos do banco um por um
        for (const event of eventsToDelete) {
          try {
            // Vamos apenas excluir sem alterar os pontos
            await db.delete(events).where(eq(events.id, event.id));
            console.log(`Evento ID ${event.id} excluído com sucesso`);
          } catch (err) {
            console.error(`Erro ao excluir evento ${event.id}:`, err);
          }
        }
        
        // Zerar ou criar registros mensais de pontos
        const allTeams = await storage.getTeams();
        
        // Para cada equipe, atualizar ou criar o registro de pontos mensais
        for (const team of allTeams) {
          console.log(`Zerando pontos mensais da equipe ${team.name} (${team.id}) para ${monthYear}`);
          
          // Verificar se já existe um registro para esta equipe neste mês
          const existingPoints = await db.select()
            .from(teamMonthlyPoints)
            .where(and(
              eq(teamMonthlyPoints.teamId, team.id),
              eq(teamMonthlyPoints.monthYear, monthYear)
            ));
          
          if (existingPoints.length > 0) {
            // Atualizar o registro existente para pontos = 0
            const pointId = existingPoints[0].id;
            console.log(`Atualizando registro existente ${pointId} para pontos = 0`);
            
            await db.update(teamMonthlyPoints)
              .set({ points: 0 })
              .where(eq(teamMonthlyPoints.id, pointId));
          } else {
            // Criar um novo registro com pontos = 0
            console.log(`Criando novo registro mensal com pontos = 0`);
            
            await db.insert(teamMonthlyPoints).values({
              teamId: team.id,
              monthYear: monthYear,
              points: 0
            });
          }
        }
        
        // Buscar as equipes atualizadas para enviar na resposta
        const updatedTeams = await storage.getTeams();
        
        res.json({ 
          success: true, 
          message: `Todos os eventos do mês de ${month} foram excluídos e os pontos zerados.`,
          monthReset: month,
          teams: updatedTeams
        });
      } else {
        // Se nenhum mês foi especificado, resetar todos os dados
        await storage.resetAllData();
        
        // Limpar também a tabela de pontos mensais
        await db.delete(teamMonthlyPoints);
        console.log("Todos os registros de pontos mensais foram limpos");
        
        // Buscar as equipes atualizadas para enviar na resposta
        const updatedTeams = await storage.getTeams();
        
        res.json({ 
          success: true, 
          message: "Todos os eventos foram excluídos e os pontos zerados.",
          teams: updatedTeams
        });
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
