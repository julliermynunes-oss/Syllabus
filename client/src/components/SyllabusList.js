import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import axios from 'axios';
import { API_URL } from '../config';
import useCourseLayoutModel from '../hooks/useCourseLayoutModel';
import { FaPlus, FaSignOutAlt, FaEdit, FaTrash, FaCopy, FaEye, FaCog } from 'react-icons/fa';
import ProfessorModal from './ProfessorModal';
import SyllabusPreviewContent from './SyllabusPreviewContent';
import './SyllabusList.css';

const SyllabusList = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [syllabi, setSyllabi] = useState([]);
  const [programaSearch, setProgramaSearch] = useState('');
  const [disciplinaSearch, setDisciplinaSearch] = useState('');
  const [professorSearch, setProfessorSearch] = useState('');
  const [filterMeusOnly, setFilterMeusOnly] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [allProfessores, setAllProfessores] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState([]);
  const [filteredProfessores, setFilteredProfessores] = useState([]);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showDisciplineDropdown, setShowDisciplineDropdown] = useState(false);
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);
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
          const searchLower = professorSearch.toLowerCase();
          // Buscar em professores e usuario
          const matchProfessores = professores.toLowerCase().includes(searchLower);
          const matchUsuario = s.usuario && s.usuario.toLowerCase().includes(searchLower);
          // Retornar true se está em professores ou usuario
          return matchProfessores || matchUsuario;
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
    // Carregar programas, disciplinas e professores
    const loadData = async () => {
      try {
        const [programsRes, disciplinesRes, professoresRes] = await Promise.all([
          axios.get(`${API_URL}/api/programs`),
          axios.get(`${API_URL}/api/disciplines`),
          axios.get(`${API_URL}/api/professores`)
        ]);
        setPrograms(programsRes.data);
        setDisciplines(disciplinesRes.data);
        
        // Flatten professores from all departments
        const data = professoresRes.data;
        const allProfs = [];
        Object.keys(data).forEach(dept => {
          if (Array.isArray(data[dept])) {
            allProfs.push(...data[dept].map(p => p.nome || p));
          }
        });
        const uniqueProfs = [...new Set(allProfs)].sort();
        setAllProfessores(uniqueProfs);
        setFilteredProfessores(uniqueProfs);
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

  const handleProfessorSearchChange = (value) => {
    setProfessorSearch(value);
    if (value.trim()) {
      const filtered = allProfessores.filter(p =>
        p.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProfessores(filtered);
      setShowProfessorDropdown(value.length > 0 && filtered.length > 0);
    } else {
      setFilteredProfessores(allProfessores);
      setShowProfessorDropdown(false);
    }
  };

  const selectProfessor = (professor) => {
    setProfessorSearch(professor);
    setShowProfessorDropdown(false);
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
    if (!window.confirm(t('deleteConfirm'))) return;

    try {
      await axios.delete(`${API_URL}/api/syllabi/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSyllabi();
    } catch (err) {
      console.error('Erro ao deletar syllabus:', err);
      if (err.response && err.response.status === 403) {
        alert(t('noPermissionDelete'));
      } else {
        alert(t('errorDeleting'));
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
      alert(t('syllabusDuplicated'));
    } catch (err) {
      console.error('Erro ao duplicar syllabus:', err);
      alert(t('errorDuplicating'));
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
      alert(`${t('requestCreated')} ${professorData.professores}`);
    } catch (err) {
      console.error('Erro ao criar requisição:', err);
      alert(t('errorCreatingRequest'));
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

  const canAccessConfigurations = user && ['coordenador', 'admin'].includes((user.role || 'professor').toLowerCase());
  
  // Debug: log user role to console
  useEffect(() => {
    if (user) {
      console.log('User role:', user.role, 'Can access configurations:', canAccessConfigurations);
    }
  }, [user, canAccessConfigurations]);

  return (
    <div className="syllabus-list-container">
      <header className="header">
        <div className="header-title-section">
          <img 
            src="/FGV_SEM_FUNDO.png" 
            alt="FGV EAESP Logo" 
            className="header-logo"
          />
          <h1 className="main-title">{t('syllabus')}</h1>
        </div>
        <div className="header-actions">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '2px solid #235795',
              borderRadius: '8px',
              background: 'white',
              color: '#235795',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginRight: '1rem'
            }}
          >
            <option value="pt">BR - Português</option>
            <option value="en">US - English</option>
            <option value="es">ES - Español</option>
          </select>
          <div className="user-badge" title={user?.email}>{t('professor')}: {user?.nome_completo || '—'}</div>
          {canAccessConfigurations && (
            <button className="icon-btn" onClick={() => navigate('/configuracoes')} style={{ backgroundColor: '#28a745', color: 'white' }}>
              <FaCog /> {t('syllabusConfigurations')}
            </button>
          )}
          <button className="icon-btn" onClick={handleLogout}>
            <FaSignOutAlt /> {t('logout')}
          </button>
          <button className="icon-btn" onClick={() => setShowProfessorModal(true)}>
            {t('addProfessor')}
          </button>
        </div>
      </header>

      <div className="section-divider"></div>

      <section className="notifications-section">
        <h2 className="section-title">{t('notifications')}</h2>
        {pendingRequests.length > 0 ? (
          <div className="requests-list">
            {pendingRequests.map((request) => (
              <div key={request.id} className="request-item">
                <div className="request-info">
                  <h3>{request.disciplina}</h3>
                  <p>{t('course')}: {request.curso}</p>
                  <p>{t('period')}: {request.semestre_ano}</p>
                  {request.turma_nome && <p>{t('class')}: {request.turma_nome}</p>}
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
                      alert(t('errorAcceptingRequest'));
                    }
                  }}
                >
                  {t('acceptAndCreate')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>{t('noNotifications')}</p>
        )}
      </section>

      <div className="search-section">
        <div className="search-box-wrapper">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('searchByCourse').toUpperCase()}
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
          <div className="search-box">
            <input
              type="text"
              placeholder={t('searchByDiscipline').toUpperCase()}
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
              placeholder={t('searchByProfessor').toUpperCase()}
              value={professorSearch}
              onChange={(e) => handleProfessorSearchChange(e.target.value)}
              onFocus={() => professorSearch && setShowProfessorDropdown(true)}
              onBlur={() => setTimeout(() => setShowProfessorDropdown(false), 200)}
            />
            {showProfessorDropdown && filteredProfessores.length > 0 && (
              <div className="autocomplete-dropdown">
                {filteredProfessores.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectProfessor(p)}
                    className="autocomplete-item"
                  >
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className={`filter-btn ${filterMeusOnly ? 'active' : ''}`}
            onClick={() => setFilterMeusOnly(!filterMeusOnly)}
            type="button"
          >
            {filterMeusOnly ? `✓ ${t('filterMySyllabi')}` : t('filterMySyllabi')}
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
              <th>{t('professor')}</th>
              <th>{t('period')}</th>
              <th>{t('course')}</th>
              <th>{t('discipline')}</th>
              <th>{t('line')}</th>
              <th>{t('disciplineLeader')}</th>
              <th>{t('curricularSemester')}</th>
              <th>{t('actions')}</th>
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
                    title={t('view')}
                  >
                    <FaEye />
                  </button>
                  <button
                    className="action-btn copy"
                    onClick={() => handleDuplicate(syllabus)}
                    title={t('copy')}
                  >
                    <FaCopy />
                  </button>
                  {syllabus.usuario_id === user.id && (
                    <>
                      <button
                        className="action-btn edit"
                        onClick={() => navigate(`/syllabus/edit/${syllabus.id}`)}
                        title={t('edit')}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(syllabus.id)}
                        title={t('delete')}
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

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <button className="add-button" onClick={() => navigate('/syllabus/new')}>
          <FaPlus /> {t('newSyllabus')}
        </button>
      </div>

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
              <h2>{t('view')} {t('syllabus')}</h2>
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

export default SyllabusList;

