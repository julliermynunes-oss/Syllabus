import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import './CompetenciesTable.css';

const CompetenciesTable = ({ data, onChange, curso }) => {
  const [rows, setRows] = useState([]);
  const initializedRef = useRef(false);
  const loadedCursoRef = useRef(null);

  // Carregar dados salvos primeiro (se houver)
  useEffect(() => {
    if (!initializedRef.current && data && data.trim() !== '') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.rows && parsed.rows.length > 0) {
          setRows(parsed.rows);
          initializedRef.current = true;
          console.log('Competências carregadas do banco:', parsed.rows.length, 'linhas');
        }
      } catch (e) {
        console.error('Erro ao parsear competências salvas:', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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
        // Verificar se já temos dados salvos para mesclar
        let savedRows = [];
        if (data && data.trim() !== '') {
          try {
            const parsed = JSON.parse(data);
            savedRows = parsed.rows || [];
          } catch (e) {
            // Ignorar erro de parse
          }
        }

        // Criar um mapa dos dados salvos por competência
        const savedMap = new Map();
        savedRows.forEach(row => {
          if (row.competencia) {
            savedMap.set(row.competencia, {
              descricao: row.descricao || '',
              grau: row.grau || 0
            });
          }
        });

        // Transformar dados da API para o formato da tabela, preservando dados salvos
        const newRows = response.data.map(item => {
          const competencia = item.competencia || '';
          const saved = savedMap.get(competencia);
          
          return {
            competencia: competencia,
            descricao: saved ? saved.descricao : (item.descricao || ''),
            grau: saved ? saved.grau : 0
          };
        });
        
        setRows(newRows);
        initializedRef.current = true;
      } else {
        // Se não houver competências da API, usar dados salvos se houver
        if (data && data.trim() !== '') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.rows && parsed.rows.length > 0) {
              setRows(parsed.rows);
              initializedRef.current = true;
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
      if (data && data.trim() !== '') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.rows && parsed.rows.length > 0) {
            setRows(parsed.rows);
            initializedRef.current = true;
          }
        } catch (e) {
          setRows([]);
        }
      }
    }
  };

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
    const circles = [];
    for (let i = 0; i < 3; i++) {
      circles.push(i < grau ? '●' : '○');
    }
    return circles.join('\u00A0'); // Usar espaço não separável entre bolinhas
  };

  // Função para extrair a sigla do curso do nome completo
  const getCursoSigla = (cursoNome) => {
    if (!cursoNome) return '';
    
    // Extrair sigla do padrão: "CGA - Curso de Graduação em Administração" -> "CGA"
    const match = cursoNome.match(/^([A-Z]+(?:\s+[A-Z]+)?)/);
    if (match) {
      return match[1].replace(/\s+/g, '');
    }
    
    // Se já for uma sigla curta (até 10 caracteres e apenas letras)
    if (cursoNome.length <= 10 && /^[A-Z]+$/.test(cursoNome.trim())) {
      return cursoNome.trim();
    }
    
    return cursoNome;
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

      {curso && rows.length > 0 && (
        <div className="competencies-intro">
          <p>
            Os objetivos de aprendizagem da disciplina estão apresentados na tabela abaixo, 
            demonstrando como os mesmos contribuem para os objetivos do {getCursoSigla(curso)}.
          </p>
        </div>
      )}

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

