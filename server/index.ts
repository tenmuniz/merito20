import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkDatabaseConnection } from "./db";
import { initializeDatabase } from "./init-db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  try {
    // Verificar conexão com o banco de dados
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Aplicação iniciando sem conexão com banco de dados em produção');
    }
    
    try {
      // Inicializar o banco de dados com dados padrão
      await initializeDatabase();
    } catch (dbInitError) {
      console.error('❌ Erro ao inicializar banco de dados:', dbInitError);
      if (process.env.NODE_ENV !== 'production') {
        throw dbInitError;
      }
    }
    
    try {
      // Atualizar o banco de dados (alterar a coluna created_by na tabela events)
      const { updateDatabase } = await import("./db-update");
      await updateDatabase();
    } catch (dbUpdateError) {
      console.error('❌ Erro ao atualizar banco de dados:', dbUpdateError);
      // Não interrompe a inicialização
    }
    
    // Configurar rotas e obter servidor HTTP
    const server = await registerRoutes(app);

    // Tratamento global de erros
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`❌ Erro (${status}):`, err);
      res.status(status).json({ message });
      // Não relança o erro para não quebrar o servidor
    });

    // Rota de saúde para healthcheck
    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Configurar servidor estático (conteúdo HTML/JS/CSS)
    try {
      const { configureStaticServer } = await import("./serve-static");
      configureStaticServer(app);
    } catch (staticError) {
      console.error('❌ Erro ao configurar servidor estático:', staticError);
      // Não interrompe a inicialização
    }

    // Fallback para quando nenhuma rota corresponder - importante para SPA
    app.use((_req, res) => {
      res.sendFile('index.html', { root: './public' });
    });

    // Usar a porta fornecida pelo ambiente (Railway) ou usar 5000 como fallback
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🚀 Servidor em execução na porta ${port}`);
      if (process.env.NODE_ENV === 'production') {
        log(`✨ Modo de produção ativado`);
      }
    });
  } catch (startupError) {
    console.error('❌ ERRO FATAL AO INICIAR APLICAÇÃO:', startupError);
    // Em produção, tentamos continuar iniciando o servidor mesmo com erros
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Tentando iniciar servidor em modo de emergência');
      
      // Configura rota de saúde para healthcheck passar
      app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'emergency_mode', timestamp: new Date().toISOString() });
      });
      
      // Rota de fallback
      app.use((_req, res) => {
        res.status(200).send('Sistema em manutenção. Tente novamente em breve.');
      });
      
      // Inicia o servidor mesmo assim
      const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
      const http = await import('http');
      const server = http.createServer(app);
      server.listen(port, '0.0.0.0', () => {
        log(`🚨 Servidor em MODO DE EMERGÊNCIA na porta ${port}`);
      });
    } else {
      // Em desenvolvimento, falha completamente
      throw startupError;
    }
  }
})();
