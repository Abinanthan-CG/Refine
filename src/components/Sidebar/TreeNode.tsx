import React, { useState, useRef, useEffect } from 'react';
import { type AppNode, useAppStore } from '../../store/appStore';
import './TreeNode.css';

interface TreeNodeProps {
  node: AppNode;
  allNodes: AppNode[];
  depth: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node, allNodes, depth }) => {
  const { activePageId, setActivePage, toggleFolder, updateNodeTitle, editingNodeId, setEditingNodeId, moveNode } = useAppStore();
  const [editTitle, setEditTitle] = useState(node.title);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFolder = node.type === 'folder';
  const isActive = activePageId === node.id;
  const isEditing = editingNodeId === node.id;
  const children = allNodes.filter(n => n.parentId === node.id);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
  };

  const handleBlur = () => {
    setEditingNodeId(null);
    if (editTitle.trim() && editTitle !== node.title) {
      updateNodeTitle(node.id, editTitle.trim());
    } else {
      setEditTitle(node.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditingNodeId(null);
      setEditTitle(node.title);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      toggleFolder(node.id);
    } else {
      setActivePage(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const event = new CustomEvent('app-context-menu', {
      detail: { x: e.clientX, y: e.clientY, nodeId: node.id }
    });
    window.dispatchEvent(event);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    if (!isFolder) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== node.id) {
      moveNode(draggedId, node.id);
    }
  };

  return (
    <>
      <div 
        className={`tree-node ${isActive ? 'active' : ''} ${isFolder ? 'folder' : 'page'} ${isDragOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="node-icon">
          {isFolder ? (
            <svg 
              className={`folder-arrow ${node.isExpanded ? 'expanded' : ''}`}
              viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          )}
        </div>
        
        {isEditing ? (
          <input
            ref={inputRef}
            className="node-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="node-title">{node.title}</span>
        )}
      </div>

      {isFolder && node.isExpanded && children.length > 0 && (
        <div className="node-children">
          {/* Subtle line connector logic can be added here or via CSS */}
          <div className="connector-line" style={{ left: `${depth * 12 + 22}px` }}></div>
          {children.map(childNode => (
            <TreeNode 
              key={childNode.id} 
              node={childNode} 
              allNodes={allNodes} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </>
  );
};
