import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { CommandPalette } from '../CommandPalette/CommandPalette';
import { useAppStore } from '../../store/appStore';
import './Layout.css';

export const Layout: React.FC = () => {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const initVault = useAppStore((state) => state.initVault);

  React.useEffect(() => {
    initVault();
  }, [initVault]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Outlet />
      </main>
      <ContextMenu />
      <CommandPalette />
    </div>
  );
};

export default Layout;
