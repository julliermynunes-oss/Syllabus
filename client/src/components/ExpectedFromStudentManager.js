import React, { useState, useEffect } from 'react';
import { FaCheckSquare, FaFileAlt } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import './ExpectedFromStudentManager.css';

const CATEGORIAS = {
  participacao: {
    nome: 'Participação',
    itens: [
      'Participar ativamente das aulas',
      'Fazer perguntas e contribuir com discussões',
      'Manter atenção e foco durante as aulas',
      'Respeitar os horários de início e término',
      'Colaborar com colegas em atividades em grupo'
    ]
  },
  trabalhos: {
    nome: 'Trabalhos',
    itens: [
      'Entregar trabalhos no prazo estabelecido',
      'Seguir a formatação e normas solicitadas',
      'Realizar pesquisas e consultas adequadas',
      'Demonstrar originalidade e criatividade',
      'Revisar e corrigir trabalhos antes da entrega'
    ]
  },
  estudos: {
    nome: 'Estudos',
    itens: [
      'Estudar regularmente o conteúdo abordado',
      'Revisar material das aulas anteriores',
      'Realizar leituras complementares indicadas',
      'Preparar-se para avaliações com antecedência',
      'Organizar anotações e materiais de estudo'
    ]
  },
  comportamento: {
    nome: 'Comportamento',
    itens: [
      'Respeitar colegas, professores e funcionários',
      'Manter ambiente de aprendizado positivo',
      'Seguir as normas da instituição',
      'Manter pontualidade e assiduidade',
      'Demonstrar ética e integridade acadêmica'
    ]
  }
};

