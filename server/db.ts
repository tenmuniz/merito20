import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Tenta inicializar a conexão com o banco de dados Neon
let sql: any;
let db: NeonHttpDatabase<typeof schema> | any;

try {
  if (!process.env.DATABASE_URL) {
    console.error('⚠️ DATABASE_URL não está definida!');
    if (process.env.NODE_ENV === 'production') {
      console.error('Erro crítico em produção: DATABASE_URL não definida');
    }
  } else {
    sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
    console.log('✅ Configuração inicial do banco de dados concluída');
  }
} catch (error) {
  console.error('❌ Erro ao configurar banco de dados:', error);
  // Em produção, criamos um objeto dummy para não quebrar a aplicação
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Criando conexão dummy para ambiente de produção');
    db = {
      select: () => ({ from: () => ({ where: () => [] }) }),
      insert: () => ({ values: () => ({ returning: () => [] }) }),
      delete: () => ({ where: () => ({ returning: () => [] }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) })
    };
  }
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