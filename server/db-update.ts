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
    
    // Adicionar a coluna month_year à tabela events se ela não existir
    try {
      await db.execute(sql`
        ALTER TABLE IF EXISTS events
        ADD COLUMN IF NOT EXISTS month_year TEXT NOT NULL DEFAULT 'ABRIL_2025';
      `);
      log("Coluna month_year adicionada com sucesso à tabela events", "db-update");
      
      // Atualizar os eventos existentes para ter o month_year baseado na data do evento
      await db.execute(sql`
        UPDATE events SET month_year = 
        CASE 
          WHEN EXTRACT(MONTH FROM event_date) = 1 THEN 'JANEIRO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 2 THEN 'FEVEREIRO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 3 THEN 'MARÇO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 4 THEN 'ABRIL_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 5 THEN 'MAIO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 6 THEN 'JUNHO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 7 THEN 'JULHO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 8 THEN 'AGOSTO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 9 THEN 'SETEMBRO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 10 THEN 'OUTUBRO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 11 THEN 'NOVEMBRO_' || EXTRACT(YEAR FROM event_date)
          WHEN EXTRACT(MONTH FROM event_date) = 12 THEN 'DEZEMBRO_' || EXTRACT(YEAR FROM event_date)
          ELSE 'ABRIL_2025'
        END;
      `);
      log("Eventos existentes atualizados com o mês e ano correspondentes", "db-update");
    } catch (error) {
      console.error("Erro ao adicionar ou atualizar coluna month_year:", error);
    }
    
    // Criação da tabela team_monthly_points, se ainda não existir
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS team_monthly_points (
          id SERIAL PRIMARY KEY,
          team_id INTEGER NOT NULL,
          month_year TEXT NOT NULL,
          points INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      log("Tabela team_monthly_points criada com sucesso", "db-update");
      
      // Criar índice para acelerar consultas
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_team_monthly_points_team_month 
        ON team_monthly_points (team_id, month_year);
      `);
      log("Índice criado na tabela team_monthly_points", "db-update");
      
    } catch (error) {
      console.error("Erro ao criar tabela team_monthly_points:", error);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar o banco de dados:", error);
    return false;
  }
}