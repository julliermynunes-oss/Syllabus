import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

// Componente para a tabela de competências no PDF
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
    return <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>{t('errorLoadingCompetencies')}</div>;
  }
};

// Componente separado para a visualização do PDF
function SyllabusPDFContent({ formData, professoresList }) {
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

  // Função para obter seções ordenadas
  const getOrderedSections = () => {
    const sections = [];

    // 1. Informações Gerais (sempre primeiro)
    sections.push({
      id: 'info_gerais',
      component: (
        <div key="info_gerais" style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
            {t('generalInformation')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', width: '100%' }}>
            {formData.disciplina && (
              <div>
                <strong>{t('discipline')}:</strong> {formData.disciplina}
              </div>
            )}
            {formData.curso && (
              <div>
                <strong>{t('course')}:</strong> {formData.curso}
              </div>
            )}
            {formData.semestre_ano && (
              <div>
                <strong>{t('semesterYear')}:</strong> {formData.semestre_ano}
              </div>
            )}
            {formData.linha && (
              <div>
                <strong>{t('line')}:</strong> {formData.linha}
              </div>
            )}
            {formData.turma && (
              <div>
                <strong>{t('class')}:</strong> {formData.turma}
              </div>
            )}
            {formData.departamento && (
              <div>
                <strong>{t('department')}:</strong> {formData.departamento}
              </div>
            )}
            {formData.num_creditos && (
              <div>
                <strong>{t('credits')}:</strong> {formData.num_creditos}
              </div>
            )}
            {formData.sem_curricular && (
              <div>
                <strong>{t('curricularSemester')}:</strong> {formData.sem_curricular}
              </div>
            )}
            {formData.coordenador && (
              <div>
                <strong>{t('disciplineLeader')}:</strong> {formData.coordenador}
              </div>
            )}
            {formData.idioma && (
              <div>
                <strong>{t('language')}:</strong> {formData.idioma}
              </div>
            )}
            {professoresList && professoresList.length > 0 && (
              <div>
                <strong>{t('professorsList')}:</strong> {professoresList.join(', ')}
              </div>
            )}
          </div>
        </div>
      )
    });

    // 2. Professores (sempre segundo)
    if (formData.professores_data && professoresList && professoresList.length > 0) {
      try {
        const professoresData = typeof formData.professores_data === 'string' 
          ? JSON.parse(formData.professores_data) 
          : formData.professores_data;
        
        const professoresComDados = professoresList.filter(prof => {
          const data = professoresData[prof];
          return data && (data.foto || data.descricao || data.linkedin || data.lattes || (data.outrosLinks && data.outrosLinks.length > 0));
        });

        if (professoresComDados.length > 0) {
          sections.push({
            id: 'professores',
            component: (
              <div key="professores" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
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
            )
          });
        }
      } catch (e) {
        // Ignorar erro
      }
    }

    // 3. Sobre a Disciplina
    if (formData.sobre_disciplina) {
      sections.push({
        id: 'sobre',
        component: (
          <div key="sobre" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('aboutDisciplineTitle')}
            </h3>
            <div 
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: formData.sobre_disciplina }}
            />
          </div>
        )
      });
    }

    // 4. Competências
    if (formData.competencias) {
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
      
      sections.push({
        id: 'competencias',
        component: (
          <div key="competencias" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
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
        )
      });
    }

    // 5. ODS (se não for curso restrito)
    if (formData.ods && !isRestrictedCourse(formData.curso)) {
      sections.push({
        id: 'ods',
        component: (
          <div key="ods" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('odsTitle')}
            </h3>
            <div 
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: formData.ods }}
            />
          </div>
        )
      });
    }

    // 6. Metodologia
    if (formData.metodologia) {
      sections.push({
        id: 'metodologia',
        component: (
          <div key="metodologia" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('methodologyTitle')}
            </h3>
            <div 
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: formData.metodologia }}
            />
          </div>
        )
      });
    }

    // 7. Avaliação
    if (formData.criterio_avaliacao) {
      const avaliacaoComponent = (() => {
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
                    <div style={{ marginTop: '8px' }} dangerouslySetInnerHTML={{ __html: parsed.observacoes }} />
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
                dangerouslySetInnerHTML={{ __html: formData.criterio_avaliacao }}
              />
            </div>
          );
        }
      })();

      sections.push({
        id: 'avaliacao',
        component: avaliacaoComponent
      });
    }

    // 8. Conteúdo
    if (formData.conteudo) {
      sections.push({
        id: 'conteudo',
        component: (
          <div key="conteudo" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('contentTitle')}
            </h3>
            <div 
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: formData.conteudo }}
            />
          </div>
        )
      });
    }

    // 9. O que é esperado do aluno (se não for curso restrito)
    if (formData.o_que_e_esperado && !isRestrictedCourse(formData.curso)) {
      sections.push({
        id: 'o_que_e_esperado',
        component: (
          <div key="o_que_e_esperado" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('expectedFromStudentTitle')}
            </h3>
            <div 
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: formData.o_que_e_esperado }}
            />
          </div>
        )
      });
    }

    // Inserir a aba personalizada na posição correta
    if (formData.custom_tab_name && formData.custom_tab_content) {
      const customSection = {
        id: 'custom',
        component: (
          <div key="custom" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {formData.custom_tab_name.toUpperCase()}
            </h3>
            <div 
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: formData.custom_tab_content }}
            />
          </div>
        )
      };

      const position = formData.custom_tab_position || 'end';
      
      if (position === 'end') {
        sections.push(customSection);
      } else {
        // Encontrar o índice da seção após a qual inserir
        const afterIndex = sections.findIndex(section => section.id === position);
        if (afterIndex !== -1) {
          sections.splice(afterIndex + 1, 0, customSection);
        } else {
          // Se não encontrar, adicionar no final
          sections.push(customSection);
        }
      }
    }

    // 10. Referências
    if (formData.referencias) {
      const renderReferences = () => {
        const layout = formData.referencias_layout || 'lista';
        
        if (layout === 'categorizado') {
          try {
            const parsed = JSON.parse(formData.referencias);
            if (parsed.references && Array.isArray(parsed.references)) {
              const obrigatorias = parsed.references.filter(ref => ref.category === 'obrigatoria');
              const opcionais = parsed.references.filter(ref => ref.category === 'opcional');
              const outras = parsed.references.filter(ref => ref.category === 'outras');
              
              return (
                <div>
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
          <div 
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: formData.referencias }}
          />
        );
      };

      sections.push({
        id: 'referencias',
        component: (
          <div key="referencias" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('referencesTitle')}
            </h3>
            {renderReferences()}
          </div>
        )
      });
    }

    // 11. Contatos (sempre por último)
    if (formData.contatos) {
      sections.push({
        id: 'contatos',
        component: (
          <div key="contatos" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('contactsTitle')}
            </h3>
            <div 
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: formData.contatos }}
            />
          </div>
        )
      });
    }

    return sections;
  };
  
  return (
    <div className="pdf-container" style={{ 
      padding: '10px 15px',
      paddingTop: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      backgroundColor: '#fff',
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Logo fixo que aparecerá em todas as páginas */}
      <div className="pdf-logo-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '25px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '2px 20px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center'
      }}>
        <img 
          src="/FGV LOGO NOVO.png" 
          alt="FGV Logo" 
          style={{ 
            maxHeight: '20px', 
            height: 'auto',
            width: 'auto'
          }} 
        />
      </div>

      {/* Renderizar seções na ordem correta */}
      {getOrderedSections().map(section => section.component)}
    </div>
  );
}

export default SyllabusPDFContent;
