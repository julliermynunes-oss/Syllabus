import React, { useState, useEffect, useRef } from 'react';
import { FaGlobe, FaFileAlt, FaPlus, FaTimes } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import './ODSManager.css';

const ODS_LIST = [
  { numero: 1, nome: 'Erradicação da Pobreza', cor: '#E5243B' },
  { numero: 2, nome: 'Fome Zero e Agricultura Sustentável', cor: '#DDA63A' },
  { numero: 3, nome: 'Saúde e Bem-Estar', cor: '#4C9F38' },
  { numero: 4, nome: 'Educação de Qualidade', cor: '#C5192D' },
  { numero: 5, nome: 'Igualdade de Gênero', cor: '#FF3A21' },
  { numero: 6, nome: 'Água Potável e Saneamento', cor: '#26BDE2' },
  { numero: 7, nome: 'Energia Limpa e Acessível', cor: '#FCC30B' },
  { numero: 8, nome: 'Trabalho Decente e Crescimento Econômico', cor: '#A21942' },
  { numero: 9, nome: 'Indústria, Inovação e Infraestrutura', cor: '#FD6925' },
  { numero: 10, nome: 'Redução das Desigualdades', cor: '#DD1367' },
  { numero: 11, nome: 'Cidades e Comunidades Sustentáveis', cor: '#FD9D24' },
  { numero: 12, nome: 'Consumo e Produção Responsáveis', cor: '#BF8B2E' },
  { numero: 13, nome: 'Ação Contra a Mudança Global do Clima', cor: '#3F7E44' },
  { numero: 14, nome: 'Vida na Água', cor: '#0A97D9' },
  { numero: 15, nome: 'Vida Terrestre', cor: '#56C02B' },
  { numero: 16, nome: 'Paz, Justiça e Instituições Eficazes', cor: '#00689D' },
  { numero: 17, nome: 'Parcerias e Meios de Implementação', cor: '#19486A' },
];

