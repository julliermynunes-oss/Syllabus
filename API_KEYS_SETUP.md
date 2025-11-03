# Configuração de API Keys

> **IMPORTANTE**: Todas as API keys devem ser configuradas nas variáveis de ambiente do servidor (Railway), não no frontend.

## Google Books API

A API do Google Books **não requer** uma API key para uso básico. Ela está funcionando sem configuração adicional.

## Google Scholar via SerpApi

Para usar a busca do Google Scholar, você precisa de uma API key do SerpApi configurada no servidor.

### Passos para obter a API key:

1. Acesse: https://serpapi.com/users/sign_up
2. Crie uma conta gratuita (100 pesquisas/mês no plano gratuito)
3. Copie sua API key do dashboard

### Configuração no Railway:

1. Acesse o dashboard do Railway
2. Vá em seu projeto → Variables
3. Adicione a variável:
   - **Nome**: `SERPAPI_KEY`
   - **Valor**: `sua_api_key_aqui`
4. O servidor será reiniciado automaticamente

### Nota:

- A API key é armazenada no servidor, não no frontend
- As buscas em Artigos (Crossref) e Livros (Google Books) funcionam sem API key
- Não compartilhe sua API key publicamente

## Amazon Product Advertising API 5.0

Para usar a busca da Amazon Books, você precisa configurar credenciais AWS.

### Passos para obter as credenciais:

1. Acesse: https://webservices.amazon.com/paapi5/documentation/
2. Registre-se como Amazon Associate (se ainda não for)
3. Crie credenciais AWS (Access Key ID e Secret Access Key)
4. Obtenha seu Associate Tag

### Configuração no Railway:

1. Acesse o dashboard do Railway
2. Vá em seu projeto → Variables
3. Adicione as seguintes variáveis:
   - **Nome**: `AWS_ACCESS_KEY_ID` | **Valor**: `sua_access_key_id`
   - **Nome**: `AWS_SECRET_ACCESS_KEY` | **Valor**: `sua_secret_access_key`
   - **Nome**: `AWS_ASSOCIATE_TAG` | **Valor**: `seu_associate_tag`
   - **Nome**: `AWS_REGION` | **Valor**: `us-east-1` (opcional, padrão)
   - **Nome**: `AWS_MARKETPLACE` | **Valor**: `www.amazon.com` (opcional, padrão)
4. O servidor será reiniciado automaticamente

### Requisitos:

- Você precisa ser um Amazon Associate aprovado
- Algumas contas precisam ter gerado pelo menos 3 vendas qualificadas nos últimos 30 dias
- Consulte a documentação oficial: https://webservices.amazon.com/paapi5/documentation/

### Nota:

- Todas as credenciais são armazenadas no servidor, nunca no frontend
- As credenciais devem ser chaves raiz (ROOT), não IAM

