# Personal Trainer IA

Um assistente de personal trainer inteligente que usa IA para fornecer orientações personalizadas sobre exercícios e treinamento.

## 🚀 Tecnologias

- **Backend**: Node.js + Express
- **IA**: Groq API (Llama 3.2)
- **Banco de Dados**: Firebase Firestore
- **Autenticação**: Firebase Auth
- **Deploy**: Railway (24/7 gratuito)

## 🔧 Configuração Local

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd personal-trainer-ia
```

2. Instale as dependências:
```bash
cd backend
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env com suas chaves
```

4. Execute o servidor:
```bash
npm start
```

## 🌐 Deploy Automático

O projeto está configurado para deploy automático no Railway:

- **Push para main/master** → Deploy automático
- **Hospedagem 24/7 gratuita**
- **Integração com GitHub**

## 📋 Variáveis de Ambiente Necessárias

```env
GROQ_API_KEY=sua_chave_groq
GROQ_MODEL=llama-3.2-11b-text-preview
FIREBASE_PROJECT_ID=seu_projeto_firebase
FIREBASE_PRIVATE_KEY=sua_chave_privada
FIREBASE_CLIENT_EMAIL=seu_email_cliente
```

## 🏃‍♂️ Como Usar

1. Acesse a aplicação web
2. Faça login com Google
3. Configure seu perfil físico
4. Comece a conversar com o personal trainer IA!

## 📱 API Endpoints

- `GET /` - Status do servidor
- `POST /api/chat` - Chat com a IA
- `GET /api/profile` - Obter perfil do usuário
- `POST /api/profile` - Salvar perfil do usuário
- `GET /api/sessions` - Listar sessões de chat
- `GET /api/sessions/:id` - Obter mensagens de uma sessão
- `DELETE /api/sessions/:id` - Excluir uma sessão

## 🔒 Segurança

- Autenticação Firebase obrigatória
- Validação de tokens JWT
- Rate limiting implementado
- Dados sensíveis em variáveis de ambiente

## 📈 Monitoramento

- Health checks automáticos
- Logs estruturados
- Métricas de performance
- Alertas de erro

---

**Status**: ✅ Produção | **Deploy**: Automático via GitHub | **Uptime**: 24/7
