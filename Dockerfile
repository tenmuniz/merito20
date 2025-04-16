FROM node:18-alpine AS builder

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código-fonte
COPY . .

# Construir aplicação
RUN mkdir -p dist
# Compilar frontend com vite
RUN echo "Building frontend..."
RUN npx vite build
# Compilar backend com esbuild
RUN echo "Building backend..."
RUN npx esbuild server/prod-index.ts --platform=node --packages=external --external:vite --external:@vitejs/plugin-react --external:@replit/vite-plugin-* --bundle --format=esm --outfile=dist/index.js
# Compilar healthcheck
RUN echo "Building healthcheck..."
RUN npx esbuild server/healthcheck.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/healthcheck.js
# Listar arquivos gerados para debug
RUN ls -la dist/

# Imagem de produção
FROM node:18-alpine AS production

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5000

# Instalar ferramentas necessárias
RUN apk add --no-cache curl

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências e package.json
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar arquivos compilados e públicos
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Debug - listar arquivos copiados
RUN echo "Listando diretórios após cópia:" && ls -la && \
    echo "Conteúdo de ./dist:" && ls -la ./dist && \
    echo "Conteúdo de ./public:" && ls -la ./public

# Expor porta
EXPOSE 5000

# Verificar conexão com banco de dados antes de iniciar
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/health || echo "Healthcheck falhou!" && exit 1

# Iniciar aplicação
CMD ["node", "dist/index.js"]