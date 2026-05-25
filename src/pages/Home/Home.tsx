import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useAppStore } from '../../store/appStore';
import { Editor } from '../../components/Editor/Editor';
import './Home.css';

export const Home: React.FC = () => {
  const { activePageId, nodes } = useAppStore();

  const activePage = nodes.find(
    (n) => n.id === activePageId && n.type === 'page'
  );

  if (!activePage) {
    return (
      <div className="home-container empty-state">
        <div className="logo-container animate-float">
          <div className="large-logo">R</div>
        </div>
        <h1 className="brand-name gradient-text">Refine</h1>
        <p className="description">Select a page or create a new one</p>
      </div>
    );
  }

  return (
    <div className="home-container editor-view">
      <ErrorBoundary fallbackRender={({ error }) => (
        <div style={{ padding: '2rem', color: 'red' }}>
          <h2>Editor Crashed!</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(error)}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{(error as Error).stack}</pre>
        </div>
      )}>
        <Editor key={activePage.id} pageId={activePage.id} initialContent={activePage.content} title={activePage.title} />
      </ErrorBoundary>
    </div>
  );
};

export default Home;
