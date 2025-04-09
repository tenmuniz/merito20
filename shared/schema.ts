import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  isAdmin: true
});

// Team model
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  colorCode: text("color_code").notNull(),
  points: integer("points").default(0).notNull(),
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  colorCode: true,
  points: true,
});

// Event model
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  officersInvolved: text("officers_involved").notNull(),
  createdBy: text("created_by").notNull(),
  eventDate: timestamp("event_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  teamId: true,
  type: true,
  description: true,
  points: true,
  officersInvolved: true,
  createdBy: true,
  eventDate: true,
  // createdAt é gerenciado automaticamente pelo banco de dados
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>; 

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Enums for client-side use
export enum EventType {
  ARREST = "Prisão em Flagrante",
  WEAPON_SEIZURE = "Apreensão de Arma",
  DRUG_SEIZURE = "Apreensão de Drogas",
  VEHICLE_RECOVERY = "Recuperação de Veículo",
  OPERATION = "Operação",
  PATROL = "Patrulhamento",
  OTHER = "Outros"
}

// Team names enum
export enum TeamName {
  ALFA = "Alfa",
  BRAVO = "Bravo",
  CHARLIE = "Charlie"
}
