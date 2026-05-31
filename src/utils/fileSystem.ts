import type { AppNode } from '../store/appStore';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const generateId = () => Math.random().toString(36).substring(2, 9);

export function getUniqueSlug(nodes: AppNode[], node: AppNode): string {
  const baseSlug = slugify(node.title) || 'untitled';
  let slug = baseSlug;
  let counter = 1;
  
  const siblings = nodes.filter(
    n => n.id !== node.id && n.parentId === node.parentId && n.type === 'page'
  );
  
  while (siblings.some(s => slugify(s.title) === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export function getUniqueFolderTitle(
  nodes: AppNode[],
  title: string,
  parentId: string | null,
  excludeId?: string
): string {
  const baseTitle = title.trim() || 'Untitled Folder';
  let uniqueTitle = baseTitle;
  let counter = 1;
  
  const siblings = nodes.filter(
    n => n.id !== excludeId && n.parentId === parentId && n.type === 'folder'
  );
  
  while (siblings.some(s => s.title.toLowerCase() === uniqueTitle.toLowerCase())) {
    uniqueTitle = `${baseTitle} ${counter}`;
    counter++;
  }
  return uniqueTitle;
}

async function copyDirectory(
  srcDir: FileSystemDirectoryHandle,
  destParentDir: FileSystemDirectoryHandle,
  newName: string
): Promise<FileSystemDirectoryHandle> {
  const destDir = await destParentDir.getDirectoryHandle(newName, { create: true });
  for await (const entry of (srcDir as any).values()) {
    if (entry.kind === 'directory') {
      await copyDirectory(entry as FileSystemDirectoryHandle, destDir, entry.name);
    } else if (entry.kind === 'file') {
      const srcFileHandle = entry as FileSystemFileHandle;
      const destFileHandle = await destDir.getFileHandle(entry.name, { create: true });
      
      const file = await srcFileHandle.getFile();
      const writable = await destFileHandle.createWritable();
      await writable.write(file);
      await writable.close();
    }
  }
  return destDir;
}

export async function getDirHandle(
  vaultHandle: FileSystemDirectoryHandle,
  nodes: AppNode[],
  nodeId: string | null
): Promise<FileSystemDirectoryHandle> {
  if (!nodeId) return vaultHandle;
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return vaultHandle;

  const parentHandle = await getDirHandle(vaultHandle, nodes, node.parentId);
  return await parentHandle.getDirectoryHandle(node.title, { create: true });
}

export async function saveVaultFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  content: string
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function deleteVaultFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<void> {
  try {
    await dirHandle.removeEntry(filename);
  } catch (err) {
    console.warn(`Failed to delete ${filename}`, err);
  }
}

async function walkDirectory(
  dirHandle: FileSystemDirectoryHandle,
  parentId: string | null
): Promise<AppNode[]> {
  const nodes: AppNode[] = [];
  const entries = [];

  for await (const entry of (dirHandle as any).values()) {
    entries.push(entry);
  }

  for (const entry of entries) {
    if (entry.kind === 'directory') {
      const folderId = generateId();
      nodes.push({
        id: folderId,
        type: 'folder',
        title: entry.name,
        parentId,
      });
      const children = await walkDirectory(entry as FileSystemDirectoryHandle, folderId);
      nodes.push(...children);
    }
  }

  // Identify slugs for both refine.json and excalidraw files
  const refineSlugs = new Set<string>();
  const excalidrawEntries = new Map<string, FileSystemFileHandle>();

  for (const entry of entries) {
    if (entry.kind === 'file') {
      if (entry.name.endsWith('.refine.json') && entry.name !== '_refine.manifest.json') {
        refineSlugs.add(entry.name.replace('.refine.json', ''));
      } else if (entry.name.endsWith('.excalidraw')) {
        excalidrawEntries.set(entry.name.replace('.excalidraw', ''), entry as FileSystemFileHandle);
      }
    }
  }

  for (const entry of entries) {
    if (entry.kind === 'file' && entry.name.endsWith('.refine.json') && entry.name !== '_refine.manifest.json') {
      const slug = entry.name.replace('.refine.json', '');
      try {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        
        nodes.push({
          id: parsed.id || generateId(),
          type: 'page',
          title: parsed.title || slug,
          icon: parsed.icon,
          isFavorite: !!parsed.isFavorite,
          parentId,
          content: parsed.content,
          pageType: parsed.pageType || 'note',
          createdAt: parsed.createdAt || file.lastModified || Date.now(),
          updatedAt: parsed.updatedAt || file.lastModified || Date.now(),
        });
      } catch (err) {
        console.error(`Error loading file ${entry.name}`, err);
      }
    }
  }

  // Handle standalone .excalidraw nodes (auto-healing scanner)
  for (const [slug, fileHandle] of excalidrawEntries.entries()) {
    if (!refineSlugs.has(slug)) {
      try {
        const file = await fileHandle.getFile();
        nodes.push({
          id: generateId(),
          type: 'page',
          title: slug,
          parentId,
          pageType: 'canvas',
          createdAt: file.lastModified || Date.now(),
          updatedAt: file.lastModified || Date.now(),
        });
      } catch (err) {
        console.error(`Error auto-initializing standalone canvas for ${fileHandle.name}`, err);
      }
    }
  }

  return nodes;
}

export async function readAllVaultNodes(dirHandle: FileSystemDirectoryHandle): Promise<AppNode[]> {
  try {
    await dirHandle.removeEntry('_refine.manifest.json');
  } catch (e) {}

  return await walkDirectory(dirHandle, null);
}

export async function createFolderOnDisk(
  vaultHandle: FileSystemDirectoryHandle,
  nodes: AppNode[],
  parentId: string | null,
  folderName: string
): Promise<void> {
  const parentHandle = await getDirHandle(vaultHandle, nodes, parentId);
  await parentHandle.getDirectoryHandle(folderName, { create: true });
}

export async function renameNodeOnDisk(
  vaultHandle: FileSystemDirectoryHandle,
  nodes: AppNode[],
  node: AppNode,
  newTitle: string
): Promise<void> {
  const parentHandle = await getDirHandle(vaultHandle, nodes, node.parentId);
  
  if (node.type === 'folder') {
    try {
      const srcDir = await parentHandle.getDirectoryHandle(node.title);
      await copyDirectory(srcDir, parentHandle, newTitle);
      await parentHandle.removeEntry(node.title, { recursive: true });
    } catch (e) {
      console.warn("Folder rename failed", e);
    }
  } else {
    try {
      const oldSlug = getUniqueSlug(nodes, node);
      const tempNode = { ...node, title: newTitle };
      const newSlug = getUniqueSlug(nodes, tempNode);
      
      if (oldSlug !== newSlug) {
        const jsonHandle = await parentHandle.getFileHandle(`${oldSlug}.refine.json`);
        await (jsonHandle as any).move(`${newSlug}.refine.json`);
        
        try {
          const mdHandle = await parentHandle.getFileHandle(`${oldSlug}.md`);
          await (mdHandle as any).move(`${newSlug}.md`);
        } catch (e) {}

        try {
          const excHandle = await parentHandle.getFileHandle(`${oldSlug}.excalidraw`);
          await (excHandle as any).move(`${newSlug}.excalidraw`);
        } catch (e) {}
      }
    } catch (e) {
      console.warn("Native file rename failed", e);
    }
  }
}

export async function moveNodeOnDisk(
  vaultHandle: FileSystemDirectoryHandle,
  nodes: AppNode[],
  node: AppNode,
  oldParentId: string | null,
  newParentId: string | null,
  newTitle?: string
): Promise<void> {
  const oldParentHandle = await getDirHandle(vaultHandle, nodes, oldParentId);
  const newParentHandle = await getDirHandle(vaultHandle, nodes, newParentId);
  const targetTitle = newTitle || node.title;
  
  if (node.type === 'folder') {
    try {
      const srcDir = await oldParentHandle.getDirectoryHandle(node.title);
      await copyDirectory(srcDir, newParentHandle, targetTitle);
      await oldParentHandle.removeEntry(node.title, { recursive: true });
    } catch (e) {
      console.warn("Folder move failed", e);
    }
  } else {
    try {
      const oldSlug = getUniqueSlug(nodes, node);
      const tempNode = { ...node, parentId: newParentId, title: targetTitle };
      const newSlug = getUniqueSlug(nodes, tempNode);
      
      const jsonHandle = await oldParentHandle.getFileHandle(`${oldSlug}.refine.json`);
      await (jsonHandle as any).move(newParentHandle, `${newSlug}.refine.json`);
      
      try {
        const mdHandle = await oldParentHandle.getFileHandle(`${oldSlug}.md`);
        await (mdHandle as any).move(newParentHandle, `${newSlug}.md`);
      } catch (e) {}

      try {
        const excHandle = await oldParentHandle.getFileHandle(`${oldSlug}.excalidraw`);
        await (excHandle as any).move(newParentHandle, `${newSlug}.excalidraw`);
      } catch (e) {}
    } catch (e) {
      console.warn("Native file move failed", e);
    }
  }
}

export async function deleteNodeOnDisk(
  vaultHandle: FileSystemDirectoryHandle,
  nodes: AppNode[],
  node: AppNode
): Promise<void> {
  const parentHandle = await getDirHandle(vaultHandle, nodes, node.parentId);
  if (node.type === 'folder') {
    try {
      await parentHandle.removeEntry(node.title, { recursive: true });
    } catch (e) {
      console.warn("Failed to delete folder", e);
    }
  } else {
    const slug = getUniqueSlug(nodes, node);
    deleteVaultFile(parentHandle, `${slug}.refine.json`);
    deleteVaultFile(parentHandle, `${slug}.md`);
    deleteVaultFile(parentHandle, `${slug}.excalidraw`);
  }
}

export async function saveExcalidrawFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  data: string
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

export async function readExcalidrawFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<string> {
  const fileHandle = await dirHandle.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return await file.text();
}
