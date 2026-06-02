import { create } from 'zustand';
import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import type { PartialBlock } from '@blocknote/core';
import { getVaultHandle, setVaultHandle } from '../utils/indexedDB';
import { readAllVaultNodes, generateId, createFolderOnDisk, renameNodeOnDisk, moveNodeOnDisk, deleteNodeOnDisk, getUniqueFolderTitle, getUniqueSlug, getDirHandle, saveVaultFile } from '../utils/fileSystem';
import { logger } from '../utils/logger';

export type NodeType = 'page' | 'folder';
export type PageType = 'note' | 'canvas';

export interface AppNode {
  id: string;
  type: NodeType;
  title: string;
  parentId: string | null;
  isExpanded?: boolean;
  content?: PartialBlock[];
  icon?: string;
  isFavorite?: boolean;
  pageType?: PageType;
  createdAt?: number;
  updatedAt?: number;
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
  addNode: (node: Omit<AppNode, 'id'>) => string | undefined; 
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
  
  searchHighlight: string | null;
  setSearchHighlight: (term: string | null) => void;
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

type StabilityMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>
) => StateCreator<T, Mps, Mcs>;

const stabilityMiddlewareImpl = (f: any) => (set: any, get: any, store: any) => {
  const safeSet = (...args: any[]) => {
    try {
      set(...args);
    } catch (error) {
      logger.logError('Zustand State Update', error);
    }
  };
  
  const initialState = f(safeSet, get, store);
  const safeState = { ...initialState };
  
  for (const key in safeState) {
    if (typeof safeState[key] === 'function') {
      const originalMethod = safeState[key];
      safeState[key] = (...args: any[]) => {
        try {
          const result = originalMethod(...args);
          if (result instanceof Promise) {
            return result.catch(error => {
              logger.logError(`Zustand Async Action (${key})`, error);
            });
          }
          return result;
        } catch (error) {
          logger.logError(`Zustand Action (${key})`, error);
        }
      };
    }
  }
  return safeState;
};

const stabilityMiddleware = stabilityMiddlewareImpl as unknown as StabilityMiddleware;

// Start with empty nodes, they will be loaded from Vault
const initialNodes: AppNode[] = [];

export const useAppStore = create<AppState>()(stabilityMiddleware((set) => ({
  isSidebarOpen: true,
  activePageId: null,
  editingNodeId: null,
  nodes: initialNodes,
  vaultHandle: null,
  vaultName: null,
  saveStatus: null,
  searchHighlight: null,

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
    if (!nodeData.title || typeof nodeData.title !== 'string') {
      logger.logWarning('addNode', 'Invalid or missing title for new node');
      return undefined;
    }
    if (nodeData.type !== 'page' && nodeData.type !== 'folder') {
      logger.logWarning('addNode', `Invalid node type: ${nodeData.type}`);
      return undefined;
    }

    const newId = generateId();
    const now = Date.now();
    let newNode: AppNode = { 
      ...nodeData, 
      id: newId,
      createdAt: now,
      updatedAt: now
    };
    
    set((state: AppState) => {
      if (newNode.type === 'folder') {
        const uniqueTitle = getUniqueFolderTitle(state.nodes, newNode.title, newNode.parentId);
        newNode = { ...newNode, title: uniqueTitle };
        if (state.vaultHandle) {
          createFolderOnDisk(state.vaultHandle, state.nodes, newNode.parentId, newNode.title).catch(e => logger.logError('createFolderOnDisk', e));
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
    set((state: AppState) => {
      const nodeExists = state.nodes.some(n => n.id === id);
      if (!nodeExists) {
        logger.logWarning('updateNodeContent', `Attempted to update content for non-existent node: ${id}`);
        return state;
      }
      return {
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, content, updatedAt: Date.now() } : n
        ),
      };
    }),

  deleteNode: (id) => {
    set((state: AppState) => {
      const nodeToDelete = state.nodes.find((n) => n.id === id);
      if (!nodeToDelete) {
        logger.logWarning('deleteNode', `Attempted to delete non-existent node: ${id}`);
        return state;
      }

      if (state.vaultHandle) {
        deleteNodeOnDisk(state.vaultHandle, state.nodes, nodeToDelete).catch(e => logger.logError('deleteNodeOnDisk', e));
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
      const now = Date.now();
      if (node && state.vaultHandle) {
        const slug = getUniqueSlug(state.nodes, node);
        getDirHandle(state.vaultHandle, state.nodes, node.parentId)
          .then(async (dirHandle) => {
            const sidecarContent = JSON.stringify({
              id: node.id,
              title: node.title,
              icon: icon || undefined,
              isFavorite: node.isFavorite,
              pageType: node.pageType,
              createdAt: node.createdAt,
              updatedAt: now,
              content: node.content
            }, null, 2);
            await saveVaultFile(dirHandle, `${slug}.refine.json`, sidecarContent);
          })
          .catch((e) => console.warn('Failed to save icon to disk', e));
      }
      return {
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, icon: icon || undefined, updatedAt: now } : n
        ),
      };
    });
  },

  toggleFavorite: (id) => {
    set((state) => {
      const node = state.nodes.find((n) => n.id === id);
      const now = Date.now();
      if (node && state.vaultHandle) {
        const slug = getUniqueSlug(state.nodes, node);
        getDirHandle(state.vaultHandle, state.nodes, node.parentId)
          .then(async (dirHandle) => {
            const sidecarContent = JSON.stringify({
              id: node.id,
              title: node.title,
              icon: node.icon,
              isFavorite: !node.isFavorite || undefined,
              pageType: node.pageType,
              createdAt: node.createdAt,
              updatedAt: now,
              content: node.content
            }, null, 2);
            await saveVaultFile(dirHandle, `${slug}.refine.json`, sidecarContent);
          })
          .catch((e) => console.warn('Failed to save favorite toggle to disk', e));
      }
      return {
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, isFavorite: !n.isFavorite, updatedAt: now } : n
        ),
      };
    });
  },
  setSearchHighlight: (term) => set({ searchHighlight: term }),
})));

