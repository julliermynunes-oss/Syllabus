import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaFileAlt, FaCopy } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import './EthicalCommitmentManager.css';

const TEMPLATE_PADRAO = `<p><strong>Compromisso Ético</strong></p>
<p>Ao se matricular nesta disciplina, o(a) aluno(a) assume o compromisso de:</p>
<ul>
<li>Respeitar os prazos estabelecidos para entrega de trabalhos e avaliações</li>
<li>Manter integridade acadêmica, evitando plágio e outras formas de fraude</li>
<li>Participar ativamente das atividades propostas</li>
<li>Respeitar colegas, professores e funcionários</li>
<li>Seguir as normas da instituição e da disciplina</li>
</ul>`;

const EthicalCommitmentManager = ({ content, onChange }) => {
  const [layout, setLayout] = useState('template'); // 'template' ou 'texto'
  const [templateContent, setTemplateContent] = useState('');
  const [textContent, setTextContent] = useState('');

  // Inicializar dados quando receber content
  useEffect(() => {
    if (!content || content.trim() === '') {
      setLayout('template');
      setTemplateContent('');
      setTextContent('');
      return;
    }

    // Tentar parsear como JSON (layout template)
    try {
      const parsed = JSON.parse(content);
      if (parsed.layout === 'template') {
        setLayout('template');
        setTemplateContent(parsed.texto_personalizado || '');
        return;
      }
    } catch (e) {
      // Não é JSON, então é texto livre
    }

    // Se chegou aqui, é texto livre
    setLayout('texto');
    setTextContent(content);
  }, [content]);

  // Salvar dados de template
  const saveTemplateContent = (newContent) => {
    setTemplateContent(newContent);
    const jsonData = JSON.stringify({
      layout: 'template',
      texto_personalizado: newContent
    });
    onChange(jsonData);
  };

  // Salvar texto livre
  const saveTextContent = (newContent) => {
    setTextContent(newContent);
    onChange(newContent);
  };

  // Converter texto livre para template
  const convertTextToTemplate = () => {
    if (!textContent || textContent.trim() === '') {
      setLayout('template');
      setTemplateContent('');
      return;
    }

    setTemplateContent(textContent);
    setLayout('template');
    saveTemplateContent(textContent);
  };

  // Converter template para texto livre
  const convertTemplateToText = () => {
    // Combinar template padrão com conteúdo personalizado
    let html = TEMPLATE_PADRAO;
    if (templateContent && templateContent.trim() !== '') {
      html += templateContent;
    }

    setTextContent(html);
    setLayout('texto');
    saveTextContent(html);
  };

  const handleLayoutChange = (newLayout) => {
    if (newLayout === 'template' && layout === 'texto') {
      convertTextToTemplate();
    } else if (newLayout === 'texto' && layout === 'template') {
      convertTemplateToText();
    } else {
      setLayout(newLayout);
    }
  };

  const usarTemplatePadrao = () => {
    setTemplateContent('');
    saveTemplateContent('');
  };

  const copiarTemplate = () => {
    navigator.clipboard.writeText(TEMPLATE_PADRAO);
    alert('Template copiado para a área de transferência!');
  };

  return (
    <div className="ethical-commitment-manager">
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: '#235795' }}>
          Layout de Compromisso Ético:
        </label>
        <div className="layout-selector-buttons">
          <button
            type="button"
            className={`layout-option-btn ${layout === 'template' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('template')}
          >
            <div className="layout-icon">
              <FaShieldAlt size={24} />
            </div>
            <div className="layout-label">
              <strong>Template Padrão</strong>
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

      {layout === 'template' ? (
        <div className="ethical-template">
          <div style={{
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong>Template Padrão (referência):</strong>
              <button
                type="button"
                onClick={copiarTemplate}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: '#235795',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <FaCopy /> Copiar
              </button>
            </div>
            <div
              style={{
                fontSize: '0.9rem',
                color: '#666',
                lineHeight: '1.6',
                padding: '0.75rem',
                background: 'white',
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
              }}
              dangerouslySetInnerHTML={{ __html: TEMPLATE_PADRAO }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={usarTemplatePadrao}
              style={{
                padding: '0.5rem 1rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Usar Template Padrão (limpar edições)
            </button>
          </div>

          <div className="form-row full-width">
            <div className="form-field">
              <label>Conteúdo Adicional/Personalizado:</label>
              <TiptapEditor
                content={templateContent}
                onChange={saveTemplateContent}
                showCharCount={true}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                💡 Adicione aqui qualquer conteúdo adicional ou personalizado ao template padrão.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="ethical-text">
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

export default EthicalCommitmentManager;

