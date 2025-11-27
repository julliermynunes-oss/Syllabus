import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaUser, FaFileAlt, FaPlus, FaTrash, FaCaretDown, FaCaretUp, FaLink } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import './ContactsManager.css';

const createContact = (overrides = {}) => ({
  id: overrides.id || `${Date.now()}-${Math.random()}`,
  nome: overrides.nome || '',
  email: overrides.email || '',
  telefone: overrides.telefone || '',
  horario_atendimento: overrides.horario_atendimento || '',
  sala: overrides.sala || '',
  links: Array.isArray(overrides.links)
    ? overrides.links.map((link) => ({ label: link.label || '', url: link.url || '' }))
    : [],
  notas: overrides.notas || '',
  linkedToProfessor: overrides.linkedToProfessor || false,
  linkedProfessorName: overrides.linkedProfessorName || ''
});

const ContactsManager = ({ content, onChange, professoresList = [] }) => {
  const normalizedProfessores = useMemo(
    () => (professoresList || []).map((prof) => (prof || '').trim()).filter(Boolean),
    [professoresList]
  );

  const [layout, setLayout] = useState('professores');
  const [structuredData, setStructuredData] = useState({ contatos: [createContact()] });
  const [textContent, setTextContent] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const saveStructuredData = useCallback(
    (contatos) => {
      const sanitized = contatos.length > 0 ? contatos : [createContact()];
      setStructuredData({ contatos: sanitized });
      onChange(
        JSON.stringify({
          layout: 'professores',
          contatos: sanitized
        })
      );
    },
    [onChange]
  );

  useEffect(() => {
    if (!content || content.trim() === '') {
      setLayout('professores');
      setStructuredData({ contatos: [createContact()] });
      setTextContent('');
      return;
    }

    try {
      const parsed = JSON.parse(content);
      if (parsed.layout === 'professores' && Array.isArray(parsed.contatos)) {
        setStructuredData({
          contatos: parsed.contatos.map((contato) =>
            createContact({
              ...contato,
              linkedProfessorName: contato.linkedProfessorName || contato.professorName || contato.nome
            })
          )
        });
        setLayout('professores');
        return;
      }
      if (parsed.layout === 'estruturado' && parsed.data) {
        setStructuredData({ contatos: [createContact(parsed.data)] });
        setLayout('professores');
        return;
      }
    } catch (err) {
      // conteúdo antigo em texto livre
    }

    setLayout('texto');
    setTextContent(content);
  }, [content]);

  useEffect(() => {
    if (layout !== 'professores') return;
    const current = structuredData?.contatos || [];
    const professorsSet = new Set(normalizedProfessores);
    let changed = false;

    const synced = current.map((contato) => {
      const updated = { ...contato };
      if (updated.linkedToProfessor && updated.linkedProfessorName && !professorsSet.has(updated.linkedProfessorName)) {
        updated.linkedToProfessor = false;
        updated.linkedProfessorName = '';
        changed = true;
      }
      if (!updated.linkedToProfessor && professorsSet.has((updated.nome || '').trim())) {
        updated.linkedToProfessor = true;
        updated.linkedProfessorName = (updated.nome || '').trim();
        changed = true;
      }
      return createContact(updated);
    });

    professorsSet.forEach((profName) => {
      const exists = synced.some((c) => c.linkedToProfessor && c.linkedProfessorName === profName);
      if (!exists) {
        synced.push(
          createContact({
            nome: profName,
            linkedToProfessor: true,
            linkedProfessorName: profName
          })
        );
        changed = true;
      }
    });

    if (changed) {
      saveStructuredData(synced);
    }
  }, [layout, normalizedProfessores, structuredData, saveStructuredData]);

  const handleFieldChange = (id, field, value) => {
    const contatos = structuredData.contatos.map((contato) =>
      contato.id === id ? { ...contato, [field]: value } : contato
    );
    saveStructuredData(contatos);
  };

  const handleLinkChange = (id, index, field, value) => {
    const contatos = structuredData.contatos.map((contato) => {
      if (contato.id !== id) return contato;
      const links = contato.links.map((link, i) => (i === index ? { ...link, [field]: value } : link));
      return { ...contato, links };
    });
    saveStructuredData(contatos);
  };

  const addLink = (id) => {
    const contatos = structuredData.contatos.map((contato) =>
      contato.id === id
        ? { ...contato, links: [...contato.links, { label: '', url: '' }] }
        : contato
    );
    saveStructuredData(contatos);
  };

  const removeLink = (id, index) => {
    const contatos = structuredData.contatos.map((contato) =>
      contato.id === id
        ? { ...contato, links: contato.links.filter((_, i) => i !== index) }
        : contato
    );
    saveStructuredData(contatos);
  };

  const addExtraContact = () => {
    saveStructuredData([...structuredData.contatos, createContact({ linkedToProfessor: false })]);
  };

  const removeContact = (id) => {
    const target = structuredData.contatos.find((c) => c.id === id);
    if (target?.linkedToProfessor) return;
    const remaining = structuredData.contatos.filter((contato) => contato.id !== id);
    saveStructuredData(remaining.length ? remaining : [createContact()]);
  };

  const toggleRow = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const renderContactsTable = () => (
    <div className="contacts-table-wrapper">
      <div className="contacts-table-actions">
        <p>
          Professores do cabeçalho aparecem automaticamente. Utilize “Contato extra” para incluir outras pessoas.
        </p>
        <button type="button" onClick={addExtraContact}>
          <FaPlus /> Contato extra
        </button>
      </div>
      <table className="contacts-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Horário</th>
            <th>Sala/Office</th>
            <th>Detalhes</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {structuredData.contatos.map((contato, index) => {
            const displayName = contato.nome || contato.linkedProfessorName || `Contato ${index + 1}`;
            const isExpanded = expandedRow === contato.id;
            return (
              <React.Fragment key={contato.id}>
                <tr className={contato.linkedToProfessor ? 'linked-row' : ''}>
                  <td>
                    <div className="name-cell">
                      <input
                        type="text"
                        value={displayName}
                        disabled={contato.linkedToProfessor}
                        onChange={(e) => handleFieldChange(contato.id, 'nome', e.target.value)}
                        placeholder="Nome do contato"
                      />
                      {contato.linkedToProfessor && (
                        <span className="linked-badge">Professor</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <input
                      type="email"
                      value={contato.email}
                      onChange={(e) => handleFieldChange(contato.id, 'email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={contato.telefone}
                      onChange={(e) => handleFieldChange(contato.id, 'telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={contato.horario_atendimento}
                      onChange={(e) => handleFieldChange(contato.id, 'horario_atendimento', e.target.value)}
                      placeholder="Ex: seg 14h-16h"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={contato.sala}
                      onChange={(e) => handleFieldChange(contato.id, 'sala', e.target.value)}
                      placeholder="Sala 101"
                    />
                  </td>
                  <td className="details-cell">
                    <button type="button" onClick={() => toggleRow(contato.id)}>
                      {isExpanded ? <FaCaretUp /> : <FaCaretDown />} Detalhes
                    </button>
                  </td>
                  <td className="actions-cell">
                    {!contato.linkedToProfessor && (
                      <button type="button" onClick={() => removeContact(contato.id)}>
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="details-row">
                    <td colSpan={7}>
                      <div className="details-grid">
                        <div>
                          <div className="links-header">
                            <strong>
                              <FaLink /> Links
                            </strong>
                            <button type="button" onClick={() => addLink(contato.id)}>
                              + Link
                            </button>
                          </div>
                          {contato.links.length === 0 && (
                            <p className="links-empty">Nenhum link cadastrado.</p>
                          )}
                          {contato.links.map((link, idx) => (
                            <div key={idx} className="link-row">
                              <input
                                type="text"
                                placeholder="Rótulo"
                                value={link.label}
                                onChange={(e) => handleLinkChange(contato.id, idx, 'label', e.target.value)}
                              />
                              <input
                                type="url"
                                placeholder="https://..."
                                value={link.url}
                                onChange={(e) => handleLinkChange(contato.id, idx, 'url', e.target.value)}
                              />
                              <button type="button" onClick={() => removeLink(contato.id, idx)}>
                                <FaTrash />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div>
                          <label>Notas / Observações</label>
                          <TiptapEditor
                            content={contato.notas}
                            onChange={(value) => handleFieldChange(contato.id, 'notas', value)}
                            showCharCount={true}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderTextEditor = () => (
    <div className="contacts-text">
      <TiptapEditor content={textContent} onChange={setTextContent} showCharCount={true} />
      <p className="editor-note">
        💡 Use o editor livre apenas se não quiser os campos estruturados. O conteúdo salvo aqui não sincroniza
        com os dados dos professores.
      </p>
    </div>
  );

  return (
    <div className="contacts-manager">
      <div className="contacts-layout-selector">
        <label>Layout de Contatos:</label>
        <div className="layout-selector-buttons">
          <button
            type="button"
            className={`layout-option-btn ${layout === 'professores' ? 'active' : ''}`}
            onClick={() => setLayout('professores')}
          >
            <div className="layout-icon">
              <FaUser size={22} />
            </div>
            <div className="layout-label">
              <strong>Professores (Tabela)</strong>
            </div>
          </button>
          <button
            type="button"
            className={`layout-option-btn ${layout === 'texto' ? 'active' : ''}`}
            onClick={() => setLayout('texto')}
          >
            <div className="layout-icon">
              <FaFileAlt size={22} />
            </div>
            <div className="layout-label">
              <strong>Texto livre</strong>
            </div>
          </button>
        </div>
      </div>
      {layout === 'professores' ? renderContactsTable() : renderTextEditor()}
    </div>
  );
};

export default ContactsManager;
