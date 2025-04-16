import { Express } from "express";
import path from "path";
import fs from "fs";
import express from "express";

/**
 * Configura o servidor para servir a página HTML estática
 */
export function configureStaticServer(app: Express) {
  // Possíveis locais onde o diretório public pode estar
  const possiblePaths = [
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "dist", "public")
  ];
  
  // Verificar qual diretório existe
  let publicPath = null;
  let indexPath = null;
  
  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      const testIndexPath = path.join(dirPath, 'index.html');
      if (fs.existsSync(testIndexPath)) {
        publicPath = dirPath;
        indexPath = testIndexPath;
        break;
      } else {
        console.log(`Diretório ${dirPath} existe, mas não contém index.html`);
        try {
          if (fs.existsSync(dirPath)) {
            console.log(`Conteúdo de ${dirPath}:`);
            const files = fs.readdirSync(dirPath);
            console.log(files.join(', '));
          }
        } catch (error: any) {
          console.error(`Erro ao listar arquivos em ${dirPath}:`, error.message);
        }
      }
    }
  }
  
  if (!publicPath || !indexPath) {
    console.error(`⚠️ ERRO: Não foi possível encontrar um diretório público válido com index.html`);
    // Listar diretórios na raiz para debug
    try {
      console.log("Diretórios disponíveis na raiz:");
      const dirs = fs.readdirSync(process.cwd());
      console.log(dirs.join(', '));
    } catch (error: any) {
      console.error("Erro ao listar diretórios:", error.message);
    }
    return;
  }
  
  // Servir arquivos estáticos do diretório public encontrado
  app.use(express.static(publicPath, {
    etag: true,           // Ativar etag para cache de browser
    lastModified: true,   // Enviar cabeçalho Last-Modified
    maxAge: '1d'          // Cache de 1 dia
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