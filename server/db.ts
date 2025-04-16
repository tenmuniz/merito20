import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import { join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Obter o diretório atual
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Definir o caminho para o arquivo .env
const envPath = join(__dirname, '..', '.env');

// Verificar e carregar variáveis do arquivo .env se existir
if (fs.existsSync(envPath)) {
  console.log('Carregando variáveis de ambiente do arquivo .env');
  dotenv.config({ path: envPath });
}

// URL de conexão padrão para desenvolvimento local
const DEFAULT_DB_URL = 'postgresql://postgres:postgres@localhost:5432/meritocracia';

// Usar a URL do banco de dados do ambiente ou a URL padrão
const connectionString = process.env.DATABASE_URL || DEFAULT_DB_URL;

console.log(`Conectando ao banco de dados: ${connectionString.split('@')[1] || 'local'}`);

// Opções de conexão com tipos apropriados
interface ConnectionOptions {
  max: number;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

const clientOptions: ConnectionOptions = { 
  max: 10, // número máximo de conexões no pool
};

// Configuração SSL para ambientes de produção e Railway
// No Railway, a DATABASE_URL já contém sslmode=require
if (!connectionString.includes('localhost')) {
  // Se já estiver usando sslmode=require na string de conexão, não precisamos adicionar SSL
  if (!connectionString.includes('sslmode=require')) {
    clientOptions.ssl = { rejectUnauthorized: false };
  }
  console.log('Habilitando SSL para conexão com o banco de dados remoto');
}

// Inicializar a conexão com o PostgreSQL
const client = postgres(connectionString, clientOptions);

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