import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Este script serve para resetar o usuário administrador quando
 * houver problemas com a autenticação no Railway ou outros ambientes.
 * Pode ser executado diretamente via:
 * 
 * npm run reset-admin
 * 
 * ou
 * 
 * npx tsx server/reset-admin.ts
 */
async function resetAdminUser() {
  try {
    console.log('🔄 Iniciando reset do usuário administrador...');
    
    // Verificar conexão com o banco de dados
    try {
      console.log('🔍 Verificando conexão com o banco de dados...');
      
      await db.select().from(users).limit(1);
      
      console.log('✅ Conexão com o banco de dados bem-sucedida.');
    } catch (error) {
      console.error('❌ Erro ao conectar ao banco de dados:', error);
      return false;
    }
    
    // 1. Buscar usuário admin existente
    const adminUsers = await db.select().from(users).where(eq(users.username, 'admin'));
    
    // 2. Remover usuário admin existente, se houver
    if (adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      console.log(`🔄 Removendo usuário admin existente (ID: ${adminUser.id})...`);
      
      await db.delete(users).where(eq(users.id, adminUser.id));
      console.log('✅ Usuário admin removido com sucesso.');
    } else {
      console.log('⚠️ Nenhum usuário admin encontrado no banco de dados.');
    }
    
    // 3. Criar um novo usuário admin com a senha padrão
    console.log('🔄 Criando novo usuário administrador...');
    
    const newAdmin = await db.insert(users).values({
      username: 'admin',
      password: 'admin123',
      fullName: 'Administrador',
      isAdmin: true
    }).returning();
    
    if (newAdmin.length > 0) {
      console.log(`✅ Novo usuário admin criado com sucesso. ID: ${newAdmin[0].id}`);
      console.log('🔐 Credenciais padrão: admin / admin123');
      return true;
    } else {
      console.error('❌ Falha ao criar novo usuário admin.');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao resetar usuário admin:', error);
    return false;
  }
}

// Executar diretamente se chamado como script
resetAdminUser().then(success => {
  if (success) {
    console.log('✅ Processo de reset do usuário admin concluído com sucesso.');
  } else {
    console.error('❌ Processo de reset do usuário admin falhou.');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Erro não tratado:', error);
  process.exit(1);
});