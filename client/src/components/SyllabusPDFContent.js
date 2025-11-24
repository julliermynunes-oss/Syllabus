import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import axios from 'axios';
import { API_URL } from '../config';
import useCourseLayoutModel from '../hooks/useCourseLayoutModel';

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
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#235795', color: '#fff' }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #235795', fontSize: '12px' }}>
                {curso ? `Competências ${getCursoSigla(curso)}` : 'Competências'}
              </th>
              <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #235795', fontSize: '12px' }}>Objetivos da Disciplina</th>
              <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #235795', fontSize: '12px', width: '130px' }}>Grau de Contribuição</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td style={{ padding: '5px 8px', border: '1px solid #ddd', fontSize: '12px' }}>{row.competencia || '-'}</td>
                <td style={{ padding: '5px 8px', border: '1px solid #ddd', fontSize: '12px' }}>{row.descricao || '-'}</td>
                <td style={{ padding: '5px 8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '12px' }}>
                  {'●'.repeat(row.grau || 0)}{'○'.repeat(3 - (row.grau || 0))}
                </td>
              </tr>
            ))}
            {/* Campo Outros Objetivos da Disciplina */}
            {curso && (
              <tr>
                <td style={{ padding: '5px 8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: 'bold' }}>Outros Objetivos da Disciplina</td>
                <td style={{ padding: '5px 8px', border: '1px solid #ddd', fontSize: '12px' }}>{outrosObjetivos || '-'}</td>
                <td style={{ padding: '5px 8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '12px', color: '#999' }}>-</td>
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
  const [linkInfo, setLinkInfo] = useState(null);
  const { layoutModel } = useCourseLayoutModel(formData.curso);
  
  // Carregar linkInfo quando o curso mudar
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

  const applyLayoutToSections = (sectionsList) => {
    if (!layoutModel) return sectionsList;
    const { tabsOrder = [], tabsVisibility = {} } = layoutModel;
    const orderMap = new Map();
    tabsOrder.forEach((tabId, index) => orderMap.set(tabId, index));

    return sectionsList
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
          return (a.order ?? 0) - (b.order ?? 0);
        }
        return orderA - orderB;
      });
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
      tabId: 'cabecalho',
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
            tabId: 'professores',
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
      const sobreComponent = (() => {
        try {
          const parsed = JSON.parse(formData.sobre_disciplina);
          if (parsed.layout === 'estruturado' && parsed.data) {
            const data = parsed.data;
            let html = '<div style="font-size: 11px; line-height: 1.5;">';
            html += '<table style="width: 100%; border-collapse: collapse; font-size: 10px;">';
            html += '<tbody>';
            
            if (data.objetivos) {
              html += `<tr>
                <td style="padding: 6px 8px; font-weight: 600; color: #235795; width: 120px; background: #f8f9fa; border: 1px solid #e0e0e0; vertical-align: top;">Objetivos:</td>
                <td style="padding: 6px 8px; border: 1px solid #e0e0e0;">${data.objetivos}</td>
              </tr>`;
            }
            if (data.ementa) {
              html += `<tr>
                <td style="padding: 6px 8px; font-weight: 600; color: #235795; width: 120px; background: #f8f9fa; border: 1px solid #e0e0e0; vertical-align: top;">Ementa:</td>
                <td style="padding: 6px 8px; border: 1px solid #e0e0e0;">${data.ementa}</td>
              </tr>`;
            }
            if (data.pre_requisitos) {
              html += `<tr>
                <td style="padding: 6px 8px; font-weight: 600; color: #235795; width: 120px; background: #f8f9fa; border: 1px solid #e0e0e0; vertical-align: top;">Pré-requisitos:</td>
                <td style="padding: 6px 8px; border: 1px solid #e0e0e0;">${data.pre_requisitos}</td>
              </tr>`;
            }
            if (data.carga_horaria) {
              html += `<tr>
                <td style="padding: 6px 8px; font-weight: 600; color: #235795; width: 120px; background: #f8f9fa; border: 1px solid #e0e0e0;">Carga Horária:</td>
                <td style="padding: 6px 8px; border: 1px solid #e0e0e0; font-weight: 600;">${data.carga_horaria}</td>
              </tr>`;
            }
            
            html += '</tbody></table></div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.sobre_disciplina;
      })();

      const hasTableOrImg = hasTablesOrImages(sobreComponent);
      sections.push({
        id: 'sobre',
        tabId: 'sobre',
        component: (
          <div key="sobre" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('aboutDisciplineTitle')}
            </h3>
            <div 
              style={{ fontSize: '11px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: sobreComponent }}
            />
          </div>
        )
      });
    }

    // 4. Compromisso Ético (se existir) - após Sobre a Disciplina, antes de Competências
    if (formData.compromisso_etico) {
      const compromissoComponent = (() => {
        try {
          const parsed = JSON.parse(formData.compromisso_etico);
          if (parsed.layout === 'template') {
            // Combinar template padrão com conteúdo personalizado
            const TEMPLATE_PADRAO = `<div style="padding: 8px; background: #f8f9fa; border-left: 3px solid #235795; border-radius: 4px; margin-bottom: 8px; font-size: 10px;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #235795;">Compromisso Ético</p>
              <p style="margin: 0 0 6px 0; font-weight: 500;">Ao se matricular nesta disciplina, o(a) aluno(a) assume o compromisso de:</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <tbody>
                  <tr><td style="padding: 2px 4px; width: 20px; color: #235795; font-weight: bold;">✓</td><td style="padding: 2px 4px;">Respeitar os prazos estabelecidos para entrega de trabalhos e avaliações</td></tr>
                  <tr><td style="padding: 2px 4px; color: #235795; font-weight: bold;">✓</td><td style="padding: 2px 4px;">Manter integridade acadêmica, evitando plágio e outras formas de fraude</td></tr>
                  <tr><td style="padding: 2px 4px; color: #235795; font-weight: bold;">✓</td><td style="padding: 2px 4px;">Participar ativamente das atividades propostas</td></tr>
                  <tr><td style="padding: 2px 4px; color: #235795; font-weight: bold;">✓</td><td style="padding: 2px 4px;">Respeitar colegas, professores e funcionários</td></tr>
                  <tr><td style="padding: 2px 4px; color: #235795; font-weight: bold;">✓</td><td style="padding: 2px 4px;">Seguir as normas da instituição e da disciplina</td></tr>
                </tbody>
              </table>
            </div>`;
            let html = TEMPLATE_PADRAO;
            if (parsed.texto_personalizado && parsed.texto_personalizado.trim()) {
              html += `<div style="margin-top: 6px; padding: 6px; background: #fff3cd; border-left: 3px solid #ffc107; border-radius: 4px; font-size: 10px;">
                <strong style="display: block; margin-bottom: 4px; color: #856404;">Informações Adicionais:</strong>
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
          <div key="compromisso_etico" className="compromisso-etico-section" style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('ethicalCommitmentTitle')}
            </h3>
            <div 
              style={{ fontSize: '11px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: compromissoComponent }}
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
        tabId: 'competencias',
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
                  Mais informações sobre as competências esperadas para os egressos do {getCursoSigla(formData.curso)} podem ser encontradas
                  {linkInfo ? (
                    <>
                      {' '}
                      <a 
                        href={linkInfo} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          color: '#235795', 
                          textDecoration: 'underline',
                          fontWeight: '500'
                        }}
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

    // 5. ODS (se não for curso restrito)
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
            
            let html = '<div style="font-size: 11px; line-height: 1.5;">';
            html += '<p style="margin-bottom: 8px; font-weight: 600;">Objetivos de Desenvolvimento Sustentável abordados:</p>';
            
            // Tabela compacta para PDF
            html += '<table style="width: 100%; border-collapse: collapse; font-size: 10px;">';
            html += '<thead><tr style="background: #235795; color: white;"><th style="padding: 4px 6px; text-align: center; border: 1px solid #1a4270; width: 10%;">ODS</th><th style="padding: 4px 6px; text-align: left; border: 1px solid #1a4270;">Nome</th><th style="padding: 4px 6px; text-align: left; border: 1px solid #1a4270;">Descrição</th></tr></thead>';
            html += '<tbody>';
            parsed.ods_selecionados.forEach(ods => {
              const cor = ODS_COLORS[ods.numero] || '#235795';
              html += `<tr>
                <td style="padding: 4px 6px; text-align: center; border: 1px solid #e0e0e0;">
                  <span style="display: inline-block; min-width: 28px; padding: 2px 6px; background: ${cor}; color: white; border-radius: 4px; font-weight: 700;">${ods.numero}</span>
                </td>
                <td style="padding: 4px 6px; font-weight: 600; border: 1px solid #e0e0e0;">${ods.nome}</td>
                <td style="padding: 4px 6px; border: 1px solid #e0e0e0;">${ods.descricao || '-'}</td>
              </tr>`;
            });
            html += '</tbody></table></div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.ods;
      })();

      const hasTableOrImg = hasTablesOrImages(odsComponent);
      sections.push({
        id: 'ods',
        tabId: 'ods',
        component: (
          <div key="ods" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('odsTitle')}
            </h3>
            <div 
              style={{ fontSize: '11px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: odsComponent }}
            />
          </div>
        )
      });
    }

    // 6. Conteúdo
    if (formData.conteudo) {
      const conteudoComponent = (() => {
        try {
          const parsed = JSON.parse(formData.conteudo);
          if (parsed.layout === 'lista' && parsed.unidades) {
            let html = '<div style="font-size: 11px; line-height: 1.5;">';
            html += '<table style="width: 100%; border-collapse: collapse; font-size: 10px;">';
            html += '<thead><tr style="background: #235795; color: white;"><th style="padding: 4px 6px; text-align: center; border: 1px solid #1a4270; width: 5%;">#</th><th style="padding: 4px 6px; text-align: left; border: 1px solid #1a4270; width: 35%;">Unidade</th><th style="padding: 4px 6px; text-align: center; border: 1px solid #1a4270; width: 15%;">Carga Horária</th><th style="padding: 4px 6px; text-align: left; border: 1px solid #1a4270;">Descrição</th></tr></thead>';
            html += '<tbody>';
            parsed.unidades.forEach((unidade, index) => {
              html += `<tr>
                <td style="padding: 4px 6px; text-align: center; font-weight: 600; color: #235795; background: #f8f9fa; border: 1px solid #e0e0e0;">${index + 1}</td>
                <td style="padding: 4px 6px; font-weight: 600; color: #235795; background: #f8f9fa; border: 1px solid #e0e0e0;">${unidade.nome || '-'}</td>
                <td style="padding: 4px 6px; text-align: center; background: #f8f9fa; border: 1px solid #e0e0e0;">${unidade.carga_horaria || '-'}</td>
                <td style="padding: 4px 6px; border: 1px solid #e0e0e0;">${unidade.descricao || '-'}</td>
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

      const hasTableOrImg = hasTablesOrImages(conteudoComponent);
      sections.push({
        id: 'conteudo',
        tabId: 'conteudo',
        component: (
          <div key="conteudo" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('contentTitle')}
            </h3>
            <div 
              style={{ fontSize: '11px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: conteudoComponent }}
            />
          </div>
        )
      });
    }

    // 7. Metodologia
    if (formData.metodologia) {
      const metodologiaComponent = (() => {
        try {
          const parsed = JSON.parse(formData.metodologia);
          if (parsed.layout === 'estruturado' && parsed.data) {
            const data = parsed.data;
            let html = '<div style="font-size: 11px; line-height: 1.5;">';
            
            // Modalidade
            if (data.modalidade) {
              html += `<p style="margin: 4px 0;"><strong>Modalidade:</strong> ${data.modalidade}</p>`;
            }
            
            // Recursos em linha compacta
            if (data.recursos && data.recursos.length > 0) {
              html += '<p style="margin: 4px 0;"><strong>Recursos:</strong> ';
              html += data.recursos.join(', ');
              html += '</p>';
            }
            
            // Atividades Práticas em tabela compacta
            if (data.atividades_praticas && data.atividades_praticas.length > 0) {
              html += '<p style="margin: 6px 0 4px 0; font-weight: 600;">Atividades Práticas:</p>';
              html += '<table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px;">';
              html += '<thead><tr style="background: #235795; color: white;"><th style="padding: 3px 6px; text-align: left; border: 1px solid #1a4270; width: 30%;">Atividade</th><th style="padding: 3px 6px; text-align: left; border: 1px solid #1a4270;">Descrição</th></tr></thead>';
              html += '<tbody>';
              data.atividades_praticas.forEach((atividade, index) => {
                if (atividade.nome) {
                  html += `<tr>
                    <td style="padding: 3px 6px; border: 1px solid #e0e0e0; font-weight: 600; background: #f8f9fa;">${atividade.nome}</td>
                    <td style="padding: 3px 6px; border: 1px solid #e0e0e0;">${atividade.descricao || '-'}</td>
                  </tr>`;
                }
              });
              html += '</tbody></table>';
            }
            
            // Avaliação Contínua
            if (data.avaliacao_continua && data.avaliacao_continua.ativa) {
              html += '<p style="margin: 4px 0;"><strong>✓ Avaliação Contínua:</strong> Ativa</p>';
              if (data.avaliacao_continua.descricao) {
                html += `<div style="margin-top: 4px; padding: 4px; background: #fff3cd; border-left: 3px solid #ffc107; font-size: 10px;">${data.avaliacao_continua.descricao}</div>`;
              }
            }
            
            html += '</div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.metodologia;
      })();

      const hasTableOrImg = hasTablesOrImages(metodologiaComponent);
      sections.push({
        id: 'metodologia',
        tabId: 'metodologia',
        component: (
          <div key="metodologia" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('methodologyTitle')}
            </h3>
            <div 
              style={{ fontSize: '11px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: metodologiaComponent }}
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
        tabId: 'avaliacao',
        component: avaliacaoComponent
      });
    }

    // 8. O que é esperado do aluno (se não for curso restrito)
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
            
            let html = '<div style="font-size: 11px; line-height: 1.5;">';
            html += '<table style="width: 100%; border-collapse: collapse; font-size: 10px;">';
            html += '<thead><tr style="background: #235795; color: white;"><th style="padding: 4px 6px; text-align: left; border: 1px solid #1a4270; width: 25%;">Categoria</th><th style="padding: 4px 6px; text-align: left; border: 1px solid #1a4270;">Expectativas</th></tr></thead>';
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
                      expectativas += ' | ';
                    }
                  });
                  if (categoria.outros) {
                    expectativas += `${itensSelecionados.length > 0 ? itensSelecionados.length + 1 + '. ' : ''}${categoria.outros}`;
                  }
                  
                  html += `<tr>
                    <td style="padding: 4px 6px; font-weight: 600; color: ${catInfo.cor}; background: ${catInfo.cor}15; border: 1px solid #e0e0e0; vertical-align: top;">${catInfo.nome}</td>
                    <td style="padding: 4px 6px; border: 1px solid #e0e0e0; vertical-align: top;">${expectativas || '-'}</td>
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

      const hasTableOrImg = hasTablesOrImages(esperadoComponent);
      sections.push({
        id: 'o_que_e_esperado',
        tabId: 'o_que_e_esperado',
        component: (
          <div key="o_que_e_esperado" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('expectedFromStudentTitle')}
            </h3>
            <div 
              style={{ fontSize: '11px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: esperadoComponent }}
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
        const afterIndex = sections.findIndex(section => section.id === position || section.tabId === position);
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
        tabId: 'referencias',
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
      const contatosComponent = (() => {
        try {
          const parsed = JSON.parse(formData.contatos);
          if (parsed.layout === 'estruturado' && parsed.data) {
            const data = parsed.data;
            let html = '<div style="font-size: 11px; line-height: 1.5;">';
            
            // Tabela para PDF (mais compacta)
            const hasMainInfo = data.email || data.telefone || data.horario_atendimento || data.sala;
            if (hasMainInfo) {
              html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px;">';
              html += '<tbody>';
              
              if (data.email) {
                html += `<tr>
                  <td style="padding: 4px 8px; font-weight: 600; color: #235795; width: 120px; background: #f8f9fa; border: 1px solid #e0e0e0;">Email:</td>
                  <td style="padding: 4px 8px; border: 1px solid #e0e0e0;">${data.email}</td>
                </tr>`;
              }
              if (data.telefone) {
                html += `<tr>
                  <td style="padding: 4px 8px; font-weight: 600; color: #235795; width: 120px; background: #f8f9fa; border: 1px solid #e0e0e0;">Telefone:</td>
                  <td style="padding: 4px 8px; border: 1px solid #e0e0e0;">${data.telefone}</td>
                </tr>`;
              }
              if (data.horario_atendimento) {
                html += `<tr>
                  <td style="padding: 4px 8px; font-weight: 600; color: #235795; width: 120px; background: #f8f9fa; border: 1px solid #e0e0e0;">Horário:</td>
                  <td style="padding: 4px 8px; border: 1px solid #e0e0e0;">${data.horario_atendimento}</td>
                </tr>`;
              }
              if (data.sala) {
                html += `<tr>
                  <td style="padding: 4px 8px; font-weight: 600; color: #235795; width: 120px; background: #f8f9fa; border: 1px solid #e0e0e0;">Sala:</td>
                  <td style="padding: 4px 8px; border: 1px solid #e0e0e0;">${data.sala}</td>
                </tr>`;
              }
              
              html += '</tbody></table>';
            }
            
            if (data.links && data.links.length > 0) {
              html += '<p style="margin: 4px 0; font-weight: 600; color: #235795;">Links:</p>';
              data.links.forEach(link => {
                if (link.url) {
                  html += `<p style="margin: 2px 0; font-size: 10px;">• ${link.label || link.url}</p>`;
                }
              });
            }
            
            if (data.outras_informacoes) {
              html += `<div style="margin-top: 8px; padding: 6px; background: #f8f9fa; border-left: 3px solid #235795; font-size: 10px;">${data.outras_informacoes}</div>`;
            }
            
            html += '</div>';
            return html;
          }
        } catch (e) {
          // Não é JSON, retornar como texto livre
        }
        return formData.contatos;
      })();

      const hasTableOrImg = hasTablesOrImages(contatosComponent);
      sections.push({
        id: 'contatos',
        tabId: 'contatos',
        component: (
          <div key="contatos" style={{ marginBottom: '18px', ...(hasTableOrImg ? { pageBreakInside: 'avoid' } : {}) }}>
            <h3 style={{ fontSize: '15px', color: '#000', fontWeight: 'bold',  marginBottom: '10px', marginTop: '15px', border: 'none', lineHeight: '1.4', textAlign: 'left' }}>
              {t('contactsTitle')}
            </h3>
            <div 
              style={{ fontSize: '11px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: contatosComponent }}
            />
          </div>
        )
      });
    }

    return applyLayoutToSections(sections);
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
