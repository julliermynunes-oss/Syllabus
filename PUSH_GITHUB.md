# 🚀 Como Fazer Push para o GitHub

## Opção 1: Personal Access Token (Mais Fácil)

### Passo 1: Criar o Token

1. **Acesse**: https://github.com/settings/tokens
2. **Clique**: "Generate new token (classic)"
3. **Nome**: `Syllabus Project`
4. **Marque**: ✅ **repo** (checkbox completo)
5. **Generate token**
6. **COPIE** o token (começa com `ghp_...`)

### Passo 2: Fazer Push

Execute no terminal:

```bash
cd /Users/julliermy/Desktop/Syllabus
git push -u origin main
```

Quando pedir:
- **Username**: `Julliermy`
- **Password**: Cole o TOKEN (não sua senha!)

O macOS vai salvar automaticamente no Keychain.

---

## Opção 2: Abrir GitHub Desktop (Mais Visual)

1. Instale: https://desktop.github.com
2. Abra GitHub Desktop
3. File → Add Local Repository
4. Escolha a pasta: `/Users/julliermy/Desktop/Syllabus`
5. Clique em "Publish repository"
6. Pronto!

---

## Opção 3: Web UI do GitHub

1. Acesse: https://github.com/Julliermy/Syllabus
2. Clique em "uploading an existing file"
3. Arraste os arquivos (mas isso é trabalhoso...)

---

## Recomendação

Use a **Opção 1** (Token) - é mais rápida e funciona bem!

Se tiver dúvidas, me diga qual opção prefere! 😊

