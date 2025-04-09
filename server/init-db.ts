import { db } from './db';
import { teams, users, type InsertTeam, type InsertUser } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Inicializa o banco de dados com dados padrão.
 * Este script cria as tabelas (se não existirem) e adiciona dados iniciais.
 */
export async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // Verificar se as equipes já existem e criar as padrão se não existirem
    const existingTeams = await db.select().from(teams);
    
    if (existingTeams.length === 0) {
      console.log('🛠️ Criando equipes padrão...');
      // Criar as equipes padrão: Alfa, Bravo, Charlie
      const defaultTeams: InsertTeam[] = [
        { name: "Alfa", colorCode: "#3b82f6", points: 0 },
        { name: "Bravo", colorCode: "#10b981", points: 0 },
        { name: "Charlie", colorCode: "#ef4444", points: 0 }
      ];
      
      for (const team of defaultTeams) {
        await db.insert(teams).values(team);
      }
      console.log('✅ Equipes padrão criadas com sucesso!');
    } else {
      console.log('ℹ️ Equipes já existem no banco de dados');
    }
    
    // Verificar se o usuário administrador já existe e criar um se não existir
    const adminUser = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (adminUser.length === 0) {
      console.log('🛠️ Criando usuário administrador padrão...');
      // Criar o usuário administrador
      const defaultAdmin: InsertUser = {
        username: "admin",
        password: "admin123", // Em uma aplicação real, seria hashed
        fullName: "Administrador",
        isAdmin: true
      };
      
      await db.insert(users).values(defaultAdmin);
      console.log('✅ Usuário administrador criado com sucesso!');
    } else {
      console.log('ℹ️ Usuário administrador já existe no banco de dados');
    }
    
    console.log('✅ Inicialização do banco de dados concluída!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar o banco de dados:', error);
    return false;
  }
}