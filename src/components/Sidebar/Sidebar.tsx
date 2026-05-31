import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { SidebarTree } from './SidebarTree';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, addNode, vaultHandle, vaultName, saveStatus, promptSelectVault } = useAppStore();
  const [showVaultPopover, setShowVaultPopover] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'bookmarks'>('explorer');
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

  const handleTabClick = (tab: 'explorer' | 'bookmarks') => {
    if (!isSidebarOpen) {
      // If closed, open sidebar and set active tab
      toggleSidebar();
      setActiveTab(tab);
    } else if (activeTab === tab) {
      // If open and clicking the active tab, collapse sidebar
      toggleSidebar();
    } else {
      // If open and clicking a different tab, switch active tab
      setActiveTab(tab);
    }
  };

  return (
    <>
      <div className="sidebar-layout-wrapper">
        {/* 1. Left Vertical Ribbon Bar (Always visible) */}
        <div className="sidebar-ribbon">
          <button 
            className={`ribbon-btn toggle-btn ${!isSidebarOpen ? 'collapsed' : ''}`}
            onClick={toggleSidebar} 
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          {vaultHandle && (
            <div className="ribbon-tabs">
              <button 
                className={`ribbon-btn tab-btn ${activeTab === 'explorer' && isSidebarOpen ? 'active' : ''}`}
                onClick={() => handleTabClick('explorer')}
                title="File Explorer"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
              
              <button 
                className={`ribbon-btn tab-btn ${activeTab === 'bookmarks' && isSidebarOpen ? 'active' : ''}`}
                onClick={() => handleTabClick('bookmarks')}
                title="Bookmarks"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* 2. Main Sidebar Pane (Slides open/closed) */}
        <div className={`sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header-obsidian">
            {vaultHandle ? (
              <div className="vault-info-container" ref={popoverRef}>
                <div 
                  className="vault-info" 
                  onClick={() => setShowVaultPopover(!showVaultPopover)}
                  title="Vault details & management"
                >
                  <span className={`status-dot ${saveStatus || 'saved'}`}></span>
                  <span className="vault-title">{vaultName || 'Vault'}</span>
                  <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="2.5" fill="none" className="vault-chevron">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

                {showVaultPopover && (
                  <div className="vault-popover top-popover">
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
            ) : (
              <div className="vault-info empty" onClick={promptSelectVault}>
                <span className="status-dot error"></span>
                <span className="vault-title">No Vault Selected</span>
              </div>
            )}

            {vaultHandle && (
              <div className="header-actions">
                <button 
                  className="header-action-btn" 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                  title="Search Vault (Ctrl K)"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>

                <div className="new-file-dropdown-wrapper" ref={pageTypePickerRef}>
                  <button 
                    className="header-action-btn"
                    onClick={() => setShowPageTypePicker(!showPageTypePicker)}
                    title="New File / Folder..."
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>

                  {showPageTypePicker && (
                    <div className="new-page-picker-dropdown obsidian-style">
                      <button className="picker-option-btn" onClick={handleCreateNote}>
                        <span className="option-icon">📝</span>
                        <div className="option-text-group">
                          <span className="option-title">New Note</span>
                        </div>
                      </button>
                      <button className="picker-option-btn" onClick={handleCreateCanvas}>
                        <span className="option-icon">🎨</span>
                        <div className="option-text-group">
                          <span className="option-title">New Canvas</span>
                        </div>
                      </button>
                      <button className="picker-option-btn" onClick={handleNewFolder}>
                        <span className="option-icon">📁</span>
                        <div className="option-text-group">
                          <span className="option-title">New Folder</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  className="header-action-btn collapse-btn" 
                  onClick={toggleSidebar} 
                  title="Collapse Sidebar"
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="sidebar-content">
            {!vaultHandle ? (
              <div className="empty-vault-container">
                <div className="empty-vault-icon">📁</div>
                <p className="empty-vault-text">
                  Open a folder on your system to load or create your local knowledge vault.
                </p>
                <button className="new-page-btn vault-btn" onClick={promptSelectVault}>
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>Open Folder</span>
                </button>
              </div>
            ) : (
              <SidebarTree activeTab={activeTab} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
