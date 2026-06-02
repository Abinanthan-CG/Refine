import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useAppStore } from '../../store/appStore';
import { Editor } from '../../components/Editor/Editor';
import { Canvas } from '../../components/Canvas/Canvas';
import { logger } from '../../utils/logger';
import './Home.css';

const LocalErrorFallback = ({ componentName, error, resetErrorBoundary }: any) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    padding: '40px',
    backgroundColor: 'transparent',
    color: '#e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    <div style={{
      background: 'rgba(139, 92, 246, 0.05)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      padding: '32px',
      borderRadius: '16px',
      maxWidth: '500px',
      textAlign: 'center',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#c4b5fd' }}>{componentName} Crashed</h2>
      <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
        A rendering error occurred in this view.
      </p>
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '12px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#cbd5e1',
        marginBottom: '24px',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        textAlign: 'left',
        maxHeight: '120px'
      }}>
        {error.message}
      </div>
      <button
        onClick={resetErrorBoundary}
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          border: 'none',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
      >
        Reload {componentName}
      </button>
    </div>
  </div>
);

const EditorWithBoundary = ({ activePage }: { activePage: any }) => {
  const [resetKey, setResetKey] = useState(0);
  return (
    <ErrorBoundary 
      key={`editor-boundary-${resetKey}`}
      FallbackComponent={(props) => <LocalErrorFallback componentName="Editor" {...props} />}
      onReset={() => setResetKey(prev => prev + 1)}
      onError={(error) => logger.logError('EditorBoundary', error)}
    >
      <Editor pageId={activePage.id} initialContent={activePage.content} title={activePage.title} />
    </ErrorBoundary>
  );
};

const CanvasWithBoundary = ({ activePage }: { activePage: any }) => {
  const [resetKey, setResetKey] = useState(0);
  return (
    <ErrorBoundary 
      key={`canvas-boundary-${resetKey}`}
      FallbackComponent={(props) => <LocalErrorFallback componentName="Canvas" {...props} />}
      onReset={() => setResetKey(prev => prev + 1)}
      onError={(error) => logger.logError('CanvasBoundary', error)}
    >
      <Canvas key={activePage.id} pageId={activePage.id} title={activePage.title} />
    </ErrorBoundary>
  );
};

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
      {activePage.pageType === 'canvas' ? (
        <CanvasWithBoundary activePage={activePage} />
      ) : (
        <EditorWithBoundary activePage={activePage} />
      )}
    </div>
  );
};

export default Home;
