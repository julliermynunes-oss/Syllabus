# 🔑 Como Configurar as APIs (Guia Passo a Passo)

Este guia vai te ajudar a configurar as APIs do Google Scholar e Amazon Books para usar as buscas no sistema.

---

## 📚 Google Scholar (via SerpApi)

### Passo 1: Obter a API Key

1. Acesse https://serpapi.com/users/sign_up
2. Faça login ou crie uma conta gratuita
3. Após criar a conta, você terá acesso ao dashboard
4. No dashboard, procure por "API Key" ou "Your API Key"
5. Clique em "Reveal" ou "Show" para ver sua chave
6. **Copie a chave completa** (ela parece algo como: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### Passo 2: Configurar no Railway

1. Acesse https://railway.app e faça login
2. Clique no seu projeto (provavelmente chamado "Syllabus" ou similar)
3. Clique no serviço (Service) do seu projeto
4. Na barra lateral esquerda, clique em **"Variables"**
5. Clique no botão **"+ New Variable"** ou **"+ Add Variable"**
6. Preencha:
   - **Key** (ou Nome): `SERPAPI_KEY`
   - **Value** (ou Valor): Cole a API key que você copiou
7. Clique em **"Add"** ou **"Save"**
8. O Railway vai **reiniciar automaticamente** o servidor (isso pode levar 30-60 segundos)

### ✅ Como saber se funcionou?

Após o reinício, vá na aplicação e tente fazer uma busca no Google Scholar. Se funcionar, está configurado! 🎉

---

## 🛒 Amazon Books (Amazon Product Advertising API)

### ⚠️ Requisitos Antes de Começar

Você precisa ser um **Amazon Associate aprovado**:
- Ter uma conta Amazon Associate ativa
- Ter gerado pelo menos **3 vendas qualificadas nos últimos 30 dias** (em alguns casos)

### Passo 1: Obter as Credenciais AWS

1. Acesse https://webservices.amazon.com/paapi5/documentation/
2. Leia os requisitos e certifique-se de que você atende aos critérios
3. Acesse o console da Amazon Associates: https://affiliate-program.amazon.com/
4. Faça login com sua conta Amazon Associate
5. Vá em **"Tools"** → **"Product Advertising API"**
6. Clique em **"Manage Your API Keys"**
7. Você vai precisar de três informações:
   - **Access Key ID**: Copie essa chave
   - **Secret Access Key**: Copie essa chave (você só pode ver uma vez!)
   - **Associate Tag**: É o ID da sua conta Associate (algo como: `seusite-20`)

### Passo 2: Configurar no Railway

1. No Railway, vá no mesmo lugar: **Seu Projeto** → **Seu Serviço** → **"Variables"**
2. Adicione as seguintes variáveis (uma de cada vez):

   **Variável 1:**
   - **Key**: `AWS_ACCESS_KEY_ID`
   - **Value**: Cole o Access Key ID que você copiou
   - Clique em **"Add"**

   **Variável 2:**
   - **Key**: `AWS_SECRET_ACCESS_KEY`
   - **Value**: Cole o Secret Access Key que você copiou
   - Clique em **"Add"**

   **Variável 3:**
   - **Key**: `AWS_ASSOCIATE_TAG`
   - **Value**: Cole o Associate Tag (ex: `seusite-20`)
   - Clique em **"Add"**

   **Variáveis Opcionais (mas recomendadas):**
   - **Key**: `AWS_REGION`
   - **Value**: `us-east-1` (ou a região mais próxima de você)

   - **Key**: `AWS_MARKETPLACE`
   - **Value**: `www.amazon.com` (ou o marketplace que você usa, ex: `www.amazon.com.br`)

3. O Railway vai **reiniciar automaticamente** o servidor

### ✅ Como saber se funcionou?

Após o reinício, vá na aplicação e tente fazer uma busca na Amazon Books. Se aparecerem resultados, está funcionando! 🎉

---

## 🆘 Problemas Comuns

### "Google Scholar não está configurado"

**Solução:**
- Verifique se você adicionou a variável `SERPAPI_KEY` no Railway
- Certifique-se de que copiou a chave completa (sem espaços antes/depois)
- Aguarde o servidor reiniciar (pode levar 1-2 minutos)
- Tente fazer uma busca novamente

### "Amazon Books não está configurado"

**Solução:**
- Verifique se você adicionou **TODAS** as três variáveis:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_ASSOCIATE_TAG`
- Certifique-se de que você é um Amazon Associate **aprovado**
- Verifique se suas credenciais não expiraram
- Aguarde o servidor reiniciar

### "Erro 401" ou "Não autorizado"

**Solução:**
- Verifique se você copiou as chaves corretamente (sem espaços extras)
- Para Amazon: verifique se você preencheu todos os requisitos do Associate Program
- Tente recriar as credenciais no console da AWS

### O servidor não reiniciou automaticamente

**Solução:**
1. Vá em **"Deployments"** no Railway
2. Clique nos três pontos do último deployment
3. Selecione **"Redeploy"**

---

## 📝 Resumo Rápido

### Para Google Scholar:
```
Railway → Variables → + New Variable
Key: SERPAPI_KEY
Value: [sua chave do SerpApi]
```

### Para Amazon Books:
```
Railway → Variables → Adicione 3 variáveis:
1. AWS_ACCESS_KEY_ID = [sua access key]
2. AWS_SECRET_ACCESS_KEY = [sua secret key]
3. AWS_ASSOCIATE_TAG = [seu associate tag]
```

---

## 💡 Dicas

- **Não compartilhe suas chaves** publicamente
- As chaves ficam seguras no servidor (Railway), nunca no código
- O plano gratuito do SerpApi dá 100 buscas/mês
- Para Amazon, você precisa ser Associate aprovado
- As buscas de **Crossref** e **Google Books** funcionam sem configuração! ✅

---

## 📞 Precisa de Ajuda?

Se tiver problemas:
1. Verifique os logs no Railway: **Deployments** → **View Logs**
2. Certifique-se de que as variáveis foram salvas corretamente
3. Aguarde alguns minutos após adicionar as variáveis (o servidor precisa reiniciar)

