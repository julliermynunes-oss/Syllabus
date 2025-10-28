import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import './TiptapEditor.css';

const TiptapEditor = ({ content, onChange }) => {
  const fileInputRef = React.useRef(null);

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
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-wrapper">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <div className="tiptap-menu-bar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          type="button"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          type="button"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
          type="button"
        >
          U
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          type="button"
        >
          S
        </button>
        <div className="divider"></div>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          type="button"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          type="button"
        >
          H2
        </button>
        <div className="divider"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          type="button"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          type="button"
        >
          1.
        </button>
        <div className="divider"></div>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          type="button"
        >
          "
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          type="button"
        >
          ―
        </button>
        <div className="divider"></div>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          type="button"
        >
          ↶
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          type="button"
        >
          ↷
        </button>
        <div className="divider"></div>
        <button
          onClick={addLink}
          type="button"
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
      <div className="tiptap-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;

