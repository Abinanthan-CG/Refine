import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { TreeNode } from './TreeNode';

interface SidebarTreeProps {
  activeTab: 'explorer' | 'bookmarks';
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({ activeTab }) => {
  const { nodes, moveNode, activePageId, setActivePage } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const rootNodes = useMemo(() => {
    return nodes.filter(n => n.parentId === null);
  }, [nodes]);

  const bookmarkedPages = useMemo(() => {
    return nodes.filter(n => n.type === 'page' && n.isFavorite);
  }, [nodes]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId) {
      moveNode(draggedId, null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const event = new CustomEvent('app-context-menu', {
      detail: { x: e.clientX, y: e.clientY, nodeId: pageId }
    });
    window.dispatchEvent(event);
  };

  return (
    <div 
      className={`sidebar-tree ${isDragOver ? 'drag-over-root' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem', 
        padding: '0 0.5rem 2rem 0.5rem',
        minHeight: '100px'
      }}
    >
      {activeTab === 'explorer' ? (
        /* 1. Files / Folder Explorer Tab View */
        <div className="sidebar-section">
          <div className="sidebar-section-header static-header">
            <span className="section-title">Files</span>
          </div>

          <div className="section-content" style={{ marginTop: '4px' }}>
            {rootNodes.length === 0 ? (
              <div className="empty-tree">No files or folders yet.</div>
            ) : (
              rootNodes.map(node => (
                <TreeNode key={node.id} node={node} allNodes={nodes} depth={0} />
              ))
            )}
          </div>
        </div>
      ) : (
        /* 2. Bookmarks Tab View */
        <div className="sidebar-section">
          <div className="sidebar-section-header static-header">
            <span className="section-title">Bookmarks</span>
          </div>

          <div className="section-content" style={{ marginTop: '4px' }}>
            {bookmarkedPages.length === 0 ? (
              <div className="empty-tree">No bookmarked pages yet.</div>
            ) : (
              <div className="bookmarks-list">
                {bookmarkedPages.map(page => (
                  <div 
                    key={`book-${page.id}`}
                    className={`bookmark-item ${activePageId === page.id ? 'active' : ''}`}
                    onClick={() => setActivePage(page.id)}
                    onContextMenu={(e) => handleContextMenu(e, page.id)}
                  >
                    <span className="bookmark-icon">{page.icon || (page.pageType === 'canvas' ? "🎨" : "📄")}</span>
                    <span className="bookmark-title">{page.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
