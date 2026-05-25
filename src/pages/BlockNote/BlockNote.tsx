import React from 'react';
import './BlockNote.css';

export const BlockNote: React.FC = () => {
  return (
    <div className="blocknote-container">
      <h2
        style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.03em' }}
        className="gradient-text"
      >
        BlockNote Workspace
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.6 }}>
        The rich-text Notion-style editor workspace is fully structured. The{' '}
        <code>@blocknote/core</code> and <code>@blocknote/react</code> packages are locked as
        dependencies in your project.
      </p>

      <div className="blocknote-showcase-box glass-panel">
        <div style={{ fontSize: '3rem', color: 'var(--accent-primary)' }}>📝</div>
        <h3 style={{ fontWeight: 600, fontSize: '1.4rem' }}>Workspace Ready</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.95rem' }}>
          BlockNote is locked in <code>package.json</code> and ready for embedding inside this panel
          at your convenience.
        </p>
      </div>
    </div>
  );
};
export default BlockNote;
