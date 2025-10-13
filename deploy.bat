@echo off
echo 🚀 Iniciando deploy do Personal Trainer IA...
echo.

echo 📝 Adicionando arquivos ao Git...
git add .

echo 💬 Fazendo commit...
git commit -m "Deploy: Atualização automática $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

echo 🔄 Enviando para GitHub...
git push origin main

echo.
echo ✅ Deploy iniciado! 
echo 🌐 Acesse seu Railway dashboard para acompanhar o progresso
echo 📊 Logs disponíveis em: https://railway.app/dashboard
echo.
pause
