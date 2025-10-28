# Como Colocar o Projeto no GitHub

## Passo 1: Instalar o Git (se ainda não tiver)

O Git já vem instalado no macOS na maioria dos casos. Para verificar:
```bash
git --version
```

Se não tiver instalado, baixe em: https://git-scm.com/downloads

---

## Passo 2: Configurar o Git (primeira vez apenas)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@gmail.com"
```

---

## Passo 3: Inicializar o repositório Git

No terminal, dentro da pasta do projeto:

```bash
cd /Users/julliermy/Desktop/Syllabus
git init
```

---

## Passo 4: Adicionar arquivos e fazer commit

```bash
# Ver quais arquivos serão adicionados
git status

# Adicionar todos os arquivos (exceto os do .gitignore)
git add .

# Fazer o primeiro commit
git commit -m "Initial commit - Sistema de gerenciamento de syllabi"
```

---

## Passo 5: Criar repositório no GitHub

1. **Acesse https://github.com** e faça login
2. **Clique no botão "+"** no canto superior direito
3. **Escolha "New repository"**
4. **Preencha:**
   - Repository name: `Syllabus` (ou o nome que preferir)
   - Description: "Sistema de gerenciamento de syllabi universitários"
   - Escolha **Public** ou **Private**
   - **NÃO** marque "Add a README file" (já temos arquivos)
   - **NÃO** marque "Add .gitignore" (já temos)
   - **NÃO** marque "Choose a license"
5. **Clique em "Create repository"**

---

## Passo 6: Conectar com o GitHub e enviar código

O GitHub vai mostrar comandos. Use estes:

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/SEU-USUARIO/Syllabus.git

# (Substitua SEU-USUARIO pelo seu username do GitHub)

# Enviar o código
git branch -M main
git push -u origin main
```

**Nota:** Você pode precisar fazer login no GitHub. Se usar autenticação por HTTPS, use um Personal Access Token em vez da senha.

---

## Como criar um Personal Access Token (se necessário)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Marque: `repo`
4. Generate token
5. Copie o token (use ele no lugar da senha quando fizer push)

---

## Passo 7: Verificar que funcionou

Acesse: `https://github.com/SEU-USUARIO/Syllabus`

Você deve ver todos os arquivos do projeto lá!

---

## Comandos úteis para o futuro

```bash
# Ver status das mudanças
git status

# Adicionar arquivos modificados
git add .

# Fazer commit das mudanças
git commit -m "Descrição das mudanças"

# Enviar para o GitHub
git push
```

---

## Próximo passo

Depois que o código estiver no GitHub, siga o guia no arquivo **DEPLOY.md** para fazer deploy no Railway!

