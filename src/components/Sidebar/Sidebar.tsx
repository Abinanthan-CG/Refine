import React from 'react';
import { useAppStore } from '../../store/appStore';
import { SidebarTree } from './SidebarTree';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, addNode, vaultHandle, vaultName, saveStatus, promptSelectVault } = useAppStore();

  const handleNewPage = () => {
    addNode({ type: 'page', title: 'Untitled', parentId: null });
  };

  const handleNewFolder = () => {
    addNode({ type: 'folder', title: 'Untitled Folder', parentId: null });
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
          {!vaultHandle ? (
            <button className="new-page-btn vault-btn" onClick={promptSelectVault}>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Select Vault Folder</span>
            </button>
          ) : (
            <>
              <button className="new-page-btn" onClick={handleNewPage}>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>New Page</span>
              </button>
              <button className="new-page-btn" onClick={handleNewFolder} style={{ marginTop: '0.5rem' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  <line x1="12" y1="11" x2="12" y2="17"></line>
                  <line x1="9" y1="14" x2="15" y2="14"></line>
                </svg>
                <span>New Folder</span>
              </button>
            </>
          )}
        </div>

        <div className="sidebar-content">
          <SidebarTree />
        </div>

        <div className="sidebar-footer">
          {vaultHandle && (
            <div className="vault-status" title={`Status: ${saveStatus || 'saved'}`}>
              <span className={`status-dot ${saveStatus || 'saved'}`}></span>
              <span className="vault-name">{vaultName || 'Vault'}</span>
            </div>
          )}
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
