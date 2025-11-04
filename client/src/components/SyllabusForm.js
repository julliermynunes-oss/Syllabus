import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import { FaArrowLeft, FaFilePdf, FaTrash } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import ReferenceManager from './ReferenceManager';
import CompetenciesTable from './CompetenciesTable';
import ProfessoresManager from './ProfessoresManager';
import AvaliacaoTable from './AvaliacaoTable';
import SyllabusPDFContent from './SyllabusPDFContent';
import './SyllabusForm.css';

function SyllabusForm() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;

  // Normalizadores para compatibilidade retroativa
  const normalizeSemestreAno = (value) => {
    if (!value) return value;
    if (value.startsWith('Primeiro/')) return value.replace('Primeiro/', '1/');
    if (value.startsWith('Segundo/')) return value.replace('Segundo/', '2/');
    return value;
  };

  const normalizeSemCurricular = (value) => {
    if (!value) return value;
    const map = {
      'Primeiro': '1º', 'Segundo': '2º', 'Terceiro': '3º', 'Quarto': '4º',
      'Quinto': '5º', 'Sexto': '6º', 'Sétimo': '7º', 'Setimo': '7º', 'Oitavo': '8º'
    };
    return map[value] || value;
  };

  // Função para verificar se o curso é CGA, CGAP ou AFA
  const isRestrictedCourse = (curso) => {
    if (!curso) return false;
    const cursoUpper = curso.toUpperCase();
    // Verifica se contém as siglas ou nomes completos
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

  // Função para gerar opções de semestre/ano (formato numérico: 1/2026, 2/2026)
  const generateSemestreAnoOptions = () => {
    const options = [];
    const startYear = 2026;
    const yearsAhead = 10; // Gera opções para os próximos 10 anos

    for (let year = startYear; year <= startYear + yearsAhead; year++) {
      options.push(`1/${year}`);
      options.push(`2/${year}`);
    }

    return options;
  };

  const semestreAnoOptions = generateSemestreAnoOptions();

  // Opções para Semestre Curricular (formato numérico ordinal: 1º, 2º, ... 8º)
  const semestreCurricularOptions = [
    "1º", "2º", "3º", "4º",
    "5º", "6º", "7º", "8º"
  ];

  // Opções fixas de Departamentos (fornecidas pelo usuário)
  const departamentoOptions = [
    'FSJ - Fundamentos Sociais e Jurídicos da Administração',
    'GEP - Departamento de Gestão Pública',
    'CFC - Contabilidade, Finanças e Controle',
    'POI - Administração da Produção e de Operações',
    'TDS - Technology and Data Science (Tecnologia e Ciência de Dados)',
    'MKT - Marketing',
    'ADM - Administração Geral e Recursos Humanos',
    'PAE - Planejamento e Análise Econômica aplicados à Administração',
  ];


  const [formData, setFormData] = useState({
    curso: '',
    disciplina: '',
    linha: '',
    semestre_ano: '',
    turma: '',
    departamento: '',
    num_creditos: '',
    sem_curricular: '',
    idioma: '',
    coordenador: '',
    professores: '',
    programa: '',
    sobre_disciplina: '',
    conteudo: '',
    metodologia: '',
    criterio_avaliacao: '',
    compromisso_etico: '',
    sobre_professor: '',
    referencias: '',
    competencias: '',
    custom_tab_name: '',
    custom_tab_content: '',
    professores_data: '',
    contatos: '',
    ods: '',
    o_que_e_esperado: ''
  });

  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState([]);
  const [filteredProfessores, setFilteredProfessores] = useState([]);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showDisciplineDropdown, setShowDisciplineDropdown] = useState(false);
  const [showProfessoresDropdown, setShowProfessoresDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('cabecalho');
  const [currentProfessor, setCurrentProfessor] = useState('');
  const [professoresList, setProfessoresList] = useState([]);
  const [allProfessoresForLider, setAllProfessoresForLider] = useState([]);
  const [filteredLiderDisciplina, setFilteredLiderDisciplina] = useState([]);
  const [showLiderDropdown, setShowLiderDropdown] = useState(false);
  const [showCustomTabModal, setShowCustomTabModal] = useState(false);
  const [customTabNameInput, setCustomTabNameInput] = useState('');

  useEffect(() => {
    fetchPrograms();
    fetchAllProfessoresForLider();
    if (isEditing) {
      fetchSyllabus();
    } else if (location.state) {
      // Pre-fill form with request data
      const { curso, disciplina, semestre_ano, turma } = location.state;
      setFormData(prevData => ({
        ...prevData,
        curso: curso || '',
        disciplina: disciplina || '',
        semestre_ano: normalizeSemestreAno(semestre_ano || ''),
        turma: turma || '',
        programa: curso || ''
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  const fetchAllProfessoresForLider = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/professores`);
      const data = response.data;
      // Flatten all professors from all departments
      const allProfs = [];
      Object.keys(data).forEach(dept => {
        if (Array.isArray(data[dept])) {
          allProfs.push(...data[dept].map(p => p.nome || p));
        }
      });
      const uniqueProfs = [...new Set(allProfs)].sort();
      setAllProfessoresForLider(uniqueProfs);
      setFilteredLiderDisciplina(uniqueProfs);
    } catch (err) {
      console.error('Erro ao buscar professores para Líder:', err);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/programs`);
      setPrograms(response.data);
    } catch (err) {
      console.error('Erro ao buscar programas:', err);
    }
  };

  const fetchSyllabus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/syllabi/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Verificar se o usuário tem permissão para editar
      if (response.data.usuario_id !== user.id) {
        alert('Você não tem permissão para editar este syllabus');
        navigate('/syllabi');
        return;
      }
      
      // Normalizar campos antigos para o novo formato
      const normalized = {
        ...response.data,
        semestre_ano: normalizeSemestreAno(response.data.semestre_ano),
        sem_curricular: normalizeSemCurricular(response.data.sem_curricular),
        professores_data: response.data.professores_data || null || '',
        contatos: response.data.contatos || null || '',
        ods: response.data.ods || null || '',
        o_que_e_esperado: response.data.o_que_e_esperado || null || ''
      };
      
      // Debug: verificar se os dados dos professores estão sendo carregados
      if (normalized.professores_data) {
        console.log('Dados dos professores carregados:', normalized.professores_data.substring(0, 100));
      }
      
      setFormData(normalized);
      
      // Converter string de professores em lista
      if (response.data.professores) {
        const profList = response.data.professores.split(',').map(p => p.trim()).filter(p => p);
        setProfessoresList(profList);
      }
    } catch (err) {
      console.error('Erro ao buscar syllabus:', err);
      alert('Erro ao carregar syllabus');
      navigate('/syllabi');
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    // Se o curso mudou, limpar disciplina e atualizar programa
    if (name === 'curso') {
      newFormData.programa = value; // Preencher programa com o mesmo valor do curso
      if (value !== formData.curso) {
        newFormData.disciplina = '';
      }
    }
    
    setFormData(newFormData);

    if (name === 'curso') {
      const filtered = programs.filter(p =>
        p.nome.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredPrograms(filtered);
      setShowProgramDropdown(value.length > 0);
    } else if (name === 'disciplina') {
      // Buscar disciplinas filtradas pelo programa selecionado
      try {
        const programaNome = newFormData.curso || newFormData.programa;
        if (programaNome) {
          const response = await axios.get(`${API_URL}/api/disciplines`, {
            params: { programa: programaNome }
          });
          const filtered = response.data.filter(d =>
            d.nome.toLowerCase().includes(value.toLowerCase())
          );
          setFilteredDisciplines(filtered);
          setShowDisciplineDropdown(value.length > 0 && filtered.length > 0);
        } else {
          // Se não há programa selecionado, buscar todas
          const response = await axios.get(`${API_URL}/api/disciplines`);
          const filtered = response.data.filter(d =>
            d.nome.toLowerCase().includes(value.toLowerCase())
          );
          setFilteredDisciplines(filtered);
          setShowDisciplineDropdown(value.length > 0 && filtered.length > 0);
        }
      } catch (err) {
        console.error('Erro ao buscar disciplinas:', err);
      }
    } else if (name === 'departamento') {
      // Quando o departamento mudar, limpar o campo de professor
      setCurrentProfessor('');
      setFilteredProfessores([]);
      setShowProfessoresDropdown(false);
    }
  };

  const selectProgram = (program) => {
    setFormData(prev => ({ 
      ...prev, 
      programa: program.nome, 
      curso: program.nome,
      disciplina: '' // Limpar disciplina ao selecionar novo curso
    }));
    setShowProgramDropdown(false);
  };
  
  // Handler for Líder de Disciplina input
  const handleLiderInputChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, coordenador: value }));
    
    if (value.trim()) {
      const filtered = allProfessoresForLider.filter(p =>
        p.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLiderDisciplina(filtered);
      setShowLiderDropdown(value.length > 0 && filtered.length > 0);
    } else {
      setFilteredLiderDisciplina(allProfessoresForLider);
      setShowLiderDropdown(false);
    }
  };
  
  const selectLider = (lider) => {
    setFormData(prev => ({ ...prev, coordenador: lider }));
    setShowLiderDropdown(false);
  };

  const handleCreateCustomTab = () => {
    if (customTabNameInput.trim()) {
      setFormData(prev => ({
        ...prev,
        custom_tab_name: customTabNameInput.trim(),
        custom_tab_content: prev.custom_tab_content || ''
      }));
      setShowCustomTabModal(false);
      setCustomTabNameInput('');
      setActiveTab('custom');
    }
  };

  const handleDeleteCustomTab = () => {
    if (window.confirm(`Tem certeza que deseja excluir a aba "${formData.custom_tab_name}"? Todo o conteúdo será perdido.`)) {
      setFormData(prev => ({
        ...prev,
        custom_tab_name: '',
        custom_tab_content: ''
      }));
      // Se a aba custom estava ativa, mudar para outra aba
      if (activeTab === 'custom') {
        setActiveTab('cabecalho');
      }
    }
  };

  const selectDiscipline = (discipline) => {
    setFormData({ ...formData, disciplina: discipline.nome });
    setShowDisciplineDropdown(false);
  };

  // Função para buscar professores baseado no departamento
  const fetchProfessores = async (searchValue) => {
    const departamento = formData.departamento;
    if (!departamento) {
      setFilteredProfessores([]);
      setShowProfessoresDropdown(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/professores`, {
        params: { departamento }
      });
      const filtered = response.data.filter(p =>
        p.nome.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredProfessores(filtered);
      setShowProfessoresDropdown(searchValue.length > 0 && filtered.length > 0);
    } catch (err) {
      console.error('Erro ao buscar professores:', err);
      setFilteredProfessores([]);
      setShowProfessoresDropdown(false);
    }
  };

  // Handler para mudança no campo de professor
  const handleProfessorInputChange = (e) => {
    const value = e.target.value;
    setCurrentProfessor(value);
    if (formData.departamento) {
      fetchProfessores(value);
    } else {
      setFilteredProfessores([]);
      setShowProfessoresDropdown(false);
    }
  };

  const selectProfessor = (professor) => {
    setCurrentProfessor(professor.nome);
    setShowProfessoresDropdown(false);
  };

  const addProfessor = () => {
    if (currentProfessor.trim()) {
      // Verificar se o professor já não está na lista
      if (!professoresList.includes(currentProfessor.trim())) {
        setProfessoresList([...professoresList, currentProfessor.trim()]);
      }
      setCurrentProfessor('');
      setShowProfessoresDropdown(false);
    }
  };

  const removeProfessor = (index) => {
    const newList = professoresList.filter((_, i) => i !== index);
    setProfessoresList(newList);
  };

  // Função para exportar PDF usando window.print()
  const handleExportPDF = () => {
    const element = document.getElementById('pdf-content');
    if (!element) {
      alert('Erro: Conteúdo não encontrado');
      return;
    }

    // Tornar o elemento visível temporariamente
    const originalDisplay = element.style.display;
    const originalPosition = element.style.position;
    const originalLeft = element.style.left;
    const originalWidth = element.style.width;
    
    element.style.display = 'block';
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.width = '210mm';
    element.style.maxWidth = '210mm';
    element.style.background = '#fff';
    element.style.zIndex = '999999';
    element.style.padding = '0';
    element.style.margin = '0';
    element.style.boxSizing = 'border-box';
    element.style.height = '297mm'; // A4 height
    
    // Aguardar um frame para renderização
    setTimeout(() => {
      // Imprimir
      window.print();
      
      // Restaurar estilos após impressão
      setTimeout(() => {
        element.style.display = originalDisplay;
        element.style.position = originalPosition;
        element.style.left = originalLeft;
        element.style.top = '';
        element.style.width = originalWidth;
        element.style.maxWidth = '';
        element.style.background = '';
        element.style.padding = '';
        element.style.zIndex = '';
        element.style.margin = '';
        element.style.height = '';
        element.style.boxSizing = '';
      }, 1000);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      professores: professoresList.join(', ')
    };

    try {
      if (isEditing) {
        await axios.put(
          `${API_URL}/api/syllabi/${id}`,
          dataToSubmit,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/syllabi`,
          dataToSubmit,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      navigate('/syllabi');
    } catch (err) {
      console.error('Erro ao salvar syllabus:', err);
      alert('Erro ao salvar syllabus');
    }
  };

  return (
    <div className="syllabus-form-container">
      <div className="form-header">
        <button className="back-btn" onClick={() => navigate('/syllabi')}>
          <FaArrowLeft /> Voltar
        </button>
        <h1 className="form-title">
          {isEditing ? 'Editar' : 'Criar'} Syllabus
        </h1>
        {isEditing && (
          <button className="export-pdf-btn" onClick={handleExportPDF} type="button">
            <FaFilePdf /> Exportar PDF
          </button>
        )}
      </div>

      {/* Container unificado com abas e formulário */}
      <div className="form-box-with-tabs">
        {/* Abas no topo */}
        <div className="tabs-container">
          <button
            className={`tab ${activeTab === 'cabecalho' ? 'active' : ''}`}
            onClick={() => setActiveTab('cabecalho')}
            type="button"
          >
            Cabeçalho
          </button>
          <button
            className={`tab ${activeTab === 'sobre' ? 'active' : ''}`}
            onClick={() => setActiveTab('sobre')}
            type="button"
          >
            Sobre a Disciplina
          </button>
          <button
            className={`tab ${activeTab === 'conteudo' ? 'active' : ''}`}
            onClick={() => setActiveTab('conteudo')}
            type="button"
          >
            Conteúdo
          </button>
          <button
            className={`tab ${activeTab === 'metodologia' ? 'active' : ''}`}
            onClick={() => setActiveTab('metodologia')}
            type="button"
          >
            Metodologia
          </button>
          <button
            className={`tab ${activeTab === 'avaliacao' ? 'active' : ''}`}
            onClick={() => setActiveTab('avaliacao')}
            type="button"
          >
            Avaliação
          </button>
          <button
            className={`tab ${activeTab === 'compromisso_etico' ? 'active' : ''}`}
            onClick={() => setActiveTab('compromisso_etico')}
            type="button"
          >
            Ética
          </button>
          <button
            className={`tab ${activeTab === 'professores' ? 'active' : ''}`}
            onClick={() => setActiveTab('professores')}
            type="button"
          >
            Professores
          </button>
          <button
            className={`tab ${activeTab === 'contatos' ? 'active' : ''}`}
            onClick={() => setActiveTab('contatos')}
            type="button"
          >
            Contatos
          </button>
          {!isRestrictedCourse(formData.curso) && (
            <button
              className={`tab ${activeTab === 'ods' ? 'active' : ''}`}
              onClick={() => setActiveTab('ods')}
              type="button"
            >
              ODS
            </button>
          )}
          <button
            className={`tab ${activeTab === 'referencias' ? 'active' : ''}`}
            onClick={() => setActiveTab('referencias')}
            type="button"
          >
            Referências
          </button>
          <button
            className={`tab ${activeTab === 'competencias' ? 'active' : ''}`}
            onClick={() => setActiveTab('competencias')}
            type="button"
          >
            Competências
          </button>
          {!isRestrictedCourse(formData.curso) && (
            <button
              className={`tab ${activeTab === 'o_que_e_esperado' ? 'active' : ''}`}
              onClick={() => setActiveTab('o_que_e_esperado')}
              type="button"
            >
              O que é esperado do aluno(a)
            </button>
          )}
          {formData.custom_tab_name && (
            <div className="tab-with-delete">
              <button
                className={`tab custom-tab ${activeTab === 'custom' ? 'active' : ''}`}
                onClick={() => setActiveTab('custom')}
                type="button"
              >
                {formData.custom_tab_name}
              </button>
              <button
                className="delete-custom-tab-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCustomTab();
                }}
                type="button"
                title="Excluir aba personalizada"
              >
                <FaTrash />
              </button>
            </div>
          )}
          {!formData.custom_tab_name && (
            <button
              className="tab add-custom-tab-btn"
              onClick={() => {
                setShowCustomTabModal(true);
              }}
              type="button"
              title="Adicionar aba personalizada"
            >
              + Nova Aba
            </button>
          )}
        </div>

        {/* Form Content Area */}
        <div className="form-content-area">
          <form onSubmit={handleSubmit} className="syllabus-form">
        {/* Aba: Cabeçalho */}
        {activeTab === 'cabecalho' && (
          <>
        <div className="form-row">
          <div className="form-field">
            <label>Curso:</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                name="curso"
                value={formData.curso}
                onChange={handleInputChange}
                placeholder="Digite o curso ..."
                onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
              />
              {showProgramDropdown && filteredPrograms.length > 0 && (
                <div className="autocomplete-dropdown">
                  {filteredPrograms.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => selectProgram(p)}
                      className="autocomplete-item"
                    >
                      {p.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-field">
            <label>Disciplina:</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                name="disciplina"
                value={formData.disciplina}
                onChange={handleInputChange}
                placeholder="Digite a disciplina ..."
                onBlur={() => setTimeout(() => setShowDisciplineDropdown(false), 200)}
                disabled={!formData.curso}
              />
              {showDisciplineDropdown && filteredDisciplines.length > 0 && (
                <div className="autocomplete-dropdown">
                  {filteredDisciplines.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => selectDiscipline(d)}
                      className="autocomplete-item"
                    >
                      {d.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Linha:</label>
            <input
              type="text"
              name="linha"
              value={formData.linha}
              onChange={handleInputChange}
              placeholder="Digite a linha ..."
            />
          </div>
          <div className="form-field">
            <label>Semestre/Ano:</label>
            <select
              name="semestre_ano"
              value={formData.semestre_ano}
              onChange={handleInputChange}
            >
              <option value="">Selecione o Semestre/Ano</option>
              {semestreAnoOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Turma:</label>
            <input
              type="text"
              name="turma"
              value={formData.turma}
              onChange={handleInputChange}
              placeholder="Digite nome/número da turma ..."
            />
          </div>
          <div className="form-field">
            <label>Departamento:</label>
            <select
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
            >
              <option value="">Selecione o Departamento</option>
              {departamentoOptions.map((dep, idx) => (
                <option key={idx} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Nº Créditos:</label>
            <input
              type="text"
              name="num_creditos"
              value={formData.num_creditos}
              onChange={handleInputChange}
              placeholder="Digite número de créditos ..."
            />
          </div>
          <div className="form-field">
            <label>Idioma:</label>
            <select
              name="idioma"
              value={formData.idioma}
              onChange={handleInputChange}
            >
              <option value="">Selecione o Idioma</option>
              <option value="Português">Português</option>
              <option value="English">English</option>
              <option value="Español">Español</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Sem. Curricular:</label>
            <select
              name="sem_curricular"
              value={formData.sem_curricular}
              onChange={handleInputChange}
            >
              <option value="">Selecione o Semestre Curricular</option>
              {semestreCurricularOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Líder de Disciplina:</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                name="coordenador"
                value={formData.coordenador}
                onChange={handleLiderInputChange}
                onFocus={() => formData.coordenador && setShowLiderDropdown(true)}
                onBlur={() => setTimeout(() => setShowLiderDropdown(false), 200)}
                placeholder="Digite o nome do líder de disciplina ..."
                className="form-input"
              />
              {showLiderDropdown && filteredLiderDisciplina.length > 0 && (
                <div className="autocomplete-dropdown">
                  {filteredLiderDisciplina.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectLider(p)}
                      className="autocomplete-item"
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <label>Professores:</label>
            <div className="professores-container">
              <div className="professor-input-row">
                <div className="autocomplete-wrapper" style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={currentProfessor}
                    onChange={handleProfessorInputChange}
                    placeholder={formData.departamento ? "Digite o nome do professor ..." : "Selecione um departamento primeiro"}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (showProfessoresDropdown && filteredProfessores.length > 0) {
                          selectProfessor(filteredProfessores[0]);
                        } else {
                          addProfessor();
                        }
                      }
                    }}
                    disabled={!formData.departamento}
                  />
                  {showProfessoresDropdown && filteredProfessores.length > 0 && (
                    <div className="autocomplete-dropdown">
                      {filteredProfessores.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectProfessor(p)}
                          className="autocomplete-item"
                        >
                          {p.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="add-professor-btn"
                  onClick={addProfessor}
                  disabled={!formData.departamento}
                >
                  Adicionar
                </button>
              </div>
              {professoresList.length > 0 && (
                <div className="professores-list">
                  {professoresList.map((prof, index) => (
                    <div key={index} className="professor-item">
                      <span>{prof}</span>
                      <button
                        type="button"
                        className="remove-professor-btn"
                        onClick={() => removeProfessor(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}

        {/* Aba: Sobre a Disciplina */}
        {activeTab === 'sobre' && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>Descrição da Disciplina:</label>
              <TiptapEditor
                content={formData.sobre_disciplina}
                onChange={(content) => setFormData(prev => ({ ...prev, sobre_disciplina: content }))}
              />
              <p className="editor-note">
                💡 <strong>Nota:</strong> Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas. Clique no botão "📊 Tabela" para inserir uma tabela.
              </p>
            </div>
          </div>
        )}

        {/* Aba: Conteúdo */}
        {activeTab === 'conteudo' && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>Conteúdo Programático:</label>
              <TiptapEditor
                content={formData.conteudo}
                onChange={(content) => setFormData(prev => ({ ...prev, conteudo: content }))}
              />
              <p className="editor-note">
                💡 <strong>Nota:</strong> Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas. Clique no botão "📊 Tabela" para inserir uma tabela.
              </p>
            </div>
          </div>
        )}

        {/* Aba: Metodologia */}
        {activeTab === 'metodologia' && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>Metodologia de Ensino:</label>
              <TiptapEditor
                content={formData.metodologia}
                onChange={(content) => setFormData(prev => ({ ...prev, metodologia: content }))}
              />
              <p className="editor-note">
                💡 <strong>Nota:</strong> Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas. Clique no botão "📊 Tabela" para inserir uma tabela.
              </p>
            </div>
          </div>
        )}

        {/* Aba: Critério de Avaliação */}
        {activeTab === 'avaliacao' && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>Critério de Avaliação:</label>
              <AvaliacaoTable
                data={formData.criterio_avaliacao}
                onChange={(content) => setFormData(prev => ({ ...prev, criterio_avaliacao: content }))}
              />
            </div>
          </div>
        )}


        {/* Aba: Compromisso Ético */}
        {activeTab === 'compromisso_etico' && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>Compromisso Ético:</label>
              <TiptapEditor
                content={formData.compromisso_etico}
                onChange={(content) => setFormData(prev => ({ ...prev, compromisso_etico: content }))}
              />
              <p className="editor-note">
                💡 <strong>Nota:</strong> Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas. Clique no botão "📊 Tabela" para inserir uma tabela.
              </p>
            </div>
          </div>
        )}

        {/* Aba: Professores */}
        {activeTab === 'professores' && (
          <div className="form-row full-width">
            <div className="form-field">
              <ProfessoresManager
                key={`professores-${id || 'new'}-${formData.professores_data ? formData.professores_data.substring(0, 20) : 'empty'}`}
                professoresList={professoresList}
                professoresData={formData.professores_data}
                onUpdate={(data) => setFormData(prev => ({ ...prev, professores_data: data }))}
              />
            </div>
          </div>
        )}

        {/* Aba: Contatos */}
        {activeTab === 'contatos' && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>Contatos:</label>
              <TiptapEditor
                content={formData.contatos}
                onChange={(content) => setFormData(prev => ({ ...prev, contatos: content }))}
              />
              <p className="editor-note">
                💡 <strong>Nota:</strong> Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas. Clique no botão "📊 Tabela" para inserir uma tabela.
              </p>
            </div>
          </div>
        )}

        {/* Aba: ODS */}
        {activeTab === 'ods' && !isRestrictedCourse(formData.curso) && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>Objetivos de Desenvolvimento Sustentável (ODS):</label>
              <TiptapEditor
                content={formData.ods}
                onChange={(content) => setFormData(prev => ({ ...prev, ods: content }))}
              />
              <p className="editor-note">
                💡 <strong>Nota:</strong> Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas. Clique no botão "📊 Tabela" para inserir uma tabela.
              </p>
            </div>
          </div>
        )}

        {/* Aba: Referências Bibliográficas */}
        {activeTab === 'referencias' && (
          <div className="form-row full-width">
            <div className="form-field">
              <h3 style={{ marginBottom: '1.5rem', color: '#235795' }}>
                Buscar e Adicionar Referências Bibliográficas
              </h3>
              <ReferenceManager
                content={formData.referencias}
                onChange={(content) => setFormData(prev => ({ ...prev, referencias: content }))}
              />
              <div style={{ marginTop: '2rem' }}>
                <label>Editor de Referências (para edição manual):</label>
                <TiptapEditor
                  content={formData.referencias}
                  onChange={(content) => setFormData(prev => ({ ...prev, referencias: content }))}
                />
                <p className="editor-note">
                  💡 <strong>Nota:</strong> Use a busca acima para adicionar referências automaticamente da API do Crossref, ou edite manualmente usando o editor rich text.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aba: Competências */}
        {activeTab === 'competencias' && (
          <div className="form-row full-width">
            <div className="form-field">
              <h3 style={{ marginBottom: '1.5rem', color: '#235795' }}>
                Competências da Disciplina
              </h3>
              <CompetenciesTable
                data={formData.competencias}
                onChange={(content) => setFormData(prev => ({ ...prev, competencias: content }))}
                curso={formData.curso}
              />
            </div>
          </div>
        )}

        {/* Aba: O QUE É ESPERADO QUE O(A) ALUNO(A) */}
        {activeTab === 'o_que_e_esperado' && !isRestrictedCourse(formData.curso) && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>O que é esperado do aluno(a):</label>
              <TiptapEditor
                content={formData.o_que_e_esperado}
                onChange={(content) => setFormData(prev => ({ ...prev, o_que_e_esperado: content }))}
              />
              <p className="editor-note">
                💡 <strong>Nota:</strong> Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas. Clique no botão "📊 Tabela" para inserir uma tabela.
              </p>
            </div>
          </div>
        )}

        {/* Aba: Personalizada */}
        {activeTab === 'custom' && formData.custom_tab_name && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>{formData.custom_tab_name}:</label>
              <TiptapEditor
                content={formData.custom_tab_content}
                onChange={(content) => setFormData(prev => ({ ...prev, custom_tab_content: content }))}
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {isEditing ? 'Atualizar' : 'Criar'} Syllabus
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/syllabi')}
          >
            Cancelar
          </button>
        </div>
          </form>
        </div>
      </div>

      {/* Componente oculto para PDF */}
      <div id="pdf-content" style={{ display: 'none', position: 'absolute', left: '-9999px', width: '210mm', maxWidth: '210mm' }}>
        <SyllabusPDFContent formData={formData} professoresList={professoresList} />
      </div>

      {/* Modal para criar aba personalizada */}
      {showCustomTabModal && (
        <div className="modal-overlay" onClick={() => setShowCustomTabModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nova Aba Personalizada</h2>
            <p>Digite o nome da nova aba:</p>
            <input
              type="text"
              value={customTabNameInput}
              onChange={(e) => setCustomTabNameInput(e.target.value)}
              placeholder="Ex: Material Complementar, Bibliografia Extensa, etc."
              className="modal-input"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCustomTab();
                }
              }}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn-confirm"
                onClick={handleCreateCustomTab}
                disabled={!customTabNameInput.trim()}
              >
                Criar Aba
              </button>
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => {
                  setShowCustomTabModal(false);
                  setCustomTabNameInput('');
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SyllabusForm;

