import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { FaArrowLeft, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import './CompetenciesManager.css';

const CompetenciesManager = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [competenciasData, setCompetenciasData] = useState({});
  const [selectedCurso, setSelectedCurso] = useState('');
  const [competenciaRows, setCompetenciaRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limiteContribuicoes, setLimiteContribuicoes] = useState(0);
  const [limitesPorCurso, setLimitesPorCurso] = useState({});

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
      response.data.forEach(item => {
        limitesMap[item.curso] = item.limite_contribuicoes;
      });
      setLimitesPorCurso(limitesMap);
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
    }
  };

  const loadCompetenciasData = async () => {
    try {
      // Carregar todas as competências organizadas por curso
      // Como não temos endpoint para todas, vamos buscar curso por curso
      const cursos = ['CGA', 'CGAP', 'OneMBA', 'MPA', 'MPGI', 'MPGPP', 'MPGC', 'DPA', 'CMAE', 'CDAE', 'CMAPG', 'CDAPG', 'AFA', 'EMBA', 'EMBA Saúde'];
      const allData = {};
      
      for (const curso of cursos) {
        try {
          const response = await axios.get(`${API_URL}/api/competencias`, {
            params: { curso }
          });
          if (response.data && response.data.length > 0) {
            allData[curso] = response.data;
          }
        } catch (error) {
          console.error(`Erro ao carregar competências para ${curso}:`, error);
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
      // Carregar limite do curso selecionado
      setLimiteContribuicoes(limitesPorCurso[curso] || 0);
    } else {
      setCompetenciaRows([]);
      setLimiteContribuicoes(0);
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

  return (
    <div className="competencies-manager-container">
      <div className="manager-header">
        <button className="back-btn" onClick={() => navigate('/syllabi')}>
          <FaArrowLeft /> Voltar
        </button>
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

