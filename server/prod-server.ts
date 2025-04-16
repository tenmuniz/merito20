/**
 * Arquivo específico para produção.
 * Não contém nenhuma referência ou importação de módulos de desenvolvimento (como Vite)
 */

// Importar fs primeiro para que possamos usá-lo para carregar as variáveis de ambiente
import fs from "fs";
// Configurar variáveis de ambiente primeiro, antes de qualquer importação
import dotenv from 'dotenv';
// Tentar carregar variáveis de ambiente de diferentes locais possíveis
try {
  const envPaths = ['./.env', '../.env', '/app/.env'];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`Carregando variáveis de ambiente de ${envPath}`);
      dotenv.config({ path: envPath });
      break;
    }
  }
} catch (e) {
  console.log('Não foi possível carregar arquivo .env, usando variáveis de ambiente do sistema');
}

// Mostrar as variáveis de ambiente disponíveis (apenas os nomes, não os valores)
console.log('Variáveis de ambiente disponíveis:', Object.keys(process.env).join(', '));
console.log('DATABASE_URL definida:', !!process.env.DATABASE_URL);

// Continuar com as importações normais
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer, type Server } from "http";
import { checkDatabaseConnection, db } from './db';
import { initializeDatabase } from './init-db';
import { storage } from './storage';
import { teams, events } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { type InsertEvent } from '@shared/schema';

// Obter diretório atual
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Função utilitária para log
export function log(message: string, source = "express") {
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

// Rota de healthcheck para o Railway
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    if (dbConnected) {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'connected',
        environment: process.env.NODE_ENV || 'production'
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

// Função para configurar o serviço de arquivos estáticos
export function serveStatic(app: express.Express) {
  // Procurar em vários diretórios onde os arquivos estáticos podem estar
  const possiblePaths = [
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "dist", "public")
  ];
  
  // Verificar qual diretório existe
  let publicPath = null;
  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath) && fs.existsSync(path.join(dirPath, 'index.html'))) {
      publicPath = dirPath;
      break;
    } else {
      log(`Diretório ${dirPath} não encontrado ou não contém index.html`, "static");
      try {
        if (fs.existsSync(dirPath)) {
          log(`Conteúdo de ${dirPath}:`, "static");
          const files = fs.readdirSync(dirPath);
          log(files.join(', '), "static");
        }
      } catch (error: any) {
        log(`Erro ao listar arquivos em ${dirPath}: ${error.message}`, "error");
      }
    }
  }
  
  if (!publicPath) {
    log('ERRO: Não foi possível encontrar diretório public válido', "error");
    // Listar todos os arquivos na raiz para debug
    log('Arquivos na raiz:', "debug");
    try {
      const rootFiles = fs.readdirSync(process.cwd());
      log(rootFiles.join(', '), "debug");
    } catch (error: any) {
      log(`Erro ao listar arquivos na raiz: ${error.message}`, "error");
    }
    return;
  }
  
  log(`Configurando servidor estático para servir arquivos de ${publicPath}`, "static");
  
  // Servir arquivos estáticos com configurações de cache
  app.use(express.static(publicPath, {
    etag: true,
    lastModified: true,
    maxAge: '1d' // Cache de 1 dia
  }));
  
  // Rota catch-all para SPA - envia index.html para todas as rotas não-API
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint não encontrado' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Registrar as rotas da API
function registerProductionRoutes(app: express.Express): Server {
  // Rota raiz para verificação básica
  app.get("/", (req, res) => {
    res.status(200).send(`
      <html>
        <head>
          <title>Sistema de Meritocracia 20ª CIPM - API</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #3b82f6; }
            .message { background-color: #f0f9ff; padding: 15px; border-radius: 5px; }
            .nav { margin-top: 20px; }
            .nav a { display: inline-block; margin-right: 10px; background-color: #3b82f6; color: white; 
                    padding: 8px 16px; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Sistema de Meritocracia 20ª CIPM</h1>
          <div class="message">
            <p>👋 A API está funcionando corretamente.</p>
            <p>Versão: 1.0.0</p>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div class="nav">
            <a href="/health">Verificar Status</a>
            <a href="/api/teams">Ver Equipes</a>
          </div>
        </body>
      </html>
    `);
  });

  // API Routes 
  // Teams
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      // Convertendo para o formato esperado pelo cliente
      const formattedTeams = teams.map(team => ({
        id: team.id,
        name: team.name,
        colorCode: team.colorCode,
        points: team.points
      }));
      res.json(formattedTeams);
    } catch (error: any) {
      console.error("Erro ao buscar equipes:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar equipes" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Equipe não encontrada" });
      }
      
      res.json({
        id: team.id,
        name: team.name,
        colorCode: team.colorCode,
        points: team.points
      });
    } catch (error: any) {
      console.error("Erro ao buscar equipe por ID:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar equipe" });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      const formattedEvents = events.map(event => ({
        id: event.id,
        teamId: event.teamId,
        type: event.type,
        description: event.description,
        points: event.points,
        officersInvolved: event.officersInvolved,
        createdBy: event.createdBy,
        eventDate: event.eventDate,
        createdAt: event.createdAt
      }));
      res.json(formattedEvents);
    } catch (error: any) {
      console.error("Erro ao buscar eventos:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar eventos" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      res.json({
        id: event.id,
        teamId: event.teamId,
        type: event.type,
        description: event.description,
        points: event.points,
        officersInvolved: event.officersInvolved,
        createdBy: event.createdBy,
        eventDate: event.eventDate,
        createdAt: event.createdAt
      });
    } catch (error: any) {
      console.error("Erro ao buscar evento por ID:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar evento" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const { teamId, type, description, points, createdBy, eventDate } = req.body;
      
      // Validações básicas
      if (!teamId || !type || !description || !points) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }
      
      // Verificar se a equipe existe
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Equipe não encontrada" });
      }
      
      // Criar o evento com a data do evento
      console.log('Data recebida do cliente:', eventDate);
      const eventDateObj = eventDate ? new Date(eventDate) : new Date();
      console.log('Data convertida para objeto:', eventDateObj);
      
      const newEvent = await storage.createEvent({
        teamId,
        type,
        description,
        points,
        officersInvolved: "Guarnição", // Valor padrão para manter compatibilidade com o banco de dados
        createdBy: createdBy || "Admin",
        eventDate: eventDateObj
      });
      
      res.status(201).json(newEvent);
    } catch (error: any) {
      console.error("Erro ao criar evento:", error);
      res.status(500).json({ message: error.message || "Erro ao criar evento" });
    }
  });
  
  app.put("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      // Verificar se o evento existe
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Evento não encontrado" });
      }
      
      const { teamId, type, description, points, eventDate } = req.body;
      
      // Validações básicas
      if (teamId) {
        // Verificar se a equipe existe
        const team = await storage.getTeam(teamId);
        if (!team) {
          return res.status(404).json({ message: "Equipe não encontrada" });
        }
      }
      
      // Dados para atualização
      const updateData: Partial<InsertEvent> = {};
      if (teamId !== undefined) updateData.teamId = teamId;
      if (type !== undefined) updateData.type = type;
      if (description !== undefined) updateData.description = description;
      if (points !== undefined) updateData.points = points;
      updateData.officersInvolved = "Guarnição"; // Valor padrão para manter compatibilidade
      if (eventDate !== undefined) {
        console.log('Data de edição recebida do cliente:', eventDate);
        updateData.eventDate = new Date(eventDate);
        console.log('Data de edição convertida para objeto:', updateData.eventDate);
      }
      
      // Atualizar o evento
      const updatedEvent = await storage.updateEvent(id, updateData);
      
      res.json(updatedEvent);
    } catch (error: any) {
      console.error("Erro ao atualizar evento:", error);
      res.status(500).json({ message: error.message || "Erro ao atualizar evento" });
    }
  });

  // Reset API - para zerar todos os eventos e pontos
  app.post("/api/reset", async (req, res) => {
    try {
      // Usar o método da interface de storage para resetar os dados
      await storage.resetAllData();
      
      res.json({ success: true, message: "Todos os eventos foram excluídos e os pontos zerados." });
    } catch (error: any) {
      console.error("Erro ao resetar dados:", error);
      res.status(500).json({ message: error.message || "Erro ao resetar dados" });
    }
  });

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Não enviar a senha na resposta
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Erro no login:", error);
      res.status(500).json({ message: error.message || "Erro no login" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Middleware para tratamento de erros
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  log(`Erro: ${status} - ${message}`, "error");
  res.status(status).json({ message });
});

