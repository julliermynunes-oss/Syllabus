## Configurações do Syllabus — Plano de Implementação

### 1. Objetivos
- Renomear o fluxo “Gerenciar Competências” para “Configurações do Syllabus”.
- Centralizar, em uma única tela protegida para coordenadores/administradores, dois grupos de configurações:
  1. **Gerenciamento de Competências** (funcionalidade atual, sem mudanças de comportamento).
  2. **Modelos de Syllabus por curso**: definir quais abas ficam disponíveis, sua ordem e outras regras para professores que criarem/visualizarem e para os PDFs.
- Manter histórico de alterações (quem, quando, qual modelo ficou ativo).
- Garantir que, para cursos sem modelo configurado, tudo funcione como hoje.

### 2. Acesso / Autorização
1. Adicionar coluna `role` na tabela `users` (`professor` padrão, `coordenador`, `admin`).
2. Incluir `role` no payload do JWT/`/api/login` e salvar no frontend (`AuthContext`).
3. Criar middleware `requireRole(['coordenador','admin'])`.
4. Proteger novos endpoints e a rota `/configuracoes`.

### 3. Modelagem de Dados
| Tabela | Campos principais | Observações |
|--------|-------------------|-------------|
| `syllabus_layout_models` | `id`, `curso_code` (FK lógico para código do curso), `nome`, `tabs_order` (JSON array), `tabs_visibility` (JSON com flags), `is_active`, `version`, `notes`, `created_by`, `updated_by`, `created_at`, `updated_at`, `activated_at` | Guarda o modelo vigente/rascunhos. Um curso pode ter vários modelos, apenas um ativo. |
| `syllabus_layout_history` | `id`, `layout_model_id`, `snapshot` (JSON com dados completos do modelo), `action` (`created`, `updated`, `activated`), `performed_by`, `created_at` | Auditoria enxuta e barata. |

Campos auxiliares:
- `tabs_order`: lista ordenada de IDs (`['cabecalho','sobre',...]`).
- `tabs_visibility`: dicionário `{ tabId: boolean }` (ex.: `{ "ods": false }`).
- `metadata`: opcional para armazenar flags futuras (ex.: obrigatoriedade, textos específicos).

### 4. API (todas protegidas por `authenticateToken` + `requireRole`)
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET /api/syllabus-config/available-tabs` | Retorna catálogo de abas possíveis (id, label, se é restrita por curso, descrição). Fonte única para frontends. |
| `GET /api/syllabus-config/models` | Lista modelos por curso (`curso` query) ou todos (com paginação futura). Inclui flag `is_active`. |
| `POST /api/syllabus-config/models` | Cria/atualiza modelo (body: `curso`, `nome`, `tabs_order`, `tabs_visibility`, `notes`). Salva histórico `created`/`updated`. |
| `POST /api/syllabus-config/models/:id/activate` | Marca modelo como ativo para o curso (desativa anteriores, grava `activated_at`, histórico `activated`). |
| `GET /api/syllabus-config/active` | Recebe `curso` e devolve modelo ativo (usado por formulário, preview e PDF). Fallback: `null`. |
| `GET /api/syllabus-config/history/:curso` | Histórico recente para UI (lista paginada). |

Reaproveitamento:
- Endpoint existente `/api/competencias/limit` permanece; apenas moveremos a UI para uma aba.

### 5. Frontend — Estrutura
1. **Botão na lista principal (`SyllabusList`)**
   - Renomear texto para `Configurações do Syllabus`.
   - Redirecionar para nova rota `/configuracoes`. Manter `/competencias` como alias temporário (redirect).

2. **Nova página `SyllabusConfigurationsPage`**
   - Tabs locais: `Modelos de Syllabus`, `Gerenciamento de Competências`.
   - Verifica `user.role`; se não autorizado, mostra mensagem + botão Voltar.

3. **Aba Gerenciamento de Competências**
   - Reaproveitar `CompetenciesManager` (mover conteúdo para componente interno ou transformar em aba).
   - Nenhuma mudança funcional além do contexto visual.

4. **Aba Modelos**
   - **Topo:** seletor de curso + resumo do modelo ativo (nome, versão, última atualização, quem ativou).
   - **Lista de modelos** (cards ou tabela): nome, status, últimas alterações, botões “Ativar”, “Duplicar”, “Editar”.
   - **Editor de modelo** (drawer/modal):
     - Reordenação de abas (drag & drop) usando catálogo global.
     - Checkboxes para habilitar/desabilitar cada aba.
     - Campo opcional “Notas” e “Nome do modelo”.
     - Botão “Salvar rascunho” e “Salvar & ativar”.
   - **Histórico**: timeline com ações + usuário.

5. **Integração no formulário (`SyllabusForm`)**
   - Ao selecionar/alterar `curso`, chamar `GET /api/syllabus-config/active`.
   - Caso exista modelo: usar `tabs_order` e `tabs_visibility` para compor `getOrderedTabs`.
   - Abas desativadas:
     - Não aparecem na barra de navegação.
     - Conteúdo correspondente fica oculto do formulário, preview, PDF e persistência.
   - Exibir aviso no topo (“Modelo CGA Verão 2025 ativo. Somente abas X, Y, Z estão disponíveis”).
   - Garantir fallback igual ao comportamento atual quando não houver modelo.

6. **Preview/PDF (`SyllabusList` preview e `SyllabusPDFContent`)**
   - Receber os mesmos dados do formulário ou, ao renderizar a partir de um registro salvo, buscar modelo ativo do curso e aplicar filtro/ordem antes de montar as seções.

### 6. Fluxo de Ativação
1. Coordenador cria novo modelo → status “Rascunho”.
2. Ao ativar: endpoint ajusta `is_active` e grava histórico.
3. Professores que já estão editando:
   - No carregamento do formulário, verificar timestamp do modelo ativo. Se houve mudança depois do último salvamento, mostrar banner informativo (futuro próximo).

### 7. Migração / Backward Compatibility
- Script de migração adiciona colunas/tabelas sem quebrar dados existentes.
- Rota `/competencias` redireciona para `/configuracoes` para não quebrar links antigos.
- Para modelos inexistentes, comportamento atual permanece.

### 8. Roadmap de Entregas
1. **Infra / Backend**
   - Migrações (`users.role`, novas tabelas, seed de roles admin).
   - Middleware de autorização e endpoints.
2. **Frontend Básico**
   - Renomear botão + nova rota protegida com skeleton.
   - Movimentar `CompetenciesManager` para dentro da nova página.
3. **Editor de Modelos**
   - UI CRUD + listagem + ativação + histórico.
4. **Aplicação dos modelos**
   - Integrar com `SyllabusForm`, preview e PDF.
5. **Polimento**
   - Mensagens, validações, testes manuais (criação/ativação, fallback, performance).

### 9. Dependências / Pontos em Aberto
- Definir lista oficial de abas permitidas (incluir futuras?).
- Confirmar se cursos utilizam códigos padronizados (ex.: `CGA` vs `CGA - ...`). Ideal padronizar com `getCursoCode`.
- Decidir se duplicar modelos deve copiar histórico.
- Confirmar necessidade de exportar/importar modelos entre cursos.

Este plano serve como guia para as próximas PRs/commits. Ajustes serão feitos conforme validarmos com o usuário.

