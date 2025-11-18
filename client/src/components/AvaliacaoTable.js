import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import TiptapEditor from './TiptapEditor';
import './AvaliacaoTable.css';

const AvaliacaoTable = ({ data, onChange, curso }) => {
  const [rows, setRows] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [weightLimits, setWeightLimits] = useState({ min: null, max: null });
  const [weightError, setWeightError] = useState('');
  const initializedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const { token } = useAuth();

  // Inicializar dados quando receber props (apenas uma vez)
  useEffect(() => {
    if (isInitializingRef.current) return;
    
    if (data && data.trim() !== '') {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsed.rows && Array.isArray(parsed.rows)) {
          setRows(parsed.rows.length > 0 ? parsed.rows : [{ tipo: '', criterio: '', peso: '' }]);
        } else {
          setRows([{ tipo: '', criterio: '', peso: '' }]);
        }
        setObservacoes(parsed.observacoes || '');
        initializedRef.current = true;
      } catch (e) {
        console.error('Erro ao parsear dados de avaliação:', e);
        setRows([{ tipo: '', criterio: '', peso: '' }]);
        setObservacoes('');
        initializedRef.current = true;
      }
    } else if (!initializedRef.current) {
      // Inicializar com pelo menos uma linha vazia apenas na primeira vez
      setRows([{ tipo: '', criterio: '', peso: '' }]);
      setObservacoes('');
      initializedRef.current = true;
    }
    isInitializingRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Salvar dados automaticamente quando mudarem (mas não durante inicialização)
  useEffect(() => {
    if (initializedRef.current && rows.length > 0) {
      const dataObj = {
        rows: rows,
        observacoes: observacoes
      };
      onChange(JSON.stringify(dataObj));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, observacoes]);

  // Carregar limites de peso quando o curso mudar
  useEffect(() => {
    if (curso && token) {
      axios.get(`${API_URL}/api/general-settings/weight-limits`, {
        params: { curso },
        headers: { Authorization: `Bearer ${token}` }
      }).then(response => {
        if (response.data) {
          setWeightLimits({
            min: response.data.min_weight || null,
            max: response.data.max_weight || null
          });
        } else {
          setWeightLimits({ min: null, max: null });
        }
      }).catch(error => {
        console.error('Erro ao carregar limites de peso', error);
        setWeightLimits({ min: null, max: null });
      });
    } else {
      setWeightLimits({ min: null, max: null });
    }
  }, [curso, token]);

  // Função para converter peso para porcentagem
  const parseWeight = (pesoStr) => {
    if (!pesoStr || !pesoStr.trim()) return null;
    
    const str = pesoStr.trim();
    
    // Se termina com %, remover e converter
    if (str.endsWith('%')) {
      const num = parseFloat(str.slice(0, -1));
      return isNaN(num) ? null : num;
    }
    
    // Se tem barra (fração), converter
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          return (num / den) * 100;
        }
      }
    }
    
    // Se é decimal (0.0 a 1.0), converter para porcentagem
    const num = parseFloat(str);
    if (!isNaN(num)) {
      if (num <= 1 && num >= 0) {
        return num * 100;
      }
      return num;
    }
    
    return null;
  };

  const updateRow = (index, field, value) => {
    const newRows = rows.map((row, i) => {
      if (i === index) {
        const updatedRow = { ...row, [field]: value };
        
        // Validar peso se for o campo peso
        if (field === 'peso' && weightLimits.min !== null && weightLimits.max !== null) {
          const pesoPercent = parseWeight(value);
          if (pesoPercent !== null) {
            if (pesoPercent < weightLimits.min || pesoPercent > weightLimits.max) {
              setWeightError(`O peso deve estar entre ${weightLimits.min}% e ${weightLimits.max}%`);
            } else {
              setWeightError('');
            }
          } else if (value.trim() !== '') {
            setWeightError('Formato de peso inválido. Use porcentagem (ex: 40%), decimal (ex: 0.4) ou fração (ex: 4/10)');
          } else {
            setWeightError('');
          }
        }
        
        return updatedRow;
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
                    value={typeof row.criterio === 'string' ? row.criterio.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') : (row.criterio || '')}
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
                    placeholder={weightLimits.min !== null && weightLimits.max !== null 
                      ? `Ex: ${weightLimits.min}% - ${weightLimits.max}%`
                      : "Ex: 40%, 0.4, 4/10"}
                    className={`table-input ${weightError && row.peso && index === rows.findIndex((r, idx) => idx === index && r.peso === row.peso) ? 'error-input' : ''}`}
                    title={weightLimits.min !== null && weightLimits.max !== null 
                      ? `Peso deve estar entre ${weightLimits.min}% e ${weightLimits.max}%`
                      : ''}
                  />
                  {weightError && row.peso && index === rows.findIndex((r, idx) => idx === index && r.peso === row.peso) && (
                    <small style={{ color: '#ff4444', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                      {weightError}
                    </small>
                  )}
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
        <TiptapEditor
          content={observacoes}
          onChange={(content) => setObservacoes(content)}
        />
      </div>
    </div>
  );
};

export default AvaliacaoTable;

