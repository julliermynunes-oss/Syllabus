import React, { useState, useEffect } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { API_URL } from '../config';
import './ProfessorModal.css';

const ProfessorModal = ({ isOpen, onClose, onAddProfessor }) => {
  const [curso, setCurso] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [semestreAno, setSemestreAno] = useState('');
  const [turmaNome, setTurmaNome] = useState('');
  const [currentProfessor, setCurrentProfessor] = useState('');
  const [professoresList, setProfessoresList] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [allProfessores, setAllProfessores] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState([]);
  const [filteredProfessores, setFilteredProfessores] = useState([]);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showDisciplineDropdown, setShowDisciplineDropdown] = useState(false);
  const [showProfessoresDropdown, setShowProfessoresDropdown] = useState(false);

  // Gera opções de Semestre/Ano (formato numérico: 1/2026, 2/2026)
  const gerarOpcoesSemestreAno = () => {
    const opcoes = [];
    const anos = [];
    for (let ano = 2026; ano <= 2036; ano++) {
      anos.push(ano);
    }
    anos.forEach(ano => {
      opcoes.push(`1/${ano}`);
      opcoes.push(`2/${ano}`);
    });
    return opcoes;
  };

  const opcoesSemestreAno = gerarOpcoesSemestreAno();

  useEffect(() => {
    // Fetch programs
    const fetchPrograms = async () => {
      try {
        const response = await fetch(`${API_URL}/api/programs`);
        const data = await response.json();
        setPrograms(data);
        setFilteredPrograms(data);
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };

    // Fetch disciplines
    const fetchDisciplines = async () => {
      try {
        const response = await fetch(`${API_URL}/api/disciplines`);
        const data = await response.json();
        setDisciplines(data);
        setFilteredDisciplines(data);
      } catch (err) {
        console.error('Error fetching disciplines:', err);
      }
    };

    // Fetch all professores (without department filter)
    const fetchAllProfessores = async () => {
      try {
        const response = await fetch(`${API_URL}/api/professores`);
        const data = await response.json();
        // Data comes as object with departments as keys, flatten to array of all professors
        const allProfs = [];
        Object.keys(data).forEach(dept => {
          if (Array.isArray(data[dept])) {
            allProfs.push(...data[dept].map(p => p.nome || p));
          }
        });
        // Remove duplicates and sort
        const uniqueProfs = [...new Set(allProfs)].sort();
        setAllProfessores(uniqueProfs);
        setFilteredProfessores(uniqueProfs);
      } catch (err) {
        console.error('Error fetching professores:', err);
      }
    };

    fetchPrograms();
    fetchDisciplines();
    fetchAllProfessores();
  }, []);

  // Filter programs based on input
  const handleCursoChange = (e) => {
    const value = e.target.value;
    setCurso(value);
    
    if (value.trim()) {
      const filtered = programs.filter(p => 
        p.nome.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredPrograms(filtered);
      setShowProgramDropdown(true);
    } else {
      setFilteredPrograms(programs);
      setShowProgramDropdown(false);
    }
  };

  // Filter disciplines based on selected program
  const handleDisciplinaChange = (e) => {
    const value = e.target.value;
    setDisciplina(value);
    
    if (value.trim()) {
      // First get the selected program
      const selectedProgram = programs.find(p => p.nome === curso);
      const programDisciplines = selectedProgram 
        ? disciplines.filter(d => d.programa_id === selectedProgram.id)
        : disciplines;
      
      const filtered = programDisciplines.filter(d => 
        d.nome.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDisciplines(filtered);
      setShowDisciplineDropdown(true);
    } else {
      // If no program selected, show all; otherwise filter by program
      const selectedProgram = programs.find(p => p.nome === curso);
      const programDisciplines = selectedProgram 
        ? disciplines.filter(d => d.programa_id === selectedProgram.id)
        : disciplines;
      setFilteredDisciplines(programDisciplines);
      setShowDisciplineDropdown(false);
    }
  };

  // Select program
  const selectProgram = (program) => {
    setCurso(program.nome);
    setShowProgramDropdown(false);
    setDisciplina(''); // Clear discipline when program changes
    // Filter disciplines for selected program
    const programDisciplines = disciplines.filter(d => d.programa_id === program.id);
    setFilteredDisciplines(programDisciplines);
  };

  // Select discipline
  const selectDiscipline = (discipline) => {
    setDisciplina(discipline.nome);
    setShowDisciplineDropdown(false);
  };

  // Handle professor input change with autocomplete
  const handleProfessorInputChange = (e) => {
    const value = e.target.value;
    setCurrentProfessor(value);
    
    if (value.trim()) {
      const filtered = allProfessores.filter(p => 
        p.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProfessores(filtered);
      setShowProfessoresDropdown(value.length > 0 && filtered.length > 0);
    } else {
      setFilteredProfessores(allProfessores);
      setShowProfessoresDropdown(false);
    }
  };

  // Select professor from autocomplete
  const selectProfessor = (professor) => {
    setCurrentProfessor(professor);
    setShowProfessoresDropdown(false);
  };

  if (!isOpen) return null;

  const addProfessor = () => {
    if (currentProfessor.trim()) {
      // Check if professor is already in the list
      if (!professoresList.includes(currentProfessor.trim())) {
        setProfessoresList([...professoresList, currentProfessor.trim()]);
      }
      setCurrentProfessor('');
      setShowProfessoresDropdown(false);
    }
  };

  const removeProfessor = (index) => {
    setProfessoresList(professoresList.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (professoresList.length === 0) {
      window.alert('Adicione pelo menos um professor');
      return;
    }

    // Adiciona cada professor individualmente
    professoresList.forEach(prof => {
      onAddProfessor({
        curso: curso,
        disciplina: disciplina,
        turma_semestral: semestreAno,
        turma_nome: turmaNome,
        professores: prof
      });
    });

    // Reset form
    setCurso('');
    setDisciplina('');
    setSemestreAno('');
    setTurmaNome('');
    setProfessoresList([]);
    setCurrentProfessor('');
    onClose();
  };

  const handleCancel = () => {
    setCurso('');
    setDisciplina('');
    setSemestreAno('');
    setTurmaNome('');
    setProfessoresList([]);
    setCurrentProfessor('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adicionar Professor</h2>
          <button type="button" className="close-btn" onClick={handleCancel}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="professor-modal-form">
          <div className="form-row">
            <div className="form-field">
              <label>Curso:</label>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  value={curso}
                  onChange={handleCursoChange}
                  onFocus={() => curso && setShowProgramDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
                  className="modal-input"
                  placeholder="Digite o curso ..."
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
                  value={disciplina}
                  onChange={handleDisciplinaChange}
                  onFocus={() => disciplina && setShowDisciplineDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDisciplineDropdown(false), 200)}
                  className="modal-input"
                  placeholder="Digite a disciplina ..."
                  disabled={!curso}
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
            <label>Semestre/Ano:</label>
            <select
              value={semestreAno}
              onChange={(e) => setSemestreAno(e.target.value)}
              className="modal-input"
            >
              <option value="">Selecione o Semestre/Ano</option>
              {opcoesSemestreAno.map((opcao, index) => (
                <option key={index} value={opcao}>{opcao}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Turma Número/Nome:</label>
            <input
              type="text"
              value={turmaNome}
              onChange={(e) => setTurmaNome(e.target.value)}
              placeholder="Ex: Turma A"
              className="modal-input"
            />
          </div>
        </div>

        <div className="form-field full-width">
          <label>Nome do Professor:</label>
          <div className="professor-input-row">
            <div className="autocomplete-wrapper" style={{ flex: 1 }}>
              <input
                type="text"
                value={currentProfessor}
                onChange={handleProfessorInputChange}
                onFocus={() => currentProfessor && setShowProfessoresDropdown(true)}
                onBlur={() => setTimeout(() => setShowProfessoresDropdown(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (showProfessoresDropdown && filteredProfessores.length > 0) {
                      selectProfessor(filteredProfessores[0]);
                    } else {
                      addProfessor();
                    }
                  }
                }}
                placeholder="Digite o nome do professor ..."
                className="professor-input-field"
              />
              {showProfessoresDropdown && filteredProfessores.length > 0 && (
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
            <button type="button" className="add-professor-btn" onClick={addProfessor}>
              <FaPlus /> Adicionar
            </button>
          </div>
          {professoresList.length > 0 && (
            <div className="professores-list">
              {professoresList.map((prof, index) => (
                <div key={index} className="professor-item">
                  <span>{prof}</span>
                  <button type="button" className="remove-professor-btn" onClick={() => removeProfessor(index)}>
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="submit" className="submit-btn">Salvar Professores</button>
          <button type="button" className="cancel-btn" onClick={handleCancel}>Cancelar</button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default ProfessorModal;
