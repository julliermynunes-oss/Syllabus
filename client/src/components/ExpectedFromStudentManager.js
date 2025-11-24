import React, { useState, useEffect } from 'react';
import TiptapEditor from './TiptapEditor';
import './ExpectedFromStudentManager.css';

const ExpectedFromStudentManager = ({ content, onChange }) => {
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
      if (parsed.layout === 'checklist' && parsed.categorias) {
        // Converter checklist para HTML
        let html = '<p><strong>O que é Esperado do Aluno:</strong></p>';
        const CATEGORIAS = {
          participacao: 'Participação',
          trabalhos: 'Trabalhos',
          estudos: 'Estudos',
          comportamento: 'Comportamento'
        };
        
        Object.keys(CATEGORIAS).forEach(catKey => {
          const categoria = parsed.categorias[catKey];
          if (categoria) {
            const itensSelecionados = categoria.itens.filter(item => item.selecionado);
            if (itensSelecionados.length > 0 || categoria.outros) {
              html += `<p><strong>${CATEGORIAS[catKey]}:</strong></p><ul>`;
              itensSelecionados.forEach(item => {
                html += `<li>${item.texto}</li>`;
              });
              if (categoria.outros) {
                html += `<li>${categoria.outros}</li>`;
              }
              html += '</ul>';
            }
          }
        });
        
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
    <div className="expected-from-student-manager">
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

export default ExpectedFromStudentManager;
