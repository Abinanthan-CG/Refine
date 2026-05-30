import React, { useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useAppStore } from '../../store/appStore';
import './Canvas.css';

interface CanvasProps {
  pageId: string;
  title: string;
}

export const Canvas: React.FC<CanvasProps> = ({ pageId, title }) => {
  const vaultHandle = useAppStore((state) => state.vaultHandle);
  const setSaveStatus = useAppStore((state) => state.setSaveStatus);
  const updateNodeTitle = useAppStore((state) => state.updateNodeTitle);
  const updateNodeIcon = useAppStore((state) => state.updateNodeIcon);
  const node = useAppStore((state) => state.nodes.find((n) => n.id === pageId));

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const lastSavedElementsRef = useRef<string>("");

  const emojis = [
    "🎨", "🖌️", "✏️", "✒️", "✍️", "🧩", "🎯", "⚡", "🌟", "🔥",
    "📝", "📄", "📁", "📂", "📚", "📓", "📖", "💡", "🧠", "🔮",
    "💼", "📅", "✅", "⏳", "📈", "📊", "📌", "🏷️", "🔑", "🔒",
    "🏠", "🧘", "🍽️", "💪", "🌱", "☕", "🧗", "🏃", "🛌", "🔋",
    "🎬", "🎸", "🎮", "📷", "✈️", "🚀", "🌍", "🗺️", "🎭", "🧪",
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

  // Load existing whiteboard data from disk on mount
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (!vaultHandle) {
        setIsLoading(false);
        return;
      }
      try {
        const state = useAppStore.getState();
        const activeNode = state.nodes.find(n => n.id === pageId);
        if (activeNode) {
          const { getUniqueSlug, getDirHandle, readExcalidrawFile } = await import('../../utils/fileSystem');
          const slug = getUniqueSlug(state.nodes, activeNode);
          const dirHandle = await getDirHandle(vaultHandle, state.nodes, activeNode.parentId);
          
          try {
            const fileData = await readExcalidrawFile(dirHandle, `${slug}.excalidraw`);
            if (fileData && active) {
              const parsed = JSON.parse(fileData);
              // Ensure elements array exists in initial data format
              setInitialData({
                elements: parsed.elements || [],
                appState: {
                  ...parsed.appState,
                  theme: 'dark'
                },
                files: parsed.files || {}
              });
              lastSavedElementsRef.current = JSON.stringify(parsed.elements || []);
            }
          } catch (e) {
            // File does not exist yet (new canvas)
          }
        }
      } catch (err) {
        console.error("Failed to load excalidraw data", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    return () => {
      active = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [pageId, vaultHandle]);

  const handleCanvasChange = (elements: readonly any[], appState: any, files: any) => {
    const elementsStr = JSON.stringify(elements);
    if (elementsStr === lastSavedElementsRef.current) {
      return;
    }

    lastSavedElementsRef.current = elementsStr;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      if (vaultHandle) {
        setSaveStatus('saving');
        try {
          const { getUniqueSlug, getDirHandle, saveExcalidrawFile, saveVaultFile } = await import('../../utils/fileSystem');
          const state = useAppStore.getState();
          const activeNode = state.nodes.find(n => n.id === pageId);
          if (!activeNode) return;
          const slug = getUniqueSlug(state.nodes, activeNode);
          const dirHandle = await getDirHandle(vaultHandle, state.nodes, activeNode.parentId);

          // 1. Save excalidraw whiteboard elements & layout
          const canvasData = JSON.stringify({
            elements,
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
              theme: 'dark'
            },
            files
          }, null, 2);
          await saveExcalidrawFile(dirHandle, `${slug}.excalidraw`, canvasData);

          // 2. Save refine node metadata
          const jsonContent = JSON.stringify({
            id: activeNode.id,
            title: activeNode.title || title,
            icon: activeNode.icon,
            isFavorite: activeNode.isFavorite,
            pageType: 'canvas'
          }, null, 2);
          await saveVaultFile(dirHandle, `${slug}.refine.json`, jsonContent);

          setSaveStatus('saved');
        } catch (err) {
          console.error("Failed to save excalidraw whiteboard node to disk", err);
          setSaveStatus('error');
        }
      }
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="canvas-loading-container">
        <div className="canvas-spinner"></div>
        <span>Loading canvas Board...</span>
      </div>
    );
  }

  return (
    <div className="canvas-wrapper">
      <div className="canvas-floating-header">
        <div className="canvas-icon-trigger-wrapper">
          {node?.icon ? (
            <div className="canvas-icon-display" onClick={() => setShowPicker(true)} title="Change icon">
              {node.icon}
            </div>
          ) : (
            <button className="canvas-add-icon-btn" onClick={() => setShowPicker(true)} title="Add icon">
              🎨
            </button>
          )}

          {showPicker && (
            <div className="emoji-picker-panel canvas-emoji-picker" ref={pickerRef}>
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
          className="canvas-floating-title-input"
          value={title}
          onChange={(e) => updateNodeTitle(pageId, e.target.value)}
          placeholder="Untitled Canvas"
        />
      </div>

      <div className="canvas-editor-container">
        <Excalidraw
          theme="dark"
          initialData={initialData || undefined}
          onChange={handleCanvasChange}
        />
      </div>
    </div>
  );
};

export default Canvas;
