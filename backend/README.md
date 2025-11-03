# Backend - Personal Trainer IA

Este é o servidor backend para o aplicativo Personal Trainer IA.

## Configuração

1. Certifique-se de que o Node.js está instalado
2. Instale as dependências:
   ```bash
   npm install
   ```

## Como Iniciar o Servidor

### Opção 1: Usando o arquivo batch (Windows)
```bash
iniciar-servidor.bat
```

### Opção 2: Usando npm
```bash
npm start
```

### Opção 3: Usando node diretamente
```bash
node index.js
```

## Endpoints

- `GET /` - Rota de teste (retorna status do servidor)
- `POST /api/chat` - Endpoint principal para chat com a IA

## Porta

O servidor roda na porta **3001** por padrão.

## Variáveis de Ambiente

O arquivo `.env` deve conter:
```
GROQ_API_KEY=sua_chave_api_aqui
```

## Testando o Servidor

Após iniciar o servidor, você pode testar acessando:
- http://localhost:3001

## Solução de Problemas

1. **Servidor não inicia**: Verifique se todas as dependências estão instaladas
2. **Erro de API**: Verifique se a chave da API Groq está configurada no arquivo `.env`
3. **Porta em uso**: O servidor usa a porta 3001 por padrão

## Como Parar o Servidor

Pressione `Ctrl+C` no terminal onde o servidor está rodando. 