// Função para atualizar o banco de dados
async function updateDatabase() {
  try {
    // Alterar o tipo da coluna created_by para TEXT
    log("[db-update] Alterando coluna created_by para tipo TEXT", "db-update");
    try {
      // Usando SQL direto, pois o Drizzle não suporta mudança de tipo nativamente
      await db.execute(sql`ALTER TABLE events ALTER COLUMN created_by TYPE TEXT`);
      log("[db-update] Coluna created_by alterada com sucesso para o tipo TEXT", "db-update");
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        log("[db-update] Coluna created_by já é do tipo TEXT", "db-update");
      } else {
        console.error("[db-update] Erro ao alterar coluna created_by:", error);
      }
    }

    // Adicionar coluna event_date à tabela events se não existir
    log("[db-update] Adicionando coluna event_date à tabela events", "db-update");
    try {
      await db.execute(sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      log("[db-update] Coluna event_date adicionada com sucesso à tabela events", "db-update");
    } catch (error) {
      console.error("[db-update] Erro ao adicionar coluna event_date:", error);
    }
  } catch (error) {
    console.error("[db-update] Erro ao atualizar banco de dados:", error);
  }
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
    await updateDatabase();
    
    // Registrar rotas da API (versão de produção)
    const server = registerProductionRoutes(app);
    
    // Configurar servidor estático
    serveStatic(app);
    
    // Iniciar servidor HTTP
    const port = process.env.PORT || 5000;
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
    }, () => {
      log(`Servidor iniciado na porta ${port} [PRODUÇÃO]`);
    });
  } catch (error) {
    console.error("Erro fatal na inicialização do servidor:", error);
    process.exit(1);
  }
})();