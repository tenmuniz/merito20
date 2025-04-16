import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Verificar se a variável de ambiente DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('ERRO: A variável de ambiente DATABASE_URL não está definida!');
  console.error('Certifique-se de definir DATABASE_URL no ambiente ou no arquivo .env');
  // Não interrompemos a execução, mas continuamos com um aviso
  console.warn('Tentando iniciar sem conexão com o banco de dados...');
}

// Variável para armazenar a instância SQL
let sqlInstance: any;
let dbInstance: any;

// Função para inicializar a conexão com o banco de dados
function initializeDatabase() {
  try {
    sqlInstance = neon(process.env.DATABASE_URL || '');
    dbInstance = drizzle(sqlInstance, { schema });
    console.log('Conexão com o banco de dados inicializada');
    return true;
  } catch (error) {
    console.error('Falha ao inicializar a conexão com o banco de dados:', error);
    return false;
  }
}

// Inicializa a conexão com o banco de dados
initializeDatabase();

// Exporta a instância do banco de dados
export const sql = sqlInstance;
export const db = dbInstance;

// Função para reconectar ao banco de dados
async function reconnectDatabase(maxRetries = 5, retryDelay = 5000) {
  let retries = 0;
  let connected = false;

  while (!connected && retries < maxRetries) {
    try {
      console.log(`Tentativa de reconexão ${retries + 1}/${maxRetries}...`);
      if (initializeDatabase()) {
        connected = true;
        console.log('Reconexão bem-sucedida!');
        return true;
      }
    } catch (error) {
      console.error(`Falha na tentativa de reconexão ${retries + 1}:`, error);
    }

    retries++;
    if (!connected && retries < maxRetries) {
      console.log(`Aguardando ${retryDelay/1000} segundos antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  if (!connected) {
    console.error(`Falha após ${maxRetries} tentativas de reconexão.`);
  }
  return connected;
}

// Função para verificar a conexão com o banco de dados
export async function checkDatabaseConnection() {
  try {
    // Executa uma consulta simples para verificar se a conexão está funcionando
    const result = await sql`SELECT 1 as connected`;
    const isConnected = result[0]?.connected === 1;
    console.log('Database connection successful:', isConnected);
    return isConnected;
  } catch (error) {
    console.error('Database connection failed:', error);
    
    // Tenta reconectar automaticamente
    console.log('Iniciando processo de reconexão automática...');
    const reconnected = await reconnectDatabase();
    
    if (reconnected) {
      console.log('Banco de dados reconectado com sucesso!');
      return true;
    } else {
      console.error('Não foi possível reconectar ao banco de dados.');
      return false;
    }
  }
}