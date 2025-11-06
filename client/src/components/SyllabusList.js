import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import axios from 'axios';
import { API_URL } from '../config';
import { FaPlus, FaSignOutAlt, FaEdit, FaTrash, FaCopy, FaEye, FaCog } from 'react-icons/fa';
import ProfessorModal from './ProfessorModal';
import LanguageSelector from './LanguageSelector';
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

  return (
    <div className="syllabus-list-container">
      <header className="header">
        <h1 className="main-title">{t('syllabus')}</h1>
        <div className="header-actions">
          <LanguageSelector
            value={language}
            onChange={changeLanguage}
            style={{
              marginRight: '1rem'
            }}
          />
          <div className="user-badge" title={user?.email}>{t('professor')}: {user?.nome_completo || '—'}</div>
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
        <button className="manage-competencias-btn" onClick={() => navigate('/competencias')}>
          <FaCog /> {t('manageCompetencies')}
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

// Componente para renderizar o preview do syllabus
const SyllabusPreviewContent = ({ formData, professoresList }) => {
  const { t } = useTranslation();
  
  // Função auxiliar para verificar se o curso é restrito
  const isRestrictedCourse = (curso) => {
    if (!curso) return false;
    const cursoUpper = curso.toUpperCase();
    return cursoUpper.includes('CGA - CURSO DE GRADUAÇÃO EM ADMINISTRAÇÃO') ||
           cursoUpper.includes('CGAP - CURSO DE GRADUAÇÃO EM ADMINISTRAÇÃO PÚBLICA') ||
           cursoUpper.includes('AFA - 2ª GRADUAÇÃO EM CONTABILIDADE') ||
           cursoUpper === 'CGA' ||
           cursoUpper === 'CGAP' ||
           cursoUpper === 'AFA' ||
           cursoUpper.startsWith('CGA ') ||
           cursoUpper.startsWith('CGAP ') ||
           cursoUpper.startsWith('AFA ');
  };
  
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
          {t('generalInformation')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px', width: '100%' }}>
          {formData.curso && (<div><strong>{t('course')}:</strong> {formData.curso}</div>)}
          {formData.semestre_ano && (<div><strong>{t('period')}:</strong> {formData.semestre_ano}</div>)}
          {formData.linha && (<div><strong>{t('line')}:</strong> {formData.linha}</div>)}
          {formData.turma && (<div><strong>{t('class')}:</strong> {formData.turma}</div>)}
          {formData.departamento && (<div><strong>{t('department')}:</strong> {formData.departamento}</div>)}
          {formData.num_creditos && (<div><strong>{t('credits')}:</strong> {formData.num_creditos}</div>)}
          {formData.sem_curricular && (<div><strong>{t('curricularSemester')}:</strong> {formData.sem_curricular}</div>)}
          {formData.coordenador && (<div><strong>{t('disciplineLeader')}:</strong> {formData.coordenador}</div>)}
          {formData.idioma && (<div><strong>{t('language')}:</strong> {formData.idioma}</div>)}
          {professoresList && professoresList.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>{t('professorsList')}:</strong> {professoresList.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Professores */}
      {formData.professores_data && professoresList && professoresList.length > 0 && (() => {
        try {
          const professoresData = typeof formData.professores_data === 'string' 
            ? JSON.parse(formData.professores_data) 
            : formData.professores_data;
          
          const professoresComDados = professoresList.filter(prof => {
            const data = professoresData[prof];
            return data && (data.foto || data.descricao || data.linkedin || data.lattes || (data.outrosLinks && data.outrosLinks.length > 0));
          });

          if (professoresComDados.length > 0) {
            return (
              <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
                  {t('professorsTitle')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {professoresComDados.map((professorNome) => {
                    const profData = professoresData[professorNome] || {};
                    return (
                      <div key={professorNome} style={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: '8px', 
                        padding: '15px',
                        background: '#fff'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                          {profData.foto && (
                            <img 
                              src={profData.foto} 
                              alt={professorNome}
                              style={{ 
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '2px solid #235795'
                              }}
                            />
                          )}
                          <h4 style={{ margin: 0, color: '#235795', fontSize: '16px' }}>{professorNome}</h4>
                        </div>
                        {profData.descricao && (
                          <div 
                            style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '12px', color: '#333' }}
                            className="preview-content"
                            dangerouslySetInnerHTML={{ __html: profData.descricao }}
                          />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                          {profData.linkedin && (
                            <div>
                              <strong>LinkedIn:</strong>{' '}
                              <a href={profData.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', textDecoration: 'underline' }}>
                                Ver perfil
                              </a>
                            </div>
                          )}
                          {profData.lattes && (
                            <div>
                              <strong>Currículo Lattes:</strong>{' '}
                              <a href={profData.lattes} target="_blank" rel="noopener noreferrer" style={{ color: '#235795', textDecoration: 'underline' }}>
                                Ver currículo
                              </a>
                            </div>
                          )}
                          {profData.outrosLinks && profData.outrosLinks.map((link, idx) => (
                            link.url && (
                              <div key={idx}>
                                <strong>{link.label || 'Link'}:</strong>{' '}
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#235795', textDecoration: 'underline' }}>
                                  {link.label || 'Acessar link'}
                                </a>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        } catch (e) {
          return null;
        }
      })()}

      {/* Sobre a Disciplina */}
      {formData.sobre_disciplina && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            {t('aboutDisciplineTitle')}
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

      {/* Competências */}
      {formData.competencias && (() => {
        const getCursoSigla = (cursoNome) => {
          if (!cursoNome) return '';
          const cursoUpper = cursoNome.toUpperCase();
          if (cursoUpper.includes('CGA') || cursoUpper.includes('CURSO DE GRADUAÇÃO EM ADMINISTRAÇÃO')) {
            return 'CGA';
          } else if (cursoUpper.includes('CGAP') || cursoUpper.includes('CURSO DE GRADUAÇÃO EM ADMINISTRAÇÃO PÚBLICA')) {
            return 'CGAP';
          } else if (cursoUpper.includes('AFA') || cursoUpper.includes('2ª GRADUAÇÃO')) {
            return 'AFA';
          }
          return cursoNome.trim();
        };
        
        return (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('competenciesTitle')}
            </h3>
            {formData.curso && (
              <div style={{ marginBottom: '15px', padding: '10px 15px', background: '#f8f9fa', borderLeft: '4px solid #235795', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#4a5568', lineHeight: '1.6' }}>
                  Os objetivos de aprendizagem da disciplina estão apresentados na tabela abaixo, 
                  demonstrando como os mesmos contribuem para os objetivos do {getCursoSigla(formData.curso)}.
                </p>
              </div>
            )}
            <CompetenciesTablePDF data={formData.competencias} />
          </div>
        );
      })()}

      {/* ODS (se não for curso restrito) */}
      {formData.ods && !isRestrictedCourse(formData.curso) && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            {t('odsTitle')}
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.ods }}
          />
        </div>
      )}

      {/* Conteúdo */}
      {formData.conteudo && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            {t('contentTitle')}
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
            {t('methodologyTitle')}
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.metodologia }}
          />
        </div>
      )}

      {/* Critério de Avaliação */}
      {formData.criterio_avaliacao && (() => {
        try {
          const parsed = typeof formData.criterio_avaliacao === 'string' 
            ? JSON.parse(formData.criterio_avaliacao) 
            : formData.criterio_avaliacao;
          
          if (parsed && parsed.rows && parsed.rows.length > 0) {
            return (
              <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
                  {t('evaluationCriteriaTitle')}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#235795', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #1a4270' }}>{t('type')}</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #1a4270' }}>{t('criteria')}</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #1a4270' }}>{t('weight')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '10px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          {row.tipo || '-'}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          {row.criterio || '-'}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          {row.peso || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.observacoes && parsed.observacoes.trim() !== '' && (
                  <div style={{ marginTop: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px', fontSize: '14px', lineHeight: '1.6' }}>
                    <strong>{t('additionalObservations')}</strong>
                    <div style={{ marginTop: '8px' }} className="preview-content" dangerouslySetInnerHTML={{ __html: parsed.observacoes }} />
                  </div>
                )}
              </div>
            );
          }
          // Fallback para formato antigo (rich text)
          return (
            <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
              <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
                {t('evaluationCriteriaTitle')}
              </h3>
              <div 
                style={{ fontSize: '14px', lineHeight: '1.6' }}
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: formData.criterio_avaliacao }}
              />
            </div>
          );
        } catch (e) {
          // Se não for JSON, tratar como rich text antigo
          return (
            <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
              <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
                {t('evaluationCriteriaTitle')}
              </h3>
              <div 
                style={{ fontSize: '14px', lineHeight: '1.6' }}
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: formData.criterio_avaliacao }}
              />
            </div>
          );
        }
      })()}

      {/* O que é esperado do aluno (se não for curso restrito) */}
      {formData.o_que_e_esperado && !isRestrictedCourse(formData.curso) && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            {t('expectedFromStudentTitle')}
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.o_que_e_esperado }}
          />
        </div>
      )}

      {/* Aba Personalizada */}
      {formData.custom_tab_name && formData.custom_tab_content && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            {formData.custom_tab_name.toUpperCase()}
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.custom_tab_content }}
          />
        </div>
      )}

      {/* Referências Bibliográficas */}
      {formData.referencias && (() => {
        const layout = formData.referencias_layout || 'lista';
        
        if (layout === 'categorizado') {
          try {
            const parsed = JSON.parse(formData.referencias);
            if (parsed.references && Array.isArray(parsed.references)) {
              const obrigatorias = parsed.references.filter(ref => ref.category === 'obrigatoria');
              const opcionais = parsed.references.filter(ref => ref.category === 'opcional');
              const outras = parsed.references.filter(ref => ref.category === 'outras');
              
              return (
                <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                  <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
                    {t('referencesTitle')}
                  </h3>
                  {obrigatorias.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', color: '#235795', fontWeight: 'bold', marginBottom: '10px' }}>
                        {t('requiredReading') || 'Leitura Obrigatória:'}
                      </h4>
                      <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
                        {obrigatorias.map((ref, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{ref.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {opcionais.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', color: '#235795', fontWeight: 'bold', marginBottom: '10px' }}>
                        {t('optionalReading') || 'Leitura Opcional/Complementar:'}
                      </h4>
                      <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
                        {opcionais.map((ref, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{ref.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {outras.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '16px', color: '#235795', fontWeight: 'bold', marginBottom: '10px' }}>
                        Outras Referências:
                      </h4>
                      <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
                        {outras.map((ref, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{ref.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            }
          } catch (e) {
            // Se não for JSON válido, renderizar como HTML
          }
        }
        
        // Layout lista ou fallback
        return (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('referencesTitle')}
            </h3>
            <div 
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: formData.referencias }}
            />
          </div>
        );
      })()}

      {/* Contatos (sempre por último) */}
      {formData.contatos && (
        <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            {t('contactsTitle')}
          </h3>
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.contatos }}
          />
        </div>
      )}
    </div>
  );
};

// Componente para a tabela de competências no preview
const CompetenciesTablePDF = ({ data }) => {
  const { t } = useTranslation();
  
  if (!data || data === '' || data === '[]') {
    return <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>{t('noCompetencies')}</div>;
  }
  
  try {
    const parsed = JSON.parse(data);
    
    // O formato é { rows: [...] }
    const rows = parsed.rows || parsed;
    
    if (!rows || rows.length === 0) {
      return <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>{t('noCompetencies')}</div>;
    }
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#235795', color: '#fff' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid #235795', fontSize: '12px' }}>{t('competence')}</th>
            <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid #235795', fontSize: '12px' }}>{t('descriptionField')}</th>
            <th style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #235795', fontSize: '12px', width: '100px' }}>{t('contributionDegree')}</th>
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
    return <div style={{ fontSize: '14px', color: '#f00' }}>{t('errorLoadingCompetencies')}</div>;
  }
};

export default SyllabusList;

