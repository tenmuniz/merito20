import { IStorage } from './storage';
import { db } from './db';
import { users, teams, events, type User, type Team, type Event, type InsertUser, type InsertTeam, type InsertEvent } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

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

  async getTeams(): Promise<Team[]> {
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

  async deleteEvent(id: number): Promise<boolean> {
    const event = await this.getEvent(id);
    if (!event) return false;

    // Remover os pontos da equipe
    await this.updateTeamPoints(event.teamId, -event.points);
    
    // Excluir o evento
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }
}