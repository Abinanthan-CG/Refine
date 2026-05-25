import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { useAppStore } from '../../store/appStore';
import './Layout.css';

export const Layout: React.FC = () => {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Outlet />
      </main>
      <ContextMenu />
    </div>
  );
};

export default Layout;
