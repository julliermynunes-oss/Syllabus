import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import { FaArrowLeft, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import './CompetenciesManager.css';

const CompetenciesManager = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [competenciasData, setCompetenciasData] = useState({});
  const [selectedCurso, setSelectedCurso] = useState('');
  const [competenciaRows, setCompetenciaRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limiteContribuicoes, setLimiteContribuicoes] = useState(0);
  const [limitesPorCurso, setLimitesPorCurso] = useState({});
  const [linkInfo, setLinkInfo] = useState('');
  const [linksPorCurso, setLinksPorCurso] = useState({});

  useEffect(() => {
    loadCompetenciasData();
    loadLimites();
  }, []);

  const loadLimites = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/competencias/limits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const limitesMap = {};
      const linksMap = {};
      response.data.forEach(item => {
        limitesMap[item.curso] = item.limite_contribuicoes;
        linksMap[item.curso] = item.link_info || '';
      });
      setLimitesPorCurso(limitesMap);
      setLinksPorCurso(linksMap);
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
    }
  };

  const loadCompetenciasData = async () => {
    try {
      // Primeiro, obter lista de todos os cursos disponíveis
      const cursosResponse = await axios.get(`${API_URL}/api/competencias/cursos`);
      const cursos = cursosResponse.data || [];
      
      if (cursos.length === 0) {
        console.warn('Nenhum curso encontrado no arquivo de competências');
        setCompetenciasData({});
        setLoading(false);
        return;
      }

      // Carregar competências para cada curso
      const allData = {};
      
      for (const curso of cursos) {
        try {
          const response = await axios.get(`${API_URL}/api/competencias`, {
            params: { curso }
          });
          if (response.data && response.data.length > 0) {
            allData[curso] = response.data;
          } else {
            // Adicionar curso mesmo sem competências para permitir configuração de limite
            allData[curso] = [];
          }
        } catch (error) {
          console.error(`Erro ao carregar competências para ${curso}:`, error);
          // Adicionar curso mesmo com erro para permitir configuração de limite
          allData[curso] = [];
        }
      }
      
      setCompetenciasData(allData);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar competências:', error);
      setLoading(false);
    }
  };

  const handleCursoChange = (e) => {
    const curso = e.target.value;
    setSelectedCurso(curso);
    if (curso && competenciasData[curso]) {
      setCompetenciaRows(
        competenciasData[curso].map(item => ({
          competencia: item.competencia || '',
          descricao: item.descricao || ''
        }))
      );
      // Carregar limite e link do curso selecionado
      setLimiteContribuicoes(limitesPorCurso[curso] || 0);
      setLinkInfo(linksPorCurso[curso] || '');
    } else {
      setCompetenciaRows([]);
      setLimiteContribuicoes(0);
      setLinkInfo('');
    }
  };

  const updateRow = (index, field, value) => {
    const newRows = competenciaRows.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setCompetenciaRows(newRows);
  };

  const addRow = () => {
    setCompetenciaRows([...competenciaRows, { competencia: '', descricao: '' }]);
  };

  const deleteRow = (index) => {
    setCompetenciaRows(competenciaRows.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedCurso) {
      alert('Selecione um curso primeiro');
      return;
    }

    // Salvar limite de contribuições e link
    try {
      await axios.post(
        `${API_URL}/api/competencias/limit`,
        {
          curso: selectedCurso,
          limite: limiteContribuicoes,
          linkInfo: linkInfo
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Atualizar mapas de limites e links
      setLimitesPorCurso(prev => ({
        ...prev,
        [selectedCurso]: limiteContribuicoes
      }));
      setLinksPorCurso(prev => ({
        ...prev,
        [selectedCurso]: linkInfo
      }));
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
      return;
    }

    // Atualizar dados em memória
    const updatedData = {
      ...competenciasData,
      [selectedCurso]: competenciaRows
    };
    setCompetenciasData(updatedData);

    // Aqui normalmente salvaríamos no backend, mas como é um arquivo XLSX,
    // precisaríamos de um endpoint para atualizar o arquivo.
    // Por enquanto, apenas atualizamos em memória
    alert('Competências atualizadas! Nota: As alterações não serão persistidas no arquivo XLSX automaticamente.');
  };

  const cursos = Object.keys(competenciasData).sort();

  if (loading) {
    return (
      <div className="competencies-manager-container">
        <div className="loading-message">Carregando competências...</div>
      </div>
    );
  }

  if (isEmbedded) {
    // Layout quando está embedded na página de configurações
    return (
      <div className="models-tab">
        <div className="models-controls">
          <div className="models-course-select">
            <label htmlFor="competencies-course">Selecione o Curso:</label>
            <div className="course-select-row">
              <select 
                id="competencies-course" 
                value={selectedCurso} 
                onChange={handleCursoChange}
              >
                <option value="">-- Selecione um curso --</option>
                {cursos.map(curso => (
                  <option key={curso} value={curso}>{curso}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!selectedCurso ? (
          <div className="empty-state-card">
            <h3>Nenhum curso selecionado</h3>
            <p>Selecione um curso para configurar as competências.</p>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h3>Configurações de Competências para {selectedCurso}</h3>
            </div>
            
            <div className="form-field" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="limite-input">
                Limite de Contribuições:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.5rem' }}>
                <input
                  id="limite-input"
                  type="number"
                  min="0"
                  value={limiteContribuicoes}
                  onChange={(e) => setLimiteContribuicoes(parseInt(e.target.value) || 0)}
                  style={{
                    width: '120px',
                    padding: '1.25rem 1.5rem',
                    border: '2px solid #a4a4a4',
                    borderRadius: '10px',
                    fontSize: '1.05rem',
                    background: '#fafafa',
                    color: '#235795'
                  }}
                />
                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                  bolinhas disponíveis para distribuir entre todas as competências
                </span>
              </div>
            </div>

            <div className="form-field" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="link-input">
                Link de Informações sobre Competências:
              </label>
              <input
                id="link-input"
                type="url"
                value={linkInfo}
                onChange={(e) => setLinkInfo(e.target.value)}
                placeholder="https://exemplo.com/competencias"
                style={{ marginTop: '0.5rem' }}
              />
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Este link aparecerá no final da tabela de competências com o texto: "Mais informações sobre as competências esperadas para os egressos do {selectedCurso} podem ser encontradas aqui."
              </p>
            </div>

            <div style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#235795' }}>Competências</h4>
                <button type="button" onClick={addRow} className="primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  <FaPlus /> Adicionar Competência
                </button>
              </div>

              <div className="competencies-table-wrapper" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                <table className="competencies-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#235795', color: 'white', padding: '12px', textAlign: 'left', fontWeight: '600' }}>Competência</th>
                      <th style={{ background: '#235795', color: 'white', padding: '12px', textAlign: 'left', fontWeight: '600' }}>Descrição</th>
                      <th style={{ background: '#235795', color: 'white', padding: '12px', textAlign: 'center', fontWeight: '600', width: '10%' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competenciaRows.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#666', fontStyle: 'italic' }}>
                          Nenhuma competência adicionada.
                        </td>
                      </tr>
                    )}
                    {competenciaRows.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="text"
                            value={row.competencia || ''}
                            onChange={(e) => updateRow(index, 'competencia', e.target.value)}
                            placeholder="Nome da competência"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '0.95rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <textarea
                            value={row.descricao || ''}
                            onChange={(e) => updateRow(index, 'descricao', e.target.value)}
                            placeholder="Descrição detalhada"
                            rows="2"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '0.95rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              minHeight: '60px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => deleteRow(index)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              transition: 'background 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#c82333'}
                            onMouseOut={(e) => e.target.style.background = '#dc3545'}
                            title="Remover linha"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-actions" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e0e0e0' }}>
                <button 
                  type="button" 
                  onClick={handleSave} 
                  className="primary-btn"
                  disabled={!selectedCurso}
                >
                  <FaSave /> Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Layout original quando não está embedded
  return (
    <div className={`competencies-manager-container${isEmbedded ? ' embedded' : ''}`}>
      <div className="manager-header">
        {!isEmbedded && (
          <button className="back-btn" onClick={() => navigate('/syllabi')}>
            <FaArrowLeft /> Voltar
          </button>
        )}
        <h1 className="manager-title">Gerenciar Competências</h1>
      </div>

      <div className="manager-content">
        <div className="curso-selector">
          <label htmlFor="curso-select">Selecione o Curso:</label>
          <select
            id="curso-select"
            value={selectedCurso}
            onChange={handleCursoChange}
            className="curso-select"
          >
            <option value="">-- Selecione um curso --</option>
            {cursos.map(curso => (
              <option key={curso} value={curso}>{curso}</option>
            ))}
          </select>
        </div>

        {selectedCurso && (
          <>
            <div className="limite-config-section">
              <label htmlFor="limite-input">
                <strong>Limite de Contribuições para {selectedCurso}:</strong>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input
                  id="limite-input"
                  type="number"
                  min="0"
                  value={limiteContribuicoes}
                  onChange={(e) => setLimiteContribuicoes(parseInt(e.target.value) || 0)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #235795',
                    borderRadius: '6px',
                    fontSize: '16px',
                    width: '100px'
                  }}
                />
                <span style={{ color: '#666', fontSize: '14px' }}>
                  bolinhas disponíveis para distribuir entre todas as competências
                </span>
              </div>
            </div>

            <div className="limite-config-section" style={{ marginTop: '20px' }}>
              <label htmlFor="link-input">
                <strong>Link de Informações sobre Competências para {selectedCurso}:</strong>
              </label>
              <div style={{ marginTop: '10px' }}>
                <input
                  id="link-input"
                  type="url"
                  value={linkInfo}
                  onChange={(e) => setLinkInfo(e.target.value)}
                  placeholder="https://exemplo.com/competencias"
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #235795',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '100%',
                    maxWidth: '600px'
                  }}
                />
                <p style={{ color: '#666', fontSize: '12px', marginTop: '5px', marginBottom: 0 }}>
                  Este link aparecerá no final da tabela de competências com o texto: "Mais informações sobre as competências esperadas para os egressos do {selectedCurso} podem ser encontradas aqui."
                </p>
              </div>
            </div>

            <div className="table-header">
              <h3>Competências para {selectedCurso}</h3>
              <button type="button" onClick={addRow} className="add-row-btn">
                <FaPlus /> Adicionar Competência
              </button>
            </div>

            <div className="competencies-table-wrapper">
              <table className="competencies-table">
                <thead>
                  <tr>
                    <th className="col-competencia">Competência</th>
                    <th className="col-descricao">Descrição</th>
                    <th className="col-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {competenciaRows.length === 0 && (
                    <tr className="empty-row">
                      <td colSpan="3" className="empty-message">
                        Nenhuma competência adicionada.
                      </td>
                    </tr>
                  )}
                  {competenciaRows.map((row, index) => (
                    <tr key={index}>
                      <td className="col-competencia">
                        <input
                          type="text"
                          value={row.competencia || ''}
                          onChange={(e) => updateRow(index, 'competencia', e.target.value)}
                          placeholder="Nome da competência"
                          className="table-input"
                        />
                      </td>
                      <td className="col-descricao">
                        <textarea
                          value={row.descricao || ''}
                          onChange={(e) => updateRow(index, 'descricao', e.target.value)}
                          placeholder="Descrição detalhada"
                          className="table-textarea"
                          rows="2"
                        />
                      </td>
                      <td className="col-actions">
                        <button
                          type="button"
                          onClick={() => deleteRow(index)}
                          className="delete-btn"
                          title="Remover linha"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="save-actions">
              <button type="button" onClick={handleSave} className="save-btn">
                <FaSave /> Salvar Alterações
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompetenciesManager;

