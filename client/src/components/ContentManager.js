import React, { useState, useEffect } from 'react';
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
import { FaPlus, FaTrash, FaGripVertical, FaList, FaFileAlt } from 'react-icons/fa';
import TiptapEditor from './TiptapEditor';
import './ContentManager.css';

const SortableUnidadeRow = ({ unidade, index, onUpdate, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: unidade.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`unidade-row ${isDragging ? 'dragging' : ''}`}
    >
      <div className="unidade-drag-handle" {...attributes} {...listeners}>
        <FaGripVertical />
      </div>
      <div className="unidade-content">
        <div className="form-row">
          <div className="form-field" style={{ flex: 2 }}>
            <input
              type="text"
              value={unidade.nome}
              onChange={(e) => onUpdate(index, 'nome', e.target.value)}
              placeholder="Nome da unidade (ex: Unidade 1: Introdução)"
              style={{ marginTop: '0.25rem' }}
            />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <input
              type="text"
              value={unidade.carga_horaria}
              onChange={(e) => onUpdate(index, 'carga_horaria', e.target.value)}
              placeholder="Carga horária (ex: 4h)"
              style={{ marginTop: '0.25rem' }}
            />
          </div>
          <div className="form-field" style={{ flex: 0, width: 'auto' }}>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="remove-unidade-btn"
            >
              <FaTrash />
            </button>
          </div>
        </div>
        <div className="form-row full-width">
          <div className="form-field">
            <TiptapEditor
              content={unidade.descricao}
              onChange={(content) => onUpdate(index, 'descricao', content)}
              showCharCount={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentManager = ({ content, onChange }) => {
  const [layout, setLayout] = useState('texto'); // 'lista' ou 'texto'
  const [unidades, setUnidades] = useState([]);
  const [textContent, setTextContent] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Inicializar dados quando receber content
  useEffect(() => {
    if (!content || content.trim() === '') {
      setLayout('texto');
      setTextContent('');
      setUnidades([]);
      return;
    }

    // Tentar parsear como JSON (layout lista)
    try {
      const parsed = JSON.parse(content);
      if (parsed.layout === 'lista' && parsed.unidades) {
        setLayout('lista');
        // Garantir que cada unidade tenha um id único
        const unidadesComId = parsed.unidades.map((u, idx) => ({
          ...u,
          id: u.id || `unidade-${idx}-${Date.now()}`,
          descricao: u.descricao || ''
        }));
        setUnidades(unidadesComId);
        return;
      }
    } catch (e) {
      // Não é JSON, então é texto livre
    }

    // Se chegou aqui, é texto livre
    setLayout('texto');
    setTextContent(content);
  }, [content]);

  // Salvar dados de lista
  const saveUnidades = (newUnidades) => {
    // Atualizar ordem
    const unidadesComOrdem = newUnidades.map((u, idx) => ({
      ...u,
      ordem: idx + 1
    }));
    setUnidades(unidadesComOrdem);
    const jsonData = JSON.stringify({
      layout: 'lista',
      unidades: unidadesComOrdem
    });
    onChange(jsonData);
  };

  // Salvar texto livre
  const saveTextContent = (newContent) => {
    setTextContent(newContent);
    onChange(newContent);
  };

  // Converter texto livre para lista
  const convertTextToList = () => {
    if (!textContent || textContent.trim() === '') {
      setLayout('lista');
      return;
    }

    // Tentar extrair unidades de listas HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textContent;
    const extractedUnidades = [];

    // Tentar encontrar listas ordenadas ou não ordenadas
    const lists = tempDiv.querySelectorAll('ol, ul');
    if (lists.length > 0) {
      lists.forEach((list, listIdx) => {
        const items = list.querySelectorAll('li');
        items.forEach((item, itemIdx) => {
          const text = item.textContent.trim();
          if (text) {
            // Tentar extrair nome e carga horária
            const cargaMatch = text.match(/(\d+[hH]?)/);
            const carga = cargaMatch ? cargaMatch[0] : '';
            const nome = text.replace(/\d+[hH]?/g, '').trim() || `Unidade ${extractedUnidades.length + 1}`;
            
            extractedUnidades.push({
              id: `unidade-${listIdx}-${itemIdx}-${Date.now()}`,
              nome,
              descricao: item.innerHTML,
              carga_horaria: carga,
              ordem: extractedUnidades.length + 1
            });
          }
        });
      });
    }

    // Se não encontrou listas, criar uma unidade com todo o conteúdo
    if (extractedUnidades.length === 0) {
      extractedUnidades.push({
        id: `unidade-1-${Date.now()}`,
        nome: 'Conteúdo Programático',
        descricao: textContent,
        carga_horaria: '',
        ordem: 1
      });
    }

    setUnidades(extractedUnidades);
    setLayout('lista');
    saveUnidades(extractedUnidades);
  };

  // Converter lista para texto livre
  const convertListToText = () => {
    let html = '<ol>';
    unidades.forEach(unidade => {
      html += '<li>';
      if (unidade.nome) {
        html += `<strong>${unidade.nome}</strong>`;
        if (unidade.carga_horaria) {
          html += ` (${unidade.carga_horaria})`;
        }
        if (unidade.descricao) {
          html += `<br/>${unidade.descricao}`;
        }
      } else if (unidade.descricao) {
        html += unidade.descricao;
      }
      html += '</li>';
    });
    html += '</ol>';

    setTextContent(html);
    setLayout('texto');
    saveTextContent(html);
  };

  const handleLayoutChange = (newLayout) => {
    if (newLayout === 'lista' && layout === 'texto') {
      convertTextToList();
    } else if (newLayout === 'texto' && layout === 'lista') {
      convertListToText();
    } else {
      setLayout(newLayout);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setUnidades((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveUnidades(newItems);
        return newItems;
      });
    }
  };

  const addUnidade = () => {
    const newUnidade = {
      id: `unidade-${Date.now()}-${Math.random()}`,
      nome: '',
      descricao: '',
      carga_horaria: '',
      ordem: unidades.length + 1
    };
    saveUnidades([...unidades, newUnidade]);
  };

  const removeUnidade = (index) => {
    const newUnidades = unidades.filter((_, i) => i !== index);
    saveUnidades(newUnidades);
  };

  const updateUnidade = (index, field, value) => {
    const newUnidades = [...unidades];
    newUnidades[index] = { ...newUnidades[index], [field]: value };
    saveUnidades(newUnidades);
  };

  return (
    <div className="content-manager">
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: '#235795' }}>
          Layout de Conteúdo Programático:
        </label>
        <div className="layout-selector-buttons">
          <button
            type="button"
            className={`layout-option-btn ${layout === 'lista' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('lista')}
          >
            <div className="layout-icon">
              <FaList size={24} />
            </div>
            <div className="layout-label">
              <strong>Lista de Unidades</strong>
            </div>
          </button>
          <button
            type="button"
            className={`layout-option-btn ${layout === 'texto' ? 'active' : ''}`}
            onClick={() => handleLayoutChange('texto')}
          >
            <div className="layout-icon">
              <FaFileAlt size={24} />
            </div>
            <div className="layout-label">
              <strong>Texto Livre</strong>
            </div>
          </button>
        </div>
      </div>

      {layout === 'lista' ? (
        <div className="content-lista">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={addUnidade}
              className="add-unidade-btn"
              style={{
                padding: '0.5rem 1rem',
                background: '#235795',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaPlus /> Adicionar Unidade
            </button>
          </div>

          {unidades.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              Nenhuma unidade adicionada. Clique em "Adicionar Unidade" para começar.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={unidades.map(u => u.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="unidades-list">
                  {unidades.map((unidade, index) => (
                    <SortableUnidadeRow
                      key={unidade.id}
                      unidade={unidade}
                      index={index}
                      onUpdate={updateUnidade}
                      onRemove={removeUnidade}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      ) : (
        <div className="content-text">
          <TiptapEditor
            content={textContent}
            onChange={saveTextContent}
            showCharCount={true}
          />
          <p className="editor-note">
            💡 Nota: Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContentManager;

