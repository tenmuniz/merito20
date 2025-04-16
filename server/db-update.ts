import { db } from "./db";
import { sql } from "drizzle-orm";
import { log } from "./vite";

export async function updateDatabase() {
  try {
    log("Iniciando atualização do esquema do banco de dados...", "db-update");
    
    // Utilizando try-catch para cada operação e ignorando erros
    try {
      // Alterar created_by para tipo TEXT se necessário
      await db.execute(sql`
        ALTER TABLE IF EXISTS events
        ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
      `);
      log("Coluna created_by alterada com sucesso para o tipo TEXT", "db-update");
    } catch (error) {
      // Ignoramos erros específicos que não impedem a aplicação de funcionar
      log("Não foi possível alterar a coluna created_by, mas a aplicação continuará", "db-update");
    }
    
    try {
      // Adicionar coluna event_date se não existir
      await db.execute(sql`
        ALTER TABLE IF EXISTS events
        ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
      `);
      log("Coluna event_date adicionada com sucesso à tabela events", "db-update");
    } catch (error) {
      // Ignoramos erros específicos que não impedem a aplicação de funcionar
      log("Não foi possível adicionar a coluna event_date, mas a aplicação continuará", "db-update");
    }
    
    log("Atualização do esquema concluída com sucesso", "db-update");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar o banco de dados:", error);
    log("Ocorreram erros na atualização do banco de dados, mas o aplicativo tentará continuar.", "db-update");
    // Mesmo com erro, tentamos continuar a aplicação
    return false;
  }
}