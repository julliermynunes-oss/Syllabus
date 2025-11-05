# APIs de Referências Bibliográficas - Sugestões

## APIs Atualmente Implementadas ✅

1. **Crossref API** - Artigos científicos
   - Status: ✅ Funcionando
   - Endpoint: `https://api.crossref.org/works`
   - Documentação: https://www.crossref.org/documentation/retrieve-metadata/rest-api/
   - Sem necessidade de API key

2. **Google Books API** - Livros
   - Status: ✅ Funcionando
   - Endpoint: `https://www.googleapis.com/books/v1/volumes`
   - Documentação: https://developers.google.com/books/docs/v1/using
   - Sem necessidade de API key

3. **Google Scholar** (via SerpApi)
   - Status: ✅ Funcionando (requer API key)
   - Documentação: https://serpapi.com/google-scholar-api

4. **Harvard Dataverse API** - Datasets
   - Status: ✅ Funcionando
   - Endpoint: Via backend `/api/search-dataverse`
   - Documentação: https://guides.dataverse.org/en/latest/api/index.html

5. **arXiv API** - Pré-publicações científicas
   - Status: ✅ Funcionando
   - Endpoint: `http://export.arxiv.org/api/query`
   - Documentação: https://arxiv.org/help/api
   - Sem necessidade de API key

6. **OpenAlex API** - Artigos científicos (boa cobertura de conteúdo brasileiro) ⭐ BRASIL
   - Status: ✅ Funcionando
   - Endpoint: `https://api.openalex.org/works`
   - Documentação: https://docs.openalex.org/
   - Sem necessidade de API key
   - Excelente cobertura de conteúdo do Brasil e em português

## APIs Populares Sugeridas para Implementação

### 1. **SciELO** ⭐⭐⭐ MUITO RECOMENDADA PARA BRASIL
- **Descrição**: Scientific Electronic Library Online - Biblioteca eletrônica com coleção de periódicos científicos brasileiros e latino-americanos
- **Website**: https://www.scielo.org/
- **Status**: ⚠️ Não possui API REST oficial pública
- **Alternativas**:
  - Busca via site: https://search.scielo.org/
  - Pode ser acessado via scraping (não recomendado)
  - Metadados podem estar disponíveis via OAI-PMH
- **Vantagens**:
  - ✅ Muito usado no Brasil
  - ✅ Grande quantidade de artigos em português
  - ✅ Foco em ciências humanas, sociais e saúde
- **Nota**: Infelizmente o SciELO não oferece uma API REST pública, mas o conteúdo é acessível via busca no site

### 2. **arXiv API** ⭐ RECOMENDADA
- **Descrição**: Base de dados de pré-publicações científicas (principalmente física, matemática, ciência da computação)
- **Endpoint**: `http://export.arxiv.org/api/query`
- **Documentação**: https://arxiv.org/help/api
- **Vantagens**:
  - ✅ API pública e gratuita
  - ✅ Sem necessidade de API key
  - ✅ Muito usado para artigos em ciências exatas
  - ✅ Formato Atom XML simples
- **Exemplo de uso**:
  ```
  http://export.arxiv.org/api/query?search_query=all:quantum+computing&start=0&max_results=10
  ```

### 3. **Semantic Scholar API** ⭐ RECOMENDADA
- **Descrição**: Motor de busca acadêmico com IA para artigos científicos
- **Endpoint**: `https://api.semanticscholar.org/graph/v1/paper/search`
- **Documentação**: https://www.semanticscholar.org/product/api
- **Vantagens**:
  - ✅ API pública e gratuita
  - ✅ Sem necessidade de API key (até 100 requests/5min)
  - ✅ Dados ricos: citações, resumos, métricas
  - ✅ Muito usado na comunidade acadêmica
- **Limitação**: Rate limit de 100 requests a cada 5 minutos (sem API key)

### 4. **LILACS/BVS** ⭐ BRASIL
- **Descrição**: Literatura Latino-Americana e do Caribe em Ciências da Saúde - Base de dados da BVS (Biblioteca Virtual em Saúde)
- **Website**: https://lilacs.bvsalud.org/
- **Status**: ⚠️ Não possui API REST oficial pública
- **Alternativas**:
  - Busca via site da BVS
  - Possível acesso via OAI-PMH
- **Vantagens**:
  - ✅ Muito usado no Brasil para área de saúde
  - ✅ Grande quantidade de artigos em português
  - ✅ Foco em ciências da saúde
- **Nota**: A BVS não oferece uma API REST pública, mas o conteúdo é acessível via busca no site

