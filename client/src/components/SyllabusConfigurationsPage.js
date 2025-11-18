import React, { useEffect, useMemo, useState } from 'react';
import { FaLayerGroup, FaSlidersH, FaInfoCircle, FaSyncAlt, FaChevronUp, FaChevronDown, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
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
  tabsVisibility: {}
});

const SyllabusConfigurationsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('models');

  return (
    <div className="syllabus-config-page">
      <div className="config-header">
        <div>
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
        alert(t('configErrorLoadingTabs'));
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
        alert(t('configErrorLoadingCourses'));
      }
    };

    fetchAvailableTabs();
    fetchCourses();
  }, [authHeaders, t]);

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

  const normalizeOrder = (order = []) => {
    const availableIds = availableTabs.map(tab => tab.id);
    const filtered = order.filter(id => availableIds.includes(id));
    availableIds.forEach(id => {
      if (!filtered.includes(id)) filtered.push(id);
    });
    return filtered;
  };

  const getDefaultVisibility = () =>
    availableTabs.reduce((acc, tab) => {
      acc[tab.id] = true;
      return acc;
    }, {});

  const startNewModel = () => {
    setFormState({
      ...getInitialFormState(),
      nome: '',
      tabsOrder: normalizeOrder(availableTabs.map(tab => tab.id)),
      tabsVisibility: getDefaultVisibility()
    });
  };

  const startEditModel = (model) => {
    setFormState({
      id: model.id,
      nome: model.nome || '',
      tabsOrder: normalizeOrder(model.tabsOrder || []),
      tabsVisibility: { ...getDefaultVisibility(), ...(model.tabsVisibility || {}) }
    });
  };

  const moveTab = (tabId, direction) => {
    setFormState(prev => {
      const order = [...prev.tabsOrder];
      const index = order.indexOf(tabId);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= order.length) return prev;
      [order[index], order[newIndex]] = [order[newIndex], order[index]];
      return { ...prev, tabsOrder: order };
    });
  };

  const toggleTabVisibility = (tabId) => {
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

  const renderTabRow = (tabId, index) => {
    const tab = availableTabs.find(item => item.id === tabId);
    if (!tab) return null;
    const label = t(tab.labelKey) || tab.labelKey;
    const visible = formState.tabsVisibility?.[tabId] ?? true;
    return (
      <div key={tabId} className="tab-row">
        <div className="tab-row-main">
          <div className="tab-row-title">
            <strong>{label}</strong>
            {tab.requiresNonRestrictedCourse && <span className="tab-pill">{t('configTabRestricted')}</span>}
          </div>
          <label className="switch">
            <input type="checkbox" checked={visible} onChange={() => toggleTabVisibility(tabId)} />
            <span className="slider round" />
          </label>
        </div>
        <div className="tab-row-actions">
          <button type="button" onClick={() => moveTab(tabId, 'up')} disabled={index === 0} aria-label={t('configMoveUp')}>
            <FaChevronUp />
          </button>
          <button type="button" onClick={() => moveTab(tabId, 'down')} disabled={index === formState.tabsOrder.length - 1} aria-label={t('configMoveDown')}>
            <FaChevronDown />
          </button>
        </div>
      </div>
    );
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
                    {formState.tabsOrder.map((tabId, index) => renderTabRow(tabId, index))}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setFormState(DEFAULT_FORM_STATE)}
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

