import React, { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { TreeNode } from './TreeNode';

export const SidebarTree: React.FC = () => {
  const nodes = useAppStore((state) => state.nodes);

  const rootNodes = useMemo(() => {
    return nodes.filter(n => n.parentId === null);
  }, [nodes]);

  if (rootNodes.length === 0) {
    return <div className="empty-tree">No pages yet.</div>;
  }

  return (
    <div className="sidebar-tree">
      {rootNodes.map(node => (
        <TreeNode key={node.id} node={node} allNodes={nodes} depth={0} />
      ))}
    </div>
  );
};
