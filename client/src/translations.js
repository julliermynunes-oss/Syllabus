// Traduções para a aplicação
export const translations = {
  pt: {
    // Header e navegação
    syllabus: 'Syllabus',
    logout: 'Sair',
    professor: 'Professor',
    addProfessor: '+Professor',
    back: 'Voltar',
    
    // Login
    login: 'Login',
    email: 'E-mail',
    password: 'Senha',
    enter: 'Entrar',
    register: 'Cadastrar',
    fullName: 'Nome Completo',
    confirmPassword: 'Confirmar Senha',
    
    // Lista de Syllabi
    notifications: 'Notificações',
    noNotifications: 'Nenhuma notificação pendente',
    newSyllabus: '+ Novo Syllabus',
    search: 'Buscar',
    searchByCourse: 'Digite o Curso',
    searchByDiscipline: 'Digite a Disciplina',
    searchByProfessor: 'Digite o Professor',
    filterMySyllabi: 'Meus Syllabi',
    manageCompetencies: 'Gerenciar Competências',
    view: 'Visualizar',
    edit: 'Editar',
    delete: 'Excluir',
    deleteConfirm: 'Tem certeza que deseja excluir este syllabus?',
    yes: 'Sim',
    no: 'Não',
    
    // Formulário
    createSyllabus: 'Criar Syllabus',
    editSyllabus: 'Editar Syllabus',
    update: 'Atualizar',
    cancel: 'Cancelar',
    exportPDF: 'Exportar PDF',
    
    // Tabs
    header: 'Cabeçalho',
    aboutDiscipline: 'Sobre a Disciplina',
    content: 'Conteúdo',
    methodology: 'Metodologia',
    evaluation: 'Avaliação',
    ethics: 'Ética',
    professors: 'Professores',
    contacts: 'Contatos',
    ods: 'ODS',
    references: 'Referências',
    competencies: 'Competências',
    expectedFromStudent: 'O que é esperado do aluno(a)',
    addCustomTab: '+ Nova Aba',
    
    // Campos do formulário
    course: 'Curso',
    discipline: 'Disciplina',
    line: 'Linha',
    semesterYear: 'Semestre/Ano',
    class: 'Turma',
    department: 'Departamento',
    selectDepartment: 'Selecione o Departamento',
    credits: 'Nº Créditos',
    curricularSemester: 'Semestre Curricular',
    selectCurricularSemester: 'Selecione o Semestre Curricular',
    language: 'Idioma',
    selectLanguage: 'Selecione o Idioma',
    selectSemesterYear: 'Selecione o Semestre/Ano',
    disciplineLeader: 'Líder de Disciplina',
    professorsList: 'Professores',
    addProfessorButton: 'Adicionar',
    typeProfessorName: 'Digite o nome do professor ...',
    
    // Campos de conteúdo
    description: 'Descrição da Disciplina:',
    programmaticContent: 'Conteúdo Programático:',
    teachingMethodology: 'Metodologia de Ensino:',
    evaluationCriteria: 'Critério de Avaliação:',
    ethicalCommitment: 'Compromisso Ético:',
    contactsLabel: 'Contatos:',
    odsLabel: 'Objetivos de Desenvolvimento Sustentável (ODS):',
    referencesLabel: 'Referências Bibliográficas',
    competenciesLabel: 'Competências da Disciplina',
    expectedFromStudentLabel: 'O que é esperado do aluno(a):',
    
    // Avaliação
    type: 'Tipo',
    criteria: 'Critério',
    weight: 'Peso',
    additionalObservations: 'Observações Adicionais:',
    addRow: 'Adicionar Linha',
    removeRow: 'Remover Linha',
    
    // Competências
    competence: 'Competência',
    descriptionField: 'Descrição',
    contributionDegree: 'Grau de Contribuição',
    introText: 'Os objetivos de aprendizagem da disciplina estão apresentados na tabela abaixo, demonstrando como os mesmos contribuem para os objetivos do [SIGLA_DO_CURSO].',
    
    // Referências
    searchReferences: 'Buscar e Adicionar Referências Bibliográficas',
    manualEditor: 'Editor de Referências (para edição manual):',
    searchCrossref: 'Buscar no Crossref',
    searchGoogleBooks: 'Buscar no Google Books',
    searchGoogleScholar: 'Buscar no Google Scholar',
    searchDataverse: 'Buscar no Dataverse',
    searchPlaceholder: 'Digite o título, autor ou palavra-chave...',
    addReference: 'Adicionar Referência',
    outdated: 'Antigo',
    
    // Professores Manager
    professorName: 'Nome do Professor',
    photo: 'Foto',
    descriptionFieldLabel: 'Descrição',
    linkedin: 'LinkedIn',
    otherLinks: 'Outros Links',
    addLink: 'Adicionar Link',
    linkLabel: 'Rótulo',
    linkUrl: 'URL',
    removeLink: 'Remover',
    
    // Notas do editor
    editorNote: '💡 Nota: Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas. Clique no botão "📊 Tabela" para inserir uma tabela.',
    referencesNote: '💡 Nota: Use a busca acima para adicionar referências automaticamente da API do Crossref, ou edite manualmente usando o editor rich text.',
    
    // Modal
    newCustomTab: 'Nova Aba Personalizada',
    enterTabName: 'Digite o nome da nova aba:',
    createTab: 'Criar Aba',
    deleteTabConfirm: 'Tem certeza que deseja excluir a aba "{name}"? Todo o conteúdo será perdido.',
    
    // PDF/Preview
    generalInformation: 'INFORMAÇÕES GERAIS',
    aboutDisciplineTitle: 'SOBRE A DISCIPLINA',
    contentTitle: 'CONTEÚDO',
    methodologyTitle: 'METODOLOGIA',
    evaluationCriteriaTitle: 'CRITÉRIO DE AVALIAÇÃO',
    ethicalCommitmentTitle: 'COMPROMISSO ÉTICO',
    professorsTitle: 'PROFESSORES',
    contactsTitle: 'CONTATOS',
    odsTitle: 'OBJETIVOS DE DESENVOLVIMENTO SUSTENTÁVEL (ODS)',
    competenciesTitle: 'COMPETÊNCIAS DA DISCIPLINA',
    referencesTitle: 'REFERÊNCIAS BIBLIOGRÁFICAS',
    noCompetencies: 'Nenhuma competência cadastrada.',
    errorLoadingCompetencies: 'Erro ao carregar competências.',
    
    // Competências Manager
    manageCompetenciesTitle: 'Gerenciar Competências',
    courseCode: 'Código do Curso',
    selectCourse: 'Selecione o Curso',
    save: 'Salvar',
    
    // Mensagens
    errorSaving: 'Erro ao salvar syllabus',
    errorLoading: 'Erro ao carregar',
    success: 'Sucesso',
    error: 'Erro',
  },
  en: {
    // Header e navegação
    syllabus: 'Syllabus',
    logout: 'Logout',
    professor: 'Professor',
    addProfessor: '+Professor',
    back: 'Back',
    
    // Login
    login: 'Login',
    email: 'E-mail',
    password: 'Password',
    enter: 'Enter',
    register: 'Register',
    fullName: 'Full Name',
    confirmPassword: 'Confirm Password',
    
    // Lista de Syllabi
    notifications: 'Notifications',
    noNotifications: 'No pending notifications',
    newSyllabus: '+ New Syllabus',
    search: 'Search',
    searchByCourse: 'Type the Course',
    searchByDiscipline: 'Type the Discipline',
    searchByProfessor: 'Type the Professor',
    filterMySyllabi: 'My Syllabi',
    manageCompetencies: 'Manage Competencies',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this syllabus?',
    yes: 'Yes',
    no: 'No',
    
    // Formulário
    createSyllabus: 'Create Syllabus',
    editSyllabus: 'Edit Syllabus',
    update: 'Update',
    cancel: 'Cancel',
    exportPDF: 'Export PDF',
    
    // Tabs
    header: 'Header',
    aboutDiscipline: 'About the Discipline',
    content: 'Content',
    methodology: 'Methodology',
    evaluation: 'Evaluation',
    ethics: 'Ethics',
    professors: 'Professors',
    contacts: 'Contacts',
    ods: 'ODS',
    references: 'References',
    competencies: 'Competencies',
    expectedFromStudent: 'What is expected from the student',
    addCustomTab: '+ New Tab',
    
    // Campos do formulário
    course: 'Course',
    discipline: 'Discipline',
    line: 'Line',
    semesterYear: 'Semester/Year',
    class: 'Class',
    department: 'Department',
    selectDepartment: 'Select the Department',
    credits: 'Credits',
    curricularSemester: 'Curricular Semester',
    selectCurricularSemester: 'Select the Curricular Semester',
    language: 'Language',
    selectLanguage: 'Select the Language',
    selectSemesterYear: 'Select the Semester/Year',
    disciplineLeader: 'Discipline Leader',
    professorsList: 'Professors',
    addProfessorButton: 'Add',
    typeProfessorName: 'Type the professor name ...',
    
    // Campos de conteúdo
    description: 'Discipline Description:',
    programmaticContent: 'Programmatic Content:',
    teachingMethodology: 'Teaching Methodology:',
    evaluationCriteria: 'Evaluation Criteria:',
    ethicalCommitment: 'Ethical Commitment:',
    contactsLabel: 'Contacts:',
    odsLabel: 'Sustainable Development Goals (SDGs):',
    referencesLabel: 'Bibliographic References',
    competenciesLabel: 'Discipline Competencies',
    expectedFromStudentLabel: 'What is expected from the student:',
    
    // Avaliação
    type: 'Type',
    criteria: 'Criteria',
    weight: 'Weight',
    additionalObservations: 'Additional Observations:',
    addRow: 'Add Row',
    removeRow: 'Remove Row',
    
    // Competências
    competence: 'Competence',
    descriptionField: 'Description',
    contributionDegree: 'Degree of Contribution',
    introText: 'The learning objectives of the discipline are presented in the table below, demonstrating how they contribute to the objectives of [COURSE_CODE].',
    
    // Referências
    searchReferences: 'Search and Add Bibliographic References',
    manualEditor: 'References Editor (for manual editing):',
    searchCrossref: 'Search in Crossref',
    searchGoogleBooks: 'Search in Google Books',
    searchGoogleScholar: 'Search in Google Scholar',
    searchDataverse: 'Search in Dataverse',
    searchPlaceholder: 'Type the title, author or keyword...',
    addReference: 'Add Reference',
    outdated: 'Old',
    
    // Professores Manager
    professorName: 'Professor Name',
    photo: 'Photo',
    descriptionFieldLabel: 'Description',
    linkedin: 'LinkedIn',
    otherLinks: 'Other Links',
    addLink: 'Add Link',
    linkLabel: 'Label',
    linkUrl: 'URL',
    removeLink: 'Remove',
    
    // Notas do editor
    editorNote: '💡 Note: Use the toolbar to format text, create lists and insert tables. Click the "📊 Table" button to insert a table.',
    referencesNote: '💡 Note: Use the search above to automatically add references from the Crossref API, or edit manually using the rich text editor.',
    
    // Modal
    newCustomTab: 'New Custom Tab',
    enterTabName: 'Type the name of the new tab:',
    createTab: 'Create Tab',
    deleteTabConfirm: 'Are you sure you want to delete the tab "{name}"? All content will be lost.',
    
    // PDF/Preview
    generalInformation: 'GENERAL INFORMATION',
    aboutDisciplineTitle: 'ABOUT THE DISCIPLINE',
    contentTitle: 'CONTENT',
    methodologyTitle: 'METHODOLOGY',
    evaluationCriteriaTitle: 'EVALUATION CRITERIA',
    ethicalCommitmentTitle: 'ETHICAL COMMITMENT',
    professorsTitle: 'PROFESSORS',
    contactsTitle: 'CONTACTS',
    odsTitle: 'SUSTAINABLE DEVELOPMENT GOALS (SDGs)',
    competenciesTitle: 'DISCIPLINE COMPETENCIES',
    referencesTitle: 'BIBLIOGRAPHIC REFERENCES',
    noCompetencies: 'No competencies registered.',
    errorLoadingCompetencies: 'Error loading competencies.',
    
    // Competências Manager
    manageCompetenciesTitle: 'Manage Competencies',
    courseCode: 'Course Code',
    selectCourse: 'Select the Course',
    save: 'Save',
    
    // Mensagens
    errorSaving: 'Error saving syllabus',
    errorLoading: 'Error loading',
    success: 'Success',
    error: 'Error',
  },
  es: {
    // Header e navegação
    syllabus: 'Syllabus',
    logout: 'Salir',
    professor: 'Profesor',
    addProfessor: '+Profesor',
    back: 'Volver',
    
    // Login
    login: 'Iniciar Sesión',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    enter: 'Entrar',
    register: 'Registrarse',
    fullName: 'Nombre Completo',
    confirmPassword: 'Confirmar Contraseña',
    
    // Lista de Syllabi
    notifications: 'Notificaciones',
    noNotifications: 'No hay notificaciones pendientes',
    newSyllabus: '+ Nuevo Syllabus',
    search: 'Buscar',
    searchByCourse: 'Escriba el Curso',
    searchByDiscipline: 'Escriba la Disciplina',
    searchByProfessor: 'Escriba el Profesor',
    filterMySyllabi: 'Mis Syllabi',
    manageCompetencies: 'Gestionar Competencias',
    view: 'Ver',
    edit: 'Editar',
    delete: 'Eliminar',
    deleteConfirm: '¿Está seguro de que desea eliminar este syllabus?',
    yes: 'Sí',
    no: 'No',
    
    // Formulário
    createSyllabus: 'Crear Syllabus',
    editSyllabus: 'Editar Syllabus',
    update: 'Actualizar',
    cancel: 'Cancelar',
    exportPDF: 'Exportar PDF',
    
    // Tabs
    header: 'Encabezado',
    aboutDiscipline: 'Sobre la Disciplina',
    content: 'Contenido',
    methodology: 'Metodología',
    evaluation: 'Evaluación',
    ethics: 'Ética',
    professors: 'Profesores',
    contacts: 'Contactos',
    ods: 'ODS',
    references: 'Referencias',
    competencies: 'Competencias',
    expectedFromStudent: 'Lo que se espera del estudiante',
    addCustomTab: '+ Nueva Pestaña',
    
    // Campos do formulário
    course: 'Curso',
    discipline: 'Disciplina',
    line: 'Línea',
    semesterYear: 'Semestre/Año',
    class: 'Clase',
    department: 'Departamento',
    selectDepartment: 'Seleccione el Departamento',
    credits: 'Créditos',
    curricularSemester: 'Semestre Curricular',
    selectCurricularSemester: 'Seleccione el Semestre Curricular',
    language: 'Idioma',
    selectLanguage: 'Seleccione el Idioma',
    selectSemesterYear: 'Seleccione el Semestre/Año',
    disciplineLeader: 'Líder de Disciplina',
    professorsList: 'Profesores',
    addProfessorButton: 'Agregar',
    typeProfessorName: 'Escriba el nombre del profesor ...',
    
    // Campos de contenido
    description: 'Descripción de la Disciplina:',
    programmaticContent: 'Contenido Programático:',
    teachingMethodology: 'Metodología de Enseñanza:',
    evaluationCriteria: 'Criterio de Evaluación:',
    ethicalCommitment: 'Compromiso Ético:',
    contactsLabel: 'Contactos:',
    odsLabel: 'Objetivos de Desarrollo Sostenible (ODS):',
    referencesLabel: 'Referencias Bibliográficas',
    competenciesLabel: 'Competencias de la Disciplina',
    expectedFromStudentLabel: 'Lo que se espera del estudiante:',
    
    // Avaliação
    type: 'Tipo',
    criteria: 'Criterio',
    weight: 'Peso',
    additionalObservations: 'Observaciones Adicionales:',
    addRow: 'Agregar Fila',
    removeRow: 'Eliminar Fila',
    
    // Competências
    competence: 'Competencia',
    descriptionField: 'Descripción',
    contributionDegree: 'Grado de Contribución',
    introText: 'Los objetivos de aprendizaje de la disciplina se presentan en la tabla a continuación, demostrando cómo contribuyen a los objetivos del [SIGLA_DEL_CURSO].',
    
    // Referências
    searchReferences: 'Buscar y Agregar Referencias Bibliográficas',
    manualEditor: 'Editor de Referencias (para edición manual):',
    searchCrossref: 'Buscar en Crossref',
    searchGoogleBooks: 'Buscar en Google Books',
    searchGoogleScholar: 'Buscar en Google Scholar',
    searchDataverse: 'Buscar en Dataverse',
    searchPlaceholder: 'Escriba el título, autor o palabra clave...',
    addReference: 'Agregar Referencia',
    outdated: 'Antiguo',
    
    // Professores Manager
    professorName: 'Nombre del Profesor',
    photo: 'Foto',
    descriptionFieldLabel: 'Descripción',
    linkedin: 'LinkedIn',
    otherLinks: 'Otros Enlaces',
    addLink: 'Agregar Enlace',
    linkLabel: 'Etiqueta',
    linkUrl: 'URL',
    removeLink: 'Eliminar',
    
    // Notas do editor
    editorNote: '💡 Nota: Use la barra de herramientas para formatear texto, crear listas e insertar tablas. Haga clic en el botón "📊 Tabla" para insertar una tabla.',
    referencesNote: '💡 Nota: Use la búsqueda anterior para agregar referencias automáticamente de la API de Crossref, o edite manualmente usando el editor de texto enriquecido.',
    
    // Modal
    newCustomTab: 'Nueva Pestaña Personalizada',
    enterTabName: 'Escriba el nombre de la nueva pestaña:',
    createTab: 'Crear Pestaña',
    deleteTabConfirm: '¿Está seguro de que desea eliminar la pestaña "{name}"? Todo el contenido se perderá.',
    
    // PDF/Preview
    generalInformation: 'INFORMACIÓN GENERAL',
    aboutDisciplineTitle: 'SOBRE LA DISCIPLINA',
    contentTitle: 'CONTENIDO',
    methodologyTitle: 'METODOLOGÍA',
    evaluationCriteriaTitle: 'CRITERIO DE EVALUACIÓN',
    ethicalCommitmentTitle: 'COMPROMISO ÉTICO',
    professorsTitle: 'PROFESORES',
    contactsTitle: 'CONTACTOS',
    odsTitle: 'OBJETIVOS DE DESARROLLO SOSTENIBLE (ODS)',
    competenciesTitle: 'COMPETENCIAS DE LA DISCIPLINA',
    referencesTitle: 'REFERENCIAS BIBLIOGRÁFICAS',
    noCompetencies: 'Ninguna competencia registrada.',
    errorLoadingCompetencies: 'Error al cargar competencias.',
    
    // Competências Manager
    manageCompetenciesTitle: 'Gestionar Competencias',
    courseCode: 'Código del Curso',
    selectCourse: 'Seleccione el Curso',
    save: 'Guardar',
    
    // Mensagens
    errorSaving: 'Error al guardar syllabus',
    errorLoading: 'Error al cargar',
    success: 'Éxito',
    error: 'Error',
  },
};