const ODSManager = ({ content, onChange }) => {
  const [layout, setLayout] = useState('visual'); // 'visual' ou 'texto'
  const [odsSelecionados, setOdsSelecionados] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Inicializar dados quando receber content
  useEffect(() => {
    if (!content || content.trim() === '') {
      setLayout('visual');
      setTextContent('');
      setOdsSelecionados([]);
      return;
    }

    // Tentar parsear como JSON (layout visual)
    try {
      const parsed = JSON.parse(content);
      if (parsed.layout === 'visual' && parsed.ods_selecionados) {
        setLayout('visual');
        setOdsSelecionados(parsed.ods_selecionados || []);
        return;
      }
    } catch (e) {
      // Não é JSON, então é texto livre
    }

    // Se chegou aqui, é texto livre
    setLayout('texto');
    setTextContent(content);
  }, [content]);

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevenir scroll do body
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showDropdown]);

  // Salvar dados visuais
  const saveODSSelecionados = (newODS) => {
    setOdsSelecionados(newODS);
    const jsonData = JSON.stringify({
      layout: 'visual',
      ods_selecionados: newODS
    });
    onChange(jsonData);
  };

  // Salvar texto livre
  const saveTextContent = (newContent) => {
    setTextContent(newContent);
    onChange(newContent);
  };

  // Converter texto livre para visual
  const convertTextToVisual = () => {
    if (!textContent || textContent.trim() === '') {
      setLayout('visual');
      return;
    }

    // Tentar identificar ODS mencionados no texto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    const novosODS = [];
    ODS_LIST.forEach(ods => {
      if (text.toLowerCase().includes(ods.numero.toString()) || 
          text.toLowerCase().includes(ods.nome.toLowerCase())) {
        novosODS.push({
          numero: ods.numero,
          nome: ods.nome,
          descricao: ''
        });
      }
    });

    setOdsSelecionados(novosODS);
    setLayout('visual');
    saveODSSelecionados(novosODS);
  };

  // Converter visual para texto livre
  const convertVisualToText = () => {
    let html = '<p><strong>Objetivos de Desenvolvimento Sustentável abordados nesta disciplina:</strong></p><ul>';
    odsSelecionados.forEach(ods => {
      html += `<li><strong>ODS ${ods.numero}: ${ods.nome}</strong>`;
      if (ods.descricao) {
        html += `<br/>${ods.descricao}`;
      }
      html += '</li>';
    });
    html += '</ul>';

    setTextContent(html);
    setLayout('texto');
    saveTextContent(html);
  };

  const handleLayoutChange = (newLayout) => {
    if (newLayout === 'visual' && layout === 'texto') {
      convertTextToVisual();
    } else if (newLayout === 'texto' && layout === 'visual') {
      convertVisualToText();
    } else {
      setLayout(newLayout);
    }
  };

  const adicionarODS = (ods) => {
    // Verificar se já está selecionado
    if (odsSelecionados.some(o => o.numero === ods.numero)) {
      setShowDropdown(false);
      return;
    }

    const novosODS = [...odsSelecionados, {
      numero: ods.numero,
      nome: ods.nome,
      descricao: ''
    }];
    
    saveODSSelecionados(novosODS);
    setShowDropdown(false);
  };

  const removerODS = (numero) => {
    const novosODS = odsSelecionados.filter(o => o.numero !== numero);
    saveODSSelecionados(novosODS);
  };

  const updateODSDescricao = (numero, descricao) => {
    const novosODS = odsSelecionados.map(ods => {
      if (ods.numero === numero) {
        return { ...ods, descricao };
      }
      return ods;
    });
    saveODSSelecionados(novosODS);
  };

  const getODSDescricao = (numero) => {
    const ods = odsSelecionados.find(o => o.numero === numero);
    return ods ? ods.descricao : '';
  };

  const isODSSelecionado = (numero) => {
    return odsSelecionados.some(o => o.numero === numero);
  };

  // ODS disponíveis para adicionar (não selecionados)
  const odsDisponiveis = ODS_LIST.filter(ods => !isODSSelecionado(ods.numero));

  return (
    <div className="ods-manager">
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: '#235795' }}>
          Layout de ODS:
        </label>
        <div className="layout-selector-buttons">
          <button
            type="button"
            className={`layout-option-btn ${layout === 'visual' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('visual')}
          >
            <div className="layout-icon">
              <FaGlobe size={24} />
            </div>
            <div className="layout-label">
              <strong>Seleção Visual</strong>
            </div>
          </button>
          <button
            type="button"
            className={`layout-option-btn ${layout === 'texto' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('texto')}
          >
            <div className="layout-icon">
              <FaFileAlt size={24} />
            </div>
            <div className="layout-label">
              <strong>Texto Livre</strong>
            </div>
          </button>
        </div>
      </div>

      {layout === 'visual' ? (
        <div className="ods-visual">
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="btn-adicionar-ods"
              onClick={() => setShowDropdown(true)}
              disabled={odsDisponiveis.length === 0}
            >
              <FaPlus size={16} style={{ marginRight: '0.5rem' }} />
              Adicionar ODS
            </button>
            
            {odsSelecionados.length > 0 && (
              <span style={{ color: '#666', fontSize: '0.9rem' }}>
                {odsSelecionados.length} ODS selecionado{odsSelecionados.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Modal de seleção de ODS */}
          {showDropdown && (
            <div className="ods-modal-overlay" onClick={() => setShowDropdown(false)}>
              <div className="ods-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ods-modal-header">
                  <h3>Selecione um ODS para adicionar</h3>
                  <button
                    type="button"
                    className="ods-modal-close"
                    onClick={() => setShowDropdown(false)}
                    title="Fechar"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
                <div className="ods-modal-content">
                  {odsDisponiveis.length === 0 ? (
                    <div className="ods-modal-empty">
                      <p>Todos os ODS já foram selecionados.</p>
                    </div>
                  ) : (
                    <div className="ods-modal-grid">
                      {odsDisponiveis.map(ods => (
                        <div
                          key={ods.numero}
                          className="ods-modal-item"
                          onClick={() => adicionarODS(ods)}
                        >
                          <div 
                            className="ods-modal-icon"
                            style={{ background: ods.cor, position: 'relative' }}
                          >
                            <img 
                              src={`https://sdgs.un.org/themes/custom/porto/assets/images/goals/goal-${ods.numero}.svg`}
                              alt={`ODS ${ods.numero}`}
                              className="ods-icon-img"
                              onLoad={(e) => {
                                const numberSpan = e.target.parentElement.querySelector('.ods-icon-number');
                                if (numberSpan) {
                                  numberSpan.style.display = 'none';
                                }
                              }}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain',
                                filter: 'brightness(0) invert(1)',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 2
                              }}
                              onError={(e) => {
                                if (!e.target.dataset.triedAlternative) {
                                  e.target.dataset.triedAlternative = 'true';
                                  e.target.src = `https://www.globalgoals.org/resources/icons/goal-${ods.numero}.svg`;
                                  return;
                                }
                                e.target.style.display = 'none';
                                const numberSpan = e.target.parentElement.querySelector('.ods-icon-number');
                                if (numberSpan) {
                                  numberSpan.style.display = 'flex';
                                }
                              }}
                            />
                            <span 
                              className="ods-icon-number"
                              style={{ 
                                display: 'flex',
                                width: '100%', 
                                height: '100%', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                color: 'white',
                                position: 'relative',
                                zIndex: 1
                              }}
                            >
                              {ods.numero}
                            </span>
                          </div>
                          <div className="ods-modal-info">
                            <div className="ods-modal-number">ODS {ods.numero}</div>
                            <div className="ods-modal-name">{ods.nome}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
            
            {odsSelecionados.length > 0 && (
              <span style={{ color: '#666', fontSize: '0.9rem' }}>
                {odsSelecionados.length} ODS selecionado{odsSelecionados.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {odsSelecionados.length === 0 ? (
            <div className="ods-empty-state">
              <p>Nenhum ODS selecionado ainda.</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                Clique em "Adicionar ODS" para começar.
              </p>
            </div>
          ) : (
            <div className="ods-selecionados-list">
              {odsSelecionados.map(ods => {
                const odsInfo = ODS_LIST.find(o => o.numero === ods.numero);
                return (
                  <div
                    key={ods.numero}
                    className="ods-selecionado-card"
                    style={{
                      borderLeft: `4px solid ${odsInfo.cor}`,
                      background: `${odsInfo.cor}08`
                    }}
                  >
                    <div className="ods-selecionado-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <div 
                          className="ods-selecionado-icon"
                          style={{ background: odsInfo.cor, position: 'relative' }}
                        >
                          <img 
                            src={`https://sdgs.un.org/themes/custom/porto/assets/images/goals/goal-${ods.numero}.svg`}
                            alt={`ODS ${ods.numero}`}
                            className="ods-icon-img"
                            onLoad={(e) => {
                              // Quando o ícone carregar, esconder o número
                              const numberSpan = e.target.parentElement.querySelector('.ods-icon-number');
                              if (numberSpan) {
                                numberSpan.style.display = 'none';
                              }
                            }}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain',
                              filter: 'brightness(0) invert(1)',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              zIndex: 2
                            }}
                            onError={(e) => {
                              // Tentar URL alternativa
                              if (!e.target.dataset.triedAlternative) {
                                e.target.dataset.triedAlternative = 'true';
                                e.target.src = `https://www.globalgoals.org/resources/icons/goal-${ods.numero}.svg`;
                                return;
                              }
                              // Se ambas falharem, esconder ícone e mostrar número
                              e.target.style.display = 'none';
                              const numberSpan = e.target.parentElement.querySelector('.ods-icon-number');
                              if (numberSpan) {
                                numberSpan.style.display = 'flex';
                              }
                            }}
                          />
                          <span 
                            className="ods-icon-number"
                            style={{ 
                              display: 'flex',
                              width: '100%', 
                              height: '100%', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '1.1rem',
                              color: 'white',
                              position: 'relative',
                              zIndex: 1
                            }}
                          >
                            {ods.numero}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#235795', fontSize: '1rem' }}>
                            ODS {ods.numero}: {ods.nome}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-remover-ods"
                        onClick={() => removerODS(ods.numero)}
                        title="Remover ODS"
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                    
                    <div className="ods-selecionado-descricao">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#666' }}>
                        Como esta disciplina aborda este ODS:
                      </label>
                      <TiptapEditor
                        content={getODSDescricao(ods.numero)}
                        onChange={(content) => updateODSDescricao(ods.numero, content)}
                        showCharCount={true}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="ods-text">
          <TiptapEditor
            content={textContent}
            onChange={saveTextContent}
            showCharCount={true}
          />
          <p className="editor-note">
            💡 Nota: Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas.
          </p>
        </div>
      )}
    </div>
  );
};

export default ODSManager;
