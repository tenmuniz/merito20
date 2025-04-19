import { IStorage } from './storage';
import { db } from './db';
import { users, teams, events, teamMonthlyPoints, type User, type Team, type Event, type InsertUser, type InsertTeam, type InsertEvent, type TeamMonthlyPoint } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Team operations
  async getTeam(id: number): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id));
    return result[0];
  }

  async getTeamByName(name: string): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.name, name));
    return result[0];
  }

  async getTeams(month?: string): Promise<Team[]> {
    if (month) {
      const year = new Date().getFullYear();
      const monthYear = `${month.toUpperCase()}_${year}`;
      console.log(`Buscando pontos das equipes para o mês/ano: ${monthYear}`);
      
      // Buscar as equipes
      const teamsResult = await db.select().from(teams);
      
      // Para cada equipe, buscar os pontos mensais
      const teamsWithMonthlyPoints: Team[] = [];
      
      for (const team of teamsResult) {
        // Buscar pontos mensais
        const monthlyPointsResult = await db.select()
          .from(teamMonthlyPoints)
          .where(and(
            eq(teamMonthlyPoints.teamId, team.id),
            eq(teamMonthlyPoints.monthYear, monthYear)
          ));
        
        // Criar uma cópia da equipe com os pontos do mês (ou 0 se não houver)
        const teamWithMonthlyPoints: Team = {
          ...team,
          points: monthlyPointsResult.length > 0 ? monthlyPointsResult[0].points : 0
        };
        
        if (monthlyPointsResult.length === 0) {
          console.log(`Equipe ${team.name} não tem pontos registrados no mês ${month}`);
        }
        
        teamsWithMonthlyPoints.push(teamWithMonthlyPoints);
      }
      
      // Ordenar pelo campo points
      return teamsWithMonthlyPoints.sort((a, b) => b.points - a.points);
    }
    
    // Se não foi especificado mês, retornar todas as equipes com pontos totais
    return db.select().from(teams).orderBy(desc(teams.points));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    // Definir points como 0 se não for fornecido
    const teamWithPoints = { ...team, points: 0 };
    const result = await db.insert(teams).values(teamWithPoints).returning();
    return result[0];
  }

  async updateTeamPoints(id: number, points: number): Promise<Team | undefined> {
    const team = await this.getTeam(id);
    if (!team) return undefined;

    const result = await db
      .update(teams)
      .set({ points: team.points + points })
      .where(eq(teams.id, id))
      .returning();
    
    return result[0];
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getEventsByTeam(teamId: number): Promise<Event[]> {
    return db
      .select()
      .from(events)
      .where(eq(events.teamId, teamId))
      .orderBy(desc(events.createdAt));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Criar o evento
    const result = await db.insert(events).values(event).returning();
    
    // Atualizar os pontos da equipe
    await this.updateTeamPoints(event.teamId, event.points);
    
    return result[0];
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;
    
    // Se houver mudança de pontos ou equipe, ajustar os pontos das equipes
    let pointsChanged = false;
    let teamChanged = false;
    let oldTeamId = event.teamId;
    let pointsDiff = 0;
    let monthYear = event.monthYear; // Mês/ano atual do evento
    
    if (eventData.points !== undefined && eventData.points !== event.points) {
      pointsChanged = true;
      pointsDiff = eventData.points - event.points;
    }
    
    if (eventData.teamId !== undefined && eventData.teamId !== event.teamId) {
      teamChanged = true;
    }
    
    // Se houver mudança na data do evento, pode ser necessário atualizar o mês/ano
    if (eventData.eventDate) {
      // Determinar o mês e ano da nova data
      const newDate = new Date(eventData.eventDate);
      const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
                     'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
      const newMonth = months[newDate.getMonth()];
      const newYear = newDate.getFullYear();
      const newMonthYear = `${newMonth}_${newYear}`;
      
      // Se o mês/ano mudou, precisamos ajustar os pontos nos dois períodos
      if (newMonthYear !== monthYear) {
        console.log(`Alterando evento do mês/ano ${monthYear} para ${newMonthYear}`);
        
        // Remover os pontos do mês/ano antigo
        await this.updateTeamMonthlyPoints(oldTeamId, -event.points, monthYear);
        
        // Adicionar pontos no novo mês/ano
        const pointsToAdd = eventData.points !== undefined ? eventData.points : event.points;
        await this.updateTeamMonthlyPoints(
          eventData.teamId !== undefined ? eventData.teamId : oldTeamId, 
          pointsToAdd, 
          newMonthYear
        );
        
        // Atualizar o monthYear do evento
        eventData.monthYear = newMonthYear;
        
        // Como já atualizamos os pontos, não precisamos fazer as atualizações abaixo
        const updatedEvent = await db
          .update(events)
          .set(eventData)
          .where(eq(events.id, id))
          .returning();
        
        return updatedEvent[0];
      }
    }
    
    // Se a equipe mudou dentro do mesmo período, remover pontos da equipe antiga
    if (teamChanged) {
      await this.updateTeamMonthlyPoints(oldTeamId, -event.points, monthYear);
    } 
    // Se apenas os pontos mudaram, ajustar a diferença na mesma equipe
    else if (pointsChanged) {
      await this.updateTeamMonthlyPoints(event.teamId, pointsDiff, monthYear);
    }
    
    // Se a equipe mudou, adicionar pontos à nova equipe
    if (teamChanged && eventData.teamId !== undefined) {
      const pointsToAdd = eventData.points !== undefined ? eventData.points : event.points;
      await this.updateTeamMonthlyPoints(eventData.teamId, pointsToAdd, monthYear);
    }
    
    // Atualizar o evento no banco de dados, preservando createdAt
    const result = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    
    return result[0];
  }
  
  // Método para atualizar pontos mensais de uma equipe
  async updateTeamMonthlyPoints(teamId: number, pointsToAdd: number, monthYear: string): Promise<void> {
    console.log(`Atualizando pontos mensais da equipe ${teamId} para ${monthYear}: ? + ${pointsToAdd} = ?`);
    
    // Verificar se já existe um registro para esta equipe neste mês
    const existingPoints = await db.select()
      .from(teamMonthlyPoints)
      .where(and(
        eq(teamMonthlyPoints.teamId, teamId),
        eq(teamMonthlyPoints.monthYear, monthYear)
      ));
    
    // Atualizar ou criar registro
    if (existingPoints.length > 0) {
      // Atualizar registro existente
      const currentPoints = existingPoints[0].points;
      
      // Se pointsToAdd é positivo e >= 100, significa que é uma atribuição direta (definir valor)
      // em vez de um incremento, usado no endpoint salvar-dados
      let newPoints;
      if (pointsToAdd >= 0 && typeof pointsToAdd === 'number') {
        // Definir pontos diretamente (usado pelo endpoint /api/salvar-dados)
        console.log(`Definindo pontos diretamente para ${pointsToAdd}`);
        newPoints = pointsToAdd;
      } else {
        // Incrementar pontos (comportamento padrão, usado por eventos)
        newPoints = Math.max(0, currentPoints + pointsToAdd); // Evitar pontos negativos
      }
      
      console.log(`Atualizando registro existente ${existingPoints[0].id} para pontos = ${newPoints}`);
      
      await db.update(teamMonthlyPoints)
        .set({ points: newPoints })
        .where(eq(teamMonthlyPoints.id, existingPoints[0].id));
    } else {
      // Criar novo registro
      let newPoints;
      if (pointsToAdd >= 0 && typeof pointsToAdd === 'number') {
        // Definir pontos diretamente
        newPoints = pointsToAdd;
      } else {
        // Incrementar a partir de zero
        newPoints = Math.max(0, pointsToAdd); // Evitar pontos negativos
      }
      
      // Buscar o nome da equipe
      const team = await this.getTeam(teamId);
      const teamName = team ? team.name : 'Desconhecida';
      
      console.log(`Criando novo registro para equipe ${teamName} no mês ${monthYear} com ${newPoints} pontos`);
      
      await db.insert(teamMonthlyPoints)
        .values({
          teamId,
          monthYear,
          points: newPoints
        });
    }
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const event = await this.getEvent(id);
    if (!event) return false;

    // Remover os pontos da equipe no mês correspondente
    if (event.monthYear) {
      await this.updateTeamMonthlyPoints(event.teamId, -event.points, event.monthYear);
    } else {
      // Fallback para o método antigo se não tiver monthYear
      await this.updateTeamPoints(event.teamId, -event.points);
    }
    
    // Excluir o evento
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  async resetAllData(): Promise<void> {
    try {
      // Primeiro, excluir todos os eventos
      await db.delete(events);
      
      // Em seguida, zerar os pontos de todas as equipes
      const allTeams = await this.getTeams();
      for (const team of allTeams) {
        await db.update(teams)
          .set({ points: 0 })
          .where(eq(teams.id, team.id));
      }
    } catch (error) {
      console.error("Error resetting data:", error);
      throw error;
    }
  }
}