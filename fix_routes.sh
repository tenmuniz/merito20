#!/bin/bash

# Arquivo a ser modificado
FILE="server/routes.ts"

# Lista de linhas que contêm endpoints
ENDPOINTS=$(grep -n "app\.\(get\|post\|put\|patch\|delete\)" $FILE | grep -v "req: Request" | cut -d ":" -f 1)

# Fazer substituições
for LINE in $ENDPOINTS; do
  # Obter linha atual
  CURRENT=$(sed "${LINE}q;d" $FILE)
  
  # Criar nova linha com tipos
  NEW=$(echo "$CURRENT" | sed 's/async (req, res)/async (req: Request, res: Response)/g')
  
  # Substituir no arquivo
  sed -i "${LINE}s/.*/$NEW/" $FILE
done

echo "Tipos corrigidos em ${FILE}"
