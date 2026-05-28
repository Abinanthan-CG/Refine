import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems, BlockNoteEditor } from '@blocknote/core';
import type { PartialBlock } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import { useAppStore } from '../../store/appStore';
import { QuoteBlock } from './blocks/QuoteBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { EmbedBlock } from './blocks/EmbedBlock';
import { Heading4Block, Heading5Block, Heading6Block } from './blocks/ExtendedHeadings';
import './Editor.css';

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    quote: QuoteBlock,
    codeBlock: CodeBlock,
    embed: EmbedBlock,
    heading4: Heading4Block,
    heading5: Heading5Block,
    heading6: Heading6Block,
  },
});

interface EditorProps {
  pageId: string;
  initialContent?: PartialBlock[];
  title: string;
}

function isValidBlockContent(blocks: any): boolean {
  if (!blocks) return true;
  if (!Array.isArray(blocks)) return false;
  
  try {
    const checkValue = (val: any): boolean => {
      if (val === null || val === undefined) return true;
      if (typeof val === 'number') {
        return !isNaN(val);
      }
      if (typeof val === 'string') {
        return true;
      }
      if (Array.isArray(val)) {
        return val.every(checkValue);
      }
      if (typeof val === 'object') {
        return Object.values(val).every(checkValue);
      }
      return true;
    };

    for (const block of blocks) {
      if (!block || typeof block !== 'object') return false;
      if (!block.id || !block.type) return false;
      
      if (block.props && !checkValue(block.props)) return false;
      if (block.content && !checkValue(block.content)) return false;
      
      if (block.children) {
        if (!isValidBlockContent(block.children)) return false;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

export const Editor: React.FC<EditorProps> = ({ pageId, initialContent, title }) => {
  const updateNodeContent = useAppStore((state) => state.updateNodeContent);
  const updateNodeTitle = useAppStore((state) => state.updateNodeTitle);
  const vaultHandle = useAppStore((state) => state.vaultHandle);
  const setSaveStatus = useAppStore((state) => state.setSaveStatus);
  const debounceTimerRef = useRef<number | null>(null);

  const validatedContent = (() => {
    if (!initialContent || initialContent.length === 0) return undefined;
    try {
      if (isValidBlockContent(initialContent)) {
        return initialContent as any;
      }
      console.warn("Malformed blocks or NaN values detected. Dropped initialContent.");
      return undefined;
    } catch (e) {
      console.warn("Failed to validate initialContent. Dropping.", e);
      return undefined;
    }
  })();

  const editor = useMemo(() => {
    try {
      return BlockNoteEditor.create({
        schema,
        initialContent: validatedContent,
      });
    } catch (e) {
      console.error("BlockNoteEditor.create crashed on initialContent. Falling back to empty editor.", e);
      return BlockNoteEditor.create({
        schema,
        initialContent: undefined,
      });
    }
  }, [pageId, validatedContent]);

  const handleChange = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = window.setTimeout(async () => {
      const content = editor.document as any;
      updateNodeContent(pageId, content);
      
      if (vaultHandle) {
        setSaveStatus('saving');
        try {
          const markdown = await editor.blocksToMarkdownLossy(editor.document);
          const { getUniqueSlug, saveVaultFile, getDirHandle } = await import('../../utils/fileSystem');
          const state = useAppStore.getState();
          const node = state.nodes.find(n => n.id === pageId);
          if (!node) return;
          const slug = getUniqueSlug(state.nodes, node);
          
          const dirHandle = await getDirHandle(vaultHandle, state.nodes, node?.parentId || null);
          
          await saveVaultFile(dirHandle, `${slug}.md`, markdown);
          
          const jsonContent = JSON.stringify({ title: node.title || title, icon: node.icon, isFavorite: node.isFavorite, content }, null, 2);
          await saveVaultFile(dirHandle, `${slug}.refine.json`, jsonContent);
          
          setSaveStatus('saved');
        } catch (err) {
          console.error("Failed to save to vault", err);
          setSaveStatus('error');
        }
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const node = useAppStore(state => state.nodes.find(n => n.id === pageId));
  const updateNodeIcon = useAppStore(state => state.updateNodeIcon);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const emojis = [
    "📝", "📄", "📁", "📂", "📚", "📓", "✏️", "✒️", "✍️", "📖",
    "💡", "🧠", "🎯", "⚡", "🌟", "🔥", "🔮", "🧪", "🔍", "🧩",
    "💼", "📅", "✅", "⏳", "📈", "📊", "📌", "🏷️", "🔑", "🔒",
    "🏠", "🧘", "🍽️", "💪", "🌱", "☕", "🧗", "🏃", "🛌", "🔋",
    "🎨", "🎬", "🎸", "🎮", "📷", "✈️", "🚀", "🌍", "🗺️", "🎭",
    "💻", "📱", "💾", "🔌", "⚙️", "🛠️", "🛸", "🤖", "👾", "✨"
  ];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPicker]);

  return (
    <div className="editor-wrapper">
      <div className="editor-icon-section">
        {node?.icon ? (
          <div className="editor-icon-display" onClick={() => setShowPicker(true)} title="Change icon">
            {node.icon}
          </div>
        ) : (
          <button className="editor-add-icon-btn" onClick={() => setShowPicker(true)}>
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Add icon</span>
          </button>
        )}

        {showPicker && (
          <div className="emoji-picker-panel" ref={pickerRef}>
            <div className="emoji-picker-header">
              <span>Select Icon</span>
              {node?.icon && (
                <button 
                  className="emoji-picker-remove-btn" 
                  onClick={() => {
                    updateNodeIcon(pageId, null);
                    setShowPicker(false);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="emoji-picker-grid">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  className="emoji-picker-btn"
                  onClick={() => {
                    updateNodeIcon(pageId, emoji);
                    setShowPicker(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        type="text"
        className="editor-title-input"
        value={title}
        onChange={(e) => updateNodeTitle(pageId, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const editorEl = document.querySelector('.refine-blocknote .ProseMirror') as HTMLElement;
            if (editorEl) editorEl.focus();
          }
        }}
        placeholder="Untitled"
      />
      <BlockNoteView
        editor={editor}
        theme="dark"
        onChange={handleChange}
        className="refine-blocknote"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor),
                {
                  title: "Heading 4",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "heading4" } as any], currentBlock, "after");
                  },
                  aliases: ["h4", "heading 4"],
                  group: "Headings",
                  icon: <span>H4</span>,
                  subtext: "Used for a medium heading."
                },
                {
                  title: "Heading 5",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "heading5" } as any], currentBlock, "after");
                  },
                  aliases: ["h5", "heading 5"],
                  group: "Headings",
                  icon: <span>H5</span>,
                  subtext: "Used for a small heading."
                },
                {
                  title: "Heading 6",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "heading6" } as any], currentBlock, "after");
                  },
                  aliases: ["h6", "heading 6"],
                  group: "Headings",
                  icon: <span>H6</span>,
                  subtext: "Used for the smallest heading."
                },
                {
                  title: "Quote",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "quote" } as any], currentBlock, "after");
                  },
                  aliases: ["blockquote", "quote"],
                  group: "Basic blocks",
                  icon: <span>❞</span>,
                  subtext: "Insert a quote block."
                },
                {
                  title: "Code Block",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "codeBlock" } as any], currentBlock, "after");
                  },
                  aliases: ["code", "pre"],
                  group: "Basic blocks",
                  icon: <span>&lt;/&gt;</span>,
                  subtext: "Insert a code block."
                },
                {
                  title: "Embed",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "embed" } as any], currentBlock, "after");
                  },
                  aliases: ["iframe", "video", "embed"],
                  group: "Media",
                  icon: <span>🌐</span>,
                  subtext: "Embed an external URL."
                }
              ],
              query
            )
          }
        />
      </BlockNoteView>
    </div>
  );
};
