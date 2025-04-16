import { db } from "./db";
import { sql } from "drizzle-orm";
import { log } from "./vite";

export async function updateDatabase() {
  try {
    // Verificar se a tabela events existe
    try {
      const tablesResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'events'
        );
      `);
      
      const tableExists = tablesResult[0]?.exists;
      
      if (!tableExists) {
        log("Tabela events não encontrada. Pulando atualizações.", "db-update");
        return true;
      }
    } catch (e) {
      log("Erro ao verificar existência da tabela events. Continuando mesmo assim...", "db-update");
      console.error("Erro ao verificar tabela:", e);
    }

    // Alterar o tipo da coluna created_by de integer para text
    try {
      await db.execute(sql`
        ALTER TABLE IF EXISTS events
        ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
      `);
      log("Coluna created_by alterada com sucesso para o tipo TEXT", "db-update");
    } catch (error) {
      // Se o erro for que a coluna já é do tipo TEXT, podemos ignorar
      if (error instanceof Error && error.message.includes("cannot alter type")) {
        log("Coluna created_by já é do tipo TEXT", "db-update");
      } else {
        console.error("Erro ao alterar coluna created_by:", error);
      }
    }
    
    // Adicionar a coluna event_date à tabela events se ela não existir
    try {
      // Verificar se a coluna event_date já existe
      const columnResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'events' 
          AND column_name = 'event_date'
        );
      `);
      
      const columnExists = columnResult[0]?.exists;
      
      if (!columnExists) {
        await db.execute(sql`
          ALTER TABLE events
          ADD COLUMN event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
        `);
        log("Coluna event_date adicionada com sucesso à tabela events", "db-update");
      } else {
        log("Coluna event_date já existe na tabela events", "db-update");
      }
    } catch (error) {
      console.error("Erro ao verificar/adicionar coluna event_date:", error);
      log("Erro ao adicionar coluna event_date. O aplicativo pode continuar funcionando.", "db-update");
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar o banco de dados:", error);
    log("Ocorreram erros na atualização do banco de dados, mas o aplicativo tentará continuar.", "db-update");
    // Mesmo com erro, tentamos continuar a aplicação
    return false;
  }
}