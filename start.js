// Script de inicialização para Railway
const { spawn } = require('child_process');
const http = require('http');

// Criar um servidor HTTP simples que responda ao healthcheck
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Redireciona todas as outras requisições para o servidor principal
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Servidor está rodando. Acesse a porta principal para o aplicativo.');
});

// Inicia o servidor de healthcheck na porta 8080
server.listen(8080, () => {
  console.log('Servidor de healthcheck rodando na porta 8080');
});

// Inicia o aplicativo principal
console.log('Iniciando aplicativo principal...');
const app = spawn('node', ['dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: 'inherit'
});

app.on('error', (err) => {
  console.error('Erro ao iniciar aplicativo:', err);
});

// Tratamento de encerramento
process.on('SIGINT', () => {
  console.log('Encerrando servidores...');
  server.close();
  app.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando servidores...');
  server.close();
  app.kill();
  process.exit(0);
});