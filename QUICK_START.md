# 🚀 Guia Rápido: GitHub + Railway

## 1️⃣ Colocar no GitHub (5 minutos)

```bash
# Na pasta do projeto
cd /Users/julliermy/Desktop/Syllabus

# Inicializar Git
git init

# Adicionar arquivos
git add .

# Primeiro commit
git commit -m "Initial commit"

# Conectar com GitHub (SUBSTITUA SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/Syllabus.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

**Lembrete:** Crie o repositório no GitHub primeiro: https://github.com/new

---

## 2️⃣ Deploy no Railway (10 minutos)

1. Acesse: https://railway.app
2. Login com GitHub
3. New Project → Deploy from GitHub repo
4. Selecione seu repositório
5. Pronto! 🎉

---

## 📚 Documentação Completa

- **GITHUB_SETUP.md** - Detalhes sobre GitHub
- **DEPLOY.md** - Detalhes sobre Railway

---

## ⚡ Próximas Atualizações

Quando fizer mudanças no código:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

O Railway detecta automaticamente e faz novo deploy!

