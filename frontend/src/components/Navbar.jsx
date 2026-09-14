import React from 'react';
import PersonaDropdown from './PersonaDropdown';

export default function Navbar({
  activeTab,
  setActiveTab,
  onSelectPreset,
  onOpenWeights,
  theme,
  toggleTheme,
  totalCatalogSize,
  currentProfile,
  user,
  onOpenAuth,
  onLogout,
  workspaceCount = 0,
  onOpenCustomStudio,
  onOpenGitHubAudit
}) {
  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar" id="projectforge-navbar">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <div className="brand-text">
            <h1>ProjectForge</h1>
            <span>Intelligent Project Advisor & Skill-Gap System</span>
          </div>
        </div>

        {/* Desktop Navigation Links (>= 900px) */}
        <div className="nav-links">
          <button
            id="nav-tab-advisor"
            className={`nav-tab-btn ${activeTab === 'advisor' ? 'active' : ''}`}
            onClick={() => setActiveTab('advisor')}
          >
            🎯 Project Advisor
          </button>
          <button
            id="nav-tab-studio"
            className={`nav-tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('studio')}
            title="Architect custom project blueprints & synthesize unlimited ideas"
          >
            🛠️ Custom Studio
          </button>
          <button
            id="nav-tab-workspace"
            className={`nav-tab-btn ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
            title="View your started, saved, and completed projects"
          >
            🚀 My Workspace
            {workspaceCount > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '2px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                {workspaceCount}
              </span>
            )}
          </button>
          <button
            id="nav-tab-catalog"
            className={`nav-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
            title="Browse or synthesize project blueprints"
          >
            📚 Project Library
          </button>
          <button
            id="nav-tab-copilot"
            className={`nav-tab-btn ${activeTab === 'copilot' ? 'active' : ''}`}
            onClick={() => setActiveTab('copilot')}
            title="AI Engineering Copilot — architecture, code, tests, resume prep"
          >
            💬 AI Copilot
          </button>
          <button
            id="nav-tab-evaluation"
            className={`nav-tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluation')}
          >
            📊 Strategy Benchmarks
          </button>
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
          {/* Custom Glassmorphic Student Persona Dropdown */}
          <PersonaDropdown
            onSelectPreset={onSelectPreset}
            currentProfile={currentProfile}
          />

          {/* Custom Project Studio Button */}
          {onOpenCustomStudio && (
            <button
              id="btn-custom-studio"
              className="btn btn-primary btn-sm nav-action-btn"
              onClick={onOpenCustomStudio}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600
              }}
              title="Architect custom project ideas with AI recommendations"
            >
              <span>🛠️</span>
              <span className="btn-label-desktop">Custom Studio</span>
            </button>
          )}

          {/* GitHub Code Auditor Button */}
          {onOpenGitHubAudit && (
            <button
              id="btn-nav-github-audit"
              className="btn btn-secondary btn-sm nav-action-btn"
              onClick={() => onOpenGitHubAudit('')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
                border: '1px solid rgba(59, 130, 246, 0.4)',
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--primary)'
              }}
              title="Audit GitHub Repository Code Quality & Production Readiness"
            >
              <span>⚡</span>
              <span className="btn-label-desktop">Code Auditor</span>
            </button>
          )}

          {/* Custom Ranking Weights Button */}
          <button
            id="btn-custom-weights"
            className="btn btn-secondary btn-sm nav-action-btn"
            onClick={onOpenWeights}
            title="Adjust scoring weights (Skill, Interest, Career, Feasibility)"
          >
            <span>⚙️</span>
            <span className="btn-label-desktop">Weights</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="btn-theme-toggle"
            className="btn btn-secondary btn-sm"
            onClick={toggleTheme}
            style={{ padding: '6px 10px' }}
            title="Toggle Dark / Light Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* User Account Controls */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                className="badge badge-primary nav-user-badge"
                style={{ padding: '6px 10px', fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                title={`Logged in as ${user.email}. Click to view Workspace.`}
                onClick={() => setActiveTab('workspace')}
              >
                👤 {user.full_name?.split(' ')[0] || user.email.split('@')[0]}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onLogout}
                style={{ padding: '6px 9px', fontSize: '0.76rem' }}
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="btn-nav-auth"
              className="btn btn-primary btn-sm"
              onClick={onOpenAuth}
              style={{ padding: '6px 12px', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              <span>👤</span>
              <span className="btn-label-desktop">Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Dock (<= 900px) */}
      <div className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === 'advisor' ? 'active' : ''}`}
          onClick={() => setActiveTab('advisor')}
        >
          <span className="mobile-nav-icon">🎯</span>
          <span className="mobile-nav-label">Advisor</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'studio' ? 'active' : ''}`}
          onClick={() => setActiveTab('studio')}
        >
          <span className="mobile-nav-icon">🛠️</span>
          <span className="mobile-nav-label">Studio</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'workspace' ? 'active' : ''}`}
          onClick={() => setActiveTab('workspace')}
        >
          <span className="mobile-nav-icon" style={{ position: 'relative' }}>
            🚀
            {workspaceCount > 0 && (
              <span className="mobile-nav-badge">{workspaceCount}</span>
            )}
          </span>
          <span className="mobile-nav-label">Workspace</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <span className="mobile-nav-icon">📚</span>
          <span className="mobile-nav-label">Library</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'copilot' ? 'active' : ''}`}
          onClick={() => setActiveTab('copilot')}
        >
          <span className="mobile-nav-icon">💬</span>
          <span className="mobile-nav-label">Copilot</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluation')}
        >
          <span className="mobile-nav-icon">📊</span>
          <span className="mobile-nav-label">Benchmarks</span>
        </button>
      </div>
    </>
  );
}
