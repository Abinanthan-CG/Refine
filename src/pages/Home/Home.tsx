import React from 'react';
import { useAppStore } from '../../store/appStore';
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
    <div className="home-container editor-placeholder">
      <h1 className="page-title">{activePage.title}</h1>
      <div className="placeholder-content glass-panel">
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        <p className="placeholder-text">Editor coming soon</p>
      </div>
    </div>
  );
};

export default Home;
