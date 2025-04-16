/**
 * Este script executa uma verificação de saúde do aplicativo,
 * verificando a conexão com o banco de dados.
 * Usado pelo Railway para determinar se o aplicativo está funcionando corretamente.
 */
import { checkDatabaseConnection } from './db';

async function healthCheck() {
  try {
    console.log('Iniciando verificação de saúde...');
    
    // Verificar conexão com o banco de dados
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      console.error('Falha na verificação de saúde: não foi possível conectar ao banco de dados');
      process.exit(1);
    }
    
    console.log('Verificação de saúde concluída com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('Erro durante a verificação de saúde:', error);
    process.exit(1);
  }
}

healthCheck();