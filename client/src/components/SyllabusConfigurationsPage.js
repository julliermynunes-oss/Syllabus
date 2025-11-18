import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLayerGroup, FaSlidersH, FaInfoCircle, FaSyncAlt, FaPlus, FaArrowLeft, FaGripVertical } from 'react-icons/fa';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { useTranslation } from '../hooks/useTranslation';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import CompetenciesManager from './CompetenciesManager';
import './SyllabusConfigurationsPage.css';

const tabs = [
  { id: 'models', icon: FaLayerGroup },
  { id: 'competencies', icon: FaSlidersH }
];

const getInitialFormState = () => ({
  id: null,
  nome: '',
  tabsOrder: [],
  tabsVisibility: {},
  allowCustomTabs: true
});

const SyllabusConfigurationsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('models');

    return (
      <div className="syllabus-config-page">
      <div className="config-header">
        <div>
          <button 
            className="back-button" 
            onClick={() => navigate('/syllabi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '2px solid #235795',
              borderRadius: '8px',
              color: '#235795',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            <FaArrowLeft /> Voltar
          </button>
          <p className="configEyebrow">{t('syllabusConfigurations')}</p>
          <h1>{t('syllabusConfigurationsTitle')}</h1>
          <p className="config-description">{t('syllabusConfigurationsDescription')}</p>
        </div>
        <div className="config-highlight-card">
          <FaInfoCircle size={24} />
          <div>
            <strong>{t('syllabusConfigurationsAccess')}</strong>
            <p>{t('syllabusConfigurationsAccessHint')}</p>
      </div>
        </div>
      </div>

      <div className="config-tabs">
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            className={`config-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            type="button"
          >
            <Icon />
            <span>{t(`configTab_${id}`)}</span>
          </button>
        ))}
      </div>

      <div className="config-tab-panel">
        {activeTab === 'models' ? <LayoutModelsTab /> : <CompetenciesManager isEmbedded />}
      </div>
    </div>
  );
};

// Componente sortable para drag and drop (fora do componente principal para evitar problemas com hooks)
const SortableTabRow = ({ tabId, availableTabs, formState, toggleTabVisibility, t }) => {
  // Hook deve ser chamado antes de qualquer return condicional
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: tabId,
    disabled: tabId === 'cabecalho' // Desabilitar drag para cabecalho
  });
  
  const tab = availableTabs.find(item => item.id === tabId);
  if (!tab) return null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const label = t(tab.labelKey) || tab.labelKey;
  const visible = formState.tabsVisibility?.[tabId] ?? true;
  const isCabecalho = tabId === 'cabecalho';

  return (
    <div ref={setNodeRef} style={style} className="tab-row">
      <div className="tab-row-main">
        {!isCabecalho && (
          <div 
            {...attributes} 
            {...listeners}
            className="drag-handle"
            style={{ 
              cursor: 'grab',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              color: '#666'
            }}
          >
            <FaGripVertical />
          </div>
        )}
        {isCabecalho && (
          <div style={{ width: '24px', padding: '0.5rem' }} />
        )}
        <div className="tab-row-title">
          <strong>{label}</strong>
          {tab.requiresNonRestrictedCourse && <span className="tab-pill">{t('configTabRestricted')}</span>}
          {isCabecalho && <span className="tab-pill" style={{ backgroundColor: '#28a745', color: 'white' }}>Sempre ativo</span>}
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={visible} 
            onChange={() => toggleTabVisibility(tabId)} 
            disabled={isCabecalho}
          />
          <span className="slider round" />
        </label>
      </div>
    </div>
  );
};

const LayoutModelsTab = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [availableTabs, setAvailableTabs] = useState([]);
  const [models, setModels] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeModel, setActiveModel] = useState(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTabs, setLoadingTabs] = useState(true);
  const [formState, setFormState] = useState(getInitialFormState());
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  useEffect(() => {
    const fetchAvailableTabs = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/syllabus-config/available-tabs`, {
          headers: authHeaders
        });
        setAvailableTabs(response.data || []);
      } catch (error) {
        console.error('Erro ao carregar abas disponíveis', error);
        // Não mostrar alert, apenas logar o erro
      } finally {
        setLoadingTabs(false);
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/competencias/cursos`);
        setCourses(response.data || []);
      } catch (error) {
        console.error('Erro ao carregar cursos', error);
        // Não mostrar alert, apenas logar o erro
      }
    };

    // Carregar cursos imediatamente, sem depender de outras abas
    fetchCourses();
    fetchAvailableTabs();
  }, [authHeaders]);

  useEffect(() => {
    if (!selectedCourse) {
      setModels([]);
      setActiveModel(null);
      setHistory([]);
      setFormState(getInitialFormState());
      return;
    }
    loadModels(selectedCourse);
    loadHistory(selectedCourse);
  }, [selectedCourse]);

  const loadModels = async (curso) => {
    setLoadingModels(true);
    try {
      const [modelsResponse, activeResponse] = await Promise.all([
        axios.get(`${API_URL}/api/syllabus-config/models`, {
          params: { curso },
          headers: authHeaders
        }),
        axios.get(`${API_URL}/api/syllabus-config/active`, {
          params: { curso },
          headers: authHeaders
        })
      ]);
      setModels(modelsResponse.data || []);
      setActiveModel(activeResponse.data || null);
    } catch (error) {
      console.error('Erro ao carregar modelos', error);
      alert(t('configErrorLoadingModels'));
    } finally {
      setLoadingModels(false);
    }
  };

  const loadHistory = async (curso) => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/syllabus-config/history/${encodeURIComponent(curso)}`, {
        headers: authHeaders
      });
      setHistory(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Função para ordenar abas: cabecalho sempre primeiro, depois alfabético
  const sortTabsAlphabetically = (tabs) => {
    const cabecalhoTab = tabs.find(tab => tab.id === 'cabecalho');
    const otherTabs = tabs.filter(tab => tab.id !== 'cabecalho');
    
    // Ordenar alfabeticamente pelo labelKey
    otherTabs.sort((a, b) => {
      const labelA = t(a.labelKey) || a.labelKey;
      const labelB = t(b.labelKey) || b.labelKey;
      return labelA.localeCompare(labelB, 'pt-BR');
    });
    
    return cabecalhoTab ? [cabecalhoTab, ...otherTabs] : otherTabs;
  };

  const normalizeOrder = (order = []) => {
    const availableIds = availableTabs.map(tab => tab.id);
    const filtered = order.filter(id => availableIds.includes(id));
    
    // Garantir que cabecalho está sempre primeiro
    const cabecalhoIndex = filtered.indexOf('cabecalho');
    if (cabecalhoIndex > 0) {
      filtered.splice(cabecalhoIndex, 1);
      filtered.unshift('cabecalho');
    } else if (cabecalhoIndex === -1 && availableIds.includes('cabecalho')) {
      filtered.unshift('cabecalho');
    }
    
    // Adicionar outras abas que faltam, ordenadas alfabeticamente
    const missingIds = availableIds.filter(id => !filtered.includes(id));
    if (missingIds.length > 0) {
      const missingTabs = missingIds.map(id => availableTabs.find(tab => tab.id === id)).filter(Boolean);
      const sortedMissing = sortTabsAlphabetically(missingTabs);
      filtered.push(...sortedMissing.map(tab => tab.id));
    }
    
    return filtered;
  };

  const getDefaultVisibility = () => {
    const visibility = availableTabs.reduce((acc, tab) => {
      acc[tab.id] = true;
      return acc;
    }, {});
    // Garantir que cabecalho está sempre ativo
    visibility.cabecalho = true;
    return visibility;
  };

  const startNewModel = () => {
    // Ordenar abas alfabeticamente (exceto cabecalho que fica primeiro)
    const sortedTabs = sortTabsAlphabetically(availableTabs);
    const sortedTabIds = sortedTabs.map(tab => tab.id);
    
    setFormState({
      ...getInitialFormState(),
      nome: '',
      tabsOrder: sortedTabIds,
      tabsVisibility: getDefaultVisibility(),
      allowCustomTabs: true
    });
  };

  const startEditModel = (model) => {
    const visibility = { ...getDefaultVisibility(), ...(model.tabsVisibility || {}) };
    // Garantir que cabecalho está sempre ativo
    visibility.cabecalho = true;
    
    setFormState({
      id: model.id,
      nome: model.nome || '',
      tabsOrder: normalizeOrder(model.tabsOrder || []),
      tabsVisibility: visibility,
      allowCustomTabs: model.allowCustomTabs !== undefined ? model.allowCustomTabs : true
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    setFormState(prev => {
      const order = [...prev.tabsOrder];
      const oldIndex = order.indexOf(active.id);
      const newIndex = order.indexOf(over.id);
      
      // Não permitir mover cabecalho
      if (active.id === 'cabecalho' || over.id === 'cabecalho') {
        return prev;
      }
      
      // Não permitir mover para antes de cabecalho
      if (newIndex === 0 && order[0] === 'cabecalho') {
        return prev;
      }
      
      const newOrder = arrayMove(order, oldIndex, newIndex);
      return { ...prev, tabsOrder: newOrder };
    });
  };

  const toggleTabVisibility = (tabId) => {
    // Não permitir desativar cabecalho
    if (tabId === 'cabecalho') return;
    
    setFormState(prev => ({
      ...prev,
      tabsVisibility: {
        ...prev.tabsVisibility,
        [tabId]: !(prev.tabsVisibility?.[tabId] ?? true)
      }
    }));
  };

  const handleSaveModel = async (activateAfterSave = false) => {
    if (!selectedCourse) {
      alert(t('configSelectCourseFirst'));
      return;
    }
    if (!formState.nome.trim()) {
      alert(t('configModelNameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: formState.id,
        curso: selectedCourse,
        nome: formState.nome.trim(),
        tabsOrder: formState.tabsOrder,
        tabsVisibility: formState.tabsVisibility
      };
      const response = await axios.post(`${API_URL}/api/syllabus-config/models`, payload, {
        headers: authHeaders
      });
      const savedModel = response.data?.model;
      await loadModels(selectedCourse);
      await loadHistory(selectedCourse);
      if (activateAfterSave && savedModel?.id) {
        await handleActivate(savedModel.id, true);
      } else {
        alert(t('configModelSaved'));
      }
      setFormState(getInitialFormState());
    } catch (error) {
      console.error('Erro ao salvar modelo', error);
      alert(t('configErrorSavingModel'));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (modelId, silent = false) => {
    try {
      await axios.post(`${API_URL}/api/syllabus-config/models/${modelId}/activate`, {}, { headers: authHeaders });
      await loadModels(selectedCourse);
      await loadHistory(selectedCourse);
      if (!silent) {
        alert(t('configModelActivated'));
      }
    } catch (error) {
      console.error('Erro ao ativar modelo', error);
      alert(t('configErrorActivatingModel'));
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
      setFormState(getInitialFormState());
  };

  return (
    <div className="models-tab">
      <div className="models-controls">
        <div className="models-course-select">
          <label htmlFor="models-course">{t('configSelectCourseLabel')}</label>
          <div className="course-select-row">
            <select id="models-course" value={selectedCourse} onChange={handleCourseChange}>
              <option value="">{t('configSelectCoursePlaceholder')}</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => selectedCourse && loadModels(selectedCourse)}
              disabled={!selectedCourse || loadingModels}
            >
              <FaSyncAlt className={loadingModels ? 'spin' : ''} />
            </button>
          </div>
        </div>
        {selectedCourse && (
          <button type="button" className="primary-btn" onClick={startNewModel}>
            <FaPlus /> {t('configCreateModel')}
          </button>
        )}
      </div>

      {!selectedCourse && (
        <div className="empty-state-card">
          <h3>{t('configNoCourseSelectedTitle')}</h3>
          <p>{t('configNoCourseSelectedDescription')}</p>
        </div>
      )}

      {selectedCourse && (
        <div className="models-grid">
          <div className="models-list">
            <div className="card">
              <div className="card-header">
                <h3>{t('configActiveModelTitle')}</h3>
                {activeModel && <span className="status-pill active">{t('configStatusActive')}</span>}
              </div>
              {activeModel ? (
                <div className="active-model-info">
                  <p><strong>{activeModel.nome}</strong></p>
                  <p>{t('configLastUpdated')}: {formatDate(activeModel.updatedAt || activeModel.updated_at)}</p>
                  <p>{t('configActivatedAt')}: {formatDate(activeModel.activatedAt || activeModel.activated_at)}</p>
                  <p>{t('configTabsCount', { count: (activeModel.tabsOrder || []).length })}</p>
                </div>
              ) : (
                <p>{t('configNoActiveModel')}</p>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3>{t('configExistingModelsTitle')}</h3>
              </div>
              {loadingModels ? (
                <p>{t('loading')}...</p>
              ) : models.length === 0 ? (
                <p>{t('configNoModelsFound')}</p>
              ) : (
                <div className="model-list-items">
                  {models.map(model => (
                    <div key={model.id} className="model-item">
                      <div>
                        <p className="model-name">{model.nome}</p>
                        <small>{t('configLastUpdated')}: {formatDate(model.updatedAt || model.updated_at)}</small>
                      </div>
                      <div className="model-actions">
                        <span className={`status-pill ${model.isActive ? 'active' : 'draft'}`}>
                          {model.isActive ? t('configStatusActive') : t('configStatusDraft')}
                        </span>
                        <button type="button" className="ghost-btn" onClick={() => startEditModel(model)}>
                          {t('configEdit')}
                        </button>
                        {!model.isActive && (
                          <button type="button" className="primary-outline-btn" onClick={() => handleActivate(model.id)}>
                            {t('configActivate')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3>{t('configHistoryTitle')}</h3>
              </div>
              {historyLoading ? (
                <p>{t('loading')}...</p>
              ) : history.length === 0 ? (
                <p>{t('configHistoryEmpty')}</p>
              ) : (
                <ul className="history-list">
                  {history.map(entry => (
                    <li key={entry.id}>
                      <div>
                        <strong>{t(`configHistoryAction_${entry.action}`) || entry.action}</strong>
                        <p>{formatDate(entry.createdAt || entry.created_at)}</p>
                        {entry.performedBy && (
                          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                            Por: {entry.performedBy}
                          </p>
                        )}
                      </div>
                      {entry.snapshot?.nome && <p className="history-model-name">{entry.snapshot.nome}</p>}
                    </li>
        ))}
      </ul>
              )}
            </div>
          </div>

          <div className="models-form card">
            <div className="card-header">
              <h3>{formState.id ? t('configEditModelTitle') : t('configCreateModelTitle')}</h3>
            </div>
            {loadingTabs ? (
              <p>{t('loading')}...</p>
            ) : !formState.tabsOrder.length ? (
              <p>{t('configSelectModelToEdit')}</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveModel(false);
                }}
              >
                <label className="form-field">
                  {t('configModelNameLabel')}
                  <input
                    type="text"
                    value={formState.nome}
                    onChange={(e) => setFormState(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder={t('configModelNamePlaceholder')}
                  />
                </label>

                <div className="tabs-order-section">
                  <div className="tabs-order-header">
                    <h4>{t('configTabsSectionTitle')}</h4>
                    <p>{t('configTabsSectionDescription')}</p>
                  </div>
                  <div className="tabs-order-list">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={formState.tabsOrder}
                        strategy={verticalListSortingStrategy}
                      >
                        {formState.tabsOrder.map((tabId, index) => (
                          <SortableTabRow 
                            key={tabId} 
                            tabId={tabId} 
                            index={index}
                            availableTabs={availableTabs}
                            formState={formState}
                            toggleTabVisibility={toggleTabVisibility}
                            t={t}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                  
                  <div className="form-field" style={{ marginTop: '2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formState.allowCustomTabs !== undefined ? formState.allowCustomTabs : true}
                        onChange={(e) => setFormState(prev => ({ ...prev, allowCustomTabs: e.target.checked }))}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      <span>{t('configAllowCustomTabs') || 'Permitir abas customizadas no Syllabus'}</span>
                    </label>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                      {t('configAllowCustomTabsHint') || 'Quando ativado, professores podem criar abas personalizadas além das abas padrão.'}
                    </p>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setFormState(getInitialFormState())}
                    disabled={saving}
                  >
                    {t('configCancel')}
                  </button>
                  <button
                    type="submit"
                    className="primary-outline-btn"
                    disabled={saving || !selectedCourse || !formState.nome.trim()}
                  >
                    {saving ? t('saving') : t('configSaveDraft')}
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={saving || !selectedCourse || !formState.nome.trim()}
                    onClick={() => handleSaveModel(true)}
                  >
                    {saving ? t('saving') : t('configSaveAndActivate')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusConfigurationsPage;

