import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import NotFound from './pages/NotFound/NotFound';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { logger } from './utils/logger';

function GlobalErrorFallback({ error }: FallbackProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0f1115',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '16px',
        maxWidth: '500px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <h1 style={{ margin: '0 0 16px', fontSize: '24px', color: '#f87171' }}>Critical App Error</h1>
        <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: '15px', lineHeight: '1.5' }}>
          The application encountered an unexpected runtime exception.
        </p>
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '12px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#cbd5e1',
          marginBottom: '32px',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          textAlign: 'left'
        }}>
          {error instanceof Error ? error.message : String(error)}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.2s, transform 0.1s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Reload Workspace
        </button>
      </div>
    </div>
  );
}

export const App: React.FC = () => {
  return (
    <ErrorBoundary 
      FallbackComponent={GlobalErrorFallback}
      onError={(error) => logger.logError('GlobalBoundary', error)}
    >
      <BrowserRouter>
        <Routes>
          {/* Main layout wrapper */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {/* Custom animated 404 page */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;

