import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useTranslation } from '../hooks/useTranslation';
import useCourseLayoutModel from '../hooks/useCourseLayoutModel';

const SyllabusPreviewContent = ({ formData, professoresList }) => {
  const { t } = useTranslation();
  const [linkInfo, setLinkInfo] = useState(null);
  const { layoutModel } = useCourseLayoutModel(formData.curso);

  useEffect(() => {
    const loadLinkInfo = async () => {
      if (formData.curso) {
        try {
          const response = await axios.get(`${API_URL}/api/competencias/limit`, {
            params: { curso: formData.curso }
          });
          setLinkInfo(response.data.linkInfo || null);
        } catch (error) {
          console.error('Erro ao carregar linkInfo:', error);
          setLinkInfo(null);
        }
      } else {
        setLinkInfo(null);
      }
    };

    loadLinkInfo();
  }, [formData.curso]);

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

  const applyLayoutToSections = (sectionsList) => {
    if (!layoutModel) return sectionsList;
    const { tabsOrder = [], tabsVisibility = {} } = layoutModel;
    const orderMap = new Map();
    tabsOrder.forEach((tabId, index) => orderMap.set(tabId, index));

    return sectionsList
      .map((section, index) => ({ ...section, __index: index }))
      .filter(section => {
        if (!section.tabId) return true;
        if (Object.prototype.hasOwnProperty.call(tabsVisibility, section.tabId)) {
          return tabsVisibility[section.tabId];
        }
        return true;
      })
      .sort((a, b) => {
        const orderA = orderMap.has(a.tabId) ? orderMap.get(a.tabId) : Number.MAX_SAFE_INTEGER;
        const orderB = orderMap.has(b.tabId) ? orderMap.get(b.tabId) : Number.MAX_SAFE_INTEGER;
        if (orderA === orderB) {
          return a.__index - b.__index;
        }
        return orderA - orderB;
      })
      .map(({ __index, ...section }) => section);
  };

  const buildSections = () => {
    const sections = [];

    sections.push({
      id: 'info_gerais',
      tabId: 'cabecalho',
      component: (
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
      )
    });

    const professoresSection = (() => {
      if (!formData.professores_data || !professoresList || professoresList.length === 0) return null;
      try {
        const professoresData = typeof formData.professores_data === 'string'
          ? JSON.parse(formData.professores_data)
          : formData.professores_data;

        const professoresComDados = professoresList.filter(prof => {
          const data = professoresData[prof];
          return data && (data.foto || data.descricao || data.linkedin || data.lattes || (data.outrosLinks && data.outrosLinks.length > 0));
        });

        if (professoresComDados.length === 0) return null;

        return (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('professorsTitle')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {professoresComDados.map((professorNome) => {
                const profData = professoresData[professorNome] || {};
                return (
                  <div key={professorNome} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                      {profData.foto && (
                        <img
                          src={profData.foto}
                          alt={professorNome}
                          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #235795' }}
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
      } catch (e) {
        return null;
      }
    })();

    if (professoresSection) {
      sections.push({ id: 'professores', tabId: 'professores', component: professoresSection });
    }

    if (formData.sobre_disciplina) {
      sections.push({
        id: 'sobre',
        tabId: 'sobre',
        component: (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('aboutDisciplineTitle')}
            </h3>
            <div
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: formData.sobre_disciplina }}
            />
          </div>
        )
      });
    }

    if (formData.compromisso_etico) {
      sections.push({
        id: 'compromisso_etico',
        tabId: 'compromisso_etico',
        component: (
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('ethicalCommitmentTitle')}
            </h3>
            <div
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: formData.compromisso_etico }}
            />
          </div>
        )
      });
    }

    if (formData.competencias) {
      sections.push({
        id: 'competencias',
        tabId: 'competencias',
        component: (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('competenciesTitle')}
            </h3>
            {formData.curso && (
              <div style={{ marginBottom: '15px', padding: '10px 15px', background: '#f8f9fa', borderLeft: '4px solid #235795', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#4a5568', lineHeight: '1.6' }}>
                  Os objetivos de aprendizagem da disciplina estão apresentados na tabela abaixo,
                  demonstrando como contribuem para a aquisição das competências esperadas para os egressos do {getCursoSigla(formData.curso)}.
                </p>
              </div>
            )}
            <CompetenciesTablePreview data={formData.competencias} curso={formData.curso} />
            {formData.curso && (
              <div style={{ marginTop: '15px', padding: '10px 15px', background: '#f8f9fa', borderLeft: '4px solid #235795', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#4a5568', lineHeight: '1.6' }}>
                  Mais informações sobre as competências esperadas para os egressos do {getCursoSigla(formData.curso)} podem ser encontradas
                  {linkInfo ? (
                    <>
                      {' '}
                      <a
                        href={linkInfo}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#235795', textDecoration: 'underline', fontWeight: '500' }}
                      >
                        aqui
                      </a>.
                    </>
                  ) : (
                    ' aqui.'
                  )}
                </p>
              </div>
            )}
          </div>
        )
      });
    }

    if (formData.ods && !isRestrictedCourse(formData.curso)) {
      sections.push({
        id: 'ods',
        tabId: 'ods',
        component: (
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
        )
      });
    }

    if (formData.conteudo) {
      sections.push({
        id: 'conteudo',
        tabId: 'conteudo',
        component: (
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
        )
      });
    }

    if (formData.metodologia) {
      sections.push({
        id: 'metodologia',
        tabId: 'metodologia',
        component: (
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
        )
      });
    }

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
                    <tr style={{ background: '#235795', color: '#fff' }}>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #1a4270' }}>{t('type')}</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #1a4270' }}>{t('criteria')}</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #1a4270' }}>{t('weight')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '10px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>{row.tipo || '-'}</td>
                        <td style={{ padding: '10px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>{row.criterio || '-'}</td>
                        <td style={{ padding: '10px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>{row.peso || '-'}</td>
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
      })();

      if (avaliacaoComponent) {
        sections.push({
          id: 'avaliacao',
          tabId: 'avaliacao',
          component: avaliacaoComponent
        });
      }
    }

    if (formData.o_que_e_esperado && !isRestrictedCourse(formData.curso)) {
      sections.push({
        id: 'o_que_e_esperado',
        tabId: 'o_que_e_esperado',
        component: (
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
        )
      });
    }

    if (formData.custom_tab_name && formData.custom_tab_content) {
      const customSection = {
        id: 'custom',
        component: (
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
        )
      };

      const position = formData.custom_tab_position || 'end';
      if (position === 'end') {
        sections.push(customSection);
      } else {
        const afterIndex = sections.findIndex(section => section.id === position || section.tabId === position);
        if (afterIndex !== -1) {
          sections.splice(afterIndex + 1, 0, customSection);
        } else {
          sections.push(customSection);
        }
      }
    }

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
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ fontSize: '16px', color: '#235795', marginBottom: '8px' }}>
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
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ fontSize: '16px', color: '#235795', marginBottom: '8px' }}>
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
                      <h4 style={{ fontSize: '16px', color: '#235795', marginBottom: '8px' }}>
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
            // Continua para fallback em HTML
          }
        }

        return (
          <div
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formData.referencias }}
          />
        );
      };

      sections.push({
        id: 'referencias',
        tabId: 'referencias',
        component: (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '18px', color: '#235795', borderBottom: '2px solid #a4a4a4', paddingBottom: '8px', marginBottom: '15px' }}>
              {t('referencesTitle')}
            </h3>
            {renderReferences()}
          </div>
        )
      });
    }

    if (formData.contatos) {
      sections.push({
        id: 'contatos',
        tabId: 'contatos',
        component: (
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
        )
      });
    }

    return applyLayoutToSections(sections);
  };

  const sections = buildSections();

  return (
    <div style={{ padding: '10px 15px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '3px solid #235795', paddingBottom: '20px' }}>
        <img src="/FGV_Logo.png" alt="FGV Logo" style={{ maxWidth: '200px', height: 'auto', marginBottom: '20px' }} />
        <h1 style={{ fontSize: '28px', color: '#235795', marginBottom: '10px' }}>SYLLABUS</h1>
        <h2 style={{ fontSize: '22px', color: '#333', fontWeight: 'normal' }}>
          {formData.disciplina || 'Nome da Disciplina'}
        </h2>
      </div>

      {sections.map(section => (
        <React.Fragment key={section.id}>
          {section.component}
        </React.Fragment>
      ))}
    </div>
  );
};

const CompetenciesTablePreview = ({ data, curso }) => {
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
    const match = cursoNome.match(/^([A-Z]+(?:\s+[A-Z]+)?)/);
    if (match) {
      return match[1].replace(/\s+/g, '');
    }
    return cursoNome.trim();
  };

  if (!data || data === '' || data === '[]') {
    return <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>{t('noCompetencies')}</div>;
  }

  try {
    const parsed = JSON.parse(data);
    const rows = parsed.rows || parsed;
    const outrosObjetivos = parsed.outrosObjetivos || '';

    if (!rows || rows.length === 0) {
      return <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>{t('noCompetencies')}</div>;
    }

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#235795', color: '#fff' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid #235795', fontSize: '14px' }}>
              {curso ? `Competências ${getCursoSigla(curso)}` : 'Competências'}
            </th>
            <th style={{ padding: '10px 8px', textAlign: 'left', border: '1px solid #235795', fontSize: '14px' }}>Objetivos da Disciplina</th>
            <th style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #235795', fontSize: '14px', width: '100px' }}>Grau de Contribuição</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}>{row.competencia || '-'}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}>{row.descricao || '-'}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '14px' }}>
                {'●'.repeat(row.grau || 0)}{'○'.repeat(3 - (row.grau || 0))}
              </td>
            </tr>
          ))}
          {curso && (
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px', fontWeight: 'bold' }}>Outros Objetivos da Disciplina</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}>{outrosObjetivos || '-'}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '14px', color: '#999' }}>-</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  } catch (e) {
    console.error('Erro ao renderizar competências:', e, 'Data:', data);
    return <div style={{ fontSize: '14px', color: '#f00' }}>{t('errorLoadingCompetencies')}</div>;
  }
};

export default SyllabusPreviewContent;

