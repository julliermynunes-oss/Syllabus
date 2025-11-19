# Plano de Implementação - Padronização das Seções

## Estrutura Geral
Cada seção seguirá o padrão de **Referências Bibliográficas**:
- Seletor de layout no topo
- Opção 1: Layout Estruturado
- Opção 2: Texto Livre
- Conversão automática entre formatos

---

## 🔴 ALTA PRIORIDADE

### 1. Conteúdo Programático - Híbrido (Lista ou Texto)

**Estrutura de Dados**:
```json
{
  "layout": "lista" | "texto",
  "unidades": [
    {
      "nome": "Unidade 1: Introdução",
      "descricao": "Descrição detalhada...",
      "carga_horaria": "4h",
      "ordem": 1
    }
  ],
  "texto_livre": "<p>HTML do texto livre</p>"
}
```

**Interface**:
- Seletor: "Lista de Unidades" ou "Texto Livre"
- Layout Lista:
  - Tabela com: Nome, Descrição, Carga Horária, Ações
  - Botão "+ Adicionar Unidade"
  - Drag & drop para reordenar
  - Botão remover por linha
- Layout Texto: Editor TiptapEditor atual

**Conversão**:
- Lista → Texto: Gerar HTML com lista ordenada
- Texto → Lista: Tentar extrair unidades de listas HTML

---

### 2. Metodologia - Campos Estruturados + Texto Livre

**Estrutura de Dados**:
```json
{
  "layout": "estruturado" | "texto",
  "modalidade": "Presencial" | "Híbrido" | "EAD",
  "recursos": ["Slides", "Vídeos", "Plataformas", "Livros", "Artigos"],
  "atividades_praticas": [
    {
      "nome": "Atividade 1",
      "descricao": "Descrição..."
    }
  ],
  "avaliacao_continua": {
    "ativa": true/false,
    "descricao": "Como funciona..."
  },
  "texto_livre": "<p>HTML do texto livre</p>"
}
```

**Interface**:
- Seletor: "Campos Estruturados" ou "Texto Livre"
- Layout Estruturado:
  - Select: Modalidade de Ensino
  - Checkboxes: Recursos Utilizados
  - Lista de Atividades Práticas (adicionar/remover)
  - Toggle: Avaliação Contínua (sim/não) + campo descrição
- Layout Texto: Editor TiptapEditor atual

---

### 3. Contatos - Campos Estruturados

**Estrutura de Dados**:
```json
{
  "layout": "estruturado" | "texto",
  "email": "professor@email.com",
  "telefone": "(11) 99999-9999",
  "horario_atendimento": "Segundas, 14h-16h",
  "sala": "Sala 101",
  "links": [
    {
      "tipo": "Website" | "LinkedIn" | "Lattes" | "Outro",
      "url": "https://...",
      "label": "Meu Site"
    }
  ],
  "outras_informacoes": "Texto adicional...",
  "texto_livre": "<p>HTML do texto livre</p>"
}
```

**Interface**:
- Seletor: "Campos Estruturados" ou "Texto Livre"
- Layout Estruturado:
  - Input: Email
  - Input: Telefone
  - Input: Horário de Atendimento
  - Input: Sala/Office
  - Lista de Links (adicionar/remover)
  - Textarea: Outras informações
- Layout Texto: Editor TiptapEditor atual

---

## 🟡 MÉDIA PRIORIDADE

### 4. ODS - Seleção Visual

**Estrutura de Dados**:
```json
{
  "layout": "visual" | "texto",
  "ods_selecionados": [
    {
      "numero": 1,
      "nome": "Erradicação da Pobreza",
      "descricao": "Como a disciplina aborda este ODS..."
    }
  ],
  "texto_livre": "<p>HTML do texto livre</p>"
}
```

**Interface**:
- Seletor: "Seleção Visual" ou "Texto Livre"
- Layout Visual:
  - Grid 4x5 com os 17 ODS (ícones + números)
  - Ao clicar, abre modal/expansão para adicionar descrição
  - ODS selecionados destacados visualmente
- Layout Texto: Editor TiptapEditor atual

**ODS a incluir**:
1. Erradicação da Pobreza
2. Fome Zero e Agricultura Sustentável
3. Saúde e Bem-Estar
4. Educação de Qualidade
5. Igualdade de Gênero
6. Água Potável e Saneamento
7. Energia Limpa e Acessível
8. Trabalho Decente e Crescimento Econômico
9. Indústria, Inovação e Infraestrutura
10. Redução das Desigualdades
11. Cidades e Comunidades Sustentáveis
12. Consumo e Produção Responsáveis
13. Ação Contra a Mudança Global do Clima
14. Vida na Água
15. Vida Terrestre
16. Paz, Justiça e Instituições Eficazes
17. Parcerias e Meios de Implementação

