import React, { useEffect, useRef } from 'react';
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from '@blocknote/core';
import type { PartialBlock } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import { useAppStore } from '../../store/appStore';
import { QuoteBlock } from './blocks/QuoteBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { EmbedBlock } from './blocks/EmbedBlock';
import { Heading4Block, Heading5Block, Heading6Block } from './blocks/ExtendedHeadings';
import './Editor.css';

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    quote: QuoteBlock,
    codeBlock: CodeBlock,
    embed: EmbedBlock,
    heading4: Heading4Block,
    heading5: Heading5Block,
    heading6: Heading6Block,
  },
});

interface EditorProps {
  pageId: string;
  initialContent?: PartialBlock[];
  title: string;
}

export const Editor: React.FC<EditorProps> = ({ pageId, initialContent, title }) => {
  const updateNodeContent = useAppStore((state) => state.updateNodeContent);
  const updateNodeTitle = useAppStore((state) => state.updateNodeTitle);
  const debounceTimerRef = useRef<number | null>(null);

  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent && initialContent.length > 0 ? (initialContent as any) : undefined,
  });

  const handleChange = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = window.setTimeout(() => {
      updateNodeContent(pageId, editor.document as any);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="editor-wrapper">
      <input
        type="text"
        className="editor-title-input"
        value={title}
        onChange={(e) => updateNodeTitle(pageId, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const editorEl = document.querySelector('.refine-blocknote .ProseMirror') as HTMLElement;
            if (editorEl) editorEl.focus();
          }
        }}
        placeholder="Untitled"
      />
      <BlockNoteView
        editor={editor}
        theme="dark"
        onChange={handleChange}
        className="refine-blocknote"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor),
                {
                  title: "Heading 4",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "heading4" } as any], currentBlock, "after");
                  },
                  aliases: ["h4", "heading 4"],
                  group: "Headings",
                  icon: <span>H4</span>,
                  subtext: "Used for a medium heading."
                },
                {
                  title: "Heading 5",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "heading5" } as any], currentBlock, "after");
                  },
                  aliases: ["h5", "heading 5"],
                  group: "Headings",
                  icon: <span>H5</span>,
                  subtext: "Used for a small heading."
                },
                {
                  title: "Heading 6",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "heading6" } as any], currentBlock, "after");
                  },
                  aliases: ["h6", "heading 6"],
                  group: "Headings",
                  icon: <span>H6</span>,
                  subtext: "Used for the smallest heading."
                },
                {
                  title: "Quote",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "quote" } as any], currentBlock, "after");
                  },
                  aliases: ["blockquote", "quote"],
                  group: "Basic blocks",
                  icon: <span>❞</span>,
                  subtext: "Insert a quote block."
                },
                {
                  title: "Code Block",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "codeBlock" } as any], currentBlock, "after");
                  },
                  aliases: ["code", "pre"],
                  group: "Basic blocks",
                  icon: <span>&lt;/&gt;</span>,
                  subtext: "Insert a code block."
                },
                {
                  title: "Embed",
                  onItemClick: () => {
                    const currentBlock = editor.getTextCursorPosition().block;
                    editor.insertBlocks([{ type: "embed" } as any], currentBlock, "after");
                  },
                  aliases: ["iframe", "video", "embed"],
                  group: "Media",
                  icon: <span>🌐</span>,
                  subtext: "Embed an external URL."
                }
              ],
              query
            )
          }
        />
      </BlockNoteView>
    </div>
  );
};
