import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import axios from 'axios';
import { API_URL } from '../config';
import { FaArrowLeft, FaFilePdf, FaTrash } from 'react-icons/fa';
// html2pdf será importado dinamicamente para evitar problemas no build
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
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
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
    referencias_layout: 'lista', // 'lista' ou 'categorizado'
    competencias: '',
    custom_tab_name: '',
    custom_tab_content: '',
    custom_tab_position: 'end', // Posição padrão: no final
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
  const [customTabPositionInput, setCustomTabPositionInput] = useState('end');

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
        o_que_e_esperado: response.data.o_que_e_esperado || null || '',
        custom_tab_position: response.data.custom_tab_position || 'end',
        referencias_layout: response.data.referencias_layout || 'lista'
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
        custom_tab_content: prev.custom_tab_content || '',
        custom_tab_position: customTabPositionInput
      }));
      setShowCustomTabModal(false);
      setCustomTabNameInput('');
      setCustomTabPositionInput('end');
      setActiveTab('custom');
    }
  };

  const handleDeleteCustomTab = () => {
    if (window.confirm(`Tem certeza que deseja excluir a aba "${formData.custom_tab_name}"? Todo o conteúdo será perdido.`)) {
      setFormData(prev => ({
        ...prev,
        custom_tab_name: '',
        custom_tab_content: '',
        custom_tab_position: 'end'
      }));
      // Se a aba custom estava ativa, mudar para outra aba
      if (activeTab === 'custom') {
        setActiveTab('cabecalho');
      }
    }
  };

  // Função para obter a lista de abas ordenadas
  const getOrderedTabs = () => {
    const tabs = [
      { id: 'cabecalho', label: t('header') },
      { id: 'sobre', label: t('aboutDiscipline') },
      { id: 'conteudo', label: t('content') },
      { id: 'metodologia', label: t('methodology') },
      { id: 'avaliacao', label: t('evaluation') },
      { id: 'compromisso_etico', label: t('ethics') },
      { id: 'professores', label: t('professors') },
      { id: 'contatos', label: t('contacts') }
    ];

    // Adicionar ODS se não for curso restrito
    if (!isRestrictedCourse(formData.curso)) {
      tabs.push({ id: 'ods', label: t('ods') });
    }

    tabs.push({ id: 'referencias', label: t('references') });
    tabs.push({ id: 'competencias', label: t('competencies') });

    // Adicionar "O que é esperado" se não for curso restrito
    if (!isRestrictedCourse(formData.curso)) {
      tabs.push({ id: 'o_que_e_esperado', label: t('expectedFromStudent') });
    }

    // Inserir a aba personalizada na posição correta
    if (formData.custom_tab_name) {
      const customTab = { id: 'custom', label: formData.custom_tab_name, isCustom: true };
      const position = formData.custom_tab_position || 'end';
      
      if (position === 'end') {
        tabs.push(customTab);
      } else {
        // Encontrar o índice da aba após a qual inserir
        const afterIndex = tabs.findIndex(tab => tab.id === position);
        if (afterIndex !== -1) {
          tabs.splice(afterIndex + 1, 0, customTab);
        } else {
          // Se não encontrar, adicionar no final
          tabs.push(customTab);
        }
      }
    }

    return tabs;
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

  // Função para exportar PDF usando html2pdf.js
  const handleExportPDF = async () => {
    const element = document.getElementById('pdf-content');
    if (!element) {
      alert('Erro: Conteúdo não encontrado');
      return;
    }

    try {
      // Importação dinâmica para evitar problemas no build
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Tornar o elemento visível temporariamente para renderização
      const originalDisplay = element.style.display;
      const originalPosition = element.style.position;
      const originalLeft = element.style.left;
      
      element.style.display = 'block';
      element.style.position = 'relative';
      element.style.left = '0';
      element.style.width = '210mm';
      element.style.maxWidth = '210mm';
      element.style.background = '#fff';
      
      // Configurações do html2pdf
      const opt = {
        margin: [40, 20, 40, 20], // [top, left, bottom, right] em mm - reduzido laterais para evitar quebras
        filename: `Syllabus_${formData.disciplina || 'documento'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 3,
          useCORS: true,
          letterRendering: true,
          logging: false,
          width: element.scrollWidth,
          height: element.scrollHeight,
          windowWidth: element.scrollWidth,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['.pdf-container > div > div[style*="border"]', 'h3', 'table']
        }
      };

      // Aguardar renderização e gerar PDF (aumentado timeout para garantir renderização)
      setTimeout(() => {
        // Forçar reflow para garantir que os estilos sejam aplicados
        void element.offsetHeight;
        // Adicionar classe para garantir estilos CSS
        element.classList.add('pdf-exporting');
        
        // Aplicar estilos diretamente nos elementos para garantir que sejam capturados
        const allH3 = element.querySelectorAll('h3');
        allH3.forEach(h3 => {
          h3.style.fontSize = '26px';
          h3.style.marginBottom = '18px';
          h3.style.paddingBottom = '12px';
        });
        
        const allH4 = element.querySelectorAll('h4');
        allH4.forEach(h4 => {
          h4.style.fontSize = '20px';
        });
        
        const allDivs = element.querySelectorAll('div');
        allDivs.forEach(div => {
          if (!div.style.fontSize || parseInt(div.style.fontSize) < 18) {
            div.style.fontSize = '18px';
            div.style.lineHeight = '1.7';
          }
        });
        
        const allPs = element.querySelectorAll('p');
        allPs.forEach(p => {
          p.style.fontSize = '18px';
          p.style.lineHeight = '1.7';
        });
        
        const allTables = element.querySelectorAll('table');
        allTables.forEach(table => {
          table.style.fontSize = '18px';
        });
        
        const allLists = element.querySelectorAll('ul, ol');
        allLists.forEach(list => {
          list.style.fontSize = '18px';
        });
        
        // Forçar outro reflow após aplicar estilos
        void element.offsetHeight;
        
        html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            // Restaurar estilos após geração
            element.classList.remove('pdf-exporting');
            element.style.display = originalDisplay;
            element.style.position = originalPosition;
            element.style.left = originalLeft;
            element.style.width = '';
            element.style.maxWidth = '';
            element.style.background = '';
          })
          .catch((error) => {
            console.error('Erro ao gerar PDF:', error);
            element.classList.remove('pdf-exporting');
            alert('Erro ao gerar PDF. Por favor, tente novamente.');
            // Restaurar estilos mesmo em caso de erro
            element.style.display = originalDisplay;
            element.style.position = originalPosition;
            element.style.left = originalLeft;
            element.style.width = '';
            element.style.maxWidth = '';
            element.style.background = '';
          });
      }, 500);
    } catch (error) {
      console.error('Erro ao importar html2pdf:', error);
      alert('Erro ao carregar biblioteca de PDF. Por favor, tente novamente.');
    }
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
          <FaArrowLeft /> {t('back')}
        </button>
        <h1 className="form-title">
          {isEditing ? t('editSyllabus') : t('createSyllabus')}
        </h1>
        <div className="form-header-actions">
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
            <option value="pt">🇧🇷 Português</option>
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
          </select>
          {isEditing && (
            <button className="export-pdf-btn" onClick={handleExportPDF} type="button">
              <FaFilePdf /> {t('exportPDF')}
            </button>
          )}
        </div>
      </div>

      {/* Container unificado com abas e formulário */}
      <div className="form-box-with-tabs">
        {/* Abas no topo */}
        <div className="tabs-container">
          {getOrderedTabs().map((tab) => {
            if (tab.isCustom) {
              return (
                <div key={tab.id} className="tab-with-delete">
                  <button
                    className={`tab custom-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                  <button
                    className="delete-custom-tab-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomTab();
                    }}
                    type="button"
                    title={t('deleteTabConfirm').replace('{name}', formData.custom_tab_name)}
                  >
                    <FaTrash />
                  </button>
                </div>
              );
            }
            return (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
          {!formData.custom_tab_name && (
            <button
              className="tab add-custom-tab-btn"
              onClick={() => {
                setShowCustomTabModal(true);
              }}
              type="button"
              title={t('addCustomTab')}
            >
              {t('addCustomTab')}
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
            <label>{t('course')}:</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                name="curso"
                value={formData.curso}
                onChange={handleInputChange}
                placeholder={`${t('course')} ...`}
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
            <label>{t('discipline')}:</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                name="disciplina"
                value={formData.disciplina}
                onChange={handleInputChange}
                placeholder={`${t('discipline')} ...`}
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
            <label>{t('line')}:</label>
            <input
              type="text"
              name="linha"
              value={formData.linha}
              onChange={handleInputChange}
              placeholder={`${t('line')} ...`}
            />
          </div>
          <div className="form-field">
            <label>{t('period')}:</label>
            <select
              name="semestre_ano"
              value={formData.semestre_ano}
              onChange={handleInputChange}
            >
              <option value="">{t('selectSemesterYear')}</option>
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
            <label>{t('class')}:</label>
            <input
              type="text"
              name="turma"
              value={formData.turma}
              onChange={handleInputChange}
              placeholder={`${t('class')} ...`}
            />
          </div>
          <div className="form-field">
            <label>{t('department')}:</label>
            <select
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
            >
              <option value="">{t('selectDepartment')}</option>
              {departamentoOptions.map((dep, idx) => (
                <option key={idx} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>{t('credits')}:</label>
            <input
              type="text"
              name="num_creditos"
              value={formData.num_creditos}
              onChange={handleInputChange}
              placeholder={`${t('credits')} ...`}
            />
          </div>
          <div className="form-field">
            <label>{t('language')}:</label>
            <select
              name="idioma"
              value={formData.idioma}
              onChange={handleInputChange}
            >
              <option value="">{t('selectLanguage')}</option>
              <option value="Português">Português</option>
              <option value="English">English</option>
              <option value="Español">Español</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>{t('curricularSemester')}:</label>
            <select
              name="sem_curricular"
              value={formData.sem_curricular}
              onChange={handleInputChange}
            >
              <option value="">{t('selectCurricularSemester')}</option>
              {semestreCurricularOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>{t('disciplineLeader')}:</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                name="coordenador"
                value={formData.coordenador}
                onChange={handleLiderInputChange}
                onFocus={() => formData.coordenador && setShowLiderDropdown(true)}
                onBlur={() => setTimeout(() => setShowLiderDropdown(false), 200)}
                placeholder={`${t('disciplineLeader')} ...`}
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
            <label>{t('professorsList')}:</label>
            <div className="professores-container">
              <div className="professor-input-row">
                <div className="autocomplete-wrapper" style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={currentProfessor}
                    onChange={handleProfessorInputChange}
                    placeholder={formData.departamento ? `${t('typeProfessorName')}` : t('selectDepartment')}
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
                  {t('addProfessorButton')}
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
              <label>{t('description')}</label>
              <TiptapEditor
                content={formData.sobre_disciplina}
                onChange={(content) => setFormData(prev => ({ ...prev, sobre_disciplina: content }))}
              />
              <p className="editor-note">
                {t('editorNote')}
              </p>
            </div>
          </div>
        )}

        {/* Aba: Conteúdo */}
        {activeTab === 'conteudo' && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>{t('programmaticContent')}</label>
              <TiptapEditor
                content={formData.conteudo}
                onChange={(content) => setFormData(prev => ({ ...prev, conteudo: content }))}
              />
              <p className="editor-note">
                {t('editorNote')}
              </p>
            </div>
          </div>
        )}

        {/* Aba: Metodologia */}
        {activeTab === 'metodologia' && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>{t('teachingMethodology')}</label>
              <TiptapEditor
                content={formData.metodologia}
                onChange={(content) => setFormData(prev => ({ ...prev, metodologia: content }))}
              />
              <p className="editor-note">
                {t('editorNote')}
              </p>
            </div>
          </div>
        )}

        {/* Aba: Critério de Avaliação */}
        {activeTab === 'avaliacao' && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>{t('evaluationCriteria')}</label>
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
              <label>{t('ethicalCommitment')}</label>
              <TiptapEditor
                content={formData.compromisso_etico}
                onChange={(content) => setFormData(prev => ({ ...prev, compromisso_etico: content }))}
              />
              <p className="editor-note">
                {t('editorNote')}
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
              <label>{t('contactsLabel')}</label>
              <TiptapEditor
                content={formData.contatos}
                onChange={(content) => setFormData(prev => ({ ...prev, contatos: content }))}
              />
              <p className="editor-note">
                {t('editorNote')}
              </p>
            </div>
          </div>
        )}

        {/* Aba: ODS */}
        {activeTab === 'ods' && !isRestrictedCourse(formData.curso) && (
          <div className="form-row full-width">
            <div className="form-field">
              <label>{t('odsLabel')}</label>
              <TiptapEditor
                content={formData.ods}
                onChange={(content) => setFormData(prev => ({ ...prev, ods: content }))}
              />
              <p className="editor-note">
                {t('editorNote')}
              </p>
            </div>
          </div>
        )}

        {/* Aba: Referências Bibliográficas */}
        {activeTab === 'referencias' && (
          <div className="form-row full-width">
            <div className="form-field">
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#235795' }}>
                  {t('referencesLayout') || 'Layout das Referências:'}
                </label>
                <select
                  value={formData.referencias_layout || 'lista'}
                  onChange={(e) => setFormData(prev => ({ ...prev, referencias_layout: e.target.value }))}
                  style={{ padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '250px' }}
                >
                  <option value="lista">{t('listLayout') || 'Lista (todas as referências juntas)'}</option>
                  <option value="categorizado">{t('categorizedLayout') || 'Categorizado (Obrigatória/Opcional)'}</option>
                </select>
              </div>
              <h3 style={{ marginBottom: '1.5rem', color: '#235795' }}>
                {t('searchReferences')}
              </h3>
              <ReferenceManager
                content={formData.referencias}
                layout={formData.referencias_layout || 'lista'}
                onChange={(content) => setFormData(prev => ({ ...prev, referencias: content }))}
              />
              <div style={{ marginTop: '2rem' }}>
                {formData.referencias_layout === 'categorizado' && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #235795' }}>
                    <p style={{ margin: 0, color: '#235795', fontSize: '0.9rem' }}>
                      {t('categorizedModeNote') || 'No modo categorizado, você pode editar manualmente abaixo. Mantenha o formato com títulos "Leitura Obrigatória:", "Leitura Opcional/Complementar:" e "Outras Referências:" para preservar a categorização.'}
                    </p>
                  </div>
                )}
                <label>{t('manualEditor')}</label>
                <TiptapEditor
                  content={(() => {
                    // Se for categorizado e o conteúdo for JSON, converter para HTML formatado
                    if (formData.referencias_layout === 'categorizado' && formData.referencias) {
                      try {
                        const parsed = JSON.parse(formData.referencias);
                        if (parsed.references && Array.isArray(parsed.references)) {
                          const obrigatorias = parsed.references.filter(ref => ref.category === 'obrigatoria');
                          const opcionais = parsed.references.filter(ref => ref.category === 'opcional');
                          const outras = parsed.references.filter(ref => ref.category === 'outras');
                          
                          let html = '';
                          if (obrigatorias.length > 0) {
                            html += `<h4><strong>Leitura Obrigatória:</strong></h4><ul>`;
                            obrigatorias.forEach(ref => {
                              html += `<li><p>${ref.text}</p></li>`;
                            });
                            html += `</ul>`;
                          }
                          if (opcionais.length > 0) {
                            html += `<h4><strong>Leitura Opcional/Complementar:</strong></h4><ul>`;
                            opcionais.forEach(ref => {
                              html += `<li><p>${ref.text}</p></li>`;
                            });
                            html += `</ul>`;
                          }
                          if (outras.length > 0) {
                            html += `<h4><strong>Outras Referências:</strong></h4><ul>`;
                            outras.forEach(ref => {
                              html += `<li><p>${ref.text}</p></li>`;
                            });
                            html += `</ul>`;
                          }
                          return html;
                        }
                      } catch (e) {
                        // Se não for JSON, retornar o conteúdo como está
                      }
                    }
                    return formData.referencias || '';
                  })()}
                  onChange={(content) => {
                    // Se for categorizado, tentar converter HTML de volta para JSON
                    if (formData.referencias_layout === 'categorizado') {
                      try {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = content;
                        
                        const references = [];
                        
                        // Buscar seção "Leitura Obrigatória"
                        const obrigatoriaHeading = Array.from(tempDiv.querySelectorAll('h4, h3, h2, h1, strong')).find(el => {
                          const text = el.textContent || el.innerText || '';
                          return text.toLowerCase().includes('obrigatória') || text.toLowerCase().includes('obrigatoria');
                        });
                        
                        if (obrigatoriaHeading) {
                          let current = obrigatoriaHeading.nextSibling;
                          while (current && current.nodeName !== 'H4' && current.nodeName !== 'H3' && current.nodeName !== 'H2' && current.nodeName !== 'H1') {
                            if (current.nodeName === 'UL' || current.nodeName === 'OL') {
                              const items = current.querySelectorAll('li');
                              items.forEach(li => {
                                const text = li.textContent || li.innerText || '';
                                if (text.trim()) {
                                  references.push({ text: text.trim(), category: 'obrigatoria' });
                                }
                              });
                            } else if (current.nodeName === 'P' && current.textContent && current.textContent.trim()) {
                              references.push({ text: current.textContent.trim(), category: 'obrigatoria' });
                            }
                            current = current.nextSibling;
                          }
                        }
                        
                        // Buscar seção "Leitura Opcional"
                        const opcionalHeading = Array.from(tempDiv.querySelectorAll('h4, h3, h2, h1, strong')).find(el => {
                          const text = el.textContent || el.innerText || '';
                          return text.toLowerCase().includes('opcional') || text.toLowerCase().includes('complementar');
                        });
                        
                        if (opcionalHeading) {
                          let current = opcionalHeading.nextSibling;
                          while (current && current.nodeName !== 'H4' && current.nodeName !== 'H3' && current.nodeName !== 'H2' && current.nodeName !== 'H1') {
                            if (current.nodeName === 'UL' || current.nodeName === 'OL') {
                              const items = current.querySelectorAll('li');
                              items.forEach(li => {
                                const text = li.textContent || li.innerText || '';
                                if (text.trim()) {
                                  references.push({ text: text.trim(), category: 'opcional' });
                                }
                              });
                            } else if (current.nodeName === 'P' && current.textContent && current.textContent.trim()) {
                              references.push({ text: current.textContent.trim(), category: 'opcional' });
                            }
                            current = current.nextSibling;
                          }
                        }
                        
                        // Buscar seção "Outras Referências"
                        const outrasHeading = Array.from(tempDiv.querySelectorAll('h4, h3, h2, h1, strong')).find(el => {
                          const text = el.textContent || el.innerText || '';
                          return text.toLowerCase().includes('outras referências') || text.toLowerCase().includes('outras referencias');
                        });
                        
                        if (outrasHeading) {
                          let current = outrasHeading.nextSibling;
                          while (current) {
                            if (current.nodeName === 'UL' || current.nodeName === 'OL') {
                              const items = current.querySelectorAll('li');
                              items.forEach(li => {
                                const text = li.textContent || li.innerText || '';
                                if (text.trim()) {
                                  references.push({ text: text.trim(), category: 'outras' });
                                }
                              });
                            } else if (current.nodeName === 'P' && current.textContent && current.textContent.trim()) {
                              references.push({ text: current.textContent.trim(), category: 'outras' });
                            }
                            current = current.nextSibling;
                          }
                        }
                        
                        // Se encontrou referências categorizadas, salvar como JSON
                        if (references.length > 0) {
                          const jsonData = {
                            layout: 'categorizado',
                            references: references
                          };
                          setFormData(prev => ({ ...prev, referencias: JSON.stringify(jsonData) }));
                          return;
                        }
                      } catch (e) {
                        console.error('Erro ao converter HTML para JSON:', e);
                      }
                    }
                    
                    // Se não conseguir converter ou não for categorizado, salvar como HTML
                    setFormData(prev => ({ ...prev, referencias: content }));
                  }}
                />
                <p className="editor-note">
                  {formData.referencias_layout === 'categorizado' 
                    ? (t('categorizedEditorNote') || '💡 Dica: Use títulos "Leitura Obrigatória:", "Leitura Opcional/Complementar:" e "Outras Referências:" para manter a categorização. As referências podem ser em formato de lista ou parágrafos.')
                    : t('referencesNote')
                  }
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
                {t('competenciesLabel')}
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
              <label>{t('expectedFromStudentLabel')}</label>
              <TiptapEditor
                content={formData.o_que_e_esperado}
                onChange={(content) => setFormData(prev => ({ ...prev, o_que_e_esperado: content }))}
              />
              <p className="editor-note">
                {t('editorNote')}
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
            {isEditing ? t('update') : t('createSyllabus')}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/syllabi')}
          >
            {t('cancel')}
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
      {showCustomTabModal && (() => {
        // Obter lista de abas disponíveis para posicionamento (sem a custom)
        const availableTabs = [
          { id: 'cabecalho', label: t('header') },
          { id: 'sobre', label: t('aboutDiscipline') },
          { id: 'conteudo', label: t('content') },
          { id: 'metodologia', label: t('methodology') },
          { id: 'avaliacao', label: t('evaluation') },
          { id: 'compromisso_etico', label: t('ethics') },
          { id: 'professores', label: t('professors') },
          { id: 'contatos', label: t('contacts') }
        ];

        if (!isRestrictedCourse(formData.curso)) {
          availableTabs.push({ id: 'ods', label: t('ods') });
        }

        availableTabs.push(
          { id: 'referencias', label: t('references') },
          { id: 'competencias', label: t('competencies') }
        );

        if (!isRestrictedCourse(formData.curso)) {
          availableTabs.push({ id: 'o_que_e_esperado', label: t('expectedFromStudent') });
        }

        return (
          <div className="modal-overlay" onClick={() => setShowCustomTabModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{t('newCustomTab')}</h2>
              <p>{t('enterTabName')}</p>
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
              <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  {t('selectTabPosition') || 'Posição da aba:'}
                </label>
                <select
                  value={customTabPositionInput}
                  onChange={(e) => setCustomTabPositionInput(e.target.value)}
                  className="modal-input"
                  style={{ width: '100%', padding: '8px' }}
                >
                  {availableTabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {t('afterTab') || 'Após'} {tab.label}
                    </option>
                  ))}
                  <option value="end">{t('end') || 'No final'}</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn-confirm"
                  onClick={handleCreateCustomTab}
                  disabled={!customTabNameInput.trim()}
                >
                  {t('createTab')}
                </button>
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => {
                    setShowCustomTabModal(false);
                    setCustomTabNameInput('');
                    setCustomTabPositionInput('end');
                  }}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default SyllabusForm;

