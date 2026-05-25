import React from 'react';
import './Excalidraw.css';

export const Excalidraw: React.FC = () => {
  return (
    <div className="excalidraw-container">
      <h2
        style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.03em' }}
        className="gradient-text"
      >
        Excalidraw Board
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.6 }}>
        The whiteboard module is fully scaffolded and the <code>@excalidraw/excalidraw</code>{' '}
        package is successfully locked as a dependency in your project.
      </p>

      <div className="excalidraw-showcase-box glass-panel">
        <div style={{ fontSize: '3rem', color: 'var(--accent-secondary)' }}>✏</div>
        <h3 style={{ fontWeight: 600, fontSize: '1.4rem' }}>Dependency Ready</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.95rem' }}>
          Excalidraw is locked in <code>package.json</code> and ready for structural embedding
          inside this panel at your convenience.
        </p>
      </div>
    </div>
  );
};
export default Excalidraw;
