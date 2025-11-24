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
      const sobreComponent = (() => {
        try {
          const parsed = JSON.parse(formData.sobre_disciplina);
          if (parsed.layout === 'estruturado' && parsed.data) {
            const data = parsed.data;
            let html = '<div style="font-size: 14px; line-height: 1.6; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">';
            
            if (data.objetivos) {
              html += `<div style="padding: 1rem; background: #e8f4f8; border-left: 4px solid #235795; border-radius: 6px;">
                <strong style="color: #235795; display: block; margin-bottom: 0.5rem; font-size: 1rem;">Objetivos</strong>
                <div>${data.objetivos}</div>
              </div>`;
            }
            if (data.ementa) {
              html += `<div style="padding: 1rem; background: #f8f9fa; border-left: 4px solid #6c757d; border-radius: 6px;">
                <strong style="color: #6c757d; display: block; margin-bottom: 0.5rem; font-size: 1rem;">Ementa</strong>
                <div>${data.ementa}</div>
              </div>`;
            }
            if (data.pre_requisitos) {
              html += `<div style="padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 6px;">
                <strong style="color: #856404; display: block; margin-bottom: 0.5rem; font-size: 1rem;">Pré-requisitos</strong>
                <div>${data.pre_requisitos}</div>
              </div>`;
            }
            if (data.carga_horaria) {
              html += `<div style="padding: 1rem; background: #d1ecf1; border-left: 4px solid #0c5460; border-radius: 6px; grid-column: 1 / -1;">
                <strong style="color: #0c5460; display: block; margin-bottom: 0.25rem; font-size: 1rem;">Carga Horária</strong>
                <span style="font-size: 1.2rem; font-weight: 600;">${data.carga_horaria}</span>
              </div>`;
            }
            html += '</div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.sobre_disciplina;
      })();

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
              dangerouslySetInnerHTML={{ __html: sobreComponent }}
            />
          </div>
        )
      });
    }

    if (formData.compromisso_etico) {
      const compromissoComponent = (() => {
        try {
          const parsed = JSON.parse(formData.compromisso_etico);
          if (parsed.layout === 'template') {
            // Combinar template padrão com conteúdo personalizado
            const TEMPLATE_PADRAO = `<div style="padding: 1.5rem; background: #f8f9fa; border-left: 4px solid #235795; border-radius: 6px; margin-bottom: 1rem;">
              <h4 style="margin: 0 0 1rem 0; color: #235795; font-size: 1.1rem; font-weight: 600;">Compromisso Ético</h4>
              <p style="margin: 0 0 1rem 0; font-weight: 500;">Ao se matricular nesta disciplina, o(a) aluno(a) assume o compromisso de:</p>
              <div style="background: white; padding: 1rem; border-radius: 4px; border: 1px solid #e0e0e0;">
                <ul style="margin: 0; padding-left: 1.5rem; list-style-type: none;">
                  <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #235795; font-weight: bold;">✓</span>
                    Respeitar os prazos estabelecidos para entrega de trabalhos e avaliações
                  </li>
                  <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #235795; font-weight: bold;">✓</span>
                    Manter integridade acadêmica, evitando plágio e outras formas de fraude
                  </li>
                  <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #235795; font-weight: bold;">✓</span>
                    Participar ativamente das atividades propostas
                  </li>
                  <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #235795; font-weight: bold;">✓</span>
                    Respeitar colegas, professores e funcionários
                  </li>
                  <li style="margin-bottom: 0; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #235795; font-weight: bold;">✓</span>
                    Seguir as normas da instituição e da disciplina
                  </li>
                </ul>
              </div>
            </div>`;
            let html = TEMPLATE_PADRAO;
            if (parsed.texto_personalizado && parsed.texto_personalizado.trim()) {
              html += `<div style="margin-top: 1rem; padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 6px;">
                <strong style="display: block; margin-bottom: 0.5rem; color: #856404;">Informações Adicionais:</strong>
                ${parsed.texto_personalizado}
              </div>`;
            }
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.compromisso_etico;
      })();

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
              dangerouslySetInnerHTML={{ __html: compromissoComponent }}
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
      const odsComponent = (() => {
        try {
          const parsed = JSON.parse(formData.ods);
          if (parsed.layout === 'visual' && parsed.ods_selecionados) {
            const ODS_COLORS = {
              1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
              6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
              11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
              16: '#00689D', 17: '#19486A'
            };
            
            let html = '<div style="font-size: 14px; line-height: 1.6;">';
            html += '<p style="margin-bottom: 1rem;"><strong>Objetivos de Desenvolvimento Sustentável abordados nesta disciplina:</strong></p>';
            
            // Grid de cards ODS (mais compacto, estilo header + corpo)
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem;">';
            parsed.ods_selecionados.forEach(ods => {
              const cor = ODS_COLORS[ods.numero] || '#235795';
              html += `<div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.05); background: #fff; display: flex; flex-direction: column; min-height: 150px;">
                <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.9rem; background: ${cor}; color: white;">
                  <div style="width: 42px; height: 42px; border-radius: 6px; background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px;">${ods.numero}</div>
                  <div style="flex: 1;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.85;">ODS</div>
                    <div style="font-weight: 600; font-size: 0.95rem; line-height: 1.2;">${ods.nome}</div>
                  </div>
                </div>
                <div style="flex: 1; padding: 0.85rem 0.9rem; background: ${cor}12; font-size: 0.92rem; color: #2f2f2f;">
                  ${ods.descricao || '<span style="color:#777;">Sem descrição informada</span>'}
                </div>
              </div>`;
            });
            html += '</div></div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.ods;
      })();

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
              dangerouslySetInnerHTML={{ __html: odsComponent }}
            />
          </div>
        )
      });
    }

    if (formData.conteudo) {
      const conteudoComponent = (() => {
        try {
          const parsed = JSON.parse(formData.conteudo);
          if (parsed.layout === 'lista' && parsed.unidades) {
            let html = '<div style="font-size: 14px; line-height: 1.6;">';
            html += '<table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">';
            html += '<thead><tr style="background: #235795; color: white;"><th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 5%;">#</th><th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 35%;">Unidade</th><th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 15%;">Carga Horária</th><th style="padding: 12px 16px; text-align: left; font-weight: 600;">Descrição</th></tr></thead>';
            html += '<tbody>';
            parsed.unidades.forEach((unidade, index) => {
              html += `<tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 16px; text-align: center; font-weight: 600; color: #235795; background: #f8f9fa; border-right: 1px solid #e0e0e0;">${index + 1}</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #235795; background: #f8f9fa; border-right: 1px solid #e0e0e0;">${unidade.nome || '-'}</td>
                <td style="padding: 12px 16px; text-align: center; background: #f8f9fa; border-right: 1px solid #e0e0e0;">${unidade.carga_horaria || '-'}</td>
                <td style="padding: 12px 16px;">${unidade.descricao || '-'}</td>
              </tr>`;
            });
            html += '</tbody></table></div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.conteudo;
      })();

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
              dangerouslySetInnerHTML={{ __html: conteudoComponent }}
            />
          </div>
        )
      });
    }

    if (formData.metodologia) {
      const metodologiaComponent = (() => {
        try {
          const parsed = JSON.parse(formData.metodologia);
          if (parsed.layout === 'estruturado' && parsed.data) {
            const data = parsed.data;
            let html = '<div style="font-size: 14px; line-height: 1.6;">';
            
            // Modalidade em card destacado
            if (data.modalidade) {
              html += `<div style="margin-bottom: 1.5rem; padding: 1rem; background: #e8f4f8; border-left: 4px solid #235795; border-radius: 4px;">
                <strong style="color: #235795; display: block; margin-bottom: 0.25rem;">Modalidade de Ensino:</strong>
                <span style="font-size: 1.1rem; font-weight: 600;">${data.modalidade}</span>
              </div>`;
            }
            
            // Recursos em badges
            if (data.recursos && data.recursos.length > 0) {
              html += '<div style="margin-bottom: 1.5rem;"><strong style="display: block; margin-bottom: 0.75rem; color: #235795;">Recursos Utilizados:</strong>';
              html += '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">';
              data.recursos.forEach(recurso => {
                html += `<span style="display: inline-block; padding: 0.5rem 1rem; background: #235795; color: white; border-radius: 20px; font-size: 0.9rem; font-weight: 500;">${recurso}</span>`;
              });
              html += '</div></div>';
            }
            
            // Atividades Práticas em tabela
            if (data.atividades_praticas && data.atividades_praticas.length > 0) {
              html += '<div style="margin-bottom: 1.5rem;"><strong style="display: block; margin-bottom: 0.75rem; color: #235795;">Atividades Práticas:</strong>';
              html += '<table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">';
              html += '<thead><tr style="background: #235795; color: white;"><th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 30%;">Atividade</th><th style="padding: 12px 16px; text-align: left; font-weight: 600;">Descrição</th></tr></thead>';
              html += '<tbody>';
              data.atividades_praticas.forEach((atividade, index) => {
                if (atividade.nome) {
                  html += `<tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: #235795; background: #f8f9fa; border-right: 1px solid #e0e0e0;">${atividade.nome}</td>
                    <td style="padding: 12px 16px;">${atividade.descricao || '-'}</td>
                  </tr>`;
                }
              });
              html += '</tbody></table></div>';
            }
            
            // Avaliação Contínua em card
            if (data.avaliacao_continua && data.avaliacao_continua.ativa) {
              html += '<div style="padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">';
              html += '<strong style="color: #856404; display: block; margin-bottom: 0.5rem;">✓ Avaliação Contínua: Ativa</strong>';
              if (data.avaliacao_continua.descricao) {
                html += `<div style="margin-top: 0.5rem;">${data.avaliacao_continua.descricao}</div>`;
              }
              html += '</div>';
            }
            
            html += '</div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.metodologia;
      })();

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
              dangerouslySetInnerHTML={{ __html: metodologiaComponent }}
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
      const esperadoComponent = (() => {
        try {
          const parsed = JSON.parse(formData.o_que_e_esperado);
          if (parsed.layout === 'checklist' && parsed.categorias) {
            const CATEGORIAS = {
              participacao: { nome: 'Participação', cor: '#235795' },
              trabalhos: { nome: 'Trabalhos', cor: '#28a745' },
              estudos: { nome: 'Estudos', cor: '#17a2b8' },
              comportamento: { nome: 'Comportamento', cor: '#ffc107' }
            };
            
            let html = '<div style="font-size: 14px; line-height: 1.6;">';
            html += '<table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">';
            html += '<thead><tr style="background: #235795; color: white;"><th style="padding: 12px 16px; text-align: left; font-weight: 600; width: 25%;">Categoria</th><th style="padding: 12px 16px; text-align: left; font-weight: 600;">Expectativas</th></tr></thead>';
            html += '<tbody>';
            
            Object.keys(CATEGORIAS).forEach(catKey => {
              const catInfo = CATEGORIAS[catKey];
              const categoria = parsed.categorias[catKey];
              if (categoria) {
                const itensSelecionados = categoria.itens.filter(item => item.selecionado);
                if (itensSelecionados.length > 0 || categoria.outros) {
                  let expectativas = '';
                  itensSelecionados.forEach((item, idx) => {
                    expectativas += `${idx + 1}. ${item.texto}`;
                    if (idx < itensSelecionados.length - 1 || categoria.outros) {
                      expectativas += '<br/>';
                    }
                  });
                  if (categoria.outros) {
                    expectativas += `${itensSelecionados.length > 0 ? itensSelecionados.length + 1 + '. ' : ''}${categoria.outros}`;
                  }
                  
                  html += `<tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px 16px; font-weight: 600; color: ${catInfo.cor}; background: ${catInfo.cor}15; border-right: 1px solid #e0e0e0; vertical-align: top;">${catInfo.nome}</td>
                    <td style="padding: 12px 16px; vertical-align: top;">${expectativas || '-'}</td>
                  </tr>`;
                }
              }
            });
            
            html += '</tbody></table></div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.o_que_e_esperado;
      })();

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
              dangerouslySetInnerHTML={{ __html: esperadoComponent }}
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
      const contatosComponent = (() => {
        try {
          const parsed = JSON.parse(formData.contatos);
          if (parsed.layout === 'estruturado' && parsed.data) {
            const data = parsed.data;
            let html = '<div style="font-size: 14px; line-height: 1.6;">';
            
            // Criar tabela para contatos principais
            const hasMainInfo = data.email || data.telefone || data.horario_atendimento || data.sala;
            if (hasMainInfo) {
              html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; background: white; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">';
              html += '<tbody>';
              
              if (data.email) {
                html += `<tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 12px 16px; font-weight: 600; color: #235795; width: 180px; background: #f8f9fa; border-right: 1px solid #e0e0e0;">Email:</td>
                  <td style="padding: 12px 16px;"><a href="mailto:${data.email}" style="color: #235795; text-decoration: none;">${data.email}</a></td>
                </tr>`;
              }
              if (data.telefone) {
                html += `<tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 12px 16px; font-weight: 600; color: #235795; width: 180px; background: #f8f9fa; border-right: 1px solid #e0e0e0;">Telefone:</td>
                  <td style="padding: 12px 16px;">${data.telefone}</td>
                </tr>`;
              }
              if (data.horario_atendimento) {
                html += `<tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 12px 16px; font-weight: 600; color: #235795; width: 180px; background: #f8f9fa; border-right: 1px solid #e0e0e0;">Horário de Atendimento:</td>
                  <td style="padding: 12px 16px;">${data.horario_atendimento}</td>
                </tr>`;
              }
              if (data.sala) {
                html += `<tr>
                  <td style="padding: 12px 16px; font-weight: 600; color: #235795; width: 180px; background: #f8f9fa; border-right: 1px solid #e0e0e0;">Sala/Office:</td>
                  <td style="padding: 12px 16px;">${data.sala}</td>
                </tr>`;
              }
              
              html += '</tbody></table>';
            }
            
            // Links em cards/badges
            if (data.links && data.links.length > 0) {
              html += '<div style="margin-bottom: 1rem;"><strong style="display: block; margin-bottom: 0.5rem; color: #235795;">Links:</strong>';
              html += '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">';
              data.links.forEach(link => {
                if (link.url) {
                  html += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 0.5rem 1rem; background: #235795; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9rem; font-weight: 500;">${link.label || link.url}</a>`;
                }
              });
              html += '</div></div>';
            }
            
            if (data.outras_informacoes) {
              html += `<div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-left: 4px solid #235795; border-radius: 4px;">${data.outras_informacoes}</div>`;
            }
            
            html += '</div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.contatos;
      })();

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
              dangerouslySetInnerHTML={{ __html: contatosComponent }}
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

