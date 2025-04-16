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
  console.log(`${colors.blue}Construindo servidor com esbuild...${colors.reset}`);
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', 
    { stdio: 'inherit' });

  // Verificar se o diretório dist existe, se não, criá-lo
  if (!fs.existsSync(path.join(__dirname, '..', 'dist'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'dist'));
  }

  // Copiar o arquivo healthcheck.ts para a pasta dist
  console.log(`${colors.yellow}Preparando healthcheck...${colors.reset}`);
  execSync('esbuild server/healthcheck.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/healthcheck.js', 
    { stdio: 'inherit' });

  console.log(`${colors.green}Build concluído com sucesso!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Erro durante o build:${colors.reset}`, error);
  process.exit(1);
}