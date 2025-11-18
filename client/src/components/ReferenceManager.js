import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaSearch, FaPlus, FaSpinner, FaBook, FaFileAlt, FaDatabase, FaFlask, FaUser } from 'react-icons/fa';
import './ReferenceManager.css';

const ReferenceManager = ({ content, onChange, layout = 'lista' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedReferences, setAddedReferences] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingReference, setPendingReference] = useState(null);
  const [pendingIndex, setPendingIndex] = useState(null);
  const searchCacheRef = useRef(new Map()); // Cache de resultados de busca
  const debounceTimerRef = useRef(null);


  const searchAll = async () => {
    if (!searchTerm.trim()) return;

    // Verificar cache antes de buscar
    const cacheKey = searchTerm.toLowerCase();
    if (searchCacheRef.current.has(cacheKey)) {
      const cachedResults = searchCacheRef.current.get(cacheKey);
      setSearchResults(cachedResults);
      return;
    }

    setIsSearching(true);
    setSearchResults([]); // Limpar resultados anteriores

    try {
      // Buscar em todas as APIs simultaneamente (com append=true para acumular resultados)
      // Cada função com append=true não vai chamar setIsSearching, então controlamos aqui
      await Promise.allSettled([
        searchCrossRef(true).catch(err => {
          console.error('Erro no Crossref:', err);
        }),
        searchGoogleBooks(true).catch(err => {
          console.error('Erro no Google Books:', err);
        }),
        searchGoogleScholar(true).catch(err => {
          console.error('Erro no Google Scholar:', err);
        }),
        searchDataverse(true).catch(err => {
          console.error('Erro no Dataverse:', err);
        }),
        searcharXiv(true).catch(err => {
          console.error('Erro no arXiv:', err);
        }),
        searchOpenAlex(true).catch(err => {
          console.error('Erro no OpenAlex:', err);
        })
      ]);

      // Salvar no cache após a busca (usar setTimeout para garantir que searchResults foi atualizado)
      setTimeout(() => {
        const cacheKey = searchTerm.toLowerCase();
        setSearchResults(currentResults => {
          if (currentResults.length > 0) {
            searchCacheRef.current.set(cacheKey, [...currentResults]);
          }
          return currentResults;
        });
      }, 100);
    } catch (error) {
      console.error('Erro ao buscar em todas as APIs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Função para destacar palavras buscadas em negrito
  const highlightText = (text, searchTerm) => {
    if (!text || !searchTerm) return text;
    
    const words = searchTerm.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return text;
    
    let highlightedText = String(text);
    words.forEach(word => {
      const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<strong>$1</strong>');
    });
    
    return highlightedText;
  };

  // Funções individuais ajustadas para não limpar resultados quando usado em searchAll
  const searchCrossRef = async (append = false) => {
    if (!searchTerm.trim()) return;

    if (!append) setIsSearching(true);
    try {
      // Busca combinada: buscar tanto por título quanto por autor
      // Usar busca geral que inclui ambos
      const query = searchTerm;
      
      const response = await axios.get(
        `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=10`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const items = response.data.message.items || [];
      const newItems = items.map(item => ({ ...item, type: 'article', source: 'Crossref' }));
      
      if (append) {
        setSearchResults(prev => [...prev, ...newItems]);
      } else {
        setSearchResults(newItems);
      }
    } catch (error) {
      console.error('Erro ao buscar na API do Crossref:', error);
      if (!append) {
        window.alert('Erro ao buscar referências. Tente novamente.');
      }
    } finally {
      if (!append) setIsSearching(false);
    }
  };

  const searchGoogleBooks = async (append = false) => {
    if (!searchTerm.trim()) return;

    if (!append) setIsSearching(true);
    try {
      // Busca combinada: buscar tanto por título quanto por autor
      // Usar busca geral que inclui ambos
      const query = searchTerm;
      
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const items = (response.data.items || []).map(item => ({
        type: 'book',
        volumeInfo: item.volumeInfo,
        id: item.id,
        source: 'Google Books'
      }));
      
      if (append) {
        setSearchResults(prev => [...prev, ...items]);
      } else {
        setSearchResults(items);
      }
    } catch (error) {
      console.error('Erro ao buscar na API do Google Books:', error);
      if (!append) {
        window.alert('Erro ao buscar livros. Tente novamente.');
      }
    } finally {
      if (!append) setIsSearching(false);
    }
  };

  const searchGoogleScholar = async (append = false) => {
    if (!searchTerm.trim()) return;

    if (!append) setIsSearching(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/search-scholar`,
        {
          params: { q: searchTerm },
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const items = (response.data || []).map(item => ({
        ...item,
        source: item.source || 'Google Scholar'
      }));
      
      if (append) {
        setSearchResults(prev => [...prev, ...items]);
      } else {
        setSearchResults(items);
      }
    } catch (error) {
      console.error('Erro ao buscar na API do Google Scholar:', error);
      if (!append) {
        const errorMsg = error.response?.data?.message || error.message || 'Erro ao buscar no Google Scholar. Tente novamente.';
        window.alert(`Erro: ${errorMsg}`);
      }
      if (!append) setSearchResults([]);
    } finally {
      if (!append) setIsSearching(false);
    }
  };

  const searchDataverse = async (append = false) => {
    if (!searchTerm.trim()) return;

    if (!append) setIsSearching(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/search-dataverse`,
        {
          params: { q: searchTerm },
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const items = (response.data || []).map(item => ({
        ...item,
        source: item.source || 'Dataverse'
      }));
      
      if (append) {
        setSearchResults(prev => [...prev, ...items]);
      } else {
        setSearchResults(items);
      }
    } catch (error) {
      console.error('Erro ao buscar na API do Dataverse:', error);
      if (!append) {
        const errorMsg = error.response?.data?.message || error.message || 'Erro ao buscar no Dataverse. Tente novamente.';
        window.alert(`Erro: ${errorMsg}`);
      }
      if (!append) setSearchResults([]);
    } finally {
      if (!append) setIsSearching(false);
    }
  };

  const searcharXiv = async (append = false) => {
    if (!searchTerm.trim()) return;

    if (!append) setIsSearching(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/search-arxiv`,
        {
          params: { q: searchTerm },
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const items = (response.data || []).map(item => ({
        ...item,
        source: item.source || 'arXiv'
      }));
      
      if (append) {
        setSearchResults(prev => [...prev, ...items]);
      } else {
        setSearchResults(items);
      }
    } catch (error) {
      console.error('Erro ao buscar na API do arXiv:', error);
      if (!append) {
        const errorMsg = error.response?.data?.message || error.message || 'Erro ao buscar no arXiv. Tente novamente.';
        window.alert(`Erro: ${errorMsg}`);
      }
      if (!append) setSearchResults([]);
    } finally {
      if (!append) setIsSearching(false);
    }
  };

  const searchOpenAlex = async (append = false) => {
    if (!searchTerm.trim()) return;

    if (!append) setIsSearching(true);
    try {
      const response = await axios.get(
        `https://api.openalex.org/works`,
        {
          params: {
            search: searchTerm,
            per_page: 10
          },
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const items = (response.data.results || []).map(item => {
        let authors = 'Autor não especificado';
        if (item.authorships && item.authorships.length > 0) {
          const authorNames = item.authorships.map(auth => {
            const author = auth.author;
            if (author && author.display_name) {
              return author.display_name;
            }
            return null;
          }).filter(name => name);
          
          if (authorNames.length > 0) {
            authors = authorNames.join(', ');
          }
        }

        const year = item.publication_year || '';
        const title = item.title || 'Sem título';
        const venue = item.primary_location?.source?.display_name || 
                     item.venues?.[0]?.display_name || 
                     item.locations?.[0]?.source?.display_name || '';
        const doi = item.doi || '';
        
        return {
          type: 'openalex',
          title: title,
          authors: authors,
          year: year,
          venue: venue,
          doi: doi,
          language: item.language || 'pt',
          source: 'OpenAlex'
        };
      });
      
      if (append) {
        setSearchResults(prev => [...prev, ...items]);
      } else {
        setSearchResults(items);
      }
    } catch (error) {
      console.error('Erro ao buscar na API do OpenAlex:', error);
      if (!append) {
        window.alert('Erro ao buscar no OpenAlex. Tente novamente.');
      }
      if (!append) setSearchResults([]);
    } finally {
      if (!append) setIsSearching(false);
    }
  };

  // Limpar resultados quando o campo estiver vazio
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const performSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    // Sempre buscar em todas as fontes (o cache é verificado dentro de searchAll)
    searchAll();
  };

  const isOutdated = (item) => {
    let year;
    
    if (item.type === 'book') {
      const publishedDate = item.volumeInfo?.publishedDate || '';
      year = publishedDate ? parseInt(publishedDate.split('-')[0]) : null;
    } else if (item.type === 'scholar') {
      const pubInfo = item.publication_info || {};
      const yearMatch = pubInfo.summary?.match(/\d{4}/);
      year = yearMatch ? parseInt(yearMatch[0]) : null;
    } else if (item.type === 'dataverse') {
      const publishedDate = item.publicationDate || '';
      year = publishedDate ? parseInt(publishedDate.match(/\d{4}/)?.[0] || publishedDate) : null;
    } else if (item.type === 'arxiv') {
      year = item.year ? parseInt(item.year) : null;
    } else if (item.type === 'openalex') {
      year = item.year ? parseInt(item.year) : null;
    } else {
      year = item.published?.['date-parts']?.[0]?.[0] || item.created?.['date-parts']?.[0]?.[0];
    }
    
    if (!year) return false;
    const currentYear = new Date().getFullYear();
    return (currentYear - year) > 10;
  };

  const hasTitleAndAuthor = (item) => {
    try {
      let hasTitle = false;
      let hasAuthor = false;

      // Verificar título
      if (item.type === 'book') {
        hasTitle = !!(item.volumeInfo?.title && typeof item.volumeInfo.title === 'string' && item.volumeInfo.title.trim() !== '' && item.volumeInfo.title !== 'Sem título');
      } else if (item.type === 'scholar' || item.type === 'dataverse' || item.type === 'arxiv' || item.type === 'openalex') {
        hasTitle = !!(item.title && typeof item.title === 'string' && item.title.trim() !== '' && item.title !== 'Sem título');
      } else if (item.type === 'article') {
        hasTitle = !!(item.title?.[0] && typeof item.title[0] === 'string' && item.title[0].trim() !== '' && item.title[0] !== 'Sem título') ||
                   !!(item['container-title']?.[0] && typeof item['container-title'][0] === 'string' && item['container-title'][0].trim() !== '');
      }

      // Verificar autor
      if (item.type === 'book') {
        hasAuthor = !!(item.volumeInfo?.authors && Array.isArray(item.volumeInfo.authors) && item.volumeInfo.authors.length > 0 && 
                       item.volumeInfo.authors.some(a => a && typeof a === 'string' && a.trim() !== ''));
      } else if (item.type === 'scholar') {
        hasAuthor = !!(item.authors && Array.isArray(item.authors) && item.authors.length > 0 && 
                       item.authors.some(a => {
                         const name = a?.name || a;
                         return name && typeof name === 'string' && name.trim() !== '' && name !== 'Autor não especificado';
                       }));
      } else if (item.type === 'dataverse' || item.type === 'arxiv' || item.type === 'openalex') {
        hasAuthor = !!(item.authors && typeof item.authors === 'string' && item.authors.trim() !== '' && item.authors !== 'Autor não especificado');
      } else if (item.type === 'article') {
        if (item.author && Array.isArray(item.author) && item.author.length > 0) {
          hasAuthor = item.author.some(author => {
            try {
              let name = '';
              if (author?.given && author?.family) {
                const given = typeof author.given === 'string' ? author.given : String(author.given || '');
                const family = typeof author.family === 'string' ? author.family : String(author.family || '');
                name = `${given} ${family}`.trim();
              } else {
                name = (author?.family && typeof author.family === 'string' ? author.family : '') ||
                       (author?.given && typeof author.given === 'string' ? author.given : '') ||
                       (author?.name && typeof author.name === 'string' ? author.name : '') ||
                       (author?.literal && typeof author.literal === 'string' ? author.literal : '') ||
                       (author?.fullName && typeof author.fullName === 'string' ? author.fullName : '') ||
                       '';
              }
              return name && typeof name === 'string' && name.trim() !== '';
            } catch (e) {
              return false;
            }
          });
        } else if (item.author && typeof item.author === 'string') {
          hasAuthor = item.author.trim() !== '';
        }
      }

      return hasTitle && hasAuthor;
    } catch (error) {
      console.error('Erro ao verificar título e autor:', error, item);
      return false; // Em caso de erro, não mostrar o item
    }
  };

  const formatReference = (item) => {
    if (item.type === 'book') {
      const volumeInfo = item.volumeInfo || {};
      const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Autor não especificado';
      const title = volumeInfo.title || 'Sem título';
      const publisher = volumeInfo.publisher || '';
      const publishedDate = volumeInfo.publishedDate || '';
      const year = publishedDate ? publishedDate.split('-')[0] : '';
      const isbn = volumeInfo.industryIdentifiers?.[0]?.identifier || '';
      
      return `${authors} (${year}). ${title}. ${publisher ? publisher + '. ' : ''}${isbn ? 'ISBN: ' + isbn : ''}`;
    } else if (item.type === 'scholar') {
      const authors = item.authors && item.authors.length > 0 
        ? item.authors.map(a => a.name || a).join(', ')
        : 'Autor não especificado';
      const title = item.title || 'Sem título';
      const pubInfo = item.publication_info || {};
      const year = pubInfo.summary?.match(/\d{4}/)?.[0] || '';
      const journal = pubInfo.summary || '';
      
      return `${authors} (${year}). ${title}. ${journal}`;
    } else if (item.type === 'dataverse') {
      const authors = item.authors || 'Autor não especificado';
      const title = item.title || 'Sem título';
      const publisher = item.publisher || 'Dataverse';
      const publishedDate = item.publicationDate || '';
      
      // Extrair ano da data - pode vir em diferentes formatos
      let year = '';
      if (publishedDate) {
        // Pode ser uma string com ano, data completa, ou objeto
        if (typeof publishedDate === 'string') {
          // Tentar extrair ano de formato YYYY-MM-DD ou apenas YYYY
          const yearMatch = publishedDate.match(/\b(\d{4})\b/);
          year = yearMatch ? yearMatch[1] : publishedDate;
        } else if (typeof publishedDate === 'object' && publishedDate !== null) {
          // Se for objeto, tentar extrair o ano
          year = publishedDate.year || publishedDate.value || '';
        } else {
          year = String(publishedDate);
        }
      }
      
      const doi = item.doi || item.persistentId ? `DOI: ${item.doi || item.persistentId}` : '';
      
      return `${authors} (${year}). ${title}. ${publisher}. ${doi}`;
    } else if (item.type === 'arxiv') {
      const authors = item.authors || 'Autor não especificado';
      const title = item.title || 'Sem título';
      const year = item.year || '';
      const arxivId = item.arxivId ? `arXiv:${item.arxivId}` : '';
      
      return `${authors} (${year}). ${title}. ${arxivId}`;
    } else if (item.type === 'openalex') {
      const authors = item.authors || 'Autor não especificado';
      const title = item.title || 'Sem título';
      const year = item.year || '';
      const venue = item.venue || '';
      const doi = item.doi ? `DOI: ${item.doi}` : '';
      
      return `${authors} (${year}). ${title}. ${venue ? venue + '. ' : ''}${doi}`;
    } else {
      // Artigo (Crossref)
      let authors = 'Autor não especificado';
      
      if (item.author && Array.isArray(item.author) && item.author.length > 0) {
        // Crossref pode ter diferentes formatos de autor
        const authorNames = item.author.map((author) => {
          // Formato padrão: given + family
          if (author.given && author.family) {
            return `${author.given} ${author.family}`.trim();
          }
          // Se só tiver family
          if (author.family) {
            return typeof author.family === 'string' ? author.family : String(author.family || '');
          }
          // Se só tiver given
          if (author.given) {
            return typeof author.given === 'string' ? author.given : String(author.given || '');
          }
          // Se tiver name como string completa
          if (author.name) {
            return typeof author.name === 'string' ? author.name : String(author.name || '');
          }
          // Tentar outros campos possíveis
          const literal = author.literal || author.fullName || '';
          return typeof literal === 'string' ? literal : String(literal || '');
        }).filter(name => name && typeof name === 'string' && name.trim() !== '');
        
        if (authorNames.length > 0) {
          authors = authorNames.join(', ');
        }
      } else if (item.author && typeof item.author === 'string') {
        // Se author for uma string direta
        authors = item.author;
      } else if (item['container-title'] && !item.author) {
        // Alguns artigos podem não ter autor, mas ter container-title
        // Neste caso, manter "Autor não especificado"
      }
      
      const year = item.published?.['date-parts']?.[0]?.[0] || item.created?.['date-parts']?.[0]?.[0] || '';
      const title = item.title?.[0] || item['container-title']?.[0] || item['short-title']?.[0] || 'Sem título';
      const journal = item['container-title']?.[0] || item['journal-title']?.[0] || item['publisher'] || '';
      const doi = item.DOI ? `DOI: ${item.DOI}` : '';

      return `${authors} (${year}). ${title}. ${journal ? journal + '. ' : ''}${doi}`;
    }
  };

  // Função para parsear referências do conteúdo
  const parseReferences = () => {
    if (!content) return [];
    
    try {
      // Tentar parsear como JSON (layout categorizado)
      const parsed = JSON.parse(content);
      if (parsed.references && Array.isArray(parsed.references)) {
        return parsed.references;
      }
    } catch (e) {
      // Se não for JSON, tentar parsear HTML (layout lista)
      if (layout === 'lista') {
        // Extrair referências do HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const paragraphs = tempDiv.querySelectorAll('p');
        return Array.from(paragraphs).map(p => ({
          text: p.textContent || p.innerText,
          category: 'obrigatoria' // Padrão para layout lista
        }));
      }
    }
    return [];
  };

  // Carregar referências do conteúdo quando o componente monta ou quando content/layout muda
  useEffect(() => {
    if (content) {
      const refs = parseReferences();
      setAddedReferences(refs);
    } else {
      setAddedReferences([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, layout]);

  const addReference = (item, index) => {
    const formattedRef = formatReference(item);
    
    if (layout === 'categorizado') {
      // Abrir modal para escolher categoria
      setPendingReference(formattedRef);
      setPendingIndex(index);
      setShowCategoryModal(true);
    } else {
      // Layout lista: adicionar diretamente
      const currentRefs = [...addedReferences, { text: formattedRef, category: 'obrigatoria' }];
      setAddedReferences(currentRefs);
      
      // Adicionar ao conteúdo do editor (HTML simples)
      const currentContent = content || '';
      const separator = currentContent ? '<br>' : '';
      const newContent = currentContent + separator + '<p>' + formattedRef + '</p>';
      onChange(newContent);
      
      // Remover da lista de resultados
      setSearchResults(searchResults.filter((_, i) => i !== index));
    }
  };

  const confirmAddReference = (category) => {
    if (!pendingReference) return;
    
    const newRef = { text: pendingReference, category };
    const currentRefs = [...addedReferences, newRef];
    setAddedReferences(currentRefs);
    
    // Atualizar conteúdo como JSON
    const referencesData = {
      layout: 'categorizado',
      references: currentRefs
    };
    onChange(JSON.stringify(referencesData));
    
    // Remover da lista de resultados
    if (pendingIndex !== null) {
      setSearchResults(searchResults.filter((_, i) => i !== pendingIndex));
    }
    
    // Fechar modal
    setShowCategoryModal(false);
    setPendingReference(null);
    setPendingIndex(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevenir submit do formulário
      e.stopPropagation(); // Parar propagação do evento
      performSearch();
    }
  };

  const getPlaceholder = () => {
    return 'Digite o título, autor ou palavra-chave...';
  };

  return (
    <div className="reference-manager">
      <div className="reference-search">
        <div className="search-input-group">
          <input
            type="text"
            placeholder={getPlaceholder()}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="reference-search-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                performSearch();
              }
            }}
          />
          <button
            type="button"
            onClick={performSearch}
            disabled={isSearching || !searchTerm.trim()}
            className="reference-search-btn"
          >
            {isSearching ? <FaSpinner className="spinner" /> : <FaSearch />}
          </button>
        </div>
        <div className="sources-description">
          <p>
            <strong>Bases de dados consultadas:</strong> A busca é realizada simultaneamente em todas as seguintes fontes: 
            Artigos (Crossref), Livros (Google Books), Google Scholar, Dataverse (Harvard), arXiv e OpenAlex.
          </p>
        </div>
        
        {searchResults.filter(hasTitleAndAuthor).length > 0 && (
          <div className="search-results">
            <h3 className="results-title">Resultados da busca:</h3>
            {searchResults.filter(hasTitleAndAuthor).map((item, index) => {
              const outdated = isOutdated(item);
              
              // Obter título para highlight
              const getTitle = () => {
                if (item.type === 'book') {
                  return item.volumeInfo?.title || 'Sem título';
                } else if (item.type === 'scholar' || item.type === 'dataverse' || item.type === 'arxiv' || item.type === 'openalex') {
                  return item.title || 'Sem título';
                } else {
                  return item.title?.[0] || 'Sem título';
                }
              };
              
              // Obter autor para highlight
              const getAuthor = () => {
                if (item.type === 'book') {
                  return item.volumeInfo?.authors?.join(', ') || 'Autor não especificado';
                } else if (item.type === 'scholar') {
                  return item.authors?.map(a => a.name || a).join(', ') || 'Autor não especificado';
                } else if (item.type === 'dataverse' || item.type === 'arxiv' || item.type === 'openalex') {
                  return item.authors || 'Autor não especificado';
                } else if (item.type === 'article') {
                  if (item.author && Array.isArray(item.author) && item.author.length > 0) {
                    const authorNames = item.author.map(author => {
                      if (author.given && author.family) {
                        return `${author.given} ${author.family}`.trim();
                      }
                      if (author.family) return typeof author.family === 'string' ? author.family : String(author.family || '');
                      if (author.given) return typeof author.given === 'string' ? author.given : String(author.given || '');
                      if (author.name) return typeof author.name === 'string' ? author.name : String(author.name || '');
                      const literal = author.literal || author.fullName || '';
                      return typeof literal === 'string' ? literal : String(literal || '');
                    }).filter(name => name && typeof name === 'string' && name.trim() !== '');
                    return authorNames.length > 0 ? authorNames.join(', ') : 'Autor não especificado';
                  }
                  if (item.author && typeof item.author === 'string') {
                    return item.author;
                  }
                  return 'Autor não especificado';
                }
                return 'Autor não especificado';
              };
              
              const highlightedTitle = highlightText(getTitle(), searchTerm);
              const highlightedAuthor = highlightText(getAuthor(), searchTerm);
              
              return (
                <div key={index} className={`result-item ${outdated ? 'outdated' : ''}`}>
                    <div className="result-content">
                    <div className="result-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong dangerouslySetInnerHTML={{ __html: highlightedTitle }} />
                        {item.source && (
                          <span className="source-badge" title={`Fonte: ${item.source}`}>
                            {item.source}
                          </span>
                        )}
                        {outdated && (
                          <span className="outdated-badge" title="Referência com mais de 10 anos">
                            ⚠️ Antigo
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="result-details">
                      <span dangerouslySetInnerHTML={{ __html: highlightedAuthor }} />
                      {item.type === 'book' && item.volumeInfo?.publishedDate && 
                        ` (${item.volumeInfo.publishedDate.split('-')[0]})`
                      }
                      {item.type === 'scholar' && item.publication_info?.summary && 
                        ` - ${item.publication_info.summary}`
                      }
                      {item.type === 'dataverse' && item.publicationDate && 
                        ` (${item.publicationDate.match(/\d{4}/)?.[0] || item.publicationDate})`
                      }
                      {item.type === 'dataverse' && item.publisher && 
                        ` - ${item.publisher}`
                      }
                      {item.type === 'arxiv' && item.year && 
                        ` (${item.year})`
                      }
                      {item.type === 'arxiv' && item.arxivId && 
                        ` - arXiv:${item.arxivId}`
                      }
                      {item.type === 'openalex' && item.year && 
                        ` (${item.year})`
                      }
                      {item.type === 'openalex' && item.venue && 
                        ` - ${item.venue}`
                      }
                      {item.type === 'article' && item.published && 
                        ` (${item.published['date-parts']?.[0]?.[0] || ''})`
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addReference(item, index)}
                    className="add-ref-btn"
                    title="Adicionar referência"
                  >
                    <FaPlus />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para escolher categoria */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCategoryModal(false);
          setPendingReference(null);
          setPendingIndex(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Selecionar Categoria</h2>
            <p>Em qual categoria esta referência deve ser adicionada?</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="modal-btn-confirm"
                onClick={() => confirmAddReference('obrigatoria')}
                style={{ flex: 1, minWidth: '150px' }}
              >
                Leitura Obrigatória
              </button>
              <button
                type="button"
                className="modal-btn-confirm"
                onClick={() => confirmAddReference('opcional')}
                style={{ flex: 1, backgroundColor: '#28a745', minWidth: '150px' }}
              >
                Leitura Complementar
              </button>
              <button
                type="button"
                className="modal-btn-confirm"
                onClick={() => confirmAddReference('outras')}
                style={{ flex: 1, backgroundColor: '#6c757d', minWidth: '150px' }}
              >
                Outras Referências
              </button>
            </div>
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={() => {
                setShowCategoryModal(false);
                setPendingReference(null);
                setPendingIndex(null);
              }}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceManager;

