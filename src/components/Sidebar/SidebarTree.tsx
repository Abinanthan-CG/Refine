import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { TreeNode } from './TreeNode';

export const SidebarTree: React.FC = () => {
  const { nodes, moveNode, activePageId, setActivePage } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const rootNodes = useMemo(() => {
    return nodes.filter(n => n.parentId === null);
  }, [nodes]);

  const favoritePages = useMemo(() => {
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

  return (
    <div 
      className={`sidebar-tree ${isDragOver ? 'drag-over-root' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ minHeight: '100px', paddingBottom: '2rem' }}
    >
      {favoritePages.length > 0 && (
        <div className="sidebar-favorites-section">
          <div className="favorites-header-title">★ Favorites</div>
          {favoritePages.map(page => (
            <div 
              key={`fav-${page.id}`}
              className={`favorite-item ${activePageId === page.id ? 'active' : ''}`}
              onClick={() => setActivePage(page.id)}
            >
              <span className="favorite-icon">{page.icon || (page.pageType === 'canvas' ? "🎨" : "📄")}</span>
              <span className="favorite-title">{page.title}</span>
            </div>
          ))}
          <div className="favorites-divider"></div>
        </div>
      )}

      {rootNodes.length === 0 ? (
        <div className="empty-tree">No pages yet.</div>
      ) : (
        rootNodes.map(node => (
          <TreeNode key={node.id} node={node} allNodes={nodes} depth={0} />
        ))
      )}
    </div>
  );
};
