import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type InsertEvent } from "@shared/schema";
import { db } from './db';
import { teams, events, teamMonthlyPoints } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  // Teams
  app.get("/api/teams", async (req: Request, res: Response) => {
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

  app.get("/api/teams/:id", async (req: Request, res: Response) => {
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
  app.get("/api/events", async (req: Request, res: Response) => {
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

  app.get("/api/events/:id", async (req: Request, res: Response) => {
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
        monthYear: event.monthYear,
        createdAt: event.createdAt
      });
    } catch (error: any) {
      console.error("Erro ao buscar evento por ID:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar evento" });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
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
  
  // Endpoint de atualização completa (PUT)
  app.put("/api/events/:id", async (req: Request, res: Response) => {
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

  // Endpoint de atualização parcial (PATCH) - mesma implementação que PUT, apenas método diferente
  app.patch("/api/events/:id", async (req: Request, res: Response) => {
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
      
      console.log('Atualizando evento via PATCH:', id);
      console.log('Dados recebidos:', req.body);
      
      const { teamId, type, description, points, eventDate } = req.body;
      const oldPoints = event.points;
      
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
      
      // Se os pontos foram alterados, atualizar a tabela de pontos mensais
      if (points !== undefined && points !== oldPoints) {
        // Obter o mês/ano deste evento
        const monthYear = event.monthYear;
        
        // Buscar o registro de pontos mensais para esta equipe
        const teamId = event.teamId;
        
        // Verificar se já existe um registro para esta equipe neste mês
        const existingPoints = await db.select()
          .from(teamMonthlyPoints)
          .where(and(
            eq(teamMonthlyPoints.teamId, teamId),
            eq(teamMonthlyPoints.monthYear, monthYear)
          ));
        
        if (existingPoints.length > 0) {
          // Calcular a diferença de pontos
          const pointsDiff = points - oldPoints;
          // Calcular novo valor
          const currentTotal = existingPoints[0].points;
          // Calcular novo total somando a diferença (pode ser positiva ou negativa)
          let newTotal;
          
          // Verificar se os pontos mensais atuais são conhecidos
          if (currentTotal !== undefined && currentTotal !== null) {
            newTotal = currentTotal + pointsDiff;
            console.log(`Atualizando pontos mensais da equipe ${teamId} para ${monthYear}: ${currentTotal} + ${pointsDiff} = ${newTotal}`);
          } else {
            // Se por algum motivo não conseguirmos obter os pontos atuais, atribuir diretamente o novo valor
            newTotal = pointsDiff;
            console.log(`Definindo pontos diretamente para ${newTotal}`);
          }
          
          // Garantir que não seja negativo
          newTotal = Math.max(0, newTotal);
          
          // Atualizar o registro
          const pointId = existingPoints[0].id;
          await db.update(teamMonthlyPoints)
            .set({ points: newTotal })
            .where(eq(teamMonthlyPoints.id, pointId));
            
          console.log(`Atualizando registro existente ${pointId} para pontos = ${newTotal}`);
        }
      }
      
      console.log('Evento atualizado com sucesso:', updatedEvent);
      res.json(updatedEvent);
    } catch (error: any) {
      console.error("Erro ao atualizar evento:", error);
      res.status(500).json({ message: error.message || "Erro ao atualizar evento" });
    }
  });

  // Endpoint para excluir um evento
  app.delete("/api/events/:id", async (req: Request, res: Response) => {
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
      
      // Capturar informações necessárias antes de excluir
      const { teamId, points, monthYear } = event;
      
      // Excluir o evento
      const success = await storage.deleteEvent(id);
      if (!success) {
        return res.status(500).json({ message: "Falha ao excluir evento" });
      }
      
      // Atualizar os pontos mensais da equipe
      if (monthYear) {
        try {
          // Verificar se existe um registro para esta equipe neste mês
          const existingPoints = await db.select()
            .from(teamMonthlyPoints)
            .where(and(
              eq(teamMonthlyPoints.teamId, teamId),
              eq(teamMonthlyPoints.monthYear, monthYear)
            ));
          
          if (existingPoints.length > 0) {
            // Atualizar o registro existente, subtraindo os pontos
            const pointId = existingPoints[0].id;
            const currentPoints = existingPoints[0].points;
            const newPoints = Math.max(0, currentPoints - points); // Nunca permitir pontos negativos
            
            console.log(`Atualizando pontos mensais da equipe ${teamId} para ${monthYear}: ${currentPoints} - ${points} = ${newPoints}`);
            
            await db.update(teamMonthlyPoints)
              .set({ points: newPoints })
              .where(eq(teamMonthlyPoints.id, pointId));
          }
        } catch (error) {
          console.error('Erro ao atualizar pontos mensais após exclusão de evento:', error);
          // Não falhar completamente se apenas a atualização de pontos falhar
        }
      }
      
      res.json({ success: true, message: "Evento excluído com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir evento:", error);
      res.status(500).json({ message: error.message || "Erro ao excluir evento" });
    }
  });

  // Endpoint simplificado apenas para zerar os pontos das equipes
  app.post("/api/zero-points", async (req: Request, res: Response) => {
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

  // Reset API - para zerar eventos e pontos do mês atual
  app.post("/api/reset", async (req: Request, res: Response) => {
    try {
      const { month } = req.body;
      console.log(`Zerando dados apenas para o mês: ${month}`);
      
      if (!month) {
        return res.status(400).json({ message: "Mês é obrigatório" });
      }
      
      const year = new Date().getFullYear();
      const monthYear = `${month.toUpperCase()}_${year}`;
      
      // 1. Excluir todos os eventos do mês
      const allEvents = await storage.getEvents();
      const eventsToDelete = allEvents.filter(event => event.monthYear === monthYear);
      console.log(`Encontrados ${eventsToDelete.length} eventos para excluir do mês ${month}`);
      
      // Excluir cada evento individualmente
      for (const event of eventsToDelete) {
        const success = await storage.deleteEvent(event.id);
        if (success) {
          console.log(`Evento ID ${event.id} excluído com sucesso`);
        } else {
          console.error(`Falha ao excluir evento ID ${event.id}`);
        }
      }
      
      // 2. Zerar os pontos de todas as equipes para este mês
      const allTeams = await storage.getTeams();
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
      
      res.json({ 
        success: true, 
        message: `Todos os eventos do mês de ${month} foram excluídos e os pontos das equipes foram zerados com sucesso.`
      });
    } catch (error: any) {
      console.error("Erro ao resetar dados:", error);
      res.status(500).json({ message: error.message || "Erro ao resetar dados" });
    }
  });

  // Endpoint para diagnóstico - ajuda a identificar problemas com o usuário admin
  app.get("/api/admin-check", async (_req: Request, res: Response) => {
    try {
      const user = await storage.getUserByUsername('admin');
      if (!user) {
        return res.json({
          exists: false,
          message: "Usuário admin não encontrado. Execute a inicialização do banco de dados."
        });
      }
      
      // Por segurança, não enviamos a senha completa, apenas verificamos
      const passwordStatus = user.password === 'admin123' ? 'correta' : 'incorreta';
      
      return res.json({
        exists: true,
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        passwordStatus,
        message: `Usuário admin encontrado com ID ${user.id}. Senha está ${passwordStatus}.`
      });
    } catch (error: any) {
      console.error("Erro ao verificar usuário admin:", error);
      res.status(500).json({ 
        error: true,
        message: error.message || "Erro ao verificar usuário admin"
      });
    }
  });
  
  // Endpoint ESPECIAL de emergência para forçar a criação do usuário admin
  // Este endpoint deve ser chamado quando for impossível acessar o sistema
  app.get("/api/reset-admin", async (_req: Request, res: Response) => {
    try {
      // 1. Verificar se o usuário admin já existe
      let user = await storage.getUserByUsername('admin');
      
      // 2. Se existir, atualizar a senha
      if (user) {
        console.log(`🔄 Encontrado usuário admin com ID ${user.id}. Atualizando senha...`);
        
        // 2.1 Excluir o usuário existente da tabela
        await db.delete(users).where(eq(users.id, user.id));
        console.log(`🗑️ Usuário admin antigo excluído.`);
      }
      
      // 3. Criar um novo usuário admin com a senha correta
      const newAdmin = await db.insert(users).values({
        username: "admin",
        password: "admin123", // Em uma aplicação real, seria hashed
        fullName: "Administrador",
        isAdmin: true
      }).returning();
      
      console.log(`✅ Novo usuário admin criado com ID ${newAdmin[0].id}.`);
        
      return res.json({
        success: true,
        message: "Usuário admin resetado com sucesso! Use: admin/admin123 para login",
        id: newAdmin[0].id
      });
    } catch (error: any) {
      console.error("Erro ao resetar admin:", error);
      res.status(500).json({ 
        error: true,
        message: error.message || "Erro ao resetar admin"
      });
    }
  });

  // Endpoint para autenticação simples
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validações básicas
      if (!username || !password) {
        return res.status(400).json({ message: "Nome de usuário e senha são obrigatórios" });
      }
      
      // Buscar usuário pelo nome de usuário
      const user = await storage.getUserByUsername(username);
      
      // Verificar se o usuário existe e a senha está correta
      if (!user) {
        console.log(`⚠️ Tentativa de login falhou: usuário ${username} não encontrado`);
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
      
      // Comparar senha (numa aplicação real, usaríamos bcrypt ou similar)
      if (user.password !== password) {
        console.log(`⚠️ Tentativa de login falhou para ${username}: senha incorreta`);
        return res.status(401).json({ message: "Senha incorreta" });
      }
      
      console.log(`✅ Login bem-sucedido para o usuário ${username}`);
      
      
      // Retornar usuário sem a senha
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      res.status(500).json({ message: error.message || "Erro na autenticação" });
    }
  });

  // Endpoint para salvar os dados do mês atual
  app.post("/api/salvar-dados", async (req: Request, res: Response) => {
    try {
      const { month, data } = req.body;
      
      if (!month || !data) {
        return res.status(400).json({ message: "Mês e dados são obrigatórios" });
      }
      
      console.log(`Salvando dados para o mês: ${month}`, data);
      const year = new Date().getFullYear();
      const monthYear = `${month.toUpperCase()}_${year}`;
      
      // Obter todas as equipes primeiro
      const allTeams = await storage.getTeams();
      
      // Obter os eventos do mês atual para calcular os pontos reais
      const allEvents = await storage.getEvents();
      const eventsThisMonth = allEvents.filter(event => event.monthYear === monthYear);
      
      // Calcular pontos a partir dos eventos (fonte confiável)
      const calculatedPoints: {[key: number]: number} = {};
      eventsThisMonth.forEach(event => {
        const teamId = event.teamId;
        if (calculatedPoints[teamId] === undefined) {
          calculatedPoints[teamId] = 0;
        }
        calculatedPoints[teamId] += event.points;
      });
      
      console.log('Pontos calculados a partir dos eventos:', calculatedPoints);
      
      // Para cada equipe nos dados, atualizar seus pontos mensais no banco de dados
      for (const teamKey in data) {
        const teamName = teamKey.charAt(0).toUpperCase() + teamKey.slice(1); // Capitalizar primeira letra
        const team = allTeams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
        
        if (team) {
          // Usar os pontos calculados a partir dos eventos, não os do front-end
          const pontos = calculatedPoints[team.id] || 0;
          console.log(`Salvando pontos CALCULADOS da equipe ${teamName} (${team.id}) para o mês ${month}: ${pontos}`);
          
          // Verificar se já existe um registro para esta equipe neste mês
          const existingPoints = await db.select()
            .from(teamMonthlyPoints)
            .where(and(
              eq(teamMonthlyPoints.teamId, team.id),
              eq(teamMonthlyPoints.monthYear, monthYear)
            ));
          
          if (existingPoints.length > 0) {
            // Atualizar o registro existente com os pontos calculados
            const pointId = existingPoints[0].id;
            console.log(`Atualizando registro existente ${pointId} para equipe ${team.name} no mês ${month} com pontos: ${pontos}`);
            
            await db.update(teamMonthlyPoints)
              .set({ points: pontos })
              .where(eq(teamMonthlyPoints.id, pointId));
          } else {
            // Criar um novo registro com os pontos calculados
            console.log(`Criando novo registro para equipe ${team.name} no mês ${month} com pontos: ${pontos}`);
            
            await db.insert(teamMonthlyPoints).values({
              teamId: team.id,
              monthYear,
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

  const httpServer = createServer(app);
  return httpServer;
}