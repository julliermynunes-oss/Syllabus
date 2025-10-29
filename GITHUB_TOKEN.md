# Como Obter um Personal Access Token do GitHub

## Passo 1: Criar o Token

1. Acesse: https://github.com/settings/tokens
2. Clique em "**Generate new token**" → "**Generate new token (classic)**"
3. Preencha:
   - **Note**: `Syllabus Project`
   - **Expiration**: Escolha por quanto tempo (ex: 90 dias)
   - **Select scopes**: Marque **✅ repo** (tudo relacionado a repositórios)
4. Clique em "**Generate token**"
5. **COPIE O TOKEN** (você só verá uma vez!)

---

## Passo 2: Fazer o Push

No terminal, execute:

```bash
cd /Users/julliermy/Desktop/Syllabus

# Fazer push (use o token quando pedir a senha)
git push -u origin main
```

Quando pedir:
- **Username**: `Julliermy`
- **Password**: Cole o token que você copiou (não é sua senha do GitHub!)

---

## Alternativa: Usar SSH (mais seguro a longo prazo)

Se preferir usar SSH em vez de HTTPS:

```bash
# Mudar para SSH
cd /Users/julliermy/Desktop/Syllabus
git remote set-url origin git@github.com:Julliermy/Syllabus.git
git push -u origin main
```

