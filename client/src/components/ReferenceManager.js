import React, { useState } from 'react';
import axios from 'axios';
import { FaSearch, FaPlus, FaSpinner } from 'react-icons/fa';
import './ReferenceManager.css';

const ReferenceManager = ({ content, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedReferences, setAddedReferences] = useState([]);

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
      setSearchResults(items);
    } catch (error) {
      console.error('Erro ao buscar na API do Crossref:', error);
      window.alert('Erro ao buscar referências. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const isOutdated = (item) => {
    const year = item.published?.['date-parts']?.[0]?.[0] || item.created?.['date-parts']?.[0]?.[0];
    if (!year) return false;
    const currentYear = new Date().getFullYear();
    return (currentYear - year) > 10;
  };

  const formatReference = (item) => {
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
      searchCrossRef();
    }
  };

  return (
    <div className="reference-manager">
      <div className="reference-search">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Pesquisar por título, autor ou DOI na API do Crossref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="reference-search-input"
          />
          <button
            type="button"
            onClick={searchCrossRef}
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
                      <strong>{item.title?.[0] || 'Sem título'}</strong>
                      {outdated && (
                        <span className="outdated-badge" title="Artigo com mais de 10 anos">
                          ⚠️ Desatualizado
                        </span>
                      )}
                    </div>
                    <p className="result-details">
                      {item.author?.[0] 
                        ? `${item.author[0].given || ''} ${item.author[0].family || ''}`.trim()
                        : 'Autor não especificado'
                      }
                      {item.published && ` (${item.published['date-parts']?.[0]?.[0] || ''})`}
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

