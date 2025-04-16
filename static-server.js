// Um servidor mínimo que serve apenas arquivos estáticos
// Útil para ambientes como Railway onde precisamos de um servidor simples e confiável

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve arquivos estáticos do diretório public
const staticDirs = [
  path.join(__dirname, 'public'),
  path.join(__dirname, './public'),
  path.join(__dirname, '/app/public'),
  '/app/public'
];

let foundDir = false;

for (const dir of staticDirs) {
  try {
    if (fs.existsSync(dir)) {
      console.log(`Servindo arquivos estáticos de ${dir}`);
      app.use(express.static(dir));
      foundDir = true;
      break;
    }
  } catch (err) {
    console.error(`Erro ao verificar diretório ${dir}:`, err);
  }
}

if (!foundDir) {
  console.warn('Nenhum diretório estático encontrado. Apenas API será servida.');
}

// Rota para o healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota para qualquer outra requisição (fallback para index.html)
app.get('*', (req, res) => {
  if (foundDir) {
    res.sendFile(path.join(staticDirs[0], 'index.html'));
  } else {
    res.status(200).send('<html><body><h1>Servidor em manutenção</h1><p>Por favor, tente novamente mais tarde.</p></body></html>');
  }
});

// Inicia o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor estático rodando na porta ${PORT}`);
});