/**
 * Script para construir o projeto para produção
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual para ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cores para saída do console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}Iniciando processo de build${colors.reset}`);

try {
  // Construir o frontend com vite
  console.log(`${colors.blue}Construindo frontend com Vite...${colors.reset}`);
  execSync('vite build', { stdio: 'inherit' });

  // Construir o servidor com esbuild
  console.log(`${colors.blue}Construindo servidor com esbuild (versão de produção)...${colors.reset}`);
  // Usar prod-server.ts que não tem nenhuma dependência de desenvolvimento
  execSync('esbuild server/prod-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', 
    { stdio: 'inherit' });

  // Verificar se o diretório dist existe, se não, criá-lo
  if (!fs.existsSync(path.join(__dirname, '..', 'dist'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'dist'));
  }

  // Copiar o arquivo healthcheck.ts para a pasta dist
  console.log(`${colors.yellow}Preparando healthcheck...${colors.reset}`);
  execSync('esbuild server/healthcheck.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/healthcheck.js', 
    { stdio: 'inherit' });
  
  // Garantir que todos os arquivos estáticos sejam copiados
  console.log(`${colors.yellow}Copiando arquivos estáticos...${colors.reset}`);
  
  // Função para copiar recursivamente diretórios
  function copyDirSync(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  // Criar um diretório específico para arquivos estáticos no build
  const staticDir = path.join(__dirname, '..', 'dist', 'public');
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
  
  // Copiar todo o conteúdo da pasta public para dist/public
  const publicDir = path.join(__dirname, '..', 'public');
  copyDirSync(publicDir, staticDir);
  
  // Listar os diretórios para debug
  console.log('Conteúdo do diretório de build:');
  execSync('ls -la dist', { stdio: 'inherit' });
  console.log('Conteúdo do diretório público copiado:');
  execSync('ls -la dist/public', { stdio: 'inherit' });

  console.log(`${colors.green}Build concluído com sucesso!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Erro durante o build:${colors.reset}`, error);
  process.exit(1);
}