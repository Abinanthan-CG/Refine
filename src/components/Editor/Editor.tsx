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




function extractPlainText(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  let text = '';
  for (const block of blocks) {
    if (block.content) {
      if (typeof block.content === 'string') {
        text += block.content + ' ';
      } else if (Array.isArray(block.content)) {
        for (const inline of block.content) {
          if (inline.text) {
            text += inline.text + ' ';
          }
        }
      }
    }
    if (block.children && Array.isArray(block.children)) {
      text += extractPlainText(block.children) + ' ';
    }
  }
  return text;
}

function getRelativeFilePath(nodes: any[], activeNode: any): string {
  if (!activeNode) return '';
  const pathParts: string[] = [activeNode.title];
  
  let currentParentId = activeNode.parentId;
  while (currentParentId) {
    const parentNode = nodes.find(n => n.id === currentParentId);
    if (parentNode) {
      pathParts.unshift(parentNode.title);
      currentParentId = parentNode.parentId;
    } else {
      break;
    }
  }
  
  return pathParts.join(' / ');
}

function formatLastEdited(timestamp?: number): string {
  if (!timestamp) return 'just now';
  const diff = Date.now() - timestamp;
  if (diff < 10000) return 'just now';
  if (diff < 60000) return 'less than a minute ago';
  
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

export const Editor: React.FC<EditorProps> = ({ pageId, initialContent, title }) => {
  const updateNodeContent = useAppStore((state) => state.updateNodeContent);
  const updateNodeTitle = useAppStore((state) => state.updateNodeTitle);
  const vaultHandle = useAppStore((state) => state.vaultHandle);
  const setSaveStatus = useAppStore((state) => state.setSaveStatus);
  const searchHighlight = useAppStore((state) => state.searchHighlight);
  const setSearchHighlight = useAppStore((state) => state.setSearchHighlight);
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
  }, [pageId]);

  const handleChange = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (statsDebounceRef.current) {
      clearTimeout(statsDebounceRef.current);
    }
    
    statsDebounceRef.current = window.setTimeout(() => {
      const textContent = extractPlainText(editor.document);
      const charVal = textContent.length;
      const wordVal = textContent.trim().split(/\s+/).filter(w => w.length > 0).length;
      setWordCount(wordVal);
      setCharCount(charVal);
    }, 1000);
    
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
          
          const jsonContent = JSON.stringify({
            id: node.id,
            title: node.title || title,
            icon: node.icon,
            isFavorite: node.isFavorite,
            pageType: node.pageType || 'note',
            createdAt: node.createdAt,
            updatedAt: node.updatedAt,
            content
          }, null, 2);
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

  useEffect(() => {
    if (!searchHighlight || !editorContainerRef.current) return;
    
    const container = editorContainerRef.current;
    let clearHighlightFn: (() => void) | null = null;
    
    // We wait 500ms for BlockNote/ProseMirror to fully render the text blocks
    const highlightTimer = setTimeout(() => {
      try {
        if (!container) return;
        
        const term = searchHighlight.toLowerCase();
        const ranges: Range[] = [];
        
        // Walk the text nodes inside the ProseMirror container
        const walk = (node: Node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            // Skip inputs, script/style, picker, or buttons
            if (
              el.tagName === 'INPUT' ||
              el.tagName === 'TEXTAREA' ||
              el.tagName === 'BUTTON' ||
              el.tagName === 'SCRIPT' ||
              el.tagName === 'STYLE' ||
              el.classList.contains('emoji-picker-panel') ||
              el.classList.contains('editor-add-icon-btn')
            ) {
              return;
            }
          }
          
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue || '';
            let index = text.toLowerCase().indexOf(term);
            while (index !== -1) {
              try {
                const range = new Range();
                range.setStart(node, index);
                range.setEnd(node, index + term.length);
                ranges.push(range);
              } catch (e) {}
              index = text.toLowerCase().indexOf(term, index + term.length);
            }
          } else {
            const childNodes = Array.from(node.childNodes);
            for (const child of childNodes) {
              walk(child);
            }
          }
        };
        
        // Start walk inside editorContainer
        walk(container);
        
        if (ranges.length > 0) {
          clearHighlightFn = () => {
            try {
              if (typeof (CSS as any).highlights !== 'undefined') {
                (CSS as any).highlights.delete('search-highlight');
              }
            } catch (e) {}
            try {
              window.getSelection()?.removeAllRanges();
            } catch (e) {}
            setSearchHighlight(null);
          };
          
          container.addEventListener('click', clearHighlightFn, { once: true });
          
          // Apply native Custom Highlight API if supported
          if (typeof (CSS as any).highlights !== 'undefined') {
            const highlight = new (window as any).Highlight(...ranges);
            (CSS as any).highlights.set('search-highlight', highlight);
            
            // Smoothly scroll the first match into view
            try {
              const firstParent = ranges[0].startContainer.parentElement;
              if (firstParent) {
                firstParent.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            } catch (scrollErr) {}
          } else {
            // Fallback to native window.find selection if CSS Highlights are not supported
            try {
              (window as any).find(searchHighlight, false, false, true, false, false, false);
            } catch (err) {}
          }
        } else {
          setSearchHighlight(null);
        }
      } catch (err) {
        console.warn('Failed to perform CSS Custom Highlight', err);
        setSearchHighlight(null);
      }
    }, 500);

    return () => {
      clearTimeout(highlightTimer);
      if (clearHighlightFn && container) {
        container.removeEventListener('click', clearHighlightFn);
      }
      try {
        if (typeof (CSS as any).highlights !== 'undefined') {
          (CSS as any).highlights.delete('search-highlight');
        }
      } catch (e) {}
      try {
        window.getSelection()?.removeAllRanges();
      } catch (e) {}
    };
  }, [pageId, searchHighlight, setSearchHighlight]);

  const node = useAppStore(state => state.nodes.find(n => n.id === pageId));
  const updateNodeIcon = useAppStore(state => state.updateNodeIcon);
  const setActivePage = useAppStore(state => state.setActivePage);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const nodes = useAppStore(state => state.nodes);
  const [isExpanded, setIsExpanded] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const statsDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial stats computation on page change
    const textContent = extractPlainText(editor.document);
    const charVal = textContent.length;
    const wordVal = textContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(wordVal);
    setCharCount(charVal);
    
    // Collapse on page switch
    setIsExpanded(false);
  }, [pageId]);

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

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('#refine-')) {
          e.preventDefault();
          e.stopPropagation();
          const pageId = href.replace('#refine-', '');
          setActivePage(pageId);
        }
      }
    };

    // Override window.open to intercept programmatic link clicks (e.g. from the BlockNote popover Open Link button)
    const originalOpen = window.open;
    window.open = function(url, _target, _features) {
      if (url) {
        const urlStr = typeof url === 'string' ? url : url.toString();
        const decUrl = decodeURIComponent(urlStr);
        const matchIndex = decUrl.indexOf('#refine-');
        if (matchIndex !== -1) {
          const targetPageId = decUrl.slice(matchIndex + '#refine-'.length).split(/[/?#]/)[0];
          setActivePage(targetPageId);
          return null;
        }
      }
      return originalOpen.apply(this, arguments as any);
    };

    const container = editorContainerRef.current;
    if (container) {
      container.addEventListener('click', handleLinkClick, { capture: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('click', handleLinkClick, { capture: true });
      }
      window.open = originalOpen;
    };
  }, [setActivePage]);



  const getWikilinkItems = (query: string) => {
    if (!query.startsWith('[')) return [];
    const filterQuery = query.slice(1).toLowerCase();
    
    const pages = useAppStore.getState().nodes.filter(n => n.type === 'page');
    const filteredPages = pages.filter(p => p.title.toLowerCase().includes(filterQuery)).slice(0, 6);
    
    return filteredPages.map(page => ({
      title: page.title,
      icon: <span style={{ fontSize: '0.95rem' }}>{page.icon || "📄"}</span>,
      onItemClick: () => {
        editor.insertInlineContent([
          {
            type: "link",
            content: [{ type: "text", text: page.title, styles: {} }],
            href: `#refine-${page.id}`,
          },
        ]);
      }
    }));
  };

  return (
    <div className="editor-wrapper" ref={editorContainerRef}>
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

      {/* Document Info Collapsible Panel */}
      <div className="document-info-section">
        <button 
          className="document-info-toggle" 
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <svg 
            className={`document-info-chevron ${isExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24" 
            width="12" 
            height="12" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            fill="none"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <span>
            {wordCount} words · Last edited {formatLastEdited(node?.updatedAt)}
          </span>
        </button>
        
        <div className={`document-info-panel-wrapper ${isExpanded ? 'expanded' : ''}`}>
          <div className="document-info-panel">
            <div className="document-info-grid">
              <div className="document-info-item">
                <span className="document-info-label">Words</span>
                <span className="document-info-value">{wordCount}</span>
              </div>
              <div className="document-info-item">
                <span className="document-info-label">Characters</span>
                <span className="document-info-value">{charCount}</span>
              </div>
              <div className="document-info-item">
                <span className="document-info-label">Reading Time</span>
                <span className="document-info-value">{Math.max(1, Math.round(wordCount / 200))} min read</span>
              </div>
              <div className="document-info-item">
                <span className="document-info-label">File Path</span>
                <span className="document-info-value" title={getRelativeFilePath(nodes, node)}>
                  {getRelativeFilePath(nodes, node)}
                </span>
              </div>
              <div className="document-info-item">
                <span className="document-info-label">Created Date</span>
                <span className="document-info-value">
                  {node?.createdAt ? new Date(node.createdAt).toLocaleString() : 'Unknown'}
                </span>
              </div>
              <div className="document-info-item">
                <span className="document-info-label">Last Edited</span>
                <span className="document-info-value">
                  {node?.updatedAt ? new Date(node.updatedAt).toLocaleString() : 'Just now'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div 
        className="refine-blocknote-wrapper"
        onClickCapture={(e) => {
          const anchor = (e.target as HTMLElement).closest('a');
          if (anchor?.href?.includes('#refine-')) {
            e.preventDefault();
            e.stopPropagation();
            const pageId = anchor.href.split('#refine-')[1];
            setActivePage(pageId);
          }
        }}
      >
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
          <SuggestionMenuController
            triggerCharacter={"["}
            getItems={async (query) => getWikilinkItems(query)}
          />
        </BlockNoteView>
      </div>
    </div>
  );
};
