import { users, teams, events, type User, type Team, type Event, type InsertUser, type InsertTeam, type InsertEvent } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Team operations
  getTeam(id: number): Promise<Team | undefined>;
  getTeamByName(name: string): Promise<Team | undefined>;
  getTeams(month?: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeamPoints(id: number, points: number): Promise<Team | undefined>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getEventsByTeam(teamId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // System operations
  resetAllData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teamsMap: Map<number, Team>;
  private eventsMap: Map<number, Event>;
  private currentUserId: number;
  private currentTeamId: number;
  private currentEventId: number;

  constructor() {
    this.users = new Map();
    this.teamsMap = new Map();
    this.eventsMap = new Map();
    this.currentUserId = 1;
    this.currentTeamId = 1;
    this.currentEventId = 1;
    
    // Initialize with default teams
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default teams: Alfa, Bravo, Charlie
    const defaultTeams: InsertTeam[] = [
      { name: "Alfa", colorCode: "#3b82f6" },
      { name: "Bravo", colorCode: "#10b981" },
      { name: "Charlie", colorCode: "#ef4444" }
    ];
    
    defaultTeams.forEach(team => this.createTeam(team));
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      fullName: "Administrator",
      isAdmin: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false
    };
    this.users.set(id, user);
    return user;
  }
  
  // Team operations
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teamsMap.get(id);
  }
  
  async getTeamByName(name: string): Promise<Team | undefined> {
    return Array.from(this.teamsMap.values()).find(
      (team) => team.name === name,
    );
  }
  
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teamsMap.values());
  }
  
  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentTeamId++;
    const team: Team = { ...insertTeam, id, points: 0 };
    this.teamsMap.set(id, team);
    return team;
  }
  
  async updateTeamPoints(id: number, points: number): Promise<Team | undefined> {
    const team = await this.getTeam(id);
    if (!team) return undefined;
    
    // Atualizar os pontos da equipe
    team.points += points;
    this.teamsMap.set(id, team);
    
    return team;
  }
  
  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.eventsMap.get(id);
  }
  
  async getEvents(): Promise<Event[]> {
    return Array.from(this.eventsMap.values());
  }
  
  async getEventsByTeam(teamId: number): Promise<Event[]> {
    return Array.from(this.eventsMap.values()).filter(
      (event) => event.teamId === teamId,
    );
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const event: Event = { 
      ...insertEvent, 
      id,
      createdAt: new Date() 
    };
    this.eventsMap.set(id, event);
    
    // Atualizar os pontos da equipe
    await this.updateTeamPoints(event.teamId, event.points);
    
    return event;
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
    
    // Atualizar o evento
    const updatedEvent: Event = { 
      ...event, 
      ...eventData,
      // Manter id e createdAt originais
      id: event.id,
      createdAt: event.createdAt
    };
    
    this.eventsMap.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const event = await this.getEvent(id);
    if (!event) return false;
    
    // Remover os pontos da equipe
    await this.updateTeamPoints(event.teamId, -event.points);
    
    // Excluir o evento
    return this.eventsMap.delete(id);
  }
  
  async resetAllData(): Promise<void> {
    // Limpar todos os eventos
    this.eventsMap.clear();
    
    // Zerar os pontos de todas as equipes
    const allTeams = await this.getTeams();
    for (const team of allTeams) {
      team.points = 0;
      this.teamsMap.set(team.id, team);
    }
  }
}

import { PostgresStorage } from './pg-storage';

// Escolha entre a implementação em memória ou PostgreSQL
const usePostgres = true; // Altere para false para usar o armazenamento em memória

export const storage = usePostgres ? new PostgresStorage() : new MemStorage();
