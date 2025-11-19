import React, { useState, useEffect } from 'react';
import { FaInfoCircle, FaFileAlt } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import './DisciplineInfoManager.css';

const DisciplineInfoManager = ({ content, onChange }) => {
  const [layout, setLayout] = useState('texto'); // 'estruturado' ou 'texto'
  const [structuredData, setStructuredData] = useState({
    objetivos: '',
    ementa: '',
    pre_requisitos: '',
    carga_horaria: ''
  });
  const [textContent, setTextContent] = useState('');

  // Inicializar dados quando receber content
  useEffect(() => {
    if (!content || content.trim() === '') {
      setLayout('texto');
      setTextContent('');
      setStructuredData({
        objetivos: '',
        ementa: '',
        pre_requisitos: '',
        carga_horaria: ''
      });
      return;
    }

    // Tentar parsear como JSON (layout estruturado)
    try {
      const parsed = JSON.parse(content);
      if (parsed.layout === 'estruturado' && parsed.data) {
        setLayout('estruturado');
        setStructuredData({
          objetivos: parsed.data.objetivos || '',
          ementa: parsed.data.ementa || '',
          pre_requisitos: parsed.data.pre_requisitos || '',
          carga_horaria: parsed.data.carga_horaria || ''
        });
        return;
      }
    } catch (e) {
      // Não é JSON, então é texto livre
    }

    // Se chegou aqui, é texto livre
    setLayout('texto');
    setTextContent(content);
  }, [content]);

  // Salvar dados estruturados
  const saveStructuredData = (newData) => {
    setStructuredData(newData);
    const jsonData = JSON.stringify({
      layout: 'estruturado',
      data: newData
    });
    onChange(jsonData);
  };

  // Salvar texto livre
  const saveTextContent = (newContent) => {
    setTextContent(newContent);
    onChange(newContent);
  };

  // Converter texto livre para estruturado
  const convertTextToStructured = () => {
    if (!textContent || textContent.trim() === '') {
      setLayout('estruturado');
      return;
    }

    // Tentar extrair informações do HTML/texto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';

    // Tentar identificar seções por palavras-chave
    const objetivosMatch = text.match(/objetivo[s]?:?\s*(.+?)(?=ementa|pré-requisito|requisito|carga|$)/i);
    const ementaMatch = text.match(/ementa:?\s*(.+?)(?=objetivo|pré-requisito|requisito|carga|$)/i);
    const preReqMatch = text.match(/pré-requisito[s]?:?\s*(.+?)(?=objetivo|ementa|carga|$)/i);
    const cargaMatch = text.match(/carga\s*horária:?\s*(\d+[hH]?)/i);

    const newData = {
      objetivos: objetivosMatch ? objetivosMatch[1].trim() : '',
      ementa: ementaMatch ? ementaMatch[1].trim() : '',
      pre_requisitos: preReqMatch ? preReqMatch[1].trim() : '',
      carga_horaria: cargaMatch ? cargaMatch[1] : ''
    };

    setStructuredData(newData);
    setLayout('estruturado');
    saveStructuredData(newData);
  };

  // Converter estruturado para texto livre
  const convertStructuredToText = () => {
    let html = '';
    
    if (structuredData.objetivos) {
      html += `<p><strong>Objetivos:</strong></p>${structuredData.objetivos}`;
    }
    if (structuredData.ementa) {
      html += `<p><strong>Ementa:</strong></p>${structuredData.ementa}`;
    }
    if (structuredData.pre_requisitos) {
      html += `<p><strong>Pré-requisitos:</strong></p>${structuredData.pre_requisitos}`;
    }
    if (structuredData.carga_horaria) {
      html += `<p><strong>Carga Horária:</strong> ${structuredData.carga_horaria}</p>`;
    }

    setTextContent(html);
    setLayout('texto');
    saveTextContent(html);
  };

  const handleLayoutChange = (newLayout) => {
    if (newLayout === 'estruturado' && layout === 'texto') {
      convertTextToStructured();
    } else if (newLayout === 'texto' && layout === 'estruturado') {
      convertStructuredToText();
    } else {
      setLayout(newLayout);
    }
  };

  const updateField = (field, value) => {
    saveStructuredData({ ...structuredData, [field]: value });
  };

  return (
    <div className="discipline-info-manager">
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: '#235795' }}>
          Layout de Sobre a Disciplina:
        </label>
        <div className="layout-selector-buttons">
          <button
            type="button"
            className={`layout-option-btn ${layout === 'estruturado' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('estruturado')}
          >
            <div className="layout-icon">
              <FaInfoCircle size={24} />
            </div>
            <div className="layout-label">
              <strong>Layout Estruturado</strong>
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

      {layout === 'estruturado' ? (
        <div className="discipline-info-structured">
          <div className="form-row full-width">
            <div className="form-field">
              <label>Objetivos:</label>
              <TiptapEditor
                content={structuredData.objetivos}
                onChange={(content) => updateField('objetivos', content)}
                showCharCount={true}
              />
            </div>
          </div>

          <div className="form-row full-width">
            <div className="form-field">
              <label>Ementa:</label>
              <TiptapEditor
                content={structuredData.ementa}
                onChange={(content) => updateField('ementa', content)}
                showCharCount={true}
              />
            </div>
          </div>

          <div className="form-row full-width">
            <div className="form-field">
              <label>Pré-requisitos:</label>
              <TiptapEditor
                content={structuredData.pre_requisitos}
                onChange={(content) => updateField('pre_requisitos', content)}
                showCharCount={true}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Carga Horária:</label>
              <input
                type="text"
                value={structuredData.carga_horaria}
                onChange={(e) => updateField('carga_horaria', e.target.value)}
                placeholder="Ex: 60h"
                style={{ marginTop: '0.25rem', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d5dbea', fontSize: '0.9rem', width: '100%' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="discipline-info-text">
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

export default DisciplineInfoManager;

