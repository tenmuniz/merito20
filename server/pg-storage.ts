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
    
    if (eventData.points !== undefined && eventData.points !== event.points) {
      pointsChanged = true;
      pointsDiff = eventData.points - event.points;
    }
    
    if (eventData.teamId !== undefined && eventData.teamId !== event.teamId) {
      teamChanged = true;
    }
    
    // Se a equipe mudou, remover pontos da equipe antiga
    if (teamChanged) {
      await this.updateTeamPoints(oldTeamId, -event.points);
    } 
    // Se apenas os pontos mudaram, ajustar a diferença
    else if (pointsChanged) {
      await this.updateTeamPoints(event.teamId, pointsDiff);
    }
    
    // Se a equipe mudou, adicionar pontos à nova equipe
    if (teamChanged && eventData.teamId !== undefined) {
      const pointsToAdd = eventData.points !== undefined ? eventData.points : event.points;
      await this.updateTeamPoints(eventData.teamId, pointsToAdd);
    }
    
    // Atualizar o evento no banco de dados, preservando createdAt
    const result = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const event = await this.getEvent(id);
    if (!event) return false;

    // Remover os pontos da equipe
    await this.updateTeamPoints(event.teamId, -event.points);
    
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