const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();
const { db, verifyIdToken } = require('./firebaseAdmin');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
// Default to a currently supported model; can be overridden by GROQ_MODEL in .env
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.2-11b-text-preview';
const GROQ_MODEL_FALLBACKS = [
  GROQ_MODEL,
  'llama-3.2-90b-text-preview',
  'llama-3.2-11b-text-preview',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
];

console.log("Chave da Groq:", GROQ_API_KEY ? "Encontrada" : "Não encontrada");
console.log("Modelo Groq:", GROQ_MODEL);

// Função para formatar a resposta da IA com markdown limpo e visual
function formatarResposta(texto) {
  texto = texto.trim();

  // Remove "O" sozinho no início
  if (texto.startsWith('O ')) {
    texto = texto.slice(2);
  }

  // Corrige títulos em negrito (transforma **TEXTO** em MAIÚSCULO)
  texto = texto.replace(/\*\*(.*?)\*\*/g, (_, grupo) => grupo.toUpperCase());

  // Remove quebras de bloco/caixas desnecessárias
  const linhas = texto
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  return linhas.join('\n');
}

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend (pasta public)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Healthcheck da API
app.get('/api/health', (req, res) => {
  res.json({ message: 'Servidor funcionando!', status: 'OK' });
});

// Histórico em memória por sessão (fallback se Firestore não estiver configurado)
const conversas = new Map();

