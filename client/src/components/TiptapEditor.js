import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import './TiptapEditor.css';

const TiptapEditor = ({ content, onChange, showCharCount = false }) => {
  const fileInputRef = React.useRef(null);
  const [contextMenu, setContextMenu] = React.useState(null);
  const contextMenuRef = React.useRef(null);
  const menuBarRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  const [isSticky, setIsSticky] = React.useState(false);
  const [charCount, setCharCount] = React.useState(0);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const colorPickerRef = React.useRef(null);

  // Cores disponíveis: cores do tema + vermelho + verde
  const availableColors = [
    { name: 'Preto', value: '#000000' },
    { name: 'Azul Escuro', value: '#235795' },
    { name: 'Azul Claro', value: '#2a6ca8' },
    { name: 'Vermelho', value: '#d32f2f' },
    { name: 'Verde', value: '#388e3c' },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) {
                  return {};
                }
                return {
                  style: attributes.style,
                };
              },
            },
          };
        },
      }),
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) {
                  return {};
                }
                return {
                  style: attributes.style,
                };
              },
            },
          };
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      // Atualizar contador de caracteres (texto puro, sem HTML)
      if (showCharCount) {
        const text = editor.getText();
        setCharCount(text.length);
      }
    },
  });

  // Atualizar conteúdo do editor quando o prop content mudar
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      window.alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      window.alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      editor.chain().focus().setImage({ src: base64 }).run();
    };
    reader.onerror = () => {
      window.alert('Erro ao ler o arquivo.');
    };
    reader.readAsDataURL(file);

    // Reset input
    event.target.value = '';
  };

  const addImageFromUrl = () => {
    const url = window.prompt('URL da imagem:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // Context menu handlers
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Make toolbar sticky/fixed when scrolling
  React.useEffect(() => {
    const handleScroll = () => {
      if (!wrapperRef.current || !menuBarRef.current) return;
      
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      
      // Find the scrollable parent container
      let scrollableParent = wrapperRef.current.parentElement;
      while (scrollableParent && scrollableParent !== document.body) {
        const style = window.getComputedStyle(scrollableParent);
        if (style.overflow === 'auto' || style.overflow === 'scroll' || 
            style.overflowY === 'auto' || style.overflowY === 'scroll') {
          break;
        }
        scrollableParent = scrollableParent.parentElement;
      }
      
      // If toolbar is about to scroll out of view (top of wrapper is above viewport top)
      // or wrapper top is less than a threshold
      const threshold = 10; // pixels from top
      if (wrapperRect.top < threshold) {
        setIsSticky(true);
        // Adjust width to match wrapper width
        if (menuBarRef.current) {
          menuBarRef.current.style.width = `${wrapperRect.width}px`;
          menuBarRef.current.style.left = `${wrapperRect.left}px`;
        }
      } else {
        setIsSticky(false);
        if (menuBarRef.current) {
          menuBarRef.current.style.width = 'auto';
          menuBarRef.current.style.left = 'auto';
        }
      }
    };

    // Listen to scroll on window and potential scroll containers
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('scroll', handleScroll, true);
    handleScroll(); // Initial check
    
    // Also check on resize
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Close context menu and color picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        closeContextMenu();
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target) && 
          !e.target.closest('.color-picker-wrapper')) {
        setShowColorPicker(false);
      }
    };

    if (contextMenu || showColorPicker) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
      };
    }
  }, [contextMenu, showColorPicker]);

  // Context menu actions
  const handleCut = () => {
    const { state } = editor;
    const { selection } = state;
    if (!selection.empty) {
      navigator.clipboard.writeText(state.doc.textBetween(selection.from, selection.to));
      editor.chain().focus().deleteSelection().run();
    }
    closeContextMenu();
  };

  const handleCopy = async () => {
    const { state } = editor;
    const { selection } = state;
    if (!selection.empty) {
      try {
        await navigator.clipboard.writeText(state.doc.textBetween(selection.from, selection.to));
      } catch (err) {
        // Fallback for older browsers
        const text = state.doc.textBetween(selection.from, selection.to);
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
    closeContextMenu();
  };

  const handlePaste = async () => {
    editor.chain().focus().run();
    // Trigger paste event - browser handles it
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(pasteEvent);
    closeContextMenu();
  };

  const handleSelectAll = () => {
    editor.chain().focus().selectAll().run();
    closeContextMenu();
  };

  const handleUndo = () => {
    editor.chain().focus().undo().run();
    closeContextMenu();
  };

  const handleRedo = () => {
    editor.chain().focus().redo().run();
    closeContextMenu();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`tiptap-wrapper ${isSticky ? 'toolbar-fixed' : ''}`} ref={wrapperRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <div 
        className={`tiptap-menu-bar ${isSticky ? 'is-fixed' : ''}`}
        ref={menuBarRef}
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          type="button"
          title="Negrito (Ctrl+B)"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          type="button"
          title="Itálico (Ctrl+I)"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
          type="button"
          title="Sublinhado (Ctrl+U)"
        >
          U
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          type="button"
          title="Riscado"
        >
          S
        </button>
        <div className="divider"></div>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          type="button"
          title="Título 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          type="button"
          title="Título 2"
        >
          H2
        </button>
        <div className="divider"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          type="button"
          title="Lista com marcadores"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          type="button"
          title="Lista numerada"
        >
          1.
        </button>
        <div className="divider"></div>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          type="button"
          title="Citação"
        >
          "
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          type="button"
          title="Linha horizontal"
        >
          ―
        </button>
        <div className="divider"></div>
        <div className="color-picker-wrapper">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            type="button"
            title="Cor do texto"
            className={editor.isActive('textStyle', { color: /^#(?!000000)/ }) ? 'is-active' : ''}
          >
            <span style={{ color: '#235795' }}>A</span>
          </button>
          {showColorPicker && (
            <div className="color-picker-dropdown" ref={colorPickerRef}>
              {availableColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className="color-option"
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    if (color.value === '#000000') {
                      // Remover cor (voltar ao padrão)
                      editor.chain().focus().unsetColor().run();
                    } else {
                      editor.chain().focus().setColor(color.value).run();
                    }
                    setShowColorPicker(false);
                  }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
        <div className="divider"></div>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          type="button"
          title="Desfazer (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          type="button"
          title="Refazer (Ctrl+Y)"
        >
          ↷
        </button>
        <div className="divider"></div>
        <button
          onClick={addLink}
          type="button"
          title="Adicionar link"
        >
          🔗 Link
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          type="button"
          title="Upload de imagem do computador"
        >
          📤 Upload
        </button>
        <button
          onClick={addImageFromUrl}
          type="button"
          title="Imagem de URL externa"
        >
          🖼️ Imagem URL
        </button>
        <div className="divider"></div>
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run()}
          type="button"
          title="Inserir tabela"
        >
          📊 Tabela
        </button>
        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          type="button"
          title="Adicionar coluna"
        >
          + Coluna
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.can().deleteColumn()}
          type="button"
          title="Remover coluna"
        >
          − Coluna
        </button>
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter()}
          type="button"
          title="Adicionar linha"
        >
          + Linha
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.can().deleteRow()}
          type="button"
          title="Remover linha"
        >
          − Linha
        </button>
        <button
          onClick={() => {
            const { $anchor } = editor.state.selection;
            const cell = $anchor.node(-1);
            const cellType = cell?.type?.name;
            if (cellType === 'tableCell' || cellType === 'tableHeader') {
              editor.chain().focus().updateAttributes(cellType, { style: 'text-align: left;' }).run();
            }
          }}
          type="button"
          title="Alinhar à esquerda"
        >
          ⬅
        </button>
        <button
          onClick={() => {
            const { $anchor } = editor.state.selection;
            const cell = $anchor.node(-1);
            const cellType = cell?.type?.name;
            if (cellType === 'tableCell' || cellType === 'tableHeader') {
              editor.chain().focus().updateAttributes(cellType, { style: 'text-align: center;' }).run();
            }
          }}
          type="button"
          title="Alinhar ao centro"
        >
          ⬌
        </button>
        <button
          onClick={() => {
            const { $anchor } = editor.state.selection;
            const cell = $anchor.node(-1);
            const cellType = cell?.type?.name;
            if (cellType === 'tableCell' || cellType === 'tableHeader') {
              editor.chain().focus().updateAttributes(cellType, { style: 'text-align: right;' }).run();
            }
          }}
          type="button"
          title="Alinhar à direita"
        >
          ➡
        </button>
      </div>
      <div 
        className="tiptap-editor-content"
        onContextMenu={handleContextMenu}
      >
        <EditorContent editor={editor} />
      </div>
      {showCharCount && (
        <div className="char-count">
          {charCount.toLocaleString()} {charCount === 1 ? 'caractere' : 'caracteres'}
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="context-menu-item" onClick={handleCut}>
            <span>✂️</span> Recortar
          </div>
          <div className="context-menu-item" onClick={handleCopy}>
            <span>📋</span> Copiar
          </div>
          <div className="context-menu-item" onClick={handlePaste}>
            <span>📄</span> Colar
          </div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-item" onClick={handleSelectAll}>
            <span>☑️</span> Selecionar Tudo
          </div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-item" onClick={handleUndo}>
            <span>↶</span> Desfazer
          </div>
          <div className="context-menu-item" onClick={handleRedo}>
            <span>↷</span> Refazer
          </div>
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;

