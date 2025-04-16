import { Express } from "express";
import path from "path";
import fs from "fs";
import express from "express";

/**
 * Configura o servidor para servir a página HTML estática
 */
export function configureStaticServer(app: Express) {
  const publicPath = path.join(process.cwd(), "public");
  
  // Verificar se a pasta public existe
  if (!fs.existsSync(publicPath)) {
    console.log(`Pasta 'public' não encontrada em ${publicPath}`);
    return;
  }
  
  // Servir arquivos estáticos da pasta public
  app.use(express.static(publicPath));
  
  // Configurar rota principal para servir o index.html
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).send('API endpoint não encontrado');
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
  
  console.log(`Servidor estático configurado para servir arquivos de ${publicPath}`);
}