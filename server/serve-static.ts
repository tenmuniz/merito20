import { Express } from "express";
import path from "path";
import fs from "fs";
import express from "express";

/**
 * Configura o servidor para servir a página HTML estática
 */
export function configureStaticServer(app: Express) {
  // Buscamos o arquivo estático no diretório public da raiz
  const publicPath = path.join(process.cwd(), "public");
  
  // Verificar se a pasta public existe
  if (!fs.existsSync(publicPath)) {
    console.error(`⚠️ ERRO: Pasta 'public' não encontrada em ${publicPath}`);
    // Listar diretórios para debug
    try {
      console.log("Diretórios disponíveis na raiz:");
      const dirs = fs.readdirSync(process.cwd());
      console.log(dirs);
    } catch (error) {
      console.error("Erro ao listar diretórios:", error);
    }
    return;
  }
  
  // Verificar se o index.html existe
  const indexPath = path.join(publicPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`⚠️ ERRO: Arquivo index.html não encontrado em ${indexPath}`);
    try {
      console.log("Arquivos disponíveis em public:");
      const files = fs.readdirSync(publicPath);
      console.log(files);
    } catch (error) {
      console.error("Erro ao listar arquivos:", error);
    }
    return;
  }
  
  // Servir arquivos estáticos do diretório public
  app.use(express.static(publicPath, {
    etag: true, // Ativar etag para cache de browser
    lastModified: true, // Enviar cabeçalho Last-Modified
    maxAge: '1d' // Cache de 1 dia
  }));
  
  // Rota catch-all para SPA - serve o index.html para todas as rotas não-API
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint não encontrado' });
    }
    res.sendFile(indexPath);
  });
  
  console.log(`Servidor estático configurado para servir arquivos de ${publicPath}`);
}