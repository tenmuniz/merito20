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
  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeamPoints(id: number, points: number): Promise<Team | undefined>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  getEventsByTeam(teamId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  deleteEvent(id: number): Promise<boolean>;
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
    const user: User = { ...insertUser, id };
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
    const team: Team = { ...insertTeam, id };
    this.teamsMap.set(id, team);
    return team;
  }
  
  async updateTeamPoints(id: number, points: number): Promise<Team | undefined> {
    const team = await this.getTeam(id);
    if (!team) return undefined;
    
    // In a real database, we'd update the team's points
    // For this in-memory implementation, we'd need to track points separately
    // as our Team schema doesn't have a points field
    
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
    return event;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    return this.eventsMap.delete(id);
  }
}

export const storage = new MemStorage();
