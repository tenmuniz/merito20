import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Verificar se a URL do banco de dados está definida
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida no ambiente. Configure a variável de ambiente DATABASE_URL.');
}

// Inicializar a conexão com o PostgreSQL
// Esta configuração funciona tanto localmente quanto no Railway
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { 
  max: 10, // número máximo de conexões no pool
  ssl: process.env.NODE_ENV === 'production', // habilitar SSL em produção (Railway)
});

export const db = drizzle(client, { schema });

// Função para verificar a conexão com o banco de dados
export async function checkDatabaseConnection() {
  try {
    // Executa uma consulta simples para verificar se a conexão está funcionando
    const result = await client`SELECT 1 as connected`;
    console.log('Database connection successful:', result[0]?.connected === 1);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}