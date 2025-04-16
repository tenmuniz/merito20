#!/bin/sh

# Este script constrói a aplicação para produção
echo "Construindo aplicação para produção..."

# Construir frontend com Vite
echo "Construindo frontend com Vite..."
npm run build

# Construir healthcheck
echo "Construindo healthcheck..."
esbuild server/healthcheck.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/healthcheck.js

echo "Build completo!"