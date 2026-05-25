import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import './Home.css';

export const Home: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="home-container">
      {/* Animated Hero Section */}
      <section className="hero-section">
        <div className="hero-tagline">Refine React 18 Core</div>
        <h1 className="hero-title">
          Refine your web designs with{' '}
          <span className="gradient-text animate-float">ultimate precision</span>
        </h1>
        <p className="hero-desc">
          A high-performance workspace constructed with React 18, Vite, TypeScript, and a modern
          HSL-based vanilla CSS variables design system.
        </p>
        <div className="hero-actions">
          <Link to="/blocknote" className="btn-primary">
            Launch BlockNote
          </Link>
          <Link to="/excalidraw" className="btn-secondary">
            Open Excalidraw
          </Link>
        </div>
      </section>

      {/* Tech Stack Highlights */}
      <section>
        <h2 className="section-title">Core Architecture</h2>
        <div className="grid-3">
          <div className="feature-card glass-panel">
            <div className="feature-icon">⚛</div>
            <h3>React 18 &amp; TS</h3>
            <p>
              Strictly typed React 18 setup running on high-speed Vite. Features import aliases,
              modular architectures, and fast refresh cycles.
            </p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon cyan">⚡</div>
            <h3>Zustand State</h3>
            <p>
              Ultra-lightweight, reactive global store managing themes and preferences seamlessly
              with automatic localStorage synchronizations.
            </p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon">🎨</div>
            <h3>Vanilla HSL System</h3>
            <p>
              Fully customizable custom style system relying entirely on HSL variables. Pure vanilla
              CSS - no Tailwind, maximum control, zero weight.
            </p>
          </div>
        </div>
      </section>

      {/* Design System Showcase */}
      <section className="showcase-block">
        <h2 className="section-title">Design Token Showcase</h2>

        {/* Swatches */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
            Active Colors (HSL Dynamic Tokens)
          </h3>
          <div className="color-palette-grid">
            <div className="color-swatch" style={{ background: 'var(--bg-primary)' }}>
              <span className="swatch-label">--bg-primary</span>
            </div>
            <div className="color-swatch" style={{ background: 'var(--bg-secondary)' }}>
              <span className="swatch-label">--bg-secondary</span>
            </div>
            <div className="color-swatch" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="swatch-label">--bg-tertiary</span>
            </div>
            <div className="color-swatch" style={{ background: 'var(--accent-primary)' }}>
              <span className="swatch-label">--accent-primary</span>
            </div>
            <div className="color-swatch" style={{ background: 'var(--accent-secondary)' }}>
              <span className="swatch-label">--accent-secondary</span>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="typography-display glass-panel">
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Typography Family Showcase</h3>

          <div className="font-sample-row">
            <div>
              <span className="sample-spec">--font-sans (Outfit)</span>
              <h4
                style={{ fontSize: '1.8rem', fontFamily: 'var(--font-sans)', marginTop: '0.25rem' }}
              >
                Refine Premium Aesthetics
              </h4>
            </div>
            <span className="sample-spec" style={{ fontSize: '1.1rem' }}>
              Outfit / Sans-Serif
            </span>
          </div>

          <div className="font-sample-row">
            <div>
              <span className="sample-spec">--font-mono (DM Mono)</span>
              <h4
                style={{
                  fontSize: '1.2rem',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.25rem',
                  fontWeight: 400,
                }}
              >
                const config = &#123; theme: '{theme}' &#125;;
              </h4>
            </div>
            <span className="sample-spec" style={{ fontSize: '1.1rem' }}>
              DM Mono / Monospace
            </span>
          </div>
        </div>
      </section>

      {/* Verification / Status Panel */}
      <section className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 600 }}>
          Refine System Check
        </h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-secondary)', fontSize: '1.2rem' }}>✔</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              React 18.3.1 Loaded
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-secondary)', fontSize: '1.2rem' }}>✔</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              Zustand Theme Store: {theme.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-secondary)', fontSize: '1.2rem' }}>✔</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              Vite &amp; TS Compilation Enabled
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Home;
