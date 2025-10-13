@echo off
chcp 65001 >nul
setlocal enableextensions

rem Ir para a pasta deste arquivo (backend)
cd /d "%~dp0"

echo Iniciando Backend (porta 3001)
echo Diretorio: %cd%
echo.

where node >nul 2>&1 || (
  echo ERRO: Node.js nao encontrado no PATH. Instale: https://nodejs.org
  pause & exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias...
  call npm install --no-audit --no-fund || (echo Falha no npm install & pause & exit /b 1)
)

if exist .env (
  echo .env encontrado.
) else (
  echo AVISO: arquivo .env NAO encontrado em %cd%
)

echo.
echo Executando: npm start
echo (Ctrl+C para parar)
echo.
call npm start
echo.
echo Servidor finalizado.
pause


