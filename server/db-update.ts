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
    return true;
  } catch (error) {
    console.error("Erro ao atualizar o banco de dados:", error);
    return false;
  }
}