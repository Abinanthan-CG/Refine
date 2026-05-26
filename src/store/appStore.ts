import { create } from 'zustand';
import type { PartialBlock } from '@blocknote/core';
import { getVaultHandle, setVaultHandle } from '../utils/indexedDB';
import { readAllVaultNodes, slugify, deleteVaultFile, generateId } from '../utils/fileSystem';

export type NodeType = 'page' | 'folder';

export interface AppNode {
  id: string;
  type: NodeType;
  title: string;
  parentId: string | null;
  isExpanded?: boolean;
  content?: PartialBlock[];
}

interface AppState {
  isSidebarOpen: boolean;
  activePageId: string | null;
  editingNodeId: string | null;
  nodes: AppNode[];
  
  vaultHandle: FileSystemDirectoryHandle | null;
  vaultName: string | null;
  saveStatus: 'saved' | 'saving' | 'error' | null;

  toggleSidebar: () => void;
  setActivePage: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  addNode: (node: Omit<AppNode, 'id'>) => string; 
  updateNodeTitle: (id: string, newTitle: string) => void;
  updateNodeContent: (id: string, content: PartialBlock[]) => void;
  deleteNode: (id: string) => void;
  toggleFolder: (id: string) => void;
  
  initVault: () => Promise<void>;
  promptSelectVault: () => Promise<void>;
  setSaveStatus: (status: 'saved' | 'saving' | 'error' | null) => void;
}

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

// Start with empty nodes, they will be loaded from Vault
const initialNodes: AppNode[] = [];

export const useAppStore = create<AppState>((set, get) => ({
  isSidebarOpen: true,
  activePageId: null,
  editingNodeId: null,
  nodes: initialNodes,
  vaultHandle: null,
  vaultName: null,
  saveStatus: null,

  initVault: async () => {
    try {
      const handle = await getVaultHandle();
      if (handle) {
        // Request permission if needed
        const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          const newPermission = await (handle as any).requestPermission({ mode: 'readwrite' });
          if (newPermission !== 'granted') {
            console.warn('Vault permission denied');
            return;
          }
        }
        
        const vaultNodes = await readAllVaultNodes(handle);
        set({ 
          vaultHandle: handle, 
          vaultName: handle.name,
          nodes: vaultNodes,
          activePageId: vaultNodes.length > 0 ? vaultNodes[0].id : null
        });
      }
    } catch (err) {
      console.error('Failed to init vault', err);
    }
  },

  promptSelectVault: async () => {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await setVaultHandle(handle);
      
      const vaultNodes = await readAllVaultNodes(handle);
      set({ 
        vaultHandle: handle, 
        vaultName: handle.name,
        nodes: vaultNodes,
        activePageId: vaultNodes.length > 0 ? vaultNodes[0].id : null
      });
    } catch (err) {
      console.warn('User cancelled folder picker or it failed', err);
    }
  },

  setSaveStatus: (status) => set({ saveStatus: status }),

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
      activePageId: newId, // Auto-focus new node
    }));
    return newId;
  },

  updateNodeTitle: (id, newTitle) => {
    const state = get();
    const oldNode = state.nodes.find((n) => n.id === id);
    if (oldNode && oldNode.title !== newTitle && state.vaultHandle && oldNode.type === 'page') {
      const oldSlug = slugify(oldNode.title);
      const newSlug = slugify(newTitle);
      
      // If the slug actually changes, delete old files
      if (oldSlug !== newSlug) {
        deleteVaultFile(state.vaultHandle, `${oldSlug}.md`);
        deleteVaultFile(state.vaultHandle, `${oldSlug}.refine.json`);
      }
    }

    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, title: newTitle } : n
      ),
    }));
  },

  updateNodeContent: (id, content) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, content } : n
      ),
    })),

  deleteNode: (id) => {
    const state = get();
    const nodeToDelete = state.nodes.find((n) => n.id === id);
    if (nodeToDelete && state.vaultHandle && nodeToDelete.type === 'page') {
      const slug = slugify(nodeToDelete.title);
      deleteVaultFile(state.vaultHandle, `${slug}.md`);
      deleteVaultFile(state.vaultHandle, `${slug}.refine.json`);
    }

    set((state) => {
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
    });
  },

  toggleFolder: (id) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id && n.type === 'folder'
          ? { ...n, isExpanded: !n.isExpanded }
          : n
      ),
    })),
}));
