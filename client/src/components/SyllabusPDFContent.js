import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

// Componente para a tabela de competências no PDF
const CompetenciesTablePDF = ({ data }) => {
  const { t } = useTranslation();
  
  if (!data || data === '' || data === '[]') {
    return <div style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>{t('noCompetencies')}</div>;
  }
  
  try {
    const parsed = JSON.parse(data);
    
    // O formato é { rows: [...] }
    const rows = parsed.rows || parsed;
    
    if (!rows || rows.length === 0) {
      return <div style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>{t('noCompetencies')}</div>;
    }
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '11px' }}>
        <thead>
          <tr style={{ backgroundColor: '#235795', color: '#fff' }}>
            <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #235795', fontSize: '11px' }}>{t('competence')}</th>
            <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #235795', fontSize: '11px' }}>{t('descriptionField')}</th>
            <th style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #235795', fontSize: '11px', width: '130px' }}>{t('contributionDegree')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td style={{ padding: '3px 6px', border: '1px solid #ddd', fontSize: '11px' }}>{row.competencia || '-'}</td>
              <td style={{ padding: '3px 6px', border: '1px solid #ddd', fontSize: '11px' }}>{row.descricao || '-'}</td>
              <td style={{ padding: '3px 6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' }}>
                {'●'.repeat(row.grau || 0)}{'○'.repeat(3 - (row.grau || 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

    // 1. Informações Gerais (sempre primeiro)
    sections.push({
      id: 'info_gerais',
      component: (
        <div key="info_gerais" style={{ marginBottom: '10px', marginTop: '0', paddingBottom: '0', minHeight: '0', height: 'auto', overflow: 'visible' }}>
          {/* Logo apenas na primeira página */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginBottom: '15px',
            marginTop: '0',
            paddingTop: '0'
          }}>
            <img 
              src="/FGV LOGO NOVO.png" 
              alt="FGV Logo" 
              style={{ 
                maxHeight: '55px', 
                height: '55px',
                width: 'auto',
                display: 'block'
              }} 
            />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '0px', border: 'none', borderSpacing: '0', backgroundColor: 'transparent', cellPadding: '0', cellSpacing: '0', borderWidth: '0' }}>
            <tbody>
              {formData.disciplina && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('discipline')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.disciplina}
                  </td>
                </tr>
              )}
              {formData.curso && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('course')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.curso}
                  </td>
                </tr>
              )}
              {formData.semestre_ano && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('period')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.semestre_ano}
                  </td>
                </tr>
              )}
              {formData.linha && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('line')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.linha}
                  </td>
                </tr>
              )}
              {formData.turma && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('class')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.turma}
                  </td>
                </tr>
              )}
              {formData.departamento && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('department')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.departamento}
                  </td>
                </tr>
              )}
              {formData.num_creditos && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('credits')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.num_creditos}
                  </td>
                </tr>
              )}
              {formData.sem_curricular && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('semester')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.sem_curricular}
                  </td>
                </tr>
              )}
              {formData.coordenador && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('disciplineLeader')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.coordenador}
                  </td>
                </tr>
              )}
              {formData.idioma && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('language')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {formData.idioma}
                  </td>
                </tr>
              )}
              {professoresList && professoresList.length > 0 && (
                <tr style={{ backgroundColor: 'transparent', border: 'none', borderWidth: '0' }}>
                  <td style={{ padding: '0px 1px 0px 0', lineHeight: '0.8', verticalAlign: 'top', width: 'auto', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    <strong>{t('professorsList')}:</strong>
                  </td>
                  <td style={{ padding: '0px 0', lineHeight: '0.8', verticalAlign: 'top', border: 'none', borderWidth: '0', borderColor: 'transparent', margin: '0', backgroundColor: 'transparent', background: 'none' }}>
                    {professoresList.join(', ')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              <div key="professores" className="professores-section" style={{ marginBottom: '30px', marginTop: '0', paddingTop: '0', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', marginTop: '0', paddingTop: '0px', paddingBottom: '0px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        overflow: 'visible'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
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
                          <h4 style={{ margin: 0, color: '#235795', fontSize: '17px', fontWeight: 'bold', pageBreakAfter: 'avoid' }}>{professorNome}</h4>
                        </div>
                        {profData.descricao && (
                          <div 
                            style={{ 
                              fontSize: '14px', 
                              lineHeight: '1.5', 
                              marginBottom: '12px', 
                              color: '#333',
                              pageBreakInside: 'avoid',
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
          <div key="sobre" style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
          <div key="compromisso_etico" className="compromisso-etico-section" style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
          <div key="competencias" style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
              {t('competenciesTitle')}
            </h3>
            {formData.curso && (
              <div style={{ marginBottom: '10px', padding: '8px 12px', background: 'transparent', borderLeft: 'none', borderRadius: '0' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#000', lineHeight: '1.3' }}>
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
      const hasTableOrImg = hasTablesOrImages(formData.ods);
      sections.push({
        id: 'ods',
        component: (
          <div key="ods" style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
          <div key="conteudo" style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
          <div key="metodologia" style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
              <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
            <div style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
              <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
            <div style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
              <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
          <div key="o_que_e_esperado" style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
          <div key="custom" style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '17px', color: '#235795', fontWeight: 'bold', marginBottom: '10px', marginTop: '12px' }}>
                        {t('requiredReading') || 'Leitura Obrigatória:'}
                      </h4>
                      <ul style={{ marginLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                        {obrigatorias.map((ref, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{ref.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {opcionais.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '17px', color: '#235795', fontWeight: 'bold', marginBottom: '10px', marginTop: '12px' }}>
                        {t('optionalReading') || 'Leitura Opcional/Complementar:'}
                      </h4>
                      <ul style={{ marginLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
                        {opcionais.map((ref, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{ref.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {outras.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '17px', color: '#235795', fontWeight: 'bold', marginBottom: '10px', marginTop: '12px' }}>
                        Outras Referências:
                      </h4>
                      <ul style={{ marginLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
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
            style={{ fontSize: '18px', lineHeight: '1.7' }}
            dangerouslySetInnerHTML={{ __html: formData.referencias }}
          />
        );
      };

      const hasTableOrImg = hasTablesOrImages(formData.referencias);
      sections.push({
        id: 'referencias',
        component: (
          <div key="referencias" style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
          <div key="contatos" style={{ marginBottom: '30px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '13px', color: '#000', fontWeight: 'bold', backgroundColor: '#d3d3d3', padding: '0px 8px', marginBottom: '8px', border: 'none', lineHeight: '1.0', height: 'auto', minHeight: 'auto', textAlign: 'left' }}>
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
  
  return (
    <div className="pdf-container" style={{ 
      padding: '0',
      paddingTop: '70px',
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      backgroundColor: '#fff',
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'visible'
    }}>
      {/* Logo fixo em todas as páginas - apenas no print */}
      <div className="pdf-logo-fixed" style={{
        position: 'fixed',
        top: '5mm',
        right: '20mm',
        width: 'auto',
        height: '55px',
        zIndex: 9999,
        pointerEvents: 'none',
        pageBreakInside: 'avoid',
        pageBreakAfter: 'avoid',
        pageBreakBefore: 'avoid'
      }}>
        <img 
          src="/FGV LOGO NOVO.png" 
          alt="FGV Logo" 
          style={{ 
            maxHeight: '55px', 
            height: '55px',
            width: 'auto',
            display: 'block'
          }} 
        />
      </div>
      {/* Renderizar seções na ordem correta */}
      {getOrderedSections().map(section => section.component)}
    </div>
  );
}

export default SyllabusPDFContent;
