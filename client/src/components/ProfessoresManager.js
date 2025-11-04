import React, { useState, useEffect } from 'react';
import { FaLinkedin, FaLink, FaUser, FaTimes } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import './ProfessoresManager.css';

const ProfessoresManager = ({ professoresList, professoresData, onUpdate }) => {
  const [professoresInfo, setProfessoresInfo] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Inicializar dados dos professores quando os dados são carregados do servidor
    if (professoresData && professoresData.trim() !== '') {
      try {
        const parsed = typeof professoresData === 'string' 
          ? JSON.parse(professoresData) 
          : professoresData;
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          // Carregar dados do servidor
          setProfessoresInfo(parsed);
          setIsInitialized(true);
        } else {
          // Se parsed está vazio mas temos uma string, ainda marcar como inicializado
          setIsInitialized(true);
        }
      } catch (e) {
        console.error('Erro ao parsear dados dos professores:', e);
        setIsInitialized(true);
      }
    } else if (!professoresData || professoresData === '') {
      // Se não tem dados do servidor e ainda não inicializamos, marcar como inicializado
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professoresData]);

  useEffect(() => {
    // Só sincronizar depois que os dados do servidor foram carregados (se houver)
    if (!isInitialized) {
      return;
    }

    // Sincronizar com a lista de professores do cabeçalho
    // Mas não sobrescrever dados existentes que foram carregados do servidor
    const hasDataFromServer = professoresData && professoresData.trim() !== '';
    
    // Se temos dados do servidor, não fazer sincronização automática que sobrescreva
    // Apenas adicionar novos professores que não existem
    if (hasDataFromServer) {
      const updated = { ...professoresInfo };
      let hasChanges = false;

      // Adicionar novos professores que não estão nos dados (sem sobrescrever os existentes)
      professoresList.forEach(prof => {
        if (!updated[prof]) {
          updated[prof] = {
            foto: '',
            descricao: '',
            linkedin: '',
            outrosLinks: []
          };
          hasChanges = true;
        }
      });

      // Remover professores que não estão mais na lista (mas preservar dados do servidor)
      Object.keys(updated).forEach(prof => {
        if (!professoresList.includes(prof)) {
          delete updated[prof];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setProfessoresInfo(updated);
        // Atualizar o formData para manter sincronizado
        onUpdate(JSON.stringify(updated));
      }
    } else {
      // Se não temos dados do servidor, fazer sincronização normal
      const updated = { ...professoresInfo };
      let hasChanges = false;

      // Adicionar novos professores que não estão nos dados
      professoresList.forEach(prof => {
        if (!updated[prof]) {
          updated[prof] = {
            foto: '',
            descricao: '',
            linkedin: '',
            outrosLinks: []
          };
          hasChanges = true;
        }
      });

      // Remover professores que não estão mais na lista
      Object.keys(updated).forEach(prof => {
        if (!professoresList.includes(prof)) {
          delete updated[prof];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setProfessoresInfo(updated);
        onUpdate(JSON.stringify(updated));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professoresList.join(',')]);

  const updateProfessor = (nome, field, value) => {
    const updated = {
      ...professoresInfo,
      [nome]: {
        ...professoresInfo[nome],
        [field]: value
      }
    };
    setProfessoresInfo(updated);
    onUpdate(JSON.stringify(updated));
  };

  const addLink = (nome) => {
    const updated = {
      ...professoresInfo,
      [nome]: {
        ...professoresInfo[nome],
        outrosLinks: [
          ...(professoresInfo[nome]?.outrosLinks || []),
          { label: '', url: '' }
        ]
      }
    };
    setProfessoresInfo(updated);
    onUpdate(JSON.stringify(updated));
  };

  const updateLink = (nome, index, field, value) => {
    const updated = {
      ...professoresInfo,
      [nome]: {
        ...professoresInfo[nome],
        outrosLinks: professoresInfo[nome].outrosLinks.map((link, i) => 
          i === index ? { ...link, [field]: value } : link
        )
      }
    };
    setProfessoresInfo(updated);
    onUpdate(JSON.stringify(updated));
  };

  const removeLink = (nome, index) => {
    const updated = {
      ...professoresInfo,
      [nome]: {
        ...professoresInfo[nome],
        outrosLinks: professoresInfo[nome].outrosLinks.filter((_, i) => i !== index)
      }
    };
    setProfessoresInfo(updated);
    onUpdate(JSON.stringify(updated));
  };

  const handleImageUpload = (nome, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfessor(nome, 'foto', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (professoresList.length === 0) {
    return (
      <div className="professores-manager-empty">
        <FaUser size={48} />
        <p>Adicione professores no cabeçalho para começar a preencher suas informações.</p>
      </div>
    );
  }

  return (
    <div className="professores-manager">
      <div className="professores-grid">
        {professoresList.map((professorNome) => {
          const profData = professoresInfo[professorNome] || {
            foto: '',
            descricao: '',
            linkedin: '',
            outrosLinks: []
          };

          return (
            <div key={professorNome} className="professor-card">
              <div className="professor-card-header">
                <h3>{professorNome}</h3>
              </div>
              
              <div className="professor-card-content">
                {/* Foto */}
                <div className="professor-photo-section">
                  <label className="photo-label">
                    {profData.foto ? (
                      <img src={profData.foto} alt={professorNome} className="professor-photo" />
                    ) : (
                      <div className="professor-photo-placeholder">
                        <FaUser size={32} />
                        <span>Adicionar foto</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(professorNome, e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {profData.foto && (
                    <button
                      type="button"
                      className="remove-photo-btn"
                      onClick={() => updateProfessor(professorNome, 'foto', '')}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>

                {/* Descrição */}
                <div className="professor-description-section">
                  <label>Descrição:</label>
                  <TiptapEditor
                    content={profData.descricao || ''}
                    onChange={(content) => updateProfessor(professorNome, 'descricao', content)}
                  />
                </div>

                {/* LinkedIn */}
                <div className="professor-link-section">
                  <label>
                    <FaLinkedin /> LinkedIn:
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={profData.linkedin || ''}
                    onChange={(e) => updateProfessor(professorNome, 'linkedin', e.target.value)}
                  />
                </div>

                {/* Outros Links */}
                <div className="professor-links-section">
                  <label>
                    <FaLink /> Outros Links:
                  </label>
                  {profData.outrosLinks && profData.outrosLinks.map((link, index) => (
                    <div key={index} className="link-input-group">
                      <input
                        type="text"
                        placeholder="Rótulo (ex: Site pessoal)"
                        value={link.label || ''}
                        onChange={(e) => updateLink(professorNome, index, 'label', e.target.value)}
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={link.url || ''}
                        onChange={(e) => updateLink(professorNome, index, 'url', e.target.value)}
                      />
                      <button
                        type="button"
                        className="remove-link-btn"
                        onClick={() => removeLink(professorNome, index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-link-btn"
                    onClick={() => addLink(professorNome)}
                  >
                    + Adicionar Link
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfessoresManager;

