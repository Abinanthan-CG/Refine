import React, { useEffect, useRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import type { PartialBlock } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import { useAppStore } from '../../store/appStore';
import './Editor.css';

interface EditorProps {
  pageId: string;
  initialContent?: PartialBlock[];
}

export const Editor: React.FC<EditorProps> = ({ pageId, initialContent }) => {
  const updateNodeContent = useAppStore((state) => state.updateNodeContent);
  const debounceTimerRef = useRef<number | null>(null);

  const editor = useCreateBlockNote({
    initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
  });

  const handleChange = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = window.setTimeout(() => {
      updateNodeContent(pageId, editor.document);
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
      <BlockNoteView
        editor={editor}
        theme="dark"
        onChange={handleChange}
        className="refine-blocknote"
      />
    </div>
  );
};
