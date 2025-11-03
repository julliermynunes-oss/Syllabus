import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import './CompetenciesTable.css';

const CompetenciesTable = ({ data, onChange, curso }) => {
  const [rows, setRows] = useState([]);
  const initializedRef = useRef(false);
  const loadedCursoRef = useRef(null);

  // Carregar competências do XLSX quando curso mudar
  useEffect(() => {
    if (curso && curso !== loadedCursoRef.current) {
      loadCompetenciasFromAPI(curso);
      loadedCursoRef.current = curso;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curso]);

  const loadCompetenciasFromAPI = async (cursoNome) => {
    if (!cursoNome) return;

    try {
      const response = await axios.get(`${API_URL}/api/competencias`, {
        params: { curso: cursoNome }
      });

      if (response.data && response.data.length > 0) {
        // Transformar dados da API para o formato da tabela
        const newRows = response.data.map(item => ({
          competencia: item.competencia || '',
          descricao: item.descricao || '',
          grau: 0 // Iniciar com grau 0
        }));
        setRows(newRows);
      } else {
        // Se não houver competências, verificar se há dados salvos
        if (data && data.length > 0) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.rows && parsed.rows.length > 0) {
              setRows(parsed.rows);
            } else {
              setRows([]);
            }
          } catch (e) {
            setRows([]);
          }
        } else {
          setRows([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar competências:', error);
      // Fallback para dados salvos se houver
      if (data && data.length > 0) {
        try {
          const parsed = JSON.parse(data);
          setRows(parsed.rows || []);
        } catch (e) {
          setRows([]);
        }
      }
    }
  };

  // Inicializar dados da tabela se já existirem (edição)
  useEffect(() => {
    if (!initializedRef.current && !curso) {
      if (data && data.length > 0) {
        try {
          const parsed = JSON.parse(data);
          setRows(parsed.rows || []);
        } catch (e) {
          setRows([]);
        }
      } else {
        setRows([]);
      }
      initializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salvar dados automaticamente quando mudarem
  useEffect(() => {
    if (initializedRef.current) {
      const dataObj = { rows };
      onChange(JSON.stringify(dataObj));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const updateRow = (index, field, value) => {
    // Não permitir editar competência
    if (field === 'competencia') {
      return;
    }
    const newRows = rows.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setRows(newRows);
  };

  const getContribuicao = (grau) => {
    if (grau === 0) return '○ ○ ○';
    return '●'.repeat(grau) + '○'.repeat(3 - grau);
  };

  return (
    <div className="competencies-table-container">
      <div className="competencies-header">
        <h3>Competências da Disciplina</h3>
        {!curso && (
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            Selecione um curso e disciplina para carregar as competências automaticamente.
          </p>
        )}
      </div>

      <div className="competencies-table-wrapper">
        <table className="competencies-table">
          <thead>
            <tr>
              <th className="col-competencia">Competência</th>
              <th className="col-descricao">Descrição</th>
              <th className="col-contribuicao">Grau de Contribuição</th>
              <th className="col-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className="empty-row">
                <td colSpan="4" className="empty-message">
                  {curso 
                    ? 'Nenhuma competência encontrada para este curso.' 
                    : 'Selecione um curso e disciplina para carregar as competências automaticamente.'}
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="col-competencia">
                  <input
                    type="text"
                    value={row.competencia || ''}
                    readOnly
                    placeholder="Nome da competência"
                    className="table-input readonly"
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
                <td className="col-contribuicao">
                  <button
                    type="button"
                    className="grau-btn"
                    onClick={() => updateRow(index, 'grau', ((row.grau || 0) + 1) % 4)}
                  >
                    {getContribuicao(row.grau || 0)}
                  </button>
                </td>
                <td className="col-actions">
                  {/* Não mostrar botão de excluir, pois competências vêm do XLSX */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompetenciesTable;

