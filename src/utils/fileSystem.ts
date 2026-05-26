import type { AppNode } from '../store/appStore';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Swap spaces and underscores for hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export const generateId = () => Math.random().toString(36).substring(2, 9);

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

export async function readAllVaultNodes(dirHandle: FileSystemDirectoryHandle): Promise<AppNode[]> {
  const nodes: AppNode[] = [];
  const files = new Map<string, FileSystemFileHandle>();
  
  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'file') {
      files.set(entry.name, entry as FileSystemFileHandle);
    }
  }

  for (const [name, handle] of files.entries()) {
    if (name.endsWith('.md')) {
      const slug = name.replace('.md', '');
      const jsonName = `${slug}.refine.json`;
      
      let title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); // Capitalize slug as fallback title
      let contentJson = undefined;
      
      try {
        if (files.has(jsonName)) {
          const jsonFile = await files.get(jsonName)!.getFile();
          const jsonText = await jsonFile.text();
          const parsed = JSON.parse(jsonText);
          title = parsed.title || title;
          contentJson = parsed.content;
        } else {
          // Only MD file exists.
          // BlockNoteEditor has a tryParseMarkdownToBlocks which will be used in Editor if content is undefined.
          // But actually, if we want to store raw markdown in the node, we can't cleanly, as `content` is PartialBlock[].
          // We will just leave content undefined, and when the Editor loads it, it will be empty.
          // In a real app we'd parse the markdown file here or in a helper.
          // Let's at least grab the title if it starts with #
          const mdFile = await handle.getFile();
          const mdText = await mdFile.text();
          const firstLine = mdText.split('\n')[0];
          if (firstLine && firstLine.startsWith('# ')) {
             title = firstLine.substring(2).trim();
          }
        }
        
        nodes.push({
          id: generateId(),
          type: 'page',
          title: title,
          parentId: null, // Flat structure
          content: contentJson,
        });
      } catch (err) {
        console.error(`Error loading node for ${name}`, err);
      }
    }
  }

  return nodes;
}
