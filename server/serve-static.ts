import { Express } from "express";
import path from "path";
import fs from "fs";
import express from "express";

/**
 * Configura o servidor para servir a página HTML estática
 */
export function configureStaticServer(app: Express) {
  // No ambiente de produção, o conteúdo estático é copiado para `dist/public` pelo script de build do Vite
  // Em desenvolvimento, ele está em `/public`
  const isProduction = process.env.NODE_ENV === 'production';
  const publicPath = isProduction 
    ? path.join(process.cwd(), "dist/public") 
    : path.join(process.cwd(), "public");
  
  // Verificar se a pasta public existe
  if (!fs.existsSync(publicPath)) {
    console.error(`❌ Pasta '${isProduction ? 'dist/public' : 'public'}' não encontrada em ${publicPath}`);
    
    // Verificar alternativas - isso é crítico para o deploy no Railway
    const alternatives = [
      path.join(process.cwd(), "public"),
      path.join(process.cwd(), "dist/public"),
      path.join(process.cwd(), "dist"),
      path.join(process.cwd(), "../public"),
      path.join(process.cwd(), "../dist/public")
    ];
    
    for (const alt of alternatives) {
      if (fs.existsSync(alt)) {
        console.log(`✅ Usando caminho alternativo para arquivos estáticos: ${alt}`);
        // Usar o primeiro caminho alternativo que funcionar
        return configureStaticServerWithPath(app, alt);
      }
    }
    
    console.warn(`⚠️ Nenhuma pasta alternativa encontrada. Continuando sem servir arquivos estáticos.`);
    return;
  }
  
  return configureStaticServerWithPath(app, publicPath);
}

/**
 * Configura o servidor para servir arquivos estáticos de um caminho específico
 */
function configureStaticServerWithPath(app: Express, publicPath: string) {
  
  // Servir arquivos estáticos da pasta public
  app.use(express.static(publicPath));
  
  // Rota específica para o healthcheck do Railway
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Configurar rota principal para servir o index.html
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint não encontrado' });
    }
    
    // Tenta servir o arquivo index.html
    try {
      const indexPath = path.join(publicPath, 'index.html');
      // Verifica se o arquivo index.html existe
      if (!fs.existsSync(indexPath)) {
        console.error(`Arquivo index.html não encontrado em ${indexPath}`);
        return res.status(200).send('Aplicação em manutenção. Servidor está funcionando.');
      }
      res.sendFile(indexPath);
    } catch (error) {
      console.error('Erro ao servir index.html:', error);
      res.status(200).send('Aplicação em manutenção. Servidor está funcionando.');
    }
  });
  
  console.log(`Servidor estático configurado para servir arquivos de ${publicPath}`);
}