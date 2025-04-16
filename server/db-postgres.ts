import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Verificar se a variável de ambiente DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('ERRO: A variável de ambiente DATABASE_URL não está definida!');
  console.error('Certifique-se de definir DATABASE_URL no ambiente ou no arquivo .env');
  console.warn('Tentando iniciar sem conexão com o banco de dados...');
}

// Inicializa a conexão com o banco de dados usando neon
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Função para verificar a conexão com o banco de dados
export async function checkDatabaseConnection() {
  try {
    // Executa uma consulta simples para verificar se a conexão está funcionando
    const result = await sql`SELECT 1 as connected`;
    const isConnected = result[0]?.connected === 1;
    console.log('Conexão com o banco de dados PostgreSQL estabelecida com sucesso:', isConnected);
    return isConnected;
  } catch (error) {
    console.error('Falha na conexão com o banco de dados:', error);
    return false;
  }
}

// Função para reconectar ao banco de dados (não aplicável para neon, mas mantida para compatibilidade)
export async function reconnectDatabase() {
  console.log('Tentando reconectar ao banco de dados...');
  try {
    const isConnected = await checkDatabaseConnection();
    return isConnected;
  } catch (error) {
    console.error('Erro na tentativa de reconexão:', error);
    return false;
  }
}