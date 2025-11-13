import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

// Componente para a tabela de competências no PDF
const CompetenciesTablePDF = ({ data, curso }) => {
  const { t } = useTranslation();
  
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
    // Extrair sigla do padrão: "CGA - Curso de Graduação em Administração" -> "CGA"
    const match = cursoNome.match(/^([A-Z]+(?:\s+[A-Z]+)?)/);
    if (match) {
      return match[1].replace(/\s+/g, '');
    }
    return cursoNome.trim();
  };
  
  if (!data || data === '' || data === '[]') {
    return <div style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>{t('noCompetencies')}</div>;
  }
  
  try {
    const parsed = JSON.parse(data);
    
    // O formato é { rows: [...], outrosObjetivos: '...' }
    const rows = parsed.rows || parsed;
    const outrosObjetivos = parsed.outrosObjetivos || '';
    
    if (!rows || rows.length === 0) {
      return <div style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>{t('noCompetencies')}</div>;
    }
    
    return (
      <>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#235795', color: '#fff' }}>
              <th style={{ padding: '7px 9px', textAlign: 'left', border: '1px solid #235795', fontSize: '13px' }}>
                {curso ? `Competências ${getCursoSigla(curso)}` : 'Competências'}
              </th>
              <th style={{ padding: '7px 9px', textAlign: 'left', border: '1px solid #235795', fontSize: '13px' }}>Objetivos da Disciplina</th>
              <th style={{ padding: '7px 9px', textAlign: 'center', border: '1px solid #235795', fontSize: '13px', width: '130px' }}>Grau de Contribuição</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td style={{ padding: '6px 9px', border: '1px solid #ddd', fontSize: '13px' }}>{row.competencia || '-'}</td>
                <td style={{ padding: '6px 9px', border: '1px solid #ddd', fontSize: '13px' }}>{row.descricao || '-'}</td>
                <td style={{ padding: '6px 9px', border: '1px solid #ddd', textAlign: 'center', fontSize: '13px' }}>
                  {'●'.repeat(row.grau || 0)}{'○'.repeat(3 - (row.grau || 0))}
                </td>
              </tr>
            ))}
            {/* Campo Outros Objetivos da Disciplina */}
            {curso && (
              <tr>
                <td style={{ padding: '6px 9px', border: '1px solid #ddd', fontSize: '13px', fontWeight: 'bold' }}>Outros Objetivos da Disciplina</td>
                <td style={{ padding: '6px 9px', border: '1px solid #ddd', fontSize: '13px' }}>{outrosObjetivos || '-'}</td>
                <td style={{ padding: '6px 9px', border: '1px solid #ddd', textAlign: 'center', fontSize: '13px', color: '#999' }}>-</td>
              </tr>
            )}
          </tbody>
        </table>
      </>
    );
  } catch (e) {
    console.error('Erro ao renderizar competências:', e, 'Data:', data);
    return <div style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>{t('errorLoadingCompetencies')}</div>;
  }
};

