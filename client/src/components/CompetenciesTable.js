import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import './CompetenciesTable.css';

const CompetenciesTable = ({ data, onChange }) => {
  const [rows, setRows] = useState([]);
  const initializedRef = useRef(false);

  // Inicializar dados da tabela apenas uma vez
  useEffect(() => {
    if (!initializedRef.current) {
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

  const addRow = () => {
    setRows([...rows, { competencia: '', descricao: '', grau: 0 }]);
  };

  const updateRow = (index, field, value) => {
    const newRows = rows.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setRows(newRows);
  };

  const deleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const getContribuicao = (grau) => {
    if (grau === 0) return '○ ○ ○';
    return '●'.repeat(grau) + '○'.repeat(3 - grau);
  };

  return (
    <div className="competencies-table-container">
      <div className="competencies-header">
        <h3>Competências da Disciplina</h3>
        <button type="button" onClick={addRow} className="add-row-btn">
          <FaPlus /> Adicionar Linha
        </button>
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
                  Nenhuma competência adicionada. Clique em "Adicionar Linha" para começar.
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
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
    </div>
  );
};

export default CompetenciesTable;

