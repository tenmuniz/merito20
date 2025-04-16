import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Inicializa a conexão com o banco de dados Neon
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Função para verificar a conexão com o banco de dados
export async function checkDatabaseConnection() {
  try {
    // Executa uma consulta simples para verificar se a conexão está funcionando
    const result = await sql`SELECT 1 as connected`;
    console.log('Database connection successful:', result[0]?.connected === 1);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}