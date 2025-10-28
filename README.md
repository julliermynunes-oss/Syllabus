# Syllabus - Sistema de Gerenciamento de Syllabi Universitários

Sistema web para criação e gerenciamento automatizado de syllabi universitários.

## 🚀 Funcionalidades

- **Autenticação**: Login, registro e recuperação de senha
- **Listagem de Syllabi**: Visualização de todos os syllabi cadastrados
- **Busca**: Pesquisa por Programa ou Disciplina
- **Cadastro/Edição**: Formulário completo para criação e edição de syllabi
- **Autocomplete**: Integração com dados Excel para autocompletar Curso e Disciplina
- **Múltiplos Professores**: Adicionar vários professores ao syllabus

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

## 🔧 Instalação

1. Clone ou baixe o projeto
2. Instale as dependências do backend:
```bash
npm install
```

3. Instale as dependências do frontend:
```bash
cd client
npm install
cd ..
```

Ou use o comando automático:
```bash
npm run install-all
```

## 🏃 Como executar

Execute o comando para iniciar tanto o backend quanto o frontend:

```bash
npm run dev
```

O sistema estará acessível em:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## 📁 Estrutura do Projeto

```
Syllabus/
├── client/                 # Aplicação React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   └── context/        # Context API
│   └── package.json
├── server.js              # Backend Express
├── syllabus.db            # Banco de dados SQLite
├── Base Dados Programas.xlsx  # Base de dados de programas e disciplinas
└── package.json
```

## 🗄️ Banco de Dados

O sistema usa SQLite para armazenar:
- Usuários
- Syllabi
- Programas (carregados do Excel)
- Disciplinas (carregadas do Excel)

A base de dados será criada automaticamente na primeira execução.

## 📊 Integração com Excel

O arquivo `Base Dados Programas.xlsx` contém os programas e disciplinas disponíveis. Este arquivo é lido automaticamente ao iniciar o servidor e os dados são importados para o banco de dados.

## 🔑 Registro de Usuário

Para usar o sistema:
1. Acesse a tela de login
2. Clique em "Cadastre-se"
3. Preencha: Nome completo, Email e Senha
4. Faça login com suas credenciais

## 📝 Criando um Syllabus

1. Após fazer login, clique em "Adicionar Novo Syllabus"
2. Preencha todos os campos do formulário
3. Use a busca para programas e disciplinas (autocomplete)
4. Adicione quantos professores forem necessários clicando no botão +
5. Salve o syllabus

## 🎨 Tecnologias Utilizadas

- **Frontend**: React, React Router, Axios, React Icons
- **Backend**: Node.js, Express, SQLite3
- **Autenticação**: JWT (JSON Web Tokens), bcrypt
- **Processamento**: xlsx (para ler arquivos Excel)
- **PDF**: PDFKit (para futura geração de PDFs)

## 📝 Licença

Este projeto é de uso interno.

