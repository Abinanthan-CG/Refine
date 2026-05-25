import { create } from 'zustand';

export type NodeType = 'page' | 'folder';

export interface AppNode {
  id: string;
  type: NodeType;
  title: string;
  parentId: string | null;
  isExpanded?: boolean;
}

interface AppState {
  isSidebarOpen: boolean;
  activePageId: string | null;
  editingNodeId: string | null;
  nodes: AppNode[];
  toggleSidebar: () => void;
  setActivePage: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  addNode: (node: Omit<AppNode, 'id'>) => string; // Returns the generated ID
  updateNodeTitle: (id: string, newTitle: string) => void;
  deleteNode: (id: string) => void;
  toggleFolder: (id: string) => void;
}

// Helper to generate a simple ID (could use uuid in the future)
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to get all descendant IDs of a folder to delete them recursively
const getDescendantIds = (nodes: AppNode[], parentId: string): string[] => {
  const children = nodes.filter((n) => n.parentId === parentId);
  let ids = children.map((c) => c.id);
  for (const child of children) {
    if (child.type === 'folder') {
      ids = [...ids, ...getDescendantIds(nodes, child.id)];
    }
  }
  return ids;
};

// Initial mock data to show the nested tree
const initialNodes: AppNode[] = [
  { id: '1', type: 'folder', title: 'Personal', parentId: null, isExpanded: true },
  { id: '2', type: 'page', title: 'Tasks', parentId: '1' },
  { id: '3', type: 'page', title: 'Journal', parentId: '1' },
  { id: '4', type: 'folder', title: 'Work', parentId: null, isExpanded: true },
  { id: '5', type: 'folder', title: 'Projects', parentId: '4', isExpanded: false },
  { id: '6', type: 'page', title: 'Refine MVP', parentId: '5' },
  { id: '7', type: 'page', title: 'Meeting Notes', parentId: '4' },
];

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  activePageId: '6',
  editingNodeId: null,
  nodes: initialNodes,

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setActivePage: (id) =>
    set({ activePageId: id }),

  setEditingNodeId: (id) =>
    set({ editingNodeId: id }),

  addNode: (nodeData) => {
    const newId = generateId();
    const newNode: AppNode = { ...nodeData, id: newId };
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
    return newId;
  },

  updateNodeTitle: (id, newTitle) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, title: newTitle } : n
      ),
    })),

  deleteNode: (id) =>
    set((state) => {
      const nodeToDelete = state.nodes.find((n) => n.id === id);
      if (!nodeToDelete) return state;

      const idsToDelete = [id];
      if (nodeToDelete.type === 'folder') {
        idsToDelete.push(...getDescendantIds(state.nodes, id));
      }

      return {
        nodes: state.nodes.filter((n) => !idsToDelete.includes(n.id)),
        activePageId: idsToDelete.includes(state.activePageId || '')
          ? null
          : state.activePageId,
      };
    }),

  toggleFolder: (id) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id && n.type === 'folder'
          ? { ...n, isExpanded: !n.isExpanded }
          : n
      ),
    })),
}));
