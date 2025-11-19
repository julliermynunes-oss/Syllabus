import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaChalkboardTeacher, FaFileAlt } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import './MethodologyManager.css';

const MethodologyManager = ({ content, onChange }) => {
  const [layout, setLayout] = useState('texto'); // 'estruturado' ou 'texto'
  const [structuredData, setStructuredData] = useState({
    modalidade: '',
    recursos: [],
    atividades_praticas: [],
    avaliacao_continua: {
      ativa: false,
      descricao: ''
    }
  });
  const [textContent, setTextContent] = useState('');

  const recursosOptions = [
    'Slides',
    'Vídeos',
    'Plataformas Online',
    'Livros',
    'Artigos',
    'Software',
    'Laboratórios',
    'Simulações',
    'Jogos Educacionais',
    'Outros'
  ];

  // Inicializar dados quando receber content
  useEffect(() => {
    if (!content || content.trim() === '') {
      setLayout('texto');
      setTextContent('');
      setStructuredData({
        modalidade: '',
        recursos: [],
        atividades_praticas: [],
        avaliacao_continua: {
          ativa: false,
          descricao: ''
        }
      });
      return;
    }

    // Tentar parsear como JSON (layout estruturado)
    try {
      const parsed = JSON.parse(content);
      if (parsed.layout === 'estruturado' && parsed.data) {
        setLayout('estruturado');
        setStructuredData({
          modalidade: parsed.data.modalidade || '',
          recursos: parsed.data.recursos || [],
          atividades_praticas: parsed.data.atividades_praticas || [],
          avaliacao_continua: parsed.data.avaliacao_continua || {
            ativa: false,
            descricao: ''
          }
        });
        return;
      }
    } catch (e) {
      // Não é JSON, então é texto livre
    }

    // Se chegou aqui, é texto livre
    setLayout('texto');
    setTextContent(content);
  }, [content]);

  // Salvar dados estruturados
  const saveStructuredData = (newData) => {
    setStructuredData(newData);
    const jsonData = JSON.stringify({
      layout: 'estruturado',
      data: newData
    });
    onChange(jsonData);
  };

  // Salvar texto livre
  const saveTextContent = (newContent) => {
    setTextContent(newContent);
    onChange(newContent);
  };

  // Converter texto livre para estruturado
  const convertTextToStructured = () => {
    if (!textContent || textContent.trim() === '') {
      setLayout('estruturado');
      return;
    }

    // Tentar extrair informações do HTML/texto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';

    // Tentar identificar modalidade
    let modalidade = '';
    if (text.toLowerCase().includes('presencial')) {
      modalidade = 'Presencial';
    } else if (text.toLowerCase().includes('híbrido') || text.toLowerCase().includes('hibrido')) {
      modalidade = 'Híbrido';
    } else if (text.toLowerCase().includes('ead') || text.toLowerCase().includes('online')) {
      modalidade = 'EAD';
    }

    // Tentar identificar recursos mencionados
    const recursos = [];
    recursosOptions.forEach(rec => {
      if (text.toLowerCase().includes(rec.toLowerCase())) {
        recursos.push(rec);
      }
    });

    const newData = {
      modalidade,
      recursos,
      atividades_praticas: [],
      avaliacao_continua: {
        ativa: text.toLowerCase().includes('avaliação contínua') || text.toLowerCase().includes('avaliacao continua'),
        descricao: ''
      }
    };

    setStructuredData(newData);
    setLayout('estruturado');
    saveStructuredData(newData);
  };

  // Converter estruturado para texto livre
  const convertStructuredToText = () => {
    let html = '';
    
    if (structuredData.modalidade) {
      html += `<p><strong>Modalidade de Ensino:</strong> ${structuredData.modalidade}</p>`;
    }
    
    if (structuredData.recursos && structuredData.recursos.length > 0) {
      html += '<p><strong>Recursos Utilizados:</strong></p><ul>';
      structuredData.recursos.forEach(recurso => {
        html += `<li>${recurso}</li>`;
      });
      html += '</ul>';
    }
    
    if (structuredData.atividades_praticas && structuredData.atividades_praticas.length > 0) {
      html += '<p><strong>Atividades Práticas:</strong></p><ul>';
      structuredData.atividades_praticas.forEach(atividade => {
        html += `<li><strong>${atividade.nome}:</strong> ${atividade.descricao || ''}</li>`;
      });
      html += '</ul>';
    }
    
    if (structuredData.avaliacao_continua && structuredData.avaliacao_continua.ativa) {
      html += '<p><strong>Avaliação Contínua:</strong> Sim</p>';
      if (structuredData.avaliacao_continua.descricao) {
        html += `<p>${structuredData.avaliacao_continua.descricao}</p>`;
      }
    }

    setTextContent(html);
    setLayout('texto');
    saveTextContent(html);
  };

  const handleLayoutChange = (newLayout) => {
    if (newLayout === 'estruturado' && layout === 'texto') {
      convertTextToStructured();
    } else if (newLayout === 'texto' && layout === 'estruturado') {
      convertStructuredToText();
    } else {
      setLayout(newLayout);
    }
  };

  const toggleRecurso = (recurso) => {
    const newRecursos = structuredData.recursos.includes(recurso)
      ? structuredData.recursos.filter(r => r !== recurso)
      : [...structuredData.recursos, recurso];
    saveStructuredData({ ...structuredData, recursos: newRecursos });
  };

  const addAtividade = () => {
    const newAtividades = [...structuredData.atividades_praticas, { nome: '', descricao: '' }];
    saveStructuredData({ ...structuredData, atividades_praticas: newAtividades });
  };

  const removeAtividade = (index) => {
    const newAtividades = structuredData.atividades_praticas.filter((_, i) => i !== index);
    saveStructuredData({ ...structuredData, atividades_praticas: newAtividades });
  };

  const updateAtividade = (index, field, value) => {
    const newAtividades = [...structuredData.atividades_praticas];
    newAtividades[index] = { ...newAtividades[index], [field]: value };
    saveStructuredData({ ...structuredData, atividades_praticas: newAtividades });
  };

  const updateField = (field, value) => {
    saveStructuredData({ ...structuredData, [field]: value });
  };

  const updateAvaliacaoContinua = (field, value) => {
    saveStructuredData({
      ...structuredData,
      avaliacao_continua: {
        ...structuredData.avaliacao_continua,
        [field]: value
      }
    });
  };

  return (
    <div className="methodology-manager">
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: '#235795' }}>
          Layout de Metodologia:
        </label>
        <div className="layout-selector-buttons">
          <button
            type="button"
            className={`layout-option-btn ${layout === 'estruturado' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('estruturado')}
          >
            <div className="layout-icon">
              <FaChalkboardTeacher size={24} />
            </div>
            <div className="layout-label">
              <strong>Campos Estruturados</strong>
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

      {layout === 'estruturado' ? (
        <div className="methodology-structured">
          <div className="form-row full-width">
            <div className="form-field">
              <label>
                <FaChalkboardTeacher style={{ marginRight: '0.5rem' }} />
                Modalidade de Ensino:
              </label>
              <select
                value={structuredData.modalidade}
                onChange={(e) => updateField('modalidade', e.target.value)}
                style={{ marginTop: '0.25rem', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d5dbea', fontSize: '0.9rem', width: '100%' }}
              >
                <option value="">Selecione a modalidade</option>
                <option value="Presencial">Presencial</option>
                <option value="Híbrido">Híbrido</option>
                <option value="EAD">EAD</option>
              </select>
            </div>
          </div>

          <div className="form-row full-width">
            <div className="form-field">
              <label>Recursos Utilizados:</label>
              <div className="recursos-checkboxes" style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {recursosOptions.map(recurso => (
                  <label key={recurso} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e0e0e0', background: structuredData.recursos.includes(recurso) ? '#e8f4f8' : 'white' }}>
                    <input
                      type="checkbox"
                      checked={structuredData.recursos.includes(recurso)}
                      onChange={() => toggleRecurso(recurso)}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <span>{recurso}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row full-width">
            <div className="form-field">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Atividades Práticas:</span>
                <button
                  type="button"
                  onClick={addAtividade}
                  className="add-activity-btn"
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#235795',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaPlus /> Adicionar Atividade
                </button>
              </label>
              {structuredData.atividades_praticas.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic', marginTop: '0.5rem' }}>
                  Nenhuma atividade adicionada. Clique em "Adicionar Atividade" para começar.
                </p>
              ) : (
                <div className="atividades-list" style={{ marginTop: '0.5rem' }}>
                  {structuredData.atividades_praticas.map((atividade, index) => (
                    <div key={index} className="atividade-item" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={atividade.nome}
                          onChange={(e) => updateAtividade(index, 'nome', e.target.value)}
                          placeholder="Nome da atividade"
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #d5dbea',
                            fontSize: '0.9rem'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeAtividade(index)}
                          style={{
                            padding: '0.5rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <textarea
                        value={atividade.descricao}
                        onChange={(e) => updateAtividade(index, 'descricao', e.target.value)}
                        placeholder="Descrição da atividade..."
                        rows={3}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #d5dbea',
                          fontSize: '0.9rem',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-row full-width">
            <div className="form-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={structuredData.avaliacao_continua.ativa}
                  onChange={(e) => updateAvaliacaoContinua('ativa', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Avaliação Contínua</span>
              </label>
              {structuredData.avaliacao_continua.ativa && (
                <div style={{ marginTop: '0.5rem' }}>
                  <TiptapEditor
                    content={structuredData.avaliacao_continua.descricao}
                    onChange={(content) => updateAvaliacaoContinua('descricao', content)}
                    showCharCount={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="methodology-text">
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

export default MethodologyManager;

