@echo off
echo ===================================================
echo SISTEMA DE RESET DE ADMINISTRADOR - MERITROCACIA
echo ===================================================
echo.
echo Este comando ira resetar o usuario administrador para:
echo Usuario: admin
echo Senha: admin123
echo.
echo ATENCAO: Execute este comando apenas em casos de emergencia
echo quando nao conseguir mais acessar o sistema como administrador.
echo.

set /p CONFIRM=Deseja continuar com o reset? (S/N): 

if /i "%CONFIRM%"=="S" (
    echo.
    echo Executando reset do administrador...
    npx tsx server/reset-admin.ts
    echo.
    echo Processo concluido. Tente fazer login com admin/admin123
    echo.
    pause
) else (
    echo.
    echo Operacao cancelada pelo usuario.
    echo.
    pause
)