// Componente separado para a visualização do PDF
function SyllabusPDFContent({ formData, professoresList }) {
  const { t } = useTranslation();
  
  // Função auxiliar para verificar se o HTML contém tabelas ou imagens
  const hasTablesOrImages = (html) => {
    if (!html) return false;
    // Criar um elemento temporário para verificar
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const hasTable = tempDiv.querySelector('table') !== null;
    const hasImage = tempDiv.querySelector('img') !== null;
    return hasTable || hasImage;
  };
  
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

    // 1. Informações Gerais (sempre primeiro) - tabela transparente
    const infoRows = [];
    if (formData.disciplina) infoRows.push({ label: t('discipline'), value: formData.disciplina });
    if (formData.curso) infoRows.push({ label: t('course'), value: formData.curso });
    if (formData.semestre_ano) infoRows.push({ label: t('period'), value: formData.semestre_ano });
    if (formData.linha) infoRows.push({ label: t('line'), value: formData.linha });
    if (formData.turma) infoRows.push({ label: t('class'), value: formData.turma });
    if (formData.departamento) infoRows.push({ label: t('department'), value: formData.departamento });
    if (formData.num_creditos) infoRows.push({ label: t('credits'), value: formData.num_creditos });
    if (formData.sem_curricular) infoRows.push({ label: t('semester'), value: formData.sem_curricular });
    if (formData.coordenador) infoRows.push({ label: t('disciplineLeader'), value: formData.coordenador });
    if (professoresList && professoresList.length > 0) {
      infoRows.push({ label: t('professorsList'), value: professoresList.join(', ') });
    }
    
    sections.push({
      id: 'info_gerais',
      component: (
        <div key="info_gerais" style={{ margin: '0', marginBottom: '0', marginTop: '0', padding: '0', fontSize: '12px', lineHeight: '1.6' }}>
          {infoRows.map((row, index) => (
            <div key={index} style={{ 
              display: 'flex',
              marginBottom: '4px',
              margin: '0',
              padding: '0',
              border: 'none',
              backgroundColor: 'transparent'
            }}>
              <div style={{ 
                fontWeight: 'bold',
                marginRight: '8px',
                width: '120px',
                flexShrink: 0,
                padding: '0',
                margin: '0',
                border: 'none',
                backgroundColor: 'transparent'
              }}>
                {row.label}:
              </div>
              <div style={{ 
                flex: 1,
                padding: '0',
                margin: '0',
                border: 'none',
                backgroundColor: 'transparent'
              }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
      )
    });

    // 2. Professores (sempre segundo) - sem espaçamento extra
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
              <div key="professores" className="professores-section" style={{ marginBottom: '18px', marginTop: '0', paddingTop: '0' }}>
                <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
                  {t('professorsTitle')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                  {professoresComDados.map((professorNome) => {
                    const profData = professoresData[professorNome] || {};
                    return (
                      <div key={professorNome} style={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: '8px', 
                        padding: '15px',
                        background: '#fff',
                        pageBreakInside: 'auto',
                        breakInside: 'auto',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        overflow: 'visible'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', pageBreakInside: 'auto' }}>
                          {profData.foto && (
                            <img 
                              src={profData.foto} 
                              alt={professorNome}
                              style={{ 
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '2px solid #235795',
                                flexShrink: 0
                              }}
                            />
                          )}
                          <h4 style={{ margin: 0, color: '#235795', fontSize: '17px', fontWeight: 'bold', pageBreakAfter: 'auto' }}>{professorNome}</h4>
                        </div>
                        {profData.descricao && (
                          <div 
                            style={{ 
                              fontSize: '14px', 
                              lineHeight: '1.5', 
                              marginBottom: '10px', 
                              color: '#333',
                              pageBreakInside: 'auto',
                              orphans: 3,
                              widows: 3,
                              width: '100%',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word'
                            }}
                            dangerouslySetInnerHTML={{ __html: profData.descricao }}
                          />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
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
      const hasTableOrImg = hasTablesOrImages(formData.sobre_disciplina);
      sections.push({
        id: 'sobre',
        component: (
          <div key="sobre" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('aboutDisciplineTitle')}
            </h3>
            <div 
              style={{ fontSize: '15px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: formData.sobre_disciplina }}
            />
          </div>
        )
      });
    }

    // 4. Compromisso Ético (se existir) - após Sobre a Disciplina, antes de Competências
    if (formData.compromisso_etico) {
      sections.push({
        id: 'compromisso_etico',
        component: (
          <div key="compromisso_etico" className="compromisso-etico-section" style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('ethicalCommitmentTitle')}
            </h3>
            <div 
              style={{ fontSize: '15px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: formData.compromisso_etico }}
            />
          </div>
        )
      });
    }

    // 5. Competências
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
          <div key="competencias" style={{ marginBottom: '18px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('competenciesTitle')}
            </h3>
            {formData.curso && (
              <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#f8f9fa', borderLeft: '4px solid #235795', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#000', lineHeight: '1.3' }}>
                  Os objetivos de aprendizagem da disciplina estão apresentados na tabela abaixo, 
                  demonstrando como contribuem para a aquisição das competências esperadas para os egressos do {getCursoSigla(formData.curso)}.
                </p>
              </div>
            )}
            <CompetenciesTablePDF data={formData.competencias} curso={formData.curso} />
            {formData.curso && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f8f9fa', borderLeft: '4px solid #235795', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#000', lineHeight: '1.3' }}>
                  Mais informações sobre as competências esperadas para os egressos do {getCursoSigla(formData.curso)} podem ser encontradas aqui.
                </p>
              </div>
            )}
          </div>
        )
      });
    }

    // 5. ODS (se não for curso restrito)
    if (formData.ods && !isRestrictedCourse(formData.curso)) {
      const hasTableOrImg = hasTablesOrImages(formData.ods);
      sections.push({
        id: 'ods',
        component: (
          <div key="ods" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('odsTitle')}
            </h3>
            <div 
              style={{ fontSize: '15px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: formData.ods }}
            />
          </div>
        )
      });
    }

    // 6. Conteúdo
    if (formData.conteudo) {
      const hasTableOrImg = hasTablesOrImages(formData.conteudo);
      sections.push({
        id: 'conteudo',
        component: (
          <div key="conteudo" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('contentTitle')}
            </h3>
            <div 
              style={{ fontSize: '15px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: formData.conteudo }}
            />
          </div>
        )
      });
    }

    // 7. Metodologia
    if (formData.metodologia) {
      const hasTableOrImg = hasTablesOrImages(formData.metodologia);
      sections.push({
        id: 'metodologia',
        component: (
          <div key="metodologia" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('methodologyTitle')}
            </h3>
            <div 
              style={{ fontSize: '15px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: formData.metodologia }}
            />
          </div>
        )
      });
    }

    // 8. Avaliação
    if (formData.criterio_avaliacao) {
      const avaliacaoComponent = (() => {
        try {
          const parsed = typeof formData.criterio_avaliacao === 'string' 
            ? JSON.parse(formData.criterio_avaliacao) 
            : formData.criterio_avaliacao;
          
          if (parsed && parsed.rows && parsed.rows.length > 0) {
            return (
              <div style={{ marginBottom: '18px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
                  {t('evaluationCriteriaTitle')}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#235795', color: 'white' }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #1a4270' }}>{t('type')}</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #1a4270' }}>{t('criteria')}</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #1a4270' }}>{t('weight')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          {row.tipo || '-'}
                        </td>
                        <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          {row.criterio || '-'}
                        </td>
                        <td style={{ padding: '3px 6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          {row.peso || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.observacoes && parsed.observacoes.trim() !== '' && (
                  <div style={{ marginTop: '8px', padding: '6px 8px', background: 'transparent', borderRadius: '0', fontSize: '11px', lineHeight: '1.3' }}>
                    <strong>{t('additionalObservations')}</strong>
                    <div style={{ marginTop: '4px' }} dangerouslySetInnerHTML={{ __html: parsed.observacoes }} />
                  </div>
                )}
              </div>
            );
          }
          // Fallback para formato antigo (rich text)
          const hasTableOrImg = hasTablesOrImages(formData.criterio_avaliacao);
          return (
            <div style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
              <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
                {t('evaluationCriteriaTitle')}
              </h3>
              <div 
                style={{ fontSize: '15px', lineHeight: '1.5' }}
                dangerouslySetInnerHTML={{ __html: formData.criterio_avaliacao }}
              />
            </div>
          );
        } catch (e) {
          // Se não for JSON, tratar como rich text antigo
          const hasTableOrImg = hasTablesOrImages(formData.criterio_avaliacao);
          return (
            <div style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
              <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
                {t('evaluationCriteriaTitle')}
              </h3>
              <div 
                style={{ fontSize: '15px', lineHeight: '1.5' }}
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

    // 8. O que é esperado do aluno (se não for curso restrito)
    if (formData.o_que_e_esperado && !isRestrictedCourse(formData.curso)) {
      const hasTableOrImg = hasTablesOrImages(formData.o_que_e_esperado);
      sections.push({
        id: 'o_que_e_esperado',
        component: (
          <div key="o_que_e_esperado" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('expectedFromStudentTitle')}
            </h3>
            <div 
              style={{ fontSize: '15px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: formData.o_que_e_esperado }}
            />
          </div>
        )
      });
    }

    // Inserir a aba personalizada na posição correta
    if (formData.custom_tab_name && formData.custom_tab_content) {
      const hasTableOrImg = hasTablesOrImages(formData.custom_tab_content);
      const customSection = {
        id: 'custom',
        component: (
          <div key="custom" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {formData.custom_tab_name.toUpperCase()}
            </h3>
            <div 
              style={{ fontSize: '15px', lineHeight: '1.5' }}
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
                    <div style={{ marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '17px', color: '#235795', fontWeight: 'bold', marginBottom: '10px', marginTop: '15px' }}>
                        {t('requiredReading') || 'Leitura Obrigatória:'}
                      </h4>
                      <ul style={{ marginLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                        {obrigatorias.map((ref, idx) => (
                          <li key={idx} style={{ marginBottom: '10px' }}>{ref.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {opcionais.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '17px', color: '#235795', fontWeight: 'bold', marginBottom: '10px', marginTop: '15px' }}>
                        {t('optionalReading') || 'Leitura Opcional/Complementar:'}
                      </h4>
                      <ul style={{ marginLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                        {opcionais.map((ref, idx) => (
                          <li key={idx} style={{ marginBottom: '10px' }}>{ref.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {outras.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '17px', color: '#235795', fontWeight: 'bold', marginBottom: '10px', marginTop: '15px' }}>
                        Outras Referências:
                      </h4>
                      <ul style={{ marginLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                        {outras.map((ref, idx) => (
                          <li key={idx} style={{ marginBottom: '10px' }}>{ref.text}</li>
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
            style={{ fontSize: '18px', lineHeight: '1.7' }}
            dangerouslySetInnerHTML={{ __html: formData.referencias }}
          />
        );
      };

      const hasTableOrImg = hasTablesOrImages(formData.referencias);
      sections.push({
        id: 'referencias',
        component: (
          <div key="referencias" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('referencesTitle')}
            </h3>
            {renderReferences()}
          </div>
        )
      });
    }

    // 11. Contatos (sempre por último)
    if (formData.contatos) {
      const hasTableOrImg = hasTablesOrImages(formData.contatos);
      sections.push({
        id: 'contatos',
        component: (
          <div key="contatos" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('contactsTitle')}
            </h3>
            <div 
              style={{ fontSize: '15px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: formData.contatos }}
            />
          </div>
        )
      });
    }

    return sections;
  };
  
  const sections = getOrderedSections();
  
  return (
    <div className="pdf-container" style={{ 
      padding: '0',
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      backgroundColor: '#fff',
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'visible'
    }}>
      {/* Logo apenas na primeira página */}
      {sections.length > 0 && (
        <div className="pdf-logo-first-page" style={{ marginTop: '0', marginBottom: '10px' }}>
          <img 
            src="/FGV LOGO NOVO.png" 
            alt="FGV Logo" 
            style={{ 
              maxHeight: '75px', 
              height: '75px',
              width: 'auto',
              display: 'block',
              marginBottom: '10px',
              marginTop: '0'
            }} 
          />
          <div style={{
            width: '100%',
            height: '1px',
            backgroundColor: '#d0d0d0',
            margin: '0'
          }}></div>
        </div>
      )}
      {/* Renderizar seções na ordem correta */}
      {sections.map(section => section.component)}
    </div>
  );
}

export default SyllabusPDFContent;
