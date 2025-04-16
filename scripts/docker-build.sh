#!/bin/sh

# Este script constrói a aplicação para produção
echo "Construindo aplicação para produção..."

# Criar diretório de saída se não existir
mkdir -p dist

# Construir frontend com Vite
echo "Construindo frontend com Vite..."
npx vite build

# Construir servidor e healthcheck
echo "Construindo servidor e healthcheck..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
npx esbuild server/healthcheck.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/healthcheck.js

echo "Build completo!"