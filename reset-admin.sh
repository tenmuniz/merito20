#!/bin/bash

echo "==================================================="
echo "SISTEMA DE RESET DE ADMINISTRADOR - MERITROCACIA"
echo "==================================================="
echo
echo "Este comando irá resetar o usuário administrador para:"
echo "Usuário: admin"
echo "Senha: admin123"
echo
echo "ATENÇÃO: Execute este comando apenas em casos de emergência"
echo "quando não conseguir mais acessar o sistema como administrador."
echo

read -p "Deseja continuar com o reset? (S/N): " CONFIRM

if [[ "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo
    echo "Executando reset do administrador..."
    npx tsx server/reset-admin.ts
    echo
    echo "Processo concluído. Tente fazer login com admin/admin123"
    echo
    read -p "Pressione ENTER para continuar..."
else
    echo
    echo "Operação cancelada pelo usuário."
    echo
    read -p "Pressione ENTER para continuar..."
fi