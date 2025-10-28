# 🚀 Guia de Início Rápido - Sistema Syllabus

## ✅ Status da Aplicação

A aplicação está completa e rodando! Você pode acessá-la em:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 📝 Como Usar

### 1. Primeiro Acesso

1. Abra seu navegador e vá para http://localhost:3000
2. Você verá a tela de login
3. Clique em **"Não tem uma conta? Cadastre-se"**
4. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo recomendado)
   - Confirme a senha
5. Clique em **"Cadastrar"**

### 2. Gerenciando Syllabi

Após fazer login, você verá a tela principal com:

- **Busca por Programa**: Digite para filtrar os syllabi por programa
- **Busca por Disciplina**: Digite para filtrar os syllabi por disciplina
- **Botão +**: Clique para adicionar um novo syllabus

### 3. Criando um Syllabus

1. Clique no botão **"+"** na busca de Disciplina ou no botão **"Adicionar Novo Syllabus"**
2. Preencha os campos:
   - **Curso**: Nome do curso
   - **Disciplina**: Use o autocomplete (digite para buscar)
   - **Semestre/Ano**: Ex: "1º/2025"
   - **Turma**: Ex: "Turma A"
   - **Departamento**: Nome do departamento
   - **Nº Créditos**: Número de créditos
   - **Sem. Curricular**: Ex: "1º Semestre"
   - **Idioma**: Selecione na dropdown
   - **Coordenador**: Nome do coordenador
   - **Professores**: Clique no + para adicionar mais professores
   - **Programa**: Use o autocomplete para buscar programas do Excel
3. Clique em **"Criar Syllabus"**

### 4. Ações Disponíveis

Para cada syllabus na lista, você pode:
- 📝 **Editar** (ícone de lápis)
- 👁️ **Visualizar** (ícone de documento)
- 🗑️ **Deletar** (ícone de lixeira vermelha)

## 🔧 Estrutura de Dados

### Programas Disponíveis

O sistema carrega automaticamente os programas do arquivo Excel `Base Dados Programas.xlsx`:

- CGA - Curso de Graduação em Administração
- CGAP - Curso de Graduação em Administração Pública
- MPA - Mestrado Profissional em Administração
- MPGPP - Mestrado Profissional em Gestão e Políticas Públicas
- E outros...

### Disciplinas Padrão

Cada programa tem as seguintes disciplinas padrão:
- Metodologia Científica
- Ética Profissional
- Gestão de Projetos
- Pesquisa em Administração
- Planejamento Estratégico

## 📊 Funcionalidades Implementadas

✅ Login e Registro de Usuários
✅ Recuperação de Senha (interface pronta)
✅ Listagem de Syllabi
✅ Busca por Programa e Disciplina
✅ Formulário completo de cadastro de syllabus
✅ Autocomplete de Programas e Disciplinas
✅ Múltiplos Professores
✅ Edição de Syllabi
✅ Deleção de Syllabi
✅ Proteção de rotas com autenticação

## 🔄 Próximos Passos Sugeridos

1. **Geração de PDF**: Implementar exportação de syllabus em PDF
2. **Mais Disciplinas**: Adicionar mais disciplinas ao banco
3. **Notificações**: Implementar o sistema de notificações
4. **Compartilhamento**: Permitir compartilhar syllabi entre usuários
5. **Histórico**: Manter histórico de alterações

## 🛠️ Desenvolvimento

### Estrutura do Código

```
Syllabus/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   │   ├── Login.js
│   │   │   ├── SyllabusList.js
│   │   │   └── SyllabusForm.js
│   │   └── context/           # Context API para autenticação
│   │       └── AuthContext.js
├── server.js                  # Backend Express
└── Base Dados Programas.xlsx # Dados de programas

```

### Comandos Disponíveis

```bash
# Rodar servidor e cliente juntos
npm run dev

# Apenas servidor
npm run server

# Apenas cliente
npm run client
```

## 📞 Suporte

Em caso de problemas, verifique:
1. Se as portas 3000 e 5000 estão livres
2. Se todas as dependências foram instaladas
3. Se o banco de dados foi criado (syllabus.db)

## 🎉 Pronto!

Seu sistema está funcionando! Comece criando seu primeiro syllabus.

