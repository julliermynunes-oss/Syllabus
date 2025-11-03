import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import { FaPlus, FaSignOutAlt, FaEdit, FaTrash, FaCopy, FaEye } from 'react-icons/fa';
import ProfessorModal from './ProfessorModal';
import './SyllabusList.css';

const SyllabusList = () => {
  const [syllabi, setSyllabi] = useState([]);
  const [programaSearch, setProgramaSearch] = useState('');
  const [disciplinaSearch, setDisciplinaSearch] = useState('');
  const [professorSearch, setProfessorSearch] = useState('');
  const [filterMeusOnly, setFilterMeusOnly] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState([]);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showDisciplineDropdown, setShowDisciplineDropdown] = useState(false);
  const [showProfessorModal, setShowProfessorModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [previewSyllabus, setPreviewSyllabus] = useState(null);
  const [professoresList, setProfessoresList] = useState([]);
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();

  const fetchSyllabi = async () => {
    try {
      const params = {};
      if (programaSearch) params.programa = programaSearch;
      if (disciplinaSearch) params.disciplina = disciplinaSearch;

      const response = await axios.get(`${API_URL}/api/syllabi`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let filteredData = response.data;
      
      // Filter by professor name if search is provided
      if (professorSearch) {
        filteredData = filteredData.filter(s => {
          const professores = s.professores || '';
          return professores.toLowerCase().includes(professorSearch.toLowerCase()) ||
                 (s.usuario && s.usuario.toLowerCase().includes(professorSearch.toLowerCase()));
        });
      }
      
      // Filter only my syllabi if filter is active
      if (filterMeusOnly && user) {
        filteredData = filteredData.filter(s => s.usuario_id === user.id);
      }
      
      setSyllabi(filteredData);
    } catch (err) {
      console.error('Erro ao buscar syllabi:', err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(response.data);
    } catch (err) {
      console.error('Erro ao buscar requisições:', err);
    }
  };

  useEffect(() => {
    // Carregar programas e disciplinas
    const loadData = async () => {
      try {
        const [programsRes, disciplinesRes] = await Promise.all([
          axios.get(`${API_URL}/api/programs`),
          axios.get(`${API_URL}/api/disciplines`)
        ]);
        setPrograms(programsRes.data);
        setDisciplines(disciplinesRes.data);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };

    if (token) {
      loadData();
      fetchSyllabi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSyllabi();
      fetchPendingRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programaSearch, disciplinaSearch, professorSearch, filterMeusOnly, token]);

  const handleProgramaSearchChange = (value) => {
    setProgramaSearch(value);
    const filtered = programs.filter(p =>
      p.nome.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredPrograms(filtered);
    setShowProgramDropdown(value.length > 0);
  };

  const handleDisciplinaSearchChange = (value) => {
    setDisciplinaSearch(value);
    const filtered = disciplines.filter(d =>
      d.nome.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredDisciplines(filtered);
    setShowDisciplineDropdown(value.length > 0);
  };

  const selectPrograma = (program) => {
    setProgramaSearch(program.nome);
    setShowProgramDropdown(false);
  };

  const selectDisciplina = (discipline) => {
    setDisciplinaSearch(discipline.nome);
    setShowDisciplineDropdown(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este syllabus?')) return;

    try {
      await axios.delete(`${API_URL}/api/syllabi/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSyllabi();
    } catch (err) {
      console.error('Erro ao deletar syllabus:', err);
      if (err.response && err.response.status === 403) {
        alert('Você não tem permissão para excluir este syllabus');
      } else {
        alert('Erro ao deletar syllabus');
      }
    }
  };

  const handleDuplicate = async (syllabus) => {
    try {
      const syllabusData = { ...syllabus };
      delete syllabusData.id;
      
      await axios.post(`${API_URL}/api/syllabi`, syllabusData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSyllabi();
      alert('Syllabus duplicado com sucesso!');
    } catch (err) {
      console.error('Erro ao duplicar syllabus:', err);
      alert('Erro ao duplicar syllabus');
    }
  };

  // (reatribuição removida do UI)

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddProfessor = async (professorData) => {
    try {
      // Send request to backend
      await axios.post(`${API_URL}/api/requests`, {
        professor_nome: professorData.professores,
        professor_email: '', // We'll need to get this from the user
        curso: professorData.curso,
        disciplina: professorData.disciplina,
        semestre_ano: professorData.turma_semestral,
        turma_nome: professorData.turma_nome
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Requisição criada para: ${professorData.professores}`);
    } catch (err) {
      console.error('Erro ao criar requisição:', err);
      alert('Erro ao criar requisição');
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/api/syllabi/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const syllabus = response.data;
      
      // Parse professores string into array
      const professoresArray = syllabus.professores ? syllabus.professores.split(',').map(p => p.trim()) : [];
      
      setPreviewSyllabus(syllabus);
      setProfessoresList(professoresArray);
    } catch (err) {
      console.error('Erro ao buscar syllabus:', err);
      alert('Erro ao carregar preview');
    }
  };

  return (
    <div className="syllabus-list-container">
      <header className="header">
        <h1 className="main-title">Syllabus</h1>
        <div className="header-actions">
          <div className="user-badge" title={user?.email}>Professor: {user?.nome_completo || '—'}</div>
          <button className="icon-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Sair
          </button>
          <button className="icon-btn" onClick={() => setShowProfessorModal(true)}>
            +Professor
          </button>
        </div>
      </header>

      <div className="section-divider"></div>

      <section className="notifications-section">
        <h2 className="section-title">Notificações</h2>
        {pendingRequests.length > 0 ? (
          <div className="requests-list">
            {pendingRequests.map((request) => (
              <div key={request.id} className="request-item">
                <div className="request-info">
                  <h3>{request.disciplina}</h3>
                  <p>Curso: {request.curso}</p>
                  <p>Semestre/Ano: {request.semestre_ano}</p>
                  {request.turma_nome && <p>Turma: {request.turma_nome}</p>}
                </div>
                <button 
                  className="accept-btn" 
                  onClick={async () => {
                    try {
                      // Update request status to accepted
                      await axios.put(`${API_URL}/api/requests/${request.id}/accept`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      // Remove the request from the list immediately
                      setPendingRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));
                      
                      // Navigate to create new syllabus with pre-filled data
                      navigate('/syllabus/new', { 
                        state: { 
                          curso: request.curso,
                          disciplina: request.disciplina,
                          semestre_ano: request.semestre_ano,
                          turma: request.turma_nome
                        } 
                      });
                    } catch (err) {
                      console.error('Erro ao aceitar requisição:', err);
                      alert('Erro ao aceitar requisição');
                    }
                  }}
                >
                  Aceitar e Criar Syllabus
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>Nenhuma requisição pendente</p>
        )}
      </section>

      <div className="search-section">
        <div className="search-box-wrapper">
          <div className="search-box">
            <input
              type="text"
              placeholder="DIGITE O PROGRAMA"
              value={programaSearch}
              onChange={(e) => handleProgramaSearchChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
            />
            {showProgramDropdown && filteredPrograms.length > 0 && (
              <div className="autocomplete-dropdown">
                {filteredPrograms.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectPrograma(p)}
                    className="autocomplete-item"
                  >
                    {p.nome}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="search-box-wrapper">
          <div className="search-box">
            <input
              type="text"
              placeholder="DIGITE A DISCIPLINA"
              value={disciplinaSearch}
              onChange={(e) => handleDisciplinaSearchChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowDisciplineDropdown(false), 200)}
            />
            {showDisciplineDropdown && filteredDisciplines.length > 0 && (
              <div className="autocomplete-dropdown">
                {filteredDisciplines.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => selectDisciplina(d)}
                    className="autocomplete-item"
                  >
                    {d.nome}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="DIGITE O NOME DO PROFESSOR"
              value={professorSearch}
              onChange={(e) => setProfessorSearch(e.target.value)}
            />
          </div>
          <button
            className={`filter-btn ${filterMeusOnly ? 'active' : ''}`}
            onClick={() => setFilterMeusOnly(!filterMeusOnly)}
            type="button"
          >
            {filterMeusOnly ? '✓ Meus Syllabi' : 'Meus Syllabi'}
          </button>
          <button className="icon-btn-small" onClick={() => navigate('/syllabus/new')}>
            <FaPlus />
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="syllabus-table">
          <thead>
            <tr>
              <th>Professor</th>
              <th>Semestre/Ano</th>
              <th>Programa</th>
              <th>Disciplina</th>
              <th>Linha</th>
              <th>Coordenador</th>
              <th>Semestre Curricular</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {syllabi.map((syllabus) => (
              <tr key={syllabus.id}>
                <td>{syllabus.usuario}</td>
                <td>{syllabus.semestre_ano}</td>
                <td>{syllabus.programa}</td>
                <td>{syllabus.disciplina}</td>
                <td>{syllabus.linha}</td>
                <td>{syllabus.coordenador}</td>
                <td>{syllabus.sem_curricular}</td>
                <td className="actions-cell">
                  <button
                    className="action-btn view"
                    onClick={() => handleView(syllabus.id)}
                    title="Visualizar"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="action-btn copy"
                    onClick={() => handleDuplicate(syllabus)}
                    title="Copiar"
                  >
                    <FaCopy />
                  </button>
                  {syllabus.usuario_id === user.id && (
                    <>
                      <button
                        className="action-btn edit"
                        onClick={() => navigate(`/syllabus/edit/${syllabus.id}`)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(syllabus.id)}
                        title="Deletar"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="add-button" onClick={() => navigate('/syllabus/new')}>
        <FaPlus /> Adicionar Novo Syllabus
      </button>

      {/* Modal de Adicionar Professor */}
      <ProfessorModal
        isOpen={showProfessorModal}
        onClose={() => setShowProfessorModal(false)}
        onAddProfessor={handleAddProfessor}
      />

      {/* Modal de Preview */}
      {previewSyllabus && (
        <div className="preview-modal-overlay" onClick={() => setPreviewSyllabus(null)}>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h2>Visualização do Syllabus</h2>
              <button className="close-btn" onClick={() => setPreviewSyllabus(null)}>
                ✕
              </button>
            </div>
            <div className="preview-modal-body">
              <SyllabusPreviewContent formData={previewSyllabus} professoresList={professoresList} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para renderizar o preview do syllabus
const SyllabusPreviewContent = ({ formData, professoresList }) => {
  return (
    <div style={{ 
      padding: '10px 15px',
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      backgroundColor: '#fff',
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '3px solid #235795', paddingBottom: '20px' }}>
        <img src="/FGV_Logo.png" alt="FGV Logo" style={{ maxWidth: '200px', height: 'auto', marginBottom: '20px' }} />
        <h1 style={{ fontSize: '28px', color: '#235795', marginBottom: '10px' }}>
          SYLLABUS
        </h1>
        <h2 style={{ fontSize: '22px', color: '#333', fontWeight: 'normal' }}>
          {formData.disciplina || 'Nome da Disciplina'}
        </h2>
      </div>

      {/* Informações Gerais */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
          INFORMAÇÕES GERAIS
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px', width: '100%' }}>
          {formData.curso && (<div><strong>Curso:</strong> {formData.curso}</div>)}
          {formData.semestre_ano && (<div><strong>Semestre/Ano:</strong> {formData.semestre_ano}</div>)}
          {formData.linha && (<div><strong>Linha:</strong> {formData.linha}</div>)}
          {formData.turma && (<div><strong>Turma:</strong> {formData.turma}</div>)}
          {formData.departamento && (<div><strong>Departamento:</strong> {formData.departamento}</div>)}
          {formData.num_creditos && (<div><strong>Nº Créditos:</strong> {formData.num_creditos}</div>)}
          {formData.sem_curricular && (<div><strong>Semestre Curricular:</strong> {formData.sem_curricular}</div>)}
          {formData.coordenador && (<div><strong>Líder de Disciplina:</strong> {formData.coordenador}</div>)}
          {formData.idioma && (<div><strong>Idioma:</strong> {formData.idioma}</div>)}
          {professoresList && professoresList.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Professores:</strong> {professoresList.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Sobre a Disciplina */}
      {formData.sobre_disciplina && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            SOBRE A DISCIPLINA
          </h3>
          <div 
            style={{ 
              fontSize: '14px', 
              lineHeight: '1.6',
            }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.sobre_disciplina }}
          />
        </div>
      )}

      {/* Conteúdo */}
      {formData.conteudo && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            CONTEÚDO
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.conteudo }}
          />
        </div>
      )}

      {/* Metodologia */}
      {formData.metodologia && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            METODOLOGIA
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.metodologia }}
          />
        </div>
      )}

      {/* Critério de Avaliação */}
      {formData.criterio_avaliacao && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            CRITÉRIO DE AVALIAÇÃO
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.criterio_avaliacao }}
          />
        </div>
      )}


      {/* Compromisso Ético */}
      {formData.compromisso_etico && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            COMPROMISSO ÉTICO
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.compromisso_etico }}
          />
        </div>
      )}

      {/* Sobre o Professor */}
      {formData.sobre_professor && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            SOBRE O PROFESSOR
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.sobre_professor }}
          />
        </div>
      )}

      {/* Competências */}
      {formData.competencias && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            COMPETÊNCIAS DA DISCIPLINA
          </h3>
          <CompetenciesTablePDF data={formData.competencias} />
        </div>
      )}

      {/* Referências Bibliográficas */}
      {formData.referencias && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            REFERÊNCIAS BIBLIOGRÁFICAS
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.referencias }}
          />
        </div>
      )}
    </div>
  );
};

// Componente para a tabela de competências no preview
const CompetenciesTablePDF = ({ data }) => {
  if (!data || data === '' || data === '[]') {
    return <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>Nenhuma competência cadastrada.</div>;
  }
  
  try {
    const parsed = JSON.parse(data);
    
    // O formato é { rows: [...] }
    const rows = parsed.rows || parsed;
    
    if (!rows || rows.length === 0) {
      return <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>Nenhuma competência cadastrada.</div>;
    }
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#235795', color: '#fff' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid #235795', fontSize: '12px' }}>Competência</th>
            <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid #235795', fontSize: '12px' }}>Descrição</th>
            <th style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #235795', fontSize: '12px', width: '100px' }}>Grau de Contribuição</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '11px' }}>{row.competencia || '-'}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '11px' }}>{row.descricao || '-'}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' }}>
                {'●'.repeat(row.grau || 0)}{'○'.repeat(3 - (row.grau || 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } catch (e) {
    console.error('Erro ao renderizar competências:', e, 'Data:', data);
    return <div style={{ fontSize: '14px', color: '#f00' }}>Erro ao carregar competências.</div>;
  }
};

export default SyllabusList;

