import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaSearch, FaPlus, FaSpinner, FaBook, FaFileAlt, FaDatabase } from 'react-icons/fa';
import './ReferenceManager.css';

const ReferenceManager = ({ content, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedReferences, setAddedReferences] = useState([]);
  const [searchType, setSearchType] = useState('articles'); // 'articles', 'books', 'scholar', 'dataverse'

  const searchCrossRef = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://api.crossref.org/works?query=${encodeURIComponent(searchTerm)}&rows=10`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const items = response.data.message.items || [];
      setSearchResults(items.map(item => ({ ...item, type: 'article' })));
    } catch (error) {
      console.error('Erro ao buscar na API do Crossref:', error);
      window.alert('Erro ao buscar referências. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const searchGoogleBooks = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=10`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const items = (response.data.items || []).map(item => ({
        type: 'book',
        volumeInfo: item.volumeInfo,
        id: item.id
      }));
      setSearchResults(items);
    } catch (error) {
      console.error('Erro ao buscar na API do Google Books:', error);
      window.alert('Erro ao buscar livros. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const searchGoogleScholar = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
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

      setSearchResults(response.data);
    } catch (error) {
      console.error('Erro ao buscar na API do Google Scholar:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao buscar no Google Scholar. Tente novamente.';
      window.alert(`Erro: ${errorMsg}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const searchDataverse = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
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

      setSearchResults(response.data);
    } catch (error) {
      console.error('Erro ao buscar na API do Dataverse:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao buscar no Dataverse. Tente novamente.';
      window.alert(`Erro: ${errorMsg}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const performSearch = () => {
    if (searchType === 'articles') {
      searchCrossRef();
    } else if (searchType === 'books') {
      searchGoogleBooks();
    } else if (searchType === 'scholar') {
      searchGoogleScholar();
    } else if (searchType === 'dataverse') {
      searchDataverse();
    }
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
    } else {
      year = item.published?.['date-parts']?.[0]?.[0] || item.created?.['date-parts']?.[0]?.[0];
    }
    
    if (!year) return false;
    const currentYear = new Date().getFullYear();
    return (currentYear - year) > 10;
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
    } else {
      // Artigo (Crossref)
      const authors = item.author
        ? item.author
            .map((author) => `${author.given || ''} ${author.family || ''}`.trim())
            .join(', ')
        : 'Autor não especificado';
      
      const year = item.published?.['date-parts']?.[0]?.[0] || item.created?.['date-parts']?.[0]?.[0] || '';
      const title = item.title?.[0] || item.container_title || '';
      const journal = item.container_title || '';
      const doi = item.DOI ? `DOI: ${item.DOI}` : '';

      return `${authors} (${year}). ${title}. ${journal ? journal + '. ' : ''}${doi}`;
    }
  };

  const addReference = (item, index) => {
    const formattedRef = formatReference(item);
    const currentRefs = [...addedReferences, formattedRef];
    setAddedReferences(currentRefs);
    
    // Adicionar ao conteúdo do editor
    const currentContent = content || '';
    const separator = currentContent ? '<br>' : '';
    const newContent = currentContent + separator + '<p>' + formattedRef + '</p>';
    onChange(newContent);
    
    // Remover da lista de resultados
    setSearchResults(searchResults.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const getPlaceholder = () => {
    if (searchType === 'books') {
      return 'Pesquisar livros por título ou autor no Google Books...';
    } else if (searchType === 'scholar') {
      return 'Pesquisar artigos no Google Scholar...';
    } else if (searchType === 'dataverse') {
      return 'Pesquisar datasets no Dataverse (Harvard)...';
    } else {
      return 'Pesquisar por título, autor ou DOI na API do Crossref...';
    }
  };

  return (
    <div className="reference-manager">
      <div className="reference-search">
        <div className="search-type-selector">
          <button
            type="button"
            className={`search-type-btn ${searchType === 'articles' ? 'active' : ''}`}
            onClick={() => setSearchType('articles')}
            title="Buscar Artigos"
          >
            <FaFileAlt /> Artigos (Crossref)
          </button>
          <button
            type="button"
            className={`search-type-btn ${searchType === 'books' ? 'active' : ''}`}
            onClick={() => setSearchType('books')}
            title="Buscar Livros"
          >
            <FaBook /> Livros (Google Books)
          </button>
          <button
            type="button"
            className={`search-type-btn ${searchType === 'scholar' ? 'active' : ''}`}
            onClick={() => setSearchType('scholar')}
            title="Buscar no Google Scholar"
          >
            <FaFileAlt /> Google Scholar
          </button>
          <button
            type="button"
            className={`search-type-btn ${searchType === 'dataverse' ? 'active' : ''}`}
            onClick={() => setSearchType('dataverse')}
            title="Buscar Datasets no Dataverse"
          >
            <FaDatabase /> Dataverse
          </button>
        </div>
        
        <div className="search-input-group">
          <input
            type="text"
            placeholder={getPlaceholder()}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="reference-search-input"
          />
          <button
            type="button"
            onClick={performSearch}
            disabled={isSearching}
            className="reference-search-btn"
          >
            {isSearching ? <FaSpinner className="spinner" /> : <FaSearch />}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3 className="results-title">Resultados da busca:</h3>
            {searchResults.map((item, index) => {
              const outdated = isOutdated(item);
              return (
                <div key={index} className={`result-item ${outdated ? 'outdated' : ''}`}>
                    <div className="result-content">
                    <div className="result-header">
                      <strong>
                        {item.type === 'book' 
                          ? (item.volumeInfo?.title || 'Sem título')
                          : item.type === 'scholar' || item.type === 'dataverse'
                          ? (item.title || 'Sem título')
                          : (item.title?.[0] || 'Sem título')
                        }
                      </strong>
                      {outdated && (
                        <span className="outdated-badge" title="Referência com mais de 10 anos">
                          ⚠️ Desatualizado
                        </span>
                      )}
                    </div>
                    <p className="result-details">
                      {item.type === 'book' 
                        ? (item.volumeInfo?.authors?.join(', ') || 'Autor não especificado')
                        : item.type === 'scholar'
                        ? (item.authors?.map(a => a.name || a).join(', ') || 'Autor não especificado')
                        : item.type === 'dataverse'
                        ? (item.authors || 'Autor não especificado')
                        : (item.author?.[0] 
                            ? `${item.author[0].given || ''} ${item.author[0].family || ''}`.trim()
                            : 'Autor não especificado'
                          )
                      }
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

      <div className="reference-editor">
        <label>Referências Adicionadas (use o rich text abaixo para editar):</label>
        <div className="added-references">
          {addedReferences.length > 0 ? (
            <ul>
              {addedReferences.map((ref, index) => (
                <li key={index}>{ref}</li>
              ))}
            </ul>
          ) : (
            <p className="no-references">Nenhuma referência adicionada ainda. Use a busca acima para encontrar e adicionar referências.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceManager;

