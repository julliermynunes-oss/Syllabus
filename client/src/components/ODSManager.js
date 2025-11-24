import React, { useState, useEffect } from 'react';
import { FaGlobe, FaFileAlt } from 'react-icons/fa';
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
  const [expandedODS, setExpandedODS] = useState(null);

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

  const toggleODS = (ods) => {
    const index = odsSelecionados.findIndex(o => o.numero === ods.numero);
    let novosODS;
    
    if (index >= 0) {
      novosODS = odsSelecionados.filter(o => o.numero !== ods.numero);
    } else {
      novosODS = [...odsSelecionados, {
        numero: ods.numero,
        nome: ods.nome,
        descricao: ''
      }];
    }
    
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

  // Função para obter URL da imagem do ODS
  const getODSImageUrl = (numero) => {
    // Tentar múltiplas URLs possíveis para as imagens oficiais da ONU Brasil
    const urls = [
      `https://brasil.un.org/sites/default/files/2021-04/ODS-${numero}.png`,
      `https://brasil.un.org/sites/default/files/2021-04/E_SDG_Icons-${String(numero).padStart(2, '0')}.jpg`,
      `https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/07/E_SDG_Icons-${String(numero).padStart(2, '0')}.jpg`,
      `https://sdgs.un.org/themes/custom/porto/assets/images/goals/goal-${numero}.svg`
    ];
    return urls[0]; // Retornar primeira URL, o onError tentará as outras
  };

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
          <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
            Selecione os Objetivos de Desenvolvimento Sustentável (ODS) abordados nesta disciplina. 
            Clique em um ODS para selecioná-lo e adicionar uma descrição de como a disciplina o aborda.
          </p>
          
          <div className="ods-grid">
            {ODS_LIST.map(ods => {
              const selecionado = isODSSelecionado(ods.numero);
              const isExpanded = expandedODS === ods.numero;
              
              return (
                <div
                  key={ods.numero}
                  className={`ods-card ${selecionado ? 'selecionado' : ''} ${isExpanded ? 'expanded' : ''}`}
                  style={{
                    borderColor: selecionado ? ods.cor : '#e0e0e0',
                    background: selecionado ? `${ods.cor}15` : 'white'
                  }}
                  onClick={() => {
                    toggleODS(ods);
                    if (!selecionado) {
                      setExpandedODS(ods.numero);
                    } else if (isExpanded) {
                      setExpandedODS(null);
                    } else {
                      setExpandedODS(ods.numero);
                    }
                  }}
                >
                  <div className="ods-card-content">
                    <div 
                      className="ods-card-icon"
                      style={{ background: ods.cor }}
                    >
                      <img 
                        src={getODSImageUrl(ods.numero)}
                        alt={`ODS ${ods.numero}`}
                        onError={(e) => {
                          // Tentar URLs alternativas
                          const currentSrc = e.target.src;
                          if (currentSrc.includes('ODS-')) {
                            e.target.src = `https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/07/E_SDG_Icons-${String(ods.numero).padStart(2, '0')}.jpg`;
                          } else if (currentSrc.includes('E_SDG_Icons')) {
                            e.target.src = `https://sdgs.un.org/themes/custom/porto/assets/images/goals/goal-${ods.numero}.svg`;
                          } else {
                            // Se todas falharem, mostrar número
                            e.target.style.display = 'none';
                            const numberSpan = e.target.parentElement.querySelector('.ods-icon-number');
                            if (numberSpan) {
                              numberSpan.style.display = 'flex';
                            }
                          }
                        }}
                      />
                      <span 
                        className="ods-icon-number"
                        style={{ 
                          display: 'none',
                          width: '100%', 
                          height: '100%', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '1.2rem',
                          color: 'white',
                          position: 'absolute',
                          top: 0,
                          left: 0
                        }}
                      >
                        {ods.numero}
                      </span>
                    </div>
                    <div className="ods-card-text">
                      <div className="ods-card-number">ODS {ods.numero}</div>
                      <div className="ods-card-name">{ods.nome}</div>
                    </div>
                  </div>
                  
                  {selecionado && isExpanded && (
                    <div className="ods-descricao" onClick={(e) => e.stopPropagation()}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                        Como esta disciplina aborda este ODS:
                      </label>
                      <TiptapEditor
                        content={getODSDescricao(ods.numero)}
                        onChange={(content) => updateODSDescricao(ods.numero, content)}
                        showCharCount={true}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {odsSelecionados.length > 0 && (
            <div className="ods-resumo" style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <strong>ODS Selecionados ({odsSelecionados.length}):</strong>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {odsSelecionados.map(ods => {
                  const odsInfo = ODS_LIST.find(o => o.numero === ods.numero);
                  return (
                    <span
                      key={ods.numero}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        background: odsInfo.cor,
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      ODS {ods.numero}
                    </span>
                  );
                })}
              </div>
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
