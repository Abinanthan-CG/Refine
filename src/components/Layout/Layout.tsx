import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import './Layout.css';

export const Layout: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="app-layout">
      {/* Premium Glassmorphic Header */}
      <header className="app-header">
        <Link to="/" className="brand-container">
          <div className="brand-logo">R</div>
          <span className="brand-name gradient-text">Refine</span>
          <span className="brand-badge">TS v1.0</span>
        </Link>

        {/* Navigation Links */}
        <nav className="app-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink
            to="/excalidraw"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Excalidraw
          </NavLink>
          <NavLink
            to="/blocknote"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            BlockNote
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? (
              // Sun Icon
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            ) : (
              // Moon Icon
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Modern Premium Footer */}
      <footer className="app-footer">
        <div>&copy; {new Date().getFullYear()} Refine Studio. All rights reserved.</div>
        <div className="footer-tech">
          Built with React 18 &bull; Vite &bull; TypeScript &bull; Zustand &bull; Custom HSL CSS
        </div>
      </footer>
    </div>
  );
};
export default Layout;
