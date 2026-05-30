import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { SidebarTree } from './SidebarTree';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, addNode, vaultHandle, vaultName, saveStatus, promptSelectVault } = useAppStore();
  const [showVaultPopover, setShowVaultPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowVaultPopover(false);
      }
    };
    if (showVaultPopover) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showVaultPopover]);

  const [showPageTypePicker, setShowPageTypePicker] = useState(false);
  const pageTypePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pageTypePickerRef.current && !pageTypePickerRef.current.contains(e.target as Node)) {
        setShowPageTypePicker(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPageTypePicker(false);
      }
    };
    if (showPageTypePicker) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPageTypePicker]);

  const handleCreateNote = () => {
    addNode({ type: 'page', pageType: 'note', title: 'Untitled', parentId: null });
    setShowPageTypePicker(false);
  };

  const handleCreateCanvas = () => {
    addNode({ type: 'page', pageType: 'canvas', title: 'Untitled Canvas', parentId: null });
    setShowPageTypePicker(false);
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
              <div 
                className="sidebar-search-trigger" 
                onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>Search...</span>
                <kbd className="search-hint">Ctrl K</kbd>
              </div>
              <div className="new-page-picker-wrapper" ref={pageTypePickerRef}>
                <button className="new-page-btn" onClick={() => setShowPageTypePicker(!showPageTypePicker)}>
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>New Page</span>
                  <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginLeft: 'auto', opacity: 0.7 }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {showPageTypePicker && (
                  <div className="new-page-picker-dropdown">
                    <button className="picker-option-btn" onClick={handleCreateNote}>
                      <span className="option-icon">📝</span>
                      <div className="option-text-group">
                        <span className="option-title">New Note</span>
                        <span className="option-subtitle">Rich block-based document</span>
                      </div>
                    </button>
                    <button className="picker-option-btn" onClick={handleCreateCanvas}>
                      <span className="option-icon">🎨</span>
                      <div className="option-text-group">
                        <span className="option-title">New Canvas</span>
                        <span className="option-subtitle">Infinite Excalidraw board</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
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
            <div className="vault-status-wrapper">
              <div 
                className="vault-status" 
                onClick={() => setShowVaultPopover(!showVaultPopover)}
                title="Vault details & management"
              >
                <span className={`status-dot ${saveStatus || 'saved'}`}></span>
                <span className="vault-name">{vaultName || 'Vault'}</span>
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" className="vault-chevron">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {showVaultPopover && (
                <div className="vault-popover" ref={popoverRef}>
                  <div className="vault-popover-header">
                    <span className="vault-popover-title">Vault Information</span>
                  </div>
                  <div className="vault-popover-content">
                    <div className="vault-popover-info">
                      <div className="info-label">Active Folder</div>
                      <div className="info-value" title={vaultName || ''}>
                        📁 {vaultName}
                      </div>
                    </div>
                    <div className="vault-popover-actions">
                      <button 
                        className="popover-btn primary-btn"
                        onClick={async () => {
                          await promptSelectVault();
                          setShowVaultPopover(false);
                        }}
                      >
                        Change Vault
                      </button>
                      <button 
                        className="popover-btn"
                        onClick={() => {
                          if (vaultName) {
                            navigator.clipboard.writeText(vaultName);
                            // Visual feedback
                            const btn = document.getElementById('copy-vault-btn');
                            if (btn) {
                              const origText = btn.innerText;
                              btn.innerText = 'Copied!';
                              setTimeout(() => {
                                btn.innerText = origText;
                              }, 1500);
                            }
                          }
                        }}
                        id="copy-vault-btn"
                      >
                        Copy Name
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
