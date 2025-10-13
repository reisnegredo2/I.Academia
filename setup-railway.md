# 🚀 Guia de Setup no Railway

## Passo 1: Criar Conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em "Login" e faça login com sua conta GitHub
3. Autorize as permissões do Railway

## Passo 2: Conectar Repositório

1. No dashboard do Railway, clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Escolha seu repositório `personal-trainer-ia`
4. Railway detectará automaticamente o Dockerfile

## Passo 3: Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione:

```env
GROQ_API_KEY=sua_chave_groq_aqui
GROQ_MODEL=llama-3.2-11b-text-preview
FIREBASE_PROJECT_ID=seu_projeto_firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua_chave_privada_aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=seu_email_service_account@projeto.iam.gserviceaccount.com
PORT=3001
NODE_ENV=production
```

## Passo 4: Configurar GitHub Actions (Opcional)

1. No Railway, vá em **Settings** → **Connect GitHub**
2. Copie o `RAILWAY_TOKEN`
3. No GitHub, vá em **Settings** → **Secrets and variables** → **Actions**
4. Adicione os secrets:
   - `RAILWAY_TOKEN`: token copiado do Railway
   - `RAILWAY_SERVICE_ID`: ID do serviço (encontrado na URL do Railway)

## Passo 5: Deploy Automático

✅ **Pronto!** Agora quando você fizer push para `main` ou `master`:

1. GitHub Actions executará os testes
2. Railway fará o deploy automático
3. Seu servidor estará online 24/7

## 🌐 Acessar sua Aplicação

Após o deploy, você receberá uma URL como:
`https://seu-projeto.up.railway.app`

## 📊 Monitoramento

- **Logs**: Disponível no dashboard do Railway
- **Métricas**: CPU, memória, rede em tempo real
- **Uptime**: Monitoramento automático
- **Scaling**: Automático baseado na demanda

## 💰 Custos

- **Plano Gratuito**: $5 de crédito/mês (suficiente para projetos pequenos)
- **Uptime**: 24/7 sem interrupções
- **SSL**: Certificado automático e gratuito

## 🔧 Comandos Úteis

```bash
# Instalar Railway CLI (opcional)
npm install -g @railway/cli

# Login via CLI
railway login

# Deploy via CLI
railway up

# Ver logs
railway logs

# Abrir no browser
railway open
```
