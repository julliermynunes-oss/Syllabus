import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import './AvaliacaoTable.css';

const AvaliacaoTable = ({ data, onChange }) => {
  const [rows, setRows] = useState([]);
  const [observacoes, setObservacoes] = useState('');

  // Inicializar dados quando receber props
  useEffect(() => {
    if (data && data.trim() !== '') {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsed.rows && Array.isArray(parsed.rows)) {
          setRows(parsed.rows.length > 0 ? parsed.rows : [{ tipo: '', criterio: '', peso: '' }]);
        } else {
          setRows([{ tipo: '', criterio: '', peso: '' }]);
        }
        setObservacoes(parsed.observacoes || '');
      } catch (e) {
        console.error('Erro ao parsear dados de avaliação:', e);
        setRows([{ tipo: '', criterio: '', peso: '' }]);
        setObservacoes('');
      }
    } else {
      // Inicializar com pelo menos uma linha vazia
      setRows([{ tipo: '', criterio: '', peso: '' }]);
      setObservacoes('');
    }
  }, [data]);

  // Salvar dados automaticamente quando mudarem
  useEffect(() => {
    const dataObj = {
      rows: rows,
      observacoes: observacoes
    };
    onChange(JSON.stringify(dataObj));
  }, [rows, observacoes, onChange]);

  const updateRow = (index, field, value) => {
    const newRows = rows.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { tipo: '', criterio: '', peso: '' }]);
  };

  const removeRow = (index) => {
    // Nunca permitir remover se só tiver uma linha
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="avaliacao-table-container">
      <div className="avaliacao-table-wrapper">
        <table className="avaliacao-table">
          <thead>
            <tr>
              <th className="col-tipo">Tipo</th>
              <th className="col-criterio">Critério</th>
              <th className="col-peso">Peso</th>
              <th className="col-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="col-tipo">
                  <input
                    type="text"
                    value={row.tipo || ''}
                    onChange={(e) => updateRow(index, 'tipo', e.target.value)}
                    placeholder="Ex: Prova, Trabalho, Participação..."
                    className="table-input"
                  />
                </td>
                <td className="col-criterio">
                  <textarea
                    value={row.criterio || ''}
                    onChange={(e) => updateRow(index, 'criterio', e.target.value)}
                    placeholder="Descreva o critério de avaliação"
                    className="table-textarea"
                    rows="2"
                  />
                </td>
                <td className="col-peso">
                  <input
                    type="text"
                    value={row.peso || ''}
                    onChange={(e) => updateRow(index, 'peso', e.target.value)}
                    placeholder="Ex: 40%, 0.4, 4/10"
                    className="table-input"
                  />
                </td>
                <td className="col-actions">
                  <button
                    type="button"
                    className="remove-row-btn"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                    title={rows.length === 1 ? 'A tabela deve ter pelo menos uma linha' : 'Remover linha'}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="avaliacao-actions">
        <button
          type="button"
          className="add-row-btn"
          onClick={addRow}
          title="Adicionar nova linha"
        >
          <FaPlus /> Adicionar Linha
        </button>
      </div>

      <div className="avaliacao-observacoes">
        <label>Observações Adicionais:</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Adicione observações adicionais sobre os critérios de avaliação, se necessário..."
          className="observacoes-textarea"
          rows="4"
        />
      </div>
    </div>
  );
};

export default AvaliacaoTable;