const ExpectedFromStudentManager = ({ content, onChange }) => {
  const [layout, setLayout] = useState('checklist'); // 'checklist' ou 'texto'
  const [checklistData, setChecklistData] = useState({
    participacao: { itens: [], outros: '' },
    trabalhos: { itens: [], outros: '' },
    estudos: { itens: [], outros: '' },
    comportamento: { itens: [], outros: '' }
  });
  const [textContent, setTextContent] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Inicializar dados quando receber content
  useEffect(() => {
    if (!content || content.trim() === '') {
      setLayout('checklist');
      setTextContent('');
      // Inicializar com itens padrão selecionados
      const initialData = {};
      Object.keys(CATEGORIAS).forEach(catKey => {
        initialData[catKey] = {
          itens: CATEGORIAS[catKey].itens.map(item => ({ texto: item, selecionado: false })),
          outros: ''
        };
      });
      setChecklistData(initialData);
      return;
    }

    // Tentar parsear como JSON (layout checklist)
    try {
      const parsed = JSON.parse(content);
      if (parsed.layout === 'checklist' && parsed.categorias) {
        setLayout('checklist');
        setChecklistData(parsed.categorias);
        return;
      }
    } catch (e) {
      // Não é JSON, então é texto livre
    }

    // Se chegou aqui, é texto livre
    setLayout('texto');
    setTextContent(content);
  }, [content]);

  // Salvar dados de checklist
  const saveChecklistData = (newData) => {
    setChecklistData(newData);
    const jsonData = JSON.stringify({
      layout: 'checklist',
      categorias: newData
    });
    onChange(jsonData);
  };

  // Salvar texto livre
  const saveTextContent = (newContent) => {
    setTextContent(newContent);
    onChange(newContent);
  };

  // Converter texto livre para checklist
  const convertTextToChecklist = () => {
    if (!textContent || textContent.trim() === '') {
      setLayout('checklist');
      return;
    }

    // Inicializar com estrutura padrão
    const newData = {};
    Object.keys(CATEGORIAS).forEach(catKey => {
      newData[catKey] = {
        itens: CATEGORIAS[catKey].itens.map(item => ({ texto: item, selecionado: false })),
        outros: ''
      };
    });

    setChecklistData(newData);
    setLayout('checklist');
    saveChecklistData(newData);
  };

  // Converter checklist para texto livre
  const convertChecklistToText = () => {
    let html = '';
    
    Object.keys(CATEGORIAS).forEach(catKey => {
      const categoria = CATEGORIAS[catKey];
      const data = checklistData[catKey];
      const itensSelecionados = data.itens.filter(item => item.selecionado);
      
      if (itensSelecionados.length > 0 || data.outros) {
        html += `<p><strong>${categoria.nome}:</strong></p><ul>`;
        itensSelecionados.forEach(item => {
          html += `<li>${item.texto}</li>`;
        });
        if (data.outros) {
          html += `<li>${data.outros}</li>`;
        }
        html += '</ul>';
      }
    });

    setTextContent(html);
    setLayout('texto');
    saveTextContent(html);
  };

  const handleLayoutChange = (newLayout) => {
    if (newLayout === 'checklist' && layout === 'texto') {
      convertTextToChecklist();
    } else if (newLayout === 'texto' && layout === 'checklist') {
      convertChecklistToText();
    } else {
      setLayout(newLayout);
    }
  };

  const toggleItem = (catKey, index) => {
    const newData = { ...checklistData };
    newData[catKey].itens[index].selecionado = !newData[catKey].itens[index].selecionado;
    saveChecklistData(newData);
  };

  const addCustomItem = (catKey, texto) => {
    const newData = { ...checklistData };
    newData[catKey].itens.push({ texto, selecionado: true });
    saveChecklistData(newData);
  };

  const removeCustomItem = (catKey, index) => {
    const newData = { ...checklistData };
    // Só remover se for item customizado (não está na lista padrão)
    const item = newData[catKey].itens[index];
    const isDefault = CATEGORIAS[catKey].itens.includes(item.texto);
    if (!isDefault) {
      newData[catKey].itens.splice(index, 1);
      saveChecklistData(newData);
    }
  };

  const updateOutros = (catKey, value) => {
    const newData = { ...checklistData };
    newData[catKey].outros = value;
    saveChecklistData(newData);
  };

  return (
    <div className="expected-from-student-manager">
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: '#235795' }}>
          Layout de O que é Esperado do Aluno:
        </label>
        <div className="layout-selector-buttons">
          <button
            type="button"
            className={`layout-option-btn ${layout === 'checklist' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('checklist')}
          >
            <div className="layout-icon">
              <FaCheckSquare size={24} />
            </div>
            <div className="layout-label">
              <strong>Checklist Estruturado</strong>
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

      {layout === 'checklist' ? (
        <div className="expected-checklist">
          {Object.keys(CATEGORIAS).map(catKey => {
            const categoria = CATEGORIAS[catKey];
            const data = checklistData[catKey];
            const isExpanded = expandedCategory === catKey;
            
            return (
              <div key={catKey} className="categoria-section" style={{
                marginBottom: '1.5rem',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : catKey)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: '#f8f9fa',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: '600',
                    fontSize: '1rem',
                    color: '#235795'
                  }}
                >
                  <span>{categoria.nome}</span>
                  <span>{isExpanded ? '▼' : '▶'}</span>
                </button>
                
                {isExpanded && (
                  <div style={{ padding: '1rem', background: 'white' }}>
                    <div className="checklist-items" style={{ marginBottom: '1rem' }}>
                      {data.itens.map((item, index) => {
                        const isDefault = categoria.itens.includes(item.texto);
                        return (
                          <label
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginBottom: '0.25rem',
                              background: item.selecionado ? '#e8f4f8' : 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.selecionado}
                              onChange={() => toggleItem(catKey, index)}
                              style={{ marginRight: '0.75rem', cursor: 'pointer', width: '16px', height: '16px', minWidth: '16px', flexShrink: 0 }}
                            />
                            <span style={{ flex: 1 }}>{item.texto}</span>
                            {!isDefault && (
                              <button
                                type="button"
                                onClick={() => removeCustomItem(catKey, index)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem'
                                }}
                              >
                                Remover
                              </button>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Outras expectativas:
                      </label>
                      <TiptapEditor
                        content={data.outros}
                        onChange={(content) => updateOutros(catKey, content)}
                        showCharCount={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="expected-text">
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

export default ExpectedFromStudentManager;

