import { db } from "./db";
import { sql } from "drizzle-orm";
import { log } from "./vite";

export async function updateDatabase() {
  try {
    // Alterar o tipo da coluna created_by de integer para text
    await db.execute(sql`
      ALTER TABLE IF EXISTS events
      ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
    `);
    
    log("Coluna created_by alterada com sucesso para o tipo TEXT", "db-update");
    
    // Adicionar a coluna event_date à tabela events se ela não existir
    try {
      await db.execute(sql`
        ALTER TABLE IF EXISTS events
        ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
      `);
      log("Coluna event_date adicionada com sucesso à tabela events", "db-update");
    } catch (error) {
      console.error("Erro ao adicionar coluna event_date:", error);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar o banco de dados:", error);
    return false;
  }
}