---

### 5. Sobre a Disciplina - Layout Estruturado

**Estrutura de Dados**:
```json
{
  "layout": "estruturado" | "texto",
  "objetivos": "<p>Objetivos da disciplina...</p>",
  "ementa": "<p>Ementa...</p>",
  "pre_requisitos": "<p>Pré-requisitos...</p>",
  "carga_horaria": "60h",
  "texto_livre": "<p>HTML do texto livre</p>"
}
```

**Interface**:
- Seletor: "Layout Estruturado" ou "Texto Livre"
- Layout Estruturado:
  - Editor: Objetivos
  - Editor: Ementa
  - Editor: Pré-requisitos
  - Input: Carga Horária
- Layout Texto: Editor TiptapEditor atual

---

### 6. O que é Esperado do Aluno - Checklist

**Estrutura de Dados**:
```json
{
  "layout": "checklist" | "texto",
  "categorias": {
    "participacao": {
      "itens": [
        {"texto": "Participar ativamente das aulas", "selecionado": true},
        {"texto": "Fazer perguntas e contribuir com discussões", "selecionado": false}
      ],
      "outros": "Texto adicional..."
    },
    "trabalhos": {
      "itens": [...],
      "outros": ""
    },
    "estudos": {
      "itens": [...],
      "outros": ""
    },
    "comportamento": {
      "itens": [...],
      "outros": ""
    }
  },
  "texto_livre": "<p>HTML do texto livre</p>"
}
```

**Interface**:
- Seletor: "Checklist Estruturado" ou "Texto Livre"
- Layout Checklist:
  - Seções colapsáveis por categoria
  - Checkboxes para cada item
  - Campo "Outros" por categoria
  - Itens pré-definidos + possibilidade de adicionar customizados
- Layout Texto: Editor TiptapEditor atual

---

## 🟢 BAIXA PRIORIDADE

### 7. Compromisso Ético - Template Padrão

**Estrutura de Dados**:
```json
{
  "layout": "template" | "texto",
  "usar_template": true,
  "texto_personalizado": "<p>Adições/edições ao template...</p>",
  "texto_livre": "<p>HTML do texto livre</p>"
}
```

**Interface**:
- Seletor: "Template Padrão" ou "Texto Livre"
- Layout Template:
  - Texto base pré-definido (não editável diretamente, mas pode ser copiado)
  - Editor abaixo para adicionar/editar conteúdo adicional
  - Botão "Usar Template Padrão" para resetar
- Layout Texto: Editor TiptapEditor atual

**Template Padrão Sugerido**:
```
"Compromisso Ético

Ao se matricular nesta disciplina, o(a) aluno(a) assume o compromisso de:
- Respeitar os prazos estabelecidos para entrega de trabalhos e avaliações
- Manter integridade acadêmica, evitando plágio e outras formas de fraude
- Participar ativamente das atividades propostas
- Respeitar colegas, professores e funcionários
- Seguir as normas da instituição e da disciplina"
```

---

## Ordem de Implementação Sugerida

1. **Contatos** (mais simples, campos diretos)
2. **Metodologia** (estrutura média)
3. **Conteúdo Programático** (mais complexo, drag & drop)
4. **Sobre a Disciplina** (estrutura simples)
5. **O que é Esperado** (checklist)
6. **ODS** (seleção visual, precisa de ícones)
7. **Compromisso Ético** (template simples)

---

## Decisões Necessárias

Antes de implementar, precisamos definir:

1. **ODS**: Onde obter os ícones/cores dos 17 ODS? (URLs, assets locais, ou usar emojis/números?)

2. **O que é Esperado**: Quais são os itens pré-definidos para cada categoria? (Participação, Trabalhos, Estudos, Comportamento)

3. **Compromisso Ético**: Qual é o texto exato do template padrão da instituição?

4. **Metodologia**: Quais recursos devem estar na lista de checkboxes? (Slides, Vídeos, Plataformas, Livros, Artigos, etc.)

5. **Conversão de Dados**: Como lidar com syllabi existentes que já têm conteúdo em texto livre? (Manter como está, tentar converter automaticamente, ou pedir ao usuário para escolher?)

