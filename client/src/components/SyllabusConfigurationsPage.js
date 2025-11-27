import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLayerGroup, FaSlidersH, FaInfoCircle, FaSyncAlt, FaPlus, FaArrowLeft, FaGripVertical, FaUsersCog, FaCog, FaTrash } from 'react-icons/fa';
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
import '../components/SyllabusForm.css';

const tabs = [
  { id: 'models', icon: FaLayerGroup },
  { id: 'competencies', icon: FaSlidersH },
  { id: 'general', icon: FaCog },
  { id: 'aolsyllabus', icon: FaUsersCog }
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
            className="back-btn" 
            onClick={() => navigate('/syllabi')}
          >
            <FaArrowLeft /> {t('back') || 'Voltar'}
          </button>
          <h1 className="form-title">{t('syllabusConfigurationsTitle')}</h1>
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
        {activeTab === 'models' && <LayoutModelsTab />}
        {activeTab === 'competencies' && <CompetenciesManager isEmbedded />}
        {activeTab === 'general' && <GeneralSettingsTab />}
        {activeTab === 'aolsyllabus' && <AoLSyllabusTab />}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              padding: '0 4px',
              minWidth: '20px'
            }}
          >
            <FaGripVertical />
          </div>
        )}
        {isCabecalho && (
          <div style={{ width: '20px', minWidth: '20px' }} />
        )}
        <div className="tab-row-title" style={{ flex: 1 }}>
          <strong>{label}</strong>
          {tab.requiresNonRestrictedCourse && <span className="tab-pill">{t('configTabRestricted')}</span>}
          {isCabecalho && <span className="tab-pill" style={{ backgroundColor: '#28a745', color: 'white' }}>Sempre ativo</span>}
        </div>
        <label className="switch" style={{ flexShrink: 0 }}>
          <input 
            type="checkbox" 
            checked={visible} 
            onChange={() => toggleTabVisibility(tabId)} 
            disabled={isCabecalho}
            style={{ width: '16px', height: '16px', minWidth: '16px', flexShrink: 0, cursor: 'pointer' }}
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
        const config = token ? { headers: authHeaders } : {};
        const response = await axios.get(`${API_URL}/api/competencias/cursos`, config);
        console.log('Cursos recebidos:', response.data);
        const cursos = Array.isArray(response.data) ? response.data : [];
        if (cursos.length === 0) {
          console.warn('Nenhum curso retornado pelo endpoint');
        }
        setCourses(cursos);
      } catch (error) {
        console.error('Erro ao carregar cursos', error);
        console.error('Detalhes do erro:', error.response?.data || error.message);
        setCourses([]);
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
        tabsVisibility: formState.tabsVisibility,
        allowCustomTabs: formState.allowCustomTabs !== undefined ? formState.allowCustomTabs : true
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

  const handleDeleteModel = async (modelId, modelName) => {
    if (!window.confirm(`Tem certeza que deseja excluir o modelo "${modelName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/syllabus-config/models/${modelId}`, { headers: authHeaders });
      alert('Modelo excluído com sucesso!');
      await loadModels(selectedCourse);
      await loadHistory(selectedCourse);
      setFormState(getInitialFormState());
    } catch (error) {
      console.error('Erro ao deletar modelo', error);
      const errorMsg = error.response?.data?.error || 'Erro ao deletar modelo.';
      alert(errorMsg);
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
                        {!model.isActive && (
                          <button 
                            type="button" 
                            className="ghost-btn" 
                            onClick={() => handleDeleteModel(model.id, model.nome)}
                            title="Excluir modelo"
                            style={{ color: '#ff4444' }}
                          >
                            <FaTrash />
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
                        style={{ width: '16px', height: '16px', minWidth: '16px', flexShrink: 0, cursor: 'pointer', margin: 0 }}
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

// Aba de Configurações Gerais (pesos de avaliação)
const GeneralSettingsTab = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [weightSettings, setWeightSettings] = useState({ min: '', max: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const config = token ? { headers: authHeaders } : {};
        const response = await axios.get(`${API_URL}/api/competencias/cursos`, config);
        console.log('Cursos recebidos (GeneralSettings):', response.data);
        const cursos = Array.isArray(response.data) ? response.data : [];
        if (cursos.length === 0) {
          console.warn('Nenhum curso retornado pelo endpoint (GeneralSettings)');
        }
        setCourses(cursos);
      } catch (error) {
        console.error('Erro ao carregar cursos (GeneralSettings)', error);
        console.error('Detalhes do erro:', error.response?.data || error.message);
        setCourses([]);
      }
    };
    fetchCourses();
  }, [authHeaders, token]);

  useEffect(() => {
    if (selectedCourse) {
      loadWeightSettings(selectedCourse);
    } else {
      setWeightSettings({ min: '', max: '' });
    }
  }, [selectedCourse]);

  const loadWeightSettings = async (curso) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/general-settings/weight-limits`, {
        params: { curso },
        headers: authHeaders
      });
      if (response.data) {
        setWeightSettings({
          min: response.data.min_weight || '',
          max: response.data.max_weight || ''
        });
      } else {
        setWeightSettings({ min: '', max: '' });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de peso', error);
      setWeightSettings({ min: '', max: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCourse) {
      alert(t('configSelectCourseFirst'));
      return;
    }
    
    const min = parseFloat(weightSettings.min);
    const max = parseFloat(weightSettings.max);
    
    if (isNaN(min) || isNaN(max)) {
      alert('Por favor, informe valores numéricos válidos.');
      return;
    }
    
    if (min < 0 || max < 0) {
      alert('Os valores devem ser positivos.');
      return;
    }
    
    if (min > max) {
      alert('O peso mínimo não pode ser maior que o peso máximo.');
      return;
    }
    
    if (min > 100 || max > 100) {
      alert('Os valores não podem ser maiores que 100%.');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/general-settings/weight-limits`, {
        curso: selectedCourse,
        min_weight: min,
        max_weight: max
      }, {
        headers: authHeaders
      });
      alert(t('configModelSaved') || 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações', error);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="models-tab">
      <div className="models-controls">
        <div className="models-course-select">
          <label htmlFor="general-course">{t('configSelectCourseLabel')}</label>
          <div className="course-select-row">
            <select 
              id="general-course" 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">{t('configSelectCoursePlaceholder')}</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedCourse ? (
        <div className="empty-state-card">
          <h3>{t('configNoCourseSelectedTitle')}</h3>
          <p>{t('configNoCourseSelectedDescription')}</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Configurações de Peso de Avaliação</h3>
          </div>
          {loading ? (
            <p>{t('loading')}...</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                <label>Peso Mínimo (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={weightSettings.min}
                  onChange={(e) => setWeightSettings(prev => ({ ...prev, min: e.target.value }))}
                  placeholder="Ex: 5"
                  style={{ marginTop: '0.5rem' }}
                />
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                  Peso mínimo permitido para cada item de avaliação (em porcentagem)
                </p>
              </div>

              <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                <label>Peso Máximo (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={weightSettings.max}
                  onChange={(e) => setWeightSettings(prev => ({ ...prev, max: e.target.value }))}
                  placeholder="Ex: 50"
                  style={{ marginTop: '0.5rem' }}
                />
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                  Peso máximo permitido para cada item de avaliação (em porcentagem)
                </p>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving || !selectedCourse}
                >
                  {saving ? t('saving') : 'Salvar'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

// Aba AoLSyllabus (protegida por senha)
const AoLSyllabusTab = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ nome_completo: '', email: '', senha: '', role: 'professor' });

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/aolsyllabus/authenticate`, {
        password: password
      }, {
        headers: authHeaders
      });
      if (response.data.success) {
        setIsAuthenticated(true);
        loadUsers();
      } else {
        alert('Senha incorreta.');
      }
    } catch (error) {
      console.error('Erro ao autenticar', error);
      if (error.response?.status === 401) {
        alert('Senha incorreta.');
      } else {
        alert('Erro ao autenticar. Verifique a senha.');
      }
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/aolsyllabus/users`, {
        headers: authHeaders
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários', error);
      alert('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, role) => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/aolsyllabus/users/${userId}/role`, {
        role: role
      }, {
        headers: authHeaders
      });
      alert('Role atualizado com sucesso!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar role', error);
      alert('Erro ao atualizar role.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.nome_completo || !newUser.email || !newUser.senha) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/aolsyllabus/users`, newUser, {
        headers: authHeaders
      });
      alert('Usuário criado com sucesso!');
      setShowAddUserModal(false);
      setNewUser({ nome_completo: '', email: '', senha: '', role: 'professor' });
      loadUsers();
    } catch (error) {
      console.error('Erro ao criar usuário', error);
      const errorMsg = error.response?.data?.error || 'Erro ao criar usuário.';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setSaving(true);
    try {
      await axios.delete(`${API_URL}/api/aolsyllabus/users/${userId}`, {
        headers: authHeaders
      });
      alert('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário', error);
      const errorMsg = error.response?.data?.error || 'Erro ao deletar usuário.';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Gerenciamento de Acesso - Acesso Restrito</h3>
        </div>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-field">
            <label>Senha de Acesso:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha de acesso"
              style={{ marginTop: '0.5rem' }}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-btn">
              Acessar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="models-tab">
      <div className="card">
        <div className="card-header">
          <h3>Gerenciamento de Usuários</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="primary-btn" 
              onClick={() => setShowAddUserModal(true)}
              disabled={saving}
            >
              <FaPlus /> Adicionar Usuário
            </button>
            <button 
              className="ghost-btn" 
              onClick={() => {
                setIsAuthenticated(false);
                setPassword('');
              }}
            >
              Sair
            </button>
          </div>
        </div>
        {loading ? (
          <p>{t('loading')}...</p>
        ) : (
          <div className="model-list-items">
            {users.map(user => (
              <div key={user.id} className="model-item">
                <div>
                  <p className="model-name">{user.nome_completo}</p>
                  <small>{user.email}</small>
                  <p style={{ marginTop: '0.5rem' }}>
                    <span className={`status-pill ${user.role === 'admin' ? 'active' : user.role === 'coordenador' ? 'draft' : ''}`}>
                      {user.role === 'admin' ? 'Administrador' : user.role === 'coordenador' ? 'Coordenador' : 'Professor'}
                    </span>
                  </p>
                </div>
                <div className="model-actions">
                  <select
                    value={user.role || 'professor'}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    disabled={saving}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      marginRight: '0.5rem'
                    }}
                  >
                    <option value="professor">Professor</option>
                    <option value="coordenador">Coordenador</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button
                    className="ghost-btn"
                    onClick={() => handleDeleteUser(user.id, user.nome_completo)}
                    disabled={saving}
                    title="Excluir usuário"
                    style={{ color: '#ff4444' }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Adicionar Usuário */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Adicionar Novo Usuário</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-field">
                <label>Nome Completo:</label>
                <input
                  type="text"
                  value={newUser.nome_completo}
                  onChange={(e) => setNewUser(prev => ({ ...prev, nome_completo: e.target.value }))}
                  required
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
              <div className="form-field">
                <label>Email:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
              <div className="form-field">
                <label>Senha:</label>
                <input
                  type="password"
                  value={newUser.senha}
                  onChange={(e) => setNewUser(prev => ({ ...prev, senha: e.target.value }))}
                  required
                  style={{ marginTop: '0.25rem' }}
                />
              </div>
              <div className="form-field">
                <label>Tipo:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  style={{ marginTop: '0.25rem' }}
                >
                  <option value="professor">Professor</option>
                  <option value="coordenador">Coordenador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Salvando...' : 'Criar Usuário'}
                </button>
                <button 
                  type="button" 
                  className="modal-btn-cancel"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUser({ nome_completo: '', email: '', senha: '', role: 'professor' });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusConfigurationsPage;

