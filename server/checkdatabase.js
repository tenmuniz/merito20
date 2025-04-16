// Script para verificar a conexão com o banco de dados 
// e criar variáveis de ambiente padrão se necessário
import pg from 'pg';
const { Pool } = pg;

async function checkDatabaseAndSetDefaults() {
  // Se DATABASE_URL não estiver definida, criar um valor padrão para evitar falhas
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ ALERTA: DATABASE_URL não está definida');
    
    // Em produção, definir uma URL padrão para permitir que o aplicativo inicie
    if (process.env.NODE_ENV === 'production') {
      console.log('🔧 Definindo variável DATABASE_URL padrão para ambientes sem banco de dados');
      process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/postgres';
    }
  } else {
    // Se DATABASE_URL estiver definida, testar a conexão
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Timeout de conexão mais curto para não travar
        connectionTimeoutMillis: 5000
      });
      
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        console.log('✅ Conexão com banco de dados bem-sucedida');
      } finally {
        client.release();
        await pool.end();
      }
    } catch (error) {
      console.error('❌ Erro ao conectar ao banco de dados:', error.message);
      console.warn('⚠️ Aplicação continuará sem acesso ao banco de dados');
    }
  }
}

// Executar a verificação
checkDatabaseAndSetDefaults().catch(err => {
  console.error('Erro fatal na verificação do banco de dados:', err);
  // Não falhar completamente, apenas avisar
});

export default checkDatabaseAndSetDefaults;