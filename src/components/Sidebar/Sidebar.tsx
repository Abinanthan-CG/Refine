import React from 'react';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../hooks/useTheme';
import { SidebarTree } from './SidebarTree';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, addNode } = useAppStore();
  const { isDark, toggleTheme } = useTheme();

  const handleNewPage = () => {
    addNode({ type: 'page', title: 'Untitled', parentId: null });
  };

  return (
    <>
      <div className={`sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="workspace-info">
            <div className="workspace-logo">R</div>
            <span className="workspace-title">Refine</span>
          </div>
          <button className="icon-btn" onClick={toggleSidebar} title="Collapse Sidebar">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>

        <div className="sidebar-actions">
          <button className="new-page-btn" onClick={handleNewPage}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Page</span>
          </button>
        </div>

        <div className="sidebar-content">
          <SidebarTree />
        </div>

        <div className="sidebar-footer">
          <button className="theme-toggle-inline" onClick={toggleTheme}>
            {isDark ? (
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      {!isSidebarOpen && (
        <button className="expand-btn-floating" onClick={toggleSidebar} title="Expand Sidebar">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}
    </>
  );
};