// Chat: requer auth para persistir histórico por usuário
app.post('/api/chat', verifyIdToken, async (req, res) => {
  try {
    console.log("Recebido:", req.body);

    if (!GROQ_API_KEY) {
      console.error("Chave da API Groq não definida!");
      return res.status(500).json({ error: "Chave da API Groq não definida!" });
    }

    const userMessage = req.body.message;
    const lowerMsg = (userMessage || '').toLowerCase();
    const fatLossKeywords = [
      'perder gordura',
      'perda de gordura',
      'queimar gordura',
      'emagrecer',
      'cutting',
      'definição',
      'secar'
    ];
    const ignoreProfileMeta = fatLossKeywords.some(k => lowerMsg.includes(k));
    let sessionId = req.body.sessionId || 'default';
    const providedTitle = (req.body.title || '').toString().trim();
    const userId = req.user?.uid || 'anon';

    // Carrega perfil do usuário (se disponível) para personalizar a orientação
    let userProfile = null;
    if (db && req.user?.uid) {
      try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        const data = userDoc.exists ? userDoc.data() : {};
        userProfile = data.profile || null;
      } catch (e) {
        console.warn('Falha ao carregar perfil do usuário:', e);
      }
    }

    // Se Firestore estiver disponível, carrega histórico do usuário/sessão
    let historico = [];
    if (db) {
      const sessionsColl = db.collection('users').doc(userId).collection('sessions');
      let ref;
      if (!req.body.sessionId || sessionId === 'default') {
        ref = sessionsColl.doc();
        sessionId = ref.id;
      } else {
        ref = sessionsColl.doc(sessionId);
      }
      const doc = await ref.get();
      historico = doc.exists && Array.isArray(doc.data().messages) ? doc.data().messages : [];
    } else {
      if (!conversas.has(sessionId)) {
        conversas.set(sessionId, []);
      }
      historico = conversas.get(sessionId);
    }

    // Adiciona nova mensagem do usuário
    historico.push({ role: "user", content: userMessage });

    // Mantém até as últimas 10 mensagens
    if (historico.length > 10) historico.shift();

    // Monta bloco de perfil considerando se devemos ignorar a meta nesta solicitação
    const perfilTexto = userProfile ? `- Peso: ${userProfile.peso || 'não informado'}
- Altura: ${userProfile.altura || 'não informada'}
- Meta: ${ignoreProfileMeta ? 'ignorar; foco no objetivo desta solicitação' : (userProfile.meta || 'não informada')}
- Problemas/Restrições: ${userProfile.problemas || 'não informados'}` : '- Perfil não disponível. Faça recomendações gerais, com variações para diferentes níveis.';

    const systemMessage = {
      role: "system",
      content: `Você é um personal trainer profissional experiente brasileiro. Sua função é fornecer orientações precisas, seguras e personalizadas sobre exercícios físicos, treinamento e condicionamento físico.

INFORMAÇÕES DO PERFIL DO USUÁRIO (use para personalizar as recomendações, níveis, cargas, riscos e exemplos):
${perfilTexto}

REGRAS OBRIGATÓRIAS:
1. Use nomes de exercícios comuns no Brasil (ex: "Supino Reto" em vez de "Bench Press")
2. Inclua o nome em inglês entre parênteses apenas na primeira menção
3. Mantenha o contexto da conversa - se o usuário pedir outro exercício para o mesmo músculo, ofereça uma alternativa diferente
4. Seja direto e específico nas respostas
5. Use formatação clara com títulos em negrito, listas e espaçamento adequado
6. Mantenha um tom profissional mas flexível
7. Nunca diga "Você gostou?" ou "Você quer outra opção?" no final. Apenas responda diretamente a pergunta. Espere o usuário pedir outra opção, se quiser.
8. Não pergunte nada ao final da resposta. Apenas entregue a explicação ou instrução.
9. Se a solicitação atual for específica (ex: "perder gordura"), priorize a solicitação atual, mesmo que conflite com a meta salva no perfil. Apenas considere peso/altura/restrições para segurança.

COMPORTAMENTO ESPECÍFICO:
1. Quando o usuário pedir exercícios para um grupo muscular (ex: "exercícios para peito"):
   - Primeiro liste 4-6 exercícios relevantes
   - Aguarde o usuário escolher qual quer ver em detalhes
   - Só então forneça a explicação detalhada do exercício escolhido

2. Ao listar exercícios, use este formato:
   Aqui estão alguns exercícios excelentes para treinar [grupo muscular]:

   1. [Nome do exercício] (nome em inglês)
   2. [Nome do exercício] (nome em inglês)
   3. [Nome do exercício] (nome em inglês)
   4. [Nome do exercício] (nome em inglês)
   5. [Nome do exercício] (nome em inglês)

   Qual deles você gostaria de ver explicado em detalhes?

3. Ao explicar um exercício específico, use este formato:
   [NOME DO EXERCÍCIO]

   POSICIONAMENTO:
   - Instrução 1
   - Instrução 2

   MOVIMENTO:
   - Passo 1
   - Passo 2

   SÉRIES E REPETIÇÕES:
   - 3 séries de 12 repetições

   ALTERNATIVA MAIS SIMPLES:
   - Nome do exercício alternativo (nome em inglês) - breve explicação

   Lembre-se: mantenha a técnica correta e controle o movimento.

${ignoreProfileMeta ? 'PARA ESTA SOLICITAÇÃO: O foco é perder gordura. Ignore metas de hipertrofia salvas no perfil.' : ''}`
    };

    // Discover available models from API and try in preferred order with fallbacks
    let apiResponse = null;
    let lastErrorText = '';
    let candidateModels = [];
    try {
      const modelsResp = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}` }
      });
      if (modelsResp.ok) {
        const modelsJson = await modelsResp.json();
        const availableIds = Array.isArray(modelsJson.data) ? modelsJson.data.map(m => m.id) : [];
        // Preferred order if available in the account
        const preferred = [
          'llama-3.2-90b-text-preview',
          'llama-3.2-11b-text-preview',
          'mixtral-8x7b-32768',
          'gemma2-9b-it'
        ];
        candidateModels = [
          ...preferred.filter(id => availableIds.includes(id)),
          ...(availableIds.length ? availableIds : [])
        ];
      }
    } catch (_) {
      // ignore discovery errors and rely on static fallbacks
    }
    // Always append static fallbacks and ensure uniqueness, keeping order
    const seen = new Set();
    candidateModels = [...(candidateModels.length ? candidateModels : []), ...GROQ_MODEL_FALLBACKS]
      .filter(id => {
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

    for (const candidateModel of candidateModels) {
      console.log('Tentando modelo Groq:', candidateModel);
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: candidateModel,
          messages: [
            systemMessage,
            ...historico
          ],
          temperature: 0.8,
          max_tokens: 2000,
          presence_penalty: 0.6,
          frequency_penalty: 0.6
        })
      });

      if (response.ok) {
        apiResponse = response;
        break;
      }

      const text = await response.text();
      lastErrorText = text;
      try {
        const json = JSON.parse(text);
        const code = json?.error?.code || '';
        if (response.status === 400 && code === 'model_decommissioned') {
          console.warn('Modelo descontinuado, tentando próximo fallback...');
          continue;
        }
      } catch (_) {
        // ignore JSON parse errors and break
      }
      // If it's some other error, stop trying
      console.error("Erro API Groq:", response.status, text);
      return res.status(500).json({ error: "Erro na API Groq: " + response.status });
    }

    if (!apiResponse) {
      console.error("Erro API Groq após fallbacks:", lastErrorText);
      return res.status(500).json({ error: "Erro na API Groq: modelo descontinuado. Atualize GROQ_MODEL no .env." });
    }

    const data = await apiResponse.json();
    console.log("Resposta da API:", data);

    const conteudo = data.choices[0].message.content;
    historico.push({ role: "assistant", content: conteudo });

    // Persiste histórico no Firestore por usuário/sessão
    if (db) {
      const ref = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
      const title = providedTitle || (historico.find(m => m.role === 'user')?.content || '').slice(0, 60);
      await ref.set({ messages: historico, updatedAt: new Date(), title }, { merge: true });
    } else {
      conversas.set(sessionId, historico);
    }

    const respostaFormatada = formatarResposta(conteudo);
    res.json({ reply: respostaFormatada, sessionId });

  } catch (error) {
    console.error("Erro no backend:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Rotas de perfil (protegidas)
app.get('/api/profile', verifyIdToken, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore não configurado' });
    const userId = req.user.uid;
    const snap = await db.collection('users').doc(userId).get();
    const data = snap.exists ? snap.data() : {};
    res.json(data.profile || {});
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

app.post('/api/profile', verifyIdToken, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore não configurado' });
    const userId = req.user.uid;
    const profile = req.body;
    await db.collection('users').doc(userId).set({ profile, updatedAt: new Date() }, { merge: true });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao salvar perfil:', err);
    res.status(500).json({ error: 'Erro ao salvar perfil' });
  }
});

// Listar sessões do usuário
app.get('/api/sessions', verifyIdToken, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore não configurado' });
    const userId = req.user.uid;
    const qs = await db.collection('users').doc(userId).collection('sessions').orderBy('updatedAt', 'desc').get();
    const sessions = [];
    qs.forEach(doc => sessions.push({ id: doc.id, ...doc.data() }));
    res.json(sessions.map(s => ({ id: s.id, updatedAt: s.updatedAt, title: s.title || s.id })));
  } catch (err) {
    console.error('Erro ao listar sessões:', err);
    res.status(500).json({ error: 'Erro ao listar sessões' });
  }
});

// Obter mensagens de uma sessão específica
app.get('/api/sessions/:id', verifyIdToken, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore não configurado' });
    const userId = req.user.uid;
    const sessionId = req.params.id;
    const ref = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Sessão não encontrada' });
    const { messages = [], title = sessionId } = doc.data();
    res.json({ messages, title });
  } catch (err) {
    console.error('Erro ao obter sessão:', err);
    res.status(500).json({ error: 'Erro ao obter sessão' });
  }
});

// Excluir uma sessão específica
app.delete('/api/sessions/:id', verifyIdToken, async (req, res) => {
  try {
    const sessionId = req.params.id;

    if (!db) {
      // Fallback em memória (apenas limpa histórico local se existir)
      if (conversas.has(sessionId)) {
        conversas.delete(sessionId);
        return res.json({ ok: true, fallback: true });
      }
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    const userId = req.user.uid;
    const ref = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Sessão não encontrada' });
    await ref.delete();
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao excluir sessão:', err);
    res.status(500).json({ error: 'Erro ao excluir sessão' });
  }
});

// Servir index.html na raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// SPA fallback para qualquer rota que não seja /api/*
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
