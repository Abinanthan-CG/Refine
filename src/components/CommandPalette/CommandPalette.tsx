import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import { getDirHandle, getUniqueSlug } from '../../utils/fileSystem';
import './CommandPalette.css';

interface SearchResult {
  page: any;
  breadcrumb: string;
  titleText: string;
  contentText: string;
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
  return text.trim();
}

function getBreadcrumb(nodes: any[], parentId: string | null): string {
  if (!parentId) return '';
  const path: string[] = [];
  let currentId: string | null = parentId;
  while (currentId) {
    const parentNode = nodes.find(n => n.id === currentId);
    if (parentNode) {
      path.unshift(parentNode.title);
      currentId = parentNode.parentId;
    } else {
      break;
    }
  }
  return path.join(' / ');
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text: string, query: string) {
  if (!query) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="search-highlight">{part}</mark>
          : part
      )}
    </span>
  );
}

function getContentSnippet(text: string, query: string): { snippet: string } {
  if (!query) return { snippet: text.slice(0, 120) };
  
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return { snippet: text.slice(0, 120) };
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, start + 120);
  let snippet = text.slice(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return { snippet };
}

export const CommandPalette: React.FC = () => {
  const { nodes, vaultHandle, setActivePage } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    const handleOpenTrigger = () => setIsOpen(true);
    window.addEventListener('open-command-palette', handleOpenTrigger);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('open-command-palette', handleOpenTrigger);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setSearch('');
      setDebouncedSearch('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!debouncedSearch) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const performSearch = async () => {
      const query = debouncedSearch.toLowerCase();
      const pages = nodes.filter(n => n.type === 'page');
      const searchResults: SearchResult[] = [];

      for (const page of pages) {
        let contentText = '';
        let contentBlocks = page.content;

        if (!contentBlocks && vaultHandle) {
          try {
            const slug = getUniqueSlug(nodes, page);
            const dirHandle = await getDirHandle(vaultHandle, nodes, page.parentId);
            const fileHandle = await dirHandle.getFileHandle(`${slug}.refine.json`);
            const file = await fileHandle.getFile();
            const text = await file.text();
            const parsed = JSON.parse(text);
            contentBlocks = parsed.content;
          } catch (e) {
            try {
              const slug = getUniqueSlug(nodes, page);
              const dirHandle = await getDirHandle(vaultHandle, nodes, page.parentId);
              const fileHandle = await dirHandle.getFileHandle(`${slug}.md`);
              const file = await fileHandle.getFile();
              const text = await file.text();
              contentText = text;
            } catch (err) {}
          }
        }

        if (contentBlocks) {
          contentText = extractPlainText(contentBlocks);
        }

        const titleMatch = page.title.toLowerCase().includes(query);
        const contentMatch = contentText.toLowerCase().includes(query);

        if (titleMatch || contentMatch) {
          searchResults.push({
            page,
            breadcrumb: getBreadcrumb(nodes, page.parentId),
            titleText: page.title,
            contentText,
          });
        }
      }

      setResults(searchResults);
      setSelectedIndex(0);
    };

    performSearch();
  }, [debouncedSearch, nodes, vaultHandle]);

  const handleSelect = (item: SearchResult) => {
    setActivePage(item.page.id);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={handleBackdropClick}>
      <div className="command-palette-container" ref={containerRef}>
        <div className="command-palette-input-wrapper">
          <svg className="command-palette-search-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Search pages and contents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-palette-esc-hint">ESC</kbd>
        </div>
        
        <div className="command-palette-results">
          {search && results.length === 0 ? (
            <div className="command-palette-empty">No matching pages found</div>
          ) : (
            results.map((item, index) => (
              <div
                key={item.page.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-palette-item-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div className="command-palette-item-info">
                  <div className="command-palette-item-header">
                    <span className="command-palette-item-title">
                      {highlightMatch(item.titleText, debouncedSearch)}
                    </span>
                    {item.breadcrumb && (
                      <span className="command-palette-item-breadcrumb">
                        {item.breadcrumb}
                      </span>
                    )}
                  </div>
                  {item.contentText && (
                    <div className="command-palette-item-snippet">
                      {highlightMatch(getContentSnippet(item.contentText, debouncedSearch).snippet, debouncedSearch)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
