import React, { useState, useEffect } from 'react';
import TiptapEditor from './TiptapEditor';
import './MethodologyManager.css';

const MethodologyManager = ({ content, onChange }) => {
  const [textContent, setTextContent] = useState('');

  // Inicializar dados quando receber content
  useEffect(() => {
    if (!content || content.trim() === '') {
      setTextContent('');
      return;
    }

    // Se for JSON (dados antigos estruturados), converter para HTML
    try {
      const parsed = JSON.parse(content);
      if (parsed.layout === 'estruturado' && parsed.data) {
        const data = parsed.data;
        let html = '<p><strong>Metodologia:</strong></p>';
        
        if (data.modalidade) {
          html += `<p><strong>Modalidade de Ensino:</strong> ${data.modalidade}</p>`;
        }
        
        if (data.recursos && data.recursos.length > 0) {
          html += '<p><strong>Recursos Utilizados:</strong></p><ul>';
          data.recursos.forEach(recurso => {
            html += `<li>${recurso}</li>`;
          });
          html += '</ul>';
        }
        
        if (data.atividades_praticas && data.atividades_praticas.length > 0) {
          html += '<p><strong>Atividades Práticas:</strong></p><ul>';
          data.atividades_praticas.forEach(atividade => {
            if (atividade.nome) {
              html += `<li><strong>${atividade.nome}:</strong> ${atividade.descricao || ''}</li>`;
            }
          });
          html += '</ul>';
        }
        
        if (data.avaliacao_continua && data.avaliacao_continua.ativa) {
          html += '<p><strong>Avaliação Contínua:</strong> Sim</p>';
          if (data.avaliacao_continua.descricao) {
            html += data.avaliacao_continua.descricao;
          }
        }
        
        setTextContent(html);
        onChange(html);
        return;
      }
    } catch (e) {
      // Não é JSON, usar como texto livre
    }

    // Se chegou aqui, é texto livre
    setTextContent(content);
  }, [content]);

  const saveTextContent = (newContent) => {
    setTextContent(newContent);
    onChange(newContent);
  };

  return (
    <div className="methodology-manager">
      <TiptapEditor
        content={textContent}
        onChange={saveTextContent}
        showCharCount={true}
      />
      <p className="editor-note">
        💡 Nota: Use a barra de ferramentas para formatar texto, criar listas e inserir tabelas.
      </p>
    </div>
  );
};

export default MethodologyManager;
