import 'dotenv/config'; // Carregar variáveis de ambiente no início
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { checkDatabaseConnection } from "./db";
import { initializeDatabase } from "./init-db";
import { configureStaticServer } from "./serve-static";

// Definir variável de ambiente
const isDevelopment = process.env.NODE_ENV !== 'production';

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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rota de healthcheck para o Railway
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    if (dbConnected) {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'connected',
        environment: process.env.NODE_ENV || 'development'
      });
    } else {
      return res.status(500).json({ 
        status: 'error', 
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        message: 'Problema na conexão com banco de dados' 
      });
    }
  } catch (error: any) {
    return res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      message: error.message 
    });
  }
});

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

(async () => {
  // Verificar conexão com o banco de dados
  await checkDatabaseConnection();
  
  // Inicializar o banco de dados com dados padrão
  await initializeDatabase();
  
  // Atualizar o banco de dados (alterar a coluna created_by na tabela events)
  const { updateDatabase } = await import("./db-update");
  await updateDatabase();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Configurar servidor estático
  // Em produção, usamos apenas a configuração estática simples
  configureStaticServer(app);

  // Usar a porta definida no ambiente ou 5000 como fallback
  // No Railway, a porta é definida pela variável de ambiente PORT
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
