/**
 * Versão simplificada do index.ts para produção
 * Não depende de nenhuma importação de desenvolvimento como o Vite
 */

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { checkDatabaseConnection } from "./db";
import { initializeDatabase } from "./init-db";

// Obter diretório atual
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Função utilitária para log
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Inicializar aplicação
const app = express();

// Configurar middleware para JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para logging de API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Função para configurar servidor estático
function configureStaticServer() {
  // Servir arquivos estáticos do diretório public
  const publicPath = path.join(process.cwd(), "public");
  log(`Configurando servidor estático para servir arquivos de ${publicPath}`, "static");
  
  app.use(express.static(publicPath));
  
  // Rota catch-all para SPA
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).send('API endpoint não encontrado');
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Inicializar o servidor
(async () => {
  try {
    log("Iniciando servidor em modo produção");
    
    // Verificar conexão com o banco de dados
    const dbConnected = await checkDatabaseConnection();
    log(`Conexão com banco de dados: ${dbConnected ? 'OK' : 'FALHA'}`);
    
    if (!dbConnected) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }
    
    // Inicializar banco de dados
    await initializeDatabase();
    
    // Atualizar banco de dados se necessário
    const { updateDatabase } = await import("./db-update");
    await updateDatabase();
    
    // Registrar rotas da API
    const server = await registerRoutes(app);
    
    // Middleware para tratamento de erros
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      log(`Erro: ${status} - ${message}`, "error");
      res.status(status).json({ message });
    });
    
    // Configurar servidor estático
    configureStaticServer();
    
    // Iniciar servidor HTTP
    const port = process.env.PORT || 5000;
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Servidor iniciado na porta ${port} [PRODUÇÃO]`);
    });
  } catch (error) {
    console.error("Erro fatal na inicialização do servidor:", error);
    process.exit(1);
  }
})();