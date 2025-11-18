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
  const [weightErrors, setWeightErrors] = useState({}); // Objeto: { index: 'mensagem' }
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
          const limits = {
            min: response.data.min_weight || null,
            max: response.data.max_weight || null
          };
          setWeightLimits(limits);
          // Validar todos os pesos existentes quando os limites são carregados
          if (limits.min !== null && limits.max !== null && rows.length > 0) {
            validateAllWeights(rows, limits);
          }
        } else {
          setWeightLimits({ min: null, max: null });
          setWeightErrors({});
        }
      }).catch(error => {
        console.error('Erro ao carregar limites de peso', error);
        setWeightLimits({ min: null, max: null });
        setWeightErrors({});
      });
    } else {
      setWeightLimits({ min: null, max: null });
      setWeightErrors({});
    }
  }, [curso, token]);

  // Validar todos os pesos quando os limites mudarem
  useEffect(() => {
    if (weightLimits.min !== null && weightLimits.max !== null && rows.length > 0) {
      validateAllWeights(rows, weightLimits);
    }
  }, [weightLimits.min, weightLimits.max]);

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

  // Função para validar um peso individual
  const validateWeight = (pesoStr, limits) => {
    if (!pesoStr || !pesoStr.trim()) {
      return null; // Sem erro se vazio
    }
    
    const pesoPercent = parseWeight(pesoStr);
    if (pesoPercent === null) {
      return 'Formato de peso inválido. Use porcentagem (ex: 40%), decimal (ex: 0.4) ou fração (ex: 4/10)';
    }
    
    if (pesoPercent < limits.min || pesoPercent > limits.max) {
      return `O peso deve estar entre ${limits.min}% e ${limits.max}%`;
    }
    
    return null; // Sem erro
  };

  // Validar todos os pesos de uma vez
  const validateAllWeights = (rowsToValidate, limits) => {
    const errors = {};
    rowsToValidate.forEach((row, index) => {
      if (row.peso) {
        const error = validateWeight(row.peso, limits);
        if (error) {
          errors[index] = error;
        }
      }
    });
    setWeightErrors(errors);
  };

  const updateRow = (index, field, value) => {
    const newRows = rows.map((row, i) => {
      if (i === index) {
        const updatedRow = { ...row, [field]: value };
        
        // Validar peso se for o campo peso
        if (field === 'peso' && weightLimits.min !== null && weightLimits.max !== null) {
          // Se o campo estiver vazio, permitir (para poder apagar)
          if (!value || !value.trim()) {
            setWeightErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[index];
              return newErrors;
            });
            return updatedRow;
          }
          
          const error = validateWeight(value, weightLimits);
          setWeightErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
              newErrors[index] = error;
            } else {
              delete newErrors[index];
            }
            return newErrors;
          });
        }
        
        return updatedRow;
      }
      return row;
    });
    setRows(newRows);
  };

  // Função para formatar o valor do peso para exibição
  const formatWeightValue = (value) => {
    if (!value) return '';
    // Se já está em formato de porcentagem, manter
    if (typeof value === 'string' && value.includes('%')) {
      return value;
    }
    // Se é um número, adicionar % se necessário
    const num = parseFloat(value);
    if (!isNaN(num) && weightLimits.min !== null && weightLimits.max !== null) {
      // Se o número está entre 0 e 1, pode ser decimal, senão é porcentagem
      if (num > 0 && num <= 1) {
        return value; // Manter como está (decimal)
      }
      // Se não tem %, adicionar
      if (!value.toString().includes('%')) {
        return value;
      }
    }
    return value;
  };

  // Handler específico para input numérico de peso
  const handleWeightChange = (index, value) => {
    // Permitir apagar
    if (value === '') {
      updateRow(index, 'peso', '');
      return;
    }
    
    // Se há limites configurados, usar input numérico
    if (weightLimits.min !== null && weightLimits.max !== null) {
      // Remover caracteres não numéricos exceto ponto e vírgula
      const numericValue = value.replace(/[^0-9.,]/g, '');
      // Converter vírgula para ponto
      const normalizedValue = numericValue.replace(',', '.');
      
      // Verificar se está dentro dos limites antes de atualizar
      const numValue = parseFloat(normalizedValue);
      if (!isNaN(numValue)) {
        // Se o valor está fora dos limites, mostrar erro mas permitir digitar (para poder corrigir)
        updateRow(index, 'peso', normalizedValue);
      } else if (normalizedValue === '' || normalizedValue === '.') {
        // Permitir digitação parcial
        updateRow(index, 'peso', normalizedValue);
      }
    } else {
      // Sem limites, permitir qualquer formato
      updateRow(index, 'peso', value);
    }
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
                  {weightLimits.min !== null && weightLimits.max !== null ? (
                    <>
                      <input
                        type="number"
                        min={weightLimits.min}
                        max={weightLimits.max}
                        step="0.1"
                        value={(() => {
                          if (!row.peso) return '';
                          const num = parseFloat(row.peso.toString().replace('%', ''));
                          if (isNaN(num)) return '';
                          // Garantir que o valor exibido está dentro dos limites
                          if (num < weightLimits.min) return weightLimits.min;
                          if (num > weightLimits.max) return weightLimits.max;
                          return num;
                        })()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            updateRow(index, 'peso', '');
                            return;
                          }
                          
                          const numVal = parseFloat(val);
                          if (isNaN(numVal)) {
                            return; // Não atualizar se não for número
                          }
                          
                          // Bloquear valores fora dos limites durante a digitação
                          if (numVal < weightLimits.min) {
                            // Permitir digitar valores menores temporariamente (para poder apagar e corrigir)
                            updateRow(index, 'peso', `${numVal}%`);
                          } else if (numVal > weightLimits.max) {
                            // Bloquear valores maiores que o máximo
                            // Não atualizar o valor, mantendo o anterior
                            return;
                          } else {
                            // Valor válido, atualizar
                            updateRow(index, 'peso', `${numVal}%`);
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val)) {
                            if (e.target.value === '') {
                              updateRow(index, 'peso', '');
                            }
                            return;
                          }
                          
                          // Forçar ajuste aos limites ao sair do campo
                          let finalVal = val;
                          if (val < weightLimits.min) {
                            finalVal = weightLimits.min;
                          } else if (val > weightLimits.max) {
                            finalVal = weightLimits.max;
                          }
                          
                          updateRow(index, 'peso', `${finalVal}%`);
                        }}
                        onKeyDown={(e) => {
                          // Bloquear Enter se o valor estiver fora dos limites
                          if (e.key === 'Enter') {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && (val < weightLimits.min || val > weightLimits.max)) {
                              e.preventDefault();
                              e.target.blur(); // Força o onBlur que vai ajustar o valor
                            }
                          }
                        }}
                        placeholder={`${weightLimits.min}% - ${weightLimits.max}%`}
                        className={`table-input ${weightErrors[index] ? 'error-input' : ''}`}
                        title={`Peso deve estar entre ${weightLimits.min}% e ${weightLimits.max}%`}
                        style={{ width: '100%' }}
                      />
                      {weightErrors[index] && (
                        <small style={{ color: '#ff4444', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                          {weightErrors[index]}
                        </small>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      value={row.peso || ''}
                      onChange={(e) => updateRow(index, 'peso', e.target.value)}
                      placeholder="Ex: 40%, 0.4, 4/10"
                      className="table-input"
                    />
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

