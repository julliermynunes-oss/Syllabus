import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { FaArrowLeft, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import './CompetenciesManager.css';

const CompetenciesManager = () => {
  const navigate = useNavigate();
  const [competenciasData, setCompetenciasData] = useState({});
  const [selectedCurso, setSelectedCurso] = useState('');
  const [competenciaRows, setCompetenciaRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetenciasData();
  }, []);

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
    } else {
      setCompetenciaRows([]);
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

