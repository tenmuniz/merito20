#!/bin/bash
echo "===== BUILDING APPLICATION WITH RESET ADMIN SCRIPT ====="

# Execute o build normal primeiro
npm run build

# Compile o script reset-admin.ts para o diretório dist
echo "Compilando script reset-admin.ts..."
npx esbuild server/reset-admin.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completo com reset-admin.js incluído em dist/"