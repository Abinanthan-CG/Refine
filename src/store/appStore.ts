import { create } from 'zustand';
import type { PartialBlock } from '@blocknote/core';
import { getVaultHandle, setVaultHandle } from '../utils/indexedDB';
import { readAllVaultNodes, generateId, createFolderOnDisk, renameNodeOnDisk, moveNodeOnDisk, deleteNodeOnDisk, getUniqueFolderTitle, getUniqueSlug, getDirHandle, saveVaultFile } from '../utils/fileSystem';

export type NodeType = 'page' | 'folder';

export interface AppNode {
  id: string;
  type: NodeType;
  title: string;
  parentId: string | null;
  isExpanded?: boolean;
  content?: PartialBlock[];
  icon?: string;
  isFavorite?: boolean;
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
  moveNode: (id: string, newParentId: string | null) => void;
  updateNodeIcon: (id: string, icon: string | null) => void;
  toggleFavorite: (id: string) => void;
  
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

export const useAppStore = create<AppState>((set) => ({
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
    let newNode: AppNode = { ...nodeData, id: newId };
    
    set((state) => {
      if (newNode.type === 'folder') {
        const uniqueTitle = getUniqueFolderTitle(state.nodes, newNode.title, newNode.parentId);
        newNode = { ...newNode, title: uniqueTitle };
        if (state.vaultHandle) {
          createFolderOnDisk(state.vaultHandle, state.nodes, newNode.parentId, newNode.title).catch(e => console.warn(e));
        }
      }
      return {
        nodes: [...state.nodes, newNode],
        activePageId: newId,
      };
    });
    return newId;
  },

  updateNodeTitle: (id, newTitle) => {
    set((state) => {
      const oldNode = state.nodes.find((n) => n.id === id);
      if (!oldNode) return state;

      let titleToUse = newTitle;
      if (oldNode.type === 'folder') {
        titleToUse = getUniqueFolderTitle(state.nodes, newTitle, oldNode.parentId, id);
      }

      if (oldNode.title !== titleToUse && state.vaultHandle) {
        renameNodeOnDisk(state.vaultHandle, state.nodes, oldNode, titleToUse).catch(e => console.warn(e));
      }

      return {
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, title: titleToUse } : n
        ),
      };
    });
  },

  updateNodeContent: (id, content) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, content } : n
      ),
    })),

  deleteNode: (id) => {
    set((state) => {
      const nodeToDelete = state.nodes.find((n) => n.id === id);
      if (!nodeToDelete) return state;

      if (state.vaultHandle) {
        deleteNodeOnDisk(state.vaultHandle, state.nodes, nodeToDelete).catch(e => console.warn(e));
      }

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

  moveNode: (id, newParentId) => {
    set((state) => {
      const nodeToMove = state.nodes.find(n => n.id === id);
      if (!nodeToMove) return state;
      
      if (id === newParentId) return state;
      if (nodeToMove.parentId === newParentId) return state;

      if (nodeToMove.type === 'folder' && newParentId !== null) {
        let currentParent = state.nodes.find(n => n.id === newParentId);
        while (currentParent) {
          if (currentParent.id === id) {
            console.warn('Cannot move folder into its own descendant');
            return state;
          }
          currentParent = state.nodes.find(n => n.id === currentParent?.parentId);
        }
      }

      let finalTitle = nodeToMove.title;
      if (nodeToMove.type === 'folder') {
        finalTitle = getUniqueFolderTitle(state.nodes, nodeToMove.title, newParentId, id);
      }

      if (state.vaultHandle) {
        moveNodeOnDisk(state.vaultHandle, state.nodes, nodeToMove, nodeToMove.parentId, newParentId, finalTitle).catch(e => console.warn(e));
      }

      return {
        nodes: state.nodes.map(n => 
          n.id === id ? { ...n, parentId: newParentId, title: finalTitle } : n
        )
      };
    });
  },

  updateNodeIcon: (id, icon) => {
    set((state) => {
      const node = state.nodes.find((n) => n.id === id);
      if (node && state.vaultHandle) {
        const slug = getUniqueSlug(state.nodes, node);
        getDirHandle(state.vaultHandle, state.nodes, node.parentId)
          .then(async (dirHandle) => {
            const sidecarContent = JSON.stringify({
              id: node.id,
              title: node.title,
              icon: icon || undefined,
              isFavorite: node.isFavorite,
              content: node.content
            }, null, 2);
            await saveVaultFile(dirHandle, `${slug}.refine.json`, sidecarContent);
          })
          .catch((e) => console.warn('Failed to save icon to disk', e));
      }
      return {
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, icon: icon || undefined } : n
        ),
      };
    });
  },

  toggleFavorite: (id) => {
    set((state) => {
      const node = state.nodes.find((n) => n.id === id);
      if (node && state.vaultHandle) {
        const slug = getUniqueSlug(state.nodes, node);
        getDirHandle(state.vaultHandle, state.nodes, node.parentId)
          .then(async (dirHandle) => {
            const sidecarContent = JSON.stringify({
              id: node.id,
              title: node.title,
              icon: node.icon,
              isFavorite: !node.isFavorite || undefined,
              content: node.content
            }, null, 2);
            await saveVaultFile(dirHandle, `${slug}.refine.json`, sidecarContent);
          })
          .catch((e) => console.warn('Failed to save favorite toggle to disk', e));
      }
      return {
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
        ),
      };
    });
  },
}));


