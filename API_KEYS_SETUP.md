# Configuração de API Keys

## Google Books API

A API do Google Books **não requer** uma API key para uso básico. Ela está funcionando sem configuração adicional.

## Google Scholar via SerpApi

Para usar a busca do Google Scholar, você precisa de uma API key do SerpApi:

### Passos para obter a API key:

1. Acesse: https://serpapi.com/users/sign_up
2. Crie uma conta gratuita (100 pesquisas/mês no plano gratuito)
3. Copie sua API key do dashboard

### Configuração:

1. Crie um arquivo `.env` na raiz do projeto (se não existir)
2. Adicione a linha:
   ```
   REACT_APP_SERPAPI_KEY=sua_api_key_aqui
   ```
3. Reinicie o servidor de desenvolvimento

### Exemplo de arquivo .env:

```
REACT_APP_SERPAPI_KEY=abc123def456ghi789
```

### Nota:

- A API key do SerpApi é necessária apenas para a busca no Google Scholar
- As buscas em Artigos (Crossref) e Livros (Google Books) funcionam sem API key
- Não compartilhe sua API key publicamente

