import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// URL padrão para SQLite em memória (para modo de emergência)
const DEFAULT_DB_URL = 'postgres://postgres:postgres@localhost:5432/postgres';

// Tenta inicializar a conexão com o banco de dados Neon
let sql: any;
let db: NeonHttpDatabase<typeof schema> | any;

// Em qualquer ambiente, sempre criar o db dummy primeiro para garantir que continue funcionando
db = {
  select: () => ({ from: () => ({ where: () => [] }) }),
  insert: () => ({ values: () => ({ returning: () => [] }) }),
  delete: () => ({ where: () => ({ returning: () => [] }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) })
};

// URL de conexão - usa DEFAULT_DB_URL se DATABASE_URL não estiver definida
const connectionString = process.env.DATABASE_URL || DEFAULT_DB_URL;

try {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL não está definida! Usando conexão padrão.');
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Aplicação em produção usando conexão padrão. Dados podem ser perdidos.');
    }
  }
  
  sql = neon(connectionString);
  db = drizzle(sql, { schema });
  console.log('✅ Configuração inicial do banco de dados concluída');
} catch (error) {
  console.error('❌ Erro ao configurar banco de dados:', error);
  console.warn('⚠️ Usando implementação dummy do banco de dados');
}

export { db };

// Função para verificar a conexão com o banco de dados
export async function checkDatabaseConnection() {
  try {
    if (!sql) {
      console.error('SQL client não inicializado');
      return false;
    }
    // Executa uma consulta simples para verificar se a conexão está funcionando
    const result = await sql`SELECT 1 as connected`;
    const isConnected = result[0]?.connected === 1;
    console.log('Database connection successful:', isConnected);
    return isConnected;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}