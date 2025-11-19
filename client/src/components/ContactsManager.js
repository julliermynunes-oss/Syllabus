import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaLink, FaEnvelope, FaPhone, FaClock, FaDoorOpen } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import './ContactsManager.css';

const ContactsManager = ({ content, onChange }) => {
  const [layout, setLayout] = useState('texto'); // 'estruturado' ou 'texto'
  const [structuredData, setStructuredData] = useState({
    email: '',
    telefone: '',
    horario_atendimento: '',
    sala: '',
    links: [],
    outras_informacoes: ''
  });
  const [textContent, setTextContent] = useState('');

  // Inicializar dados quando receber content
  useEffect(() => {
    if (!content || content.trim() === '') {
      setLayout('texto');
      setTextContent('');
      setStructuredData({
        email: '',
        telefone: '',
        horario_atendimento: '',
        sala: '',
        links: [],
        outras_informacoes: ''
      });
      return;
    }

    // Tentar parsear como JSON (layout estruturado)
    try {
      const parsed = JSON.parse(content);
      if (parsed.layout === 'estruturado' && parsed.data) {
        setLayout('estruturado');
        setStructuredData({
          email: parsed.data.email || '',
          telefone: parsed.data.telefone || '',
          horario_atendimento: parsed.data.horario_atendimento || '',
          sala: parsed.data.sala || '',
          links: parsed.data.links || [],
          outras_informacoes: parsed.data.outras_informacoes || ''
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

    // Tentar extrair email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : '';

    // Tentar extrair telefone
    const phoneMatch = text.match(/(\(?\d{2}\)?\s?)?(\d{4,5}[-.\s]?\d{4})/);
    const telefone = phoneMatch ? phoneMatch[0] : '';

    // Extrair links
    const links = [];
    tempDiv.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent;
      if (href) {
        links.push({
          tipo: 'Outro',
          url: href,
          label: text || href
        });
      }
    });

    const newData = {
      email,
      telefone,
      horario_atendimento: '',
      sala: '',
      links,
      outras_informacoes: textContent
    };

    setStructuredData(newData);
    setLayout('estruturado');
    saveStructuredData(newData);
  };

  // Converter estruturado para texto livre
  const convertStructuredToText = () => {
    let html = '';
    
    if (structuredData.email) {
      html += `<p><strong>Email:</strong> <a href="mailto:${structuredData.email}">${structuredData.email}</a></p>`;
    }
    if (structuredData.telefone) {
      html += `<p><strong>Telefone:</strong> ${structuredData.telefone}</p>`;
    }
    if (structuredData.horario_atendimento) {
      html += `<p><strong>Horário de Atendimento:</strong> ${structuredData.horario_atendimento}</p>`;
    }
    if (structuredData.sala) {
      html += `<p><strong>Sala:</strong> ${structuredData.sala}</p>`;
    }
    if (structuredData.links && structuredData.links.length > 0) {
      html += '<p><strong>Links:</strong></p><ul>';
      structuredData.links.forEach(link => {
        html += `<li><a href="${link.url}">${link.label || link.url}</a></li>`;
      });
      html += '</ul>';
    }
    if (structuredData.outras_informacoes) {
      html += `<p>${structuredData.outras_informacoes}</p>`;
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

  const addLink = () => {
    const newLinks = [...structuredData.links, { tipo: 'Outro', url: '', label: '' }];
    saveStructuredData({ ...structuredData, links: newLinks });
  };

  const removeLink = (index) => {
    const newLinks = structuredData.links.filter((_, i) => i !== index);
    saveStructuredData({ ...structuredData, links: newLinks });
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...structuredData.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    saveStructuredData({ ...structuredData, links: newLinks });
  };

  const updateField = (field, value) => {
    saveStructuredData({ ...structuredData, [field]: value });
  };

  return (
    <div className="contacts-manager">
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: '#235795' }}>
          Layout de Contatos:
        </label>
        <div className="layout-selector-buttons">
          <button
            type="button"
            className={`layout-option-btn ${layout === 'estruturado' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('estruturado')}
          >
            <div className="layout-icon">
              <FaEnvelope size={24} />
            </div>
            <div className="layout-label">
              <strong>Campos Estruturados</strong>
            </div>
          </button>
          <button
            type="button"
            className={`layout-option-btn ${layout === 'texto' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('texto')}
          >
            <div className="layout-icon">
              <FaLink size={24} />
            </div>
            <div className="layout-label">
              <strong>Texto Livre</strong>
            </div>
          </button>
        </div>
      </div>

      {layout === 'estruturado' ? (
        <div className="contacts-structured">
          <div className="form-row">
            <div className="form-field">
              <label>
                <FaEnvelope style={{ marginRight: '0.5rem' }} />
                Email:
              </label>
              <input
                type="email"
                value={structuredData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="professor@email.com"
                style={{ marginTop: '0.25rem' }}
              />
            </div>
            <div className="form-field">
              <label>
                <FaPhone style={{ marginRight: '0.5rem' }} />
                Telefone:
              </label>
              <input
                type="text"
                value={structuredData.telefone}
                onChange={(e) => updateField('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
                style={{ marginTop: '0.25rem' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>
                <FaClock style={{ marginRight: '0.5rem' }} />
                Horário de Atendimento:
              </label>
              <input
                type="text"
                value={structuredData.horario_atendimento}
                onChange={(e) => updateField('horario_atendimento', e.target.value)}
                placeholder="Ex: Segundas, 14h-16h"
                style={{ marginTop: '0.25rem' }}
              />
            </div>
            <div className="form-field">
              <label>
                <FaDoorOpen style={{ marginRight: '0.5rem' }} />
                Sala/Office:
              </label>
              <input
                type="text"
                value={structuredData.sala}
                onChange={(e) => updateField('sala', e.target.value)}
                placeholder="Ex: Sala 101"
                style={{ marginTop: '0.25rem' }}
              />
            </div>
          </div>

          <div className="form-row full-width">
            <div className="form-field">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>
                  <FaLink style={{ marginRight: '0.5rem' }} />
                  Links:
                </span>
                <button
                  type="button"
                  onClick={addLink}
                  className="add-link-btn"
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#235795',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaPlus /> Adicionar Link
                </button>
              </label>
              {structuredData.links.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic', marginTop: '0.5rem' }}>
                  Nenhum link adicionado. Clique em "Adicionar Link" para começar.
                </p>
              ) : (
                <div className="links-list" style={{ marginTop: '0.5rem' }}>
                  {structuredData.links.map((link, index) => (
                    <div key={index} className="link-item" style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <select
                        value={link.tipo}
                        onChange={(e) => updateLink(index, 'tipo', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #d5dbea',
                          fontSize: '0.9rem',
                          width: '150px'
                        }}
                      >
                        <option value="Website">Website</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Lattes">Lattes</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(index, 'label', e.target.value)}
                        placeholder="Label do link"
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #d5dbea',
                          fontSize: '0.9rem'
                        }}
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                        placeholder="https://..."
                        style={{
                          flex: 2,
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #d5dbea',
                          fontSize: '0.9rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        style={{
                          padding: '0.5rem',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-row full-width">
            <div className="form-field">
              <label>Outras Informações:</label>
              <TiptapEditor
                content={structuredData.outras_informacoes}
                onChange={(content) => updateField('outras_informacoes', content)}
                showCharCount={true}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="contacts-text">
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

export default ContactsManager;