### 5. **Portal de Periódicos CAPES**
- **Descrição**: Portal de acesso a periódicos científicos mantido pela CAPES
- **Website**: https://www.periodicos.capes.gov.br/
- **Status**: ⚠️ Não possui API pública
- **Nota**: Acesso restrito para instituições credenciadas

### 6. **PubMed API (NCBI)** 
- **Descrição**: Base de dados de artigos biomédicos e de ciências da vida
- **Endpoint**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`
- **Documentação**: https://www.ncbi.nlm.nih.gov/books/NBK25497/
- **Vantagens**:
  - ✅ API pública e gratuita
  - ✅ Sem necessidade de API key
  - ✅ Padrão para área biomédica
- **Desvantagens**: Formato XML, pode ser mais complexo de parsear

### 7. **ORCID API**
- **Descrição**: Identificador de pesquisadores e suas publicações
- **Endpoint**: `https://pub.orcid.org/v3.0/search`
- **Documentação**: https://info.orcid.org/documentation/api-tutorials/
- **Vantagens**:
  - ✅ Útil para buscar por pesquisador específico
  - ✅ API pública (com limitações)
- **Desvantagens**: Principalmente para buscar por pesquisador, não por tema

### 8. **OpenCitations Meta API**
- **Descrição**: Base de dados de citações acadêmicas
- **Endpoint**: SPARQL endpoint e REST API
- **Documentação**: https://opencitations.net/
- **Vantagens**:
  - ✅ Dados abertos (CC0)
  - ✅ Útil para análise de citações
- **Desvantagens**: Pode ser mais complexo para busca simples

### 9. **DOAJ API** (Directory of Open Access Journals)
- **Descrição**: Diretório de revistas de acesso aberto
- **Endpoint**: `https://doaj.org/api/v2/search/articles`
- **Documentação**: https://doaj.org/api/v2/docs
- **Vantagens**:
  - ✅ Foco em acesso aberto
  - ✅ API pública e gratuita
- **Desvantagens**: Apenas revistas de acesso aberto

## Priorização de Implementação

### Alta Prioridade (Especialmente para Brasil):
1. **OpenAlex** ✅ IMPLEMENTADA - Excelente cobertura de conteúdo brasileiro e português, API moderna
2. **arXiv** ✅ IMPLEMENTADA - Muito popular, API simples, sem API key

### Média Prioridade:
3. **Semantic Scholar** - Popular, dados ricos, sem API key (com rate limit)

### Média Prioridade:
4. **PubMed** - Essencial para área biomédica, mas formato XML mais complexo
5. **DOAJ** - Boa para revistas de acesso aberto

### Baixa Prioridade:
6. **ORCID** - Mais útil para busca por pesquisador
7. **OpenCitations** - Mais focado em análise de citações

### Nota Especial - Brasil:
- **SciELO** e **LILACS/BVS** são muito populares no Brasil, mas não possuem APIs REST públicas oficiais
- **OpenAlex** é a melhor alternativa API disponível que tem excelente cobertura de conteúdo brasileiro
- **Google Scholar** (já implementado via SerpApi) também retorna muitos resultados em português

## Notas sobre Rate Limits

- **Crossref**: Sem limites oficiais, mas recomendado usar User-Agent
- **Google Books**: 1000 requests/dia (sem API key)
- **arXiv**: Sem limites conhecidos
- **Semantic Scholar**: 100 requests/5min (sem API key), ilimitado com API key
- **PubMed**: Sem limites conhecidos, mas recomendado usar com moderação

## Recomendações Finais

Para implementação imediata, recomendo:
1. **OpenAlex** ✅ IMPLEMENTADA - Excelente para conteúdo brasileiro e português, API moderna REST
2. **arXiv** ✅ IMPLEMENTADA - Fácil de implementar, muito usado, sem API key

### Para Conteúdo Brasileiro/Português:
- ✅ **OpenAlex** - Melhor opção via API, excelente cobertura brasileira
- ✅ **Google Scholar** (via SerpApi) - Já implementado, retorna muitos resultados em português
- ⚠️ **SciELO** - Muito popular no Brasil, mas sem API oficial (apenas via site)
- ⚠️ **LILACS/BVS** - Popular para saúde no Brasil, mas sem API oficial

**Nota**: O OpenAlex sucedeu o Microsoft Academic e tem excelente cobertura de conteúdo não anglófono, incluindo do Brasil e América Latina, sendo atualmente a melhor opção via API para buscar conteúdo científico em português.

