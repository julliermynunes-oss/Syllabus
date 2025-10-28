# Como Fazer Deploy da Aplicação no Railway

## Pré-requisitos
1. Conta no GitHub (gratuita)
2. Conta no Railway (gratuita - acesse https://railway.app)

## Passo 1: Subir o código para o GitHub

```bash
# Se ainda não fez, inicialize o repositório
git init
git add .
git commit -m "Initial commit"

# Crie um repositório no GitHub e depois:
git remote add origin https://github.com/SEU-USUARIO/Syllabus.git
git branch -M main
git push -u origin main
```

**IMPORTANTE:** NÃO faça commit do arquivo `syllabus.db` (banco de dados). Crie um arquivo `.gitignore`:

```
# Banco de dados
syllabus.db

# Dependências
node_modules/
client/node_modules/

# Build
client/build/

# Logs
*.log

# Environment
.env
```

## Passo 2: Fazer Deploy no Railway

1. **Acesse https://railway.app** e faça login com sua conta do GitHub

2. **Clique em "New Project"**

3. **Selecione "Deploy from GitHub repo"**

4. **Autorize o Railway a acessar seu GitHub**

5. **Selecione o repositório "Syllabus"**

6. **Railway vai detectar automaticamente e começar o build**

7. **Configure as Variáveis de Ambiente** (se necessário):
   - Vá em "Variables"
   - Adicione: `NODE_ENV=production`
   - Adicione: `JWT_SECRET=sua-chave-secreta-forte-aqui`

8. **Configure o Domínio**:
   - Vá em "Settings" > "Networking"
   - Clique em "Generate Domain" para ter uma URL grátis
   - Ou configure um domínio customizado

## Passo 3: Acessar sua Aplicação

Após o deploy (pode levar 5-10 minutos), você terá uma URL como:
```
https://syllabus-production-xxxx.up.railway.app
```

## Pontos Importantes

### Banco de Dados
- O Railway reinicia a aplicação periodicamente
- O SQLite (`syllabus.db`) pode perder dados
- Para produção séria, recomende-se usar PostgreSQL (Railway oferece isso também)

### Fornecendo dados iniciais (Curso.csv e Disciplina.csv)
- Certifique-se de que esses arquivos estão commitados no GitHub
- Eles serão carregados automaticamente na inicialização

### Custo
- Railway oferece $5 grátis/mês
- Para uso leve (como esta aplicação), geralmente fica dentro do free tier
- Verifique seu uso em "Settings" > "Usage"

## Alternativas Gratuitas

### Render.com
Similar ao Railway:
- Acesse https://render.com
- "New" > "Web Service"
- Conecte seu repositório GitHub
- Build Command: `cd client && npm install && npm run build && cd .. && npm install`
- Start Command: `npm start`

### Vercel (só frontend)
Para usar Vercel + Railway:
1. Deploy do backend no Railway
2. Deploy do frontend no Vercel
3. Configure a variável `VITE_API_URL` ou `REACT_APP_API_URL` apontando para o Railway

## Monitoramento

- Logs: Clique no serviço no Railway e veja "Deploy Logs"
- Métricas: Veja uso de CPU, memória, etc. em tempo real
- Alerts: Configure alertas se a aplicação cair

## Troubleshooting

### Build falha
- Verifique os logs no Railway
- Certifique-se de que todas as dependências estão em `package.json`

### Erro de CORS
- Railway serve frontend e backend no mesmo domínio, então não deve ter problemas de CORS

### Banco de dados não persiste
- Use PostgreSQL oferecido pelo Railway (mais robusto)
- Ou considere usar um serviço externo de banco de dados

## Atualizações Futuras

Quando você fizer mudanças no código:
1. Faça commit no GitHub
2. Railway detecta automaticamente
3. Faz um novo deploy em alguns minutos

Boa sorte! 🚀

