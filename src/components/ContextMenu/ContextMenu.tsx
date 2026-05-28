import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import './ContextMenu.css';

export const ContextMenu: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [nodeId, setNodeId] = useState<string | null>(null);

  const { deleteNode, setEditingNodeId, addNode, nodes } = useAppStore();
  const currentNode = nodes.find(n => n.id === nodeId);
  const isFolder = currentNode?.type === 'folder';

  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      const customEvent = e as CustomEvent;
      setX(customEvent.detail.x);
      setY(customEvent.detail.y);
      setNodeId(customEvent.detail.nodeId);
      setVisible(true);
    };

    const handleClickOutside = () => {
      if (visible) setVisible(false);
    };

    window.addEventListener('app-context-menu', handleContextMenu);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('app-context-menu', handleContextMenu);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [visible]);

  if (!visible || !nodeId) return null;

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeId(nodeId);
    setVisible(false);
  };

  const handleNewPageInside = (e: React.MouseEvent) => {
    e.stopPropagation();
    addNode({ type: 'page', title: 'Untitled', parentId: nodeId });
    setVisible(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(nodeId);
    setVisible(false);
  };

  const style: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 150),
    left: Math.min(x, window.innerWidth - 180),
  };

  return (
    <div className="context-menu" style={style}>
      <button className="context-menu-item" onClick={handleRename}>
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        Rename
      </button>
      {isFolder && (
        <button className="context-menu-item" onClick={handleNewPageInside}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          New Page Inside
        </button>
      )}
      <div className="context-menu-divider"></div>
      <button className="context-menu-item danger" onClick={handleDelete}>
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
        Delete
      </button>
    </div>
  );
};
