import React, { useState } from 'react';

export default function UserWorkspace({
  userProjects = [],
  user,
  onOpenAuth,
  onOpenDetails,
  onOpenRoadmap,
  onUpdateProjectStatus,
  onRemoveProject,
  onGoToAdvisor,
  onDownloadScaffold,
  onOpenPrepKit,
  onOpenMockInterview,
  onOpenGitHubAudit,
  onOpenCopilot,
  onUpdateGithubUrl
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingGithubId, setEditingGithubId] = useState(null);
  const [githubInput, setGithubInput] = useState("");

  // Filtered projects
  const filteredProjects = userProjects.filter(p => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'in_progress') return p.status === 'started' || p.status === 'in_progress';
    if (filterStatus === 'saved') return p.status === 'saved' || p.status === 'bookmarked';
    if (filterStatus === 'completed') return p.status === 'completed';
    return true;
  });

  const inProgressCount = userProjects.filter(p => p.status === 'started' || p.status === 'in_progress').length;
  const savedCount = userProjects.filter(p => p.status === 'saved' || p.status === 'bookmarked').length;
  const completedCount = userProjects.filter(p => p.status === 'completed').length;
  const totalWeeks = userProjects
    .filter(p => p.status === 'started' || p.status === 'in_progress')
    .reduce((sum, p) => sum + (p.project_duration || 4.0), 0);

  const kanbanColumns = [
    {
      id: 'backlog',
      title: 'Backlog & Saved',
      icon: '📌',
      color: '#d97706',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.3)',
      items: userProjects.filter(p => p.status === 'saved' || p.status === 'bookmarked')
    },
    {
      id: 'sprint',
      title: 'Active Sprint',
      icon: '⚡',
      color: 'var(--primary)',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeBorder: 'rgba(56, 189, 248, 0.3)',
      items: userProjects.filter(p => p.status === 'started' || p.status === 'in_progress')
    },
    {
      id: 'completed',
      title: 'Portfolio Ready',
      icon: '🏆',
      color: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(16, 185, 129, 0.3)',
      items: userProjects.filter(p => p.status === 'completed')
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">✓ Completed</span>;
      case 'saved':
      case 'bookmarked':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>★ Saved</span>;
      case 'started':
      case 'in_progress':
      default:
        return <span className="badge badge-primary">⚡ In Progress</span>;
    }
  };

  const handleStartEditingGithub = (p) => {
    setEditingGithubId(p.project_id);
    setGithubInput(p.github_url || "");
  };

  const handleSaveGithub = (projectId) => {
    if (onUpdateGithubUrl) {
      onUpdateGithubUrl(projectId, githubInput.trim());
    }
    setEditingGithubId(null);
  };

  return (
    <div className="workspace-container" id="user-workspace-section">
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '1.65rem', margin: 0, fontWeight: 800 }}>🚀 My Project Workspace</h2>
              {user && (
                <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                  👤 {user.full_name || user.email}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Track active builds, weekly milestones, code repositories, and interview readiness in one place.
            </p>
          </div>

          {!user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Local guest session</span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onOpenAuth}
                style={{ fontSize: '0.84rem' }}
              >
                🔐 Sign In to Sync
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '14px', marginTop: '24px' }}>
          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚡ Active Builds
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
              {inProgressCount}
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🏆 Completed
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              {completedCount}
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ★ Saved / Bookmarked
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              {savedCount}
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⏱️ Active Timeline
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              {totalWeeks.toFixed(0)} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>weeks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Filters & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* View Mode Toggle: Grid vs Kanban */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)', gap: '3px', marginRight: '6px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📋 Grid View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                background: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'kanban' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🗂️ Kanban Board
            </button>
          </div>

          {viewMode === 'grid' && (
            <>
              <button
                type="button"
                className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('all')}
              >
                All Projects ({userProjects.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterStatus === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('in_progress')}
              >
                ⚡ In Progress ({inProgressCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterStatus === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('saved')}
              >
                ★ Saved ({savedCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('completed')}
              >
                ✓ Completed ({completedCount})
              </button>
            </>
          )}

          {viewMode === 'kanban' && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Organize builds across sprint stages with 1-click status transitions
            </span>
          )}
        </div>

        {onOpenGitHubAudit && (
          <div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenGitHubAudit('')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
              title="Audit code quality and production readiness for any GitHub repository"
            >
              <span>⚡</span>
              <span>Audit Code Repository</span>
            </button>
          </div>
        )}
      </div>

      {userProjects.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed var(--border-highlight)'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '14px' }}>📂</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
            No projects in your workspace yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 20px' }}>
            Browse the AI recommendations or project catalog and click "🚀 Start Project" or "★ Save" to begin building.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onGoToAdvisor}
            style={{ padding: '10px 24px' }}
          >
            🎯 Discover Recommended Projects
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '20px',
          alignItems: 'start'
        }}>
          {kanbanColumns.map(col => (
            <div
              key={col.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '16px',
                minHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Column Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{col.icon}</span>
                  <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {col.title}
                  </h3>
                </div>
                <span
                  style={{
                    background: col.badgeBg,
                    color: col.color,
                    border: `1px solid ${col.badgeBorder}`,
                    borderRadius: '20px',
                    padding: '2px 9px',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                >
                  {col.items.length}
                </span>
              </div>

              {/* Column Items */}
              {col.items.length === 0 ? (
                <div style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem'
                }}>
                  No projects in this stage
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {col.items.map(p => (
                    <div
                      key={p.project_id}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                          <h4
                            onClick={() => onOpenDetails({ project_id: p.project_id, title: p.project_title, domain: p.project_domain, required_skills: p.tech_stack || [] })}
                            style={{
                              fontSize: '0.92rem',
                              margin: 0,
                              cursor: 'pointer',
                              color: 'var(--text-primary)',
                              fontWeight: 700,
                              lineHeight: 1.35
                            }}
                          >
                            {p.project_title}
                          </h4>
                          <span
                            className="badge badge-secondary"
                            style={{ fontSize: '0.7rem', padding: '2px 6px', whiteSpace: 'nowrap' }}
                          >
                            {p.project_domain || 'Engineering'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ⏱️ {p.project_duration || 4} Weeks · {p.completed_tasks?.length || 0} tasks done
                        </div>
                      </div>

                      {/* Tech Stack Pills */}
                      {p.tech_stack && p.tech_stack.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {p.tech_stack.slice(0, 3).map((tech, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.7rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                          {p.tech_stack.length > 3 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                              +{p.tech_stack.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Transition and Tool Buttons */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
                        {col.id === 'backlog' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '3px 8px', flex: 1 }}
                            onClick={() => onUpdateProjectStatus(p.project_id, 'in_progress')}
                          >
                            ⚡ Start Sprint ➡️
                          </button>
                        )}
                        {col.id === 'sprint' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                              onClick={() => onUpdateProjectStatus(p.project_id, 'saved')}
                              title="Move back to Backlog"
                            >
                              ⬅️
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.74rem', padding: '3px 8px', flex: 1, background: '#10b981', borderColor: '#10b981' }}
                              onClick={() => onUpdateProjectStatus(p.project_id, 'completed')}
                            >
                              🏆 Done ➡️
                            </button>
                          </>
                        )}
                        {col.id === 'completed' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '3px 8px', flex: 1 }}
                            onClick={() => onUpdateProjectStatus(p.project_id, 'in_progress')}
                          >
                            ↺ Reopen Sprint
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.74rem', padding: '3px 7px' }}
                          onClick={() => onOpenDetails({ project_id: p.project_id, title: p.project_title, domain: p.project_domain, required_skills: p.tech_stack || [] })}
                          title="View Blueprint"
                        >
                          🔍
                        </button>
                        {onOpenRoadmap && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '3px 7px' }}
                            onClick={() => onOpenRoadmap(p)}
                            title="Interactive Roadmap"
                          >
                            🗺️
                          </button>
                        )}
                        {onOpenCopilot && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '3px 7px', color: 'var(--primary)' }}
                            onClick={() => onOpenCopilot({ project_id: p.project_id, title: p.project_title, domain: p.project_domain }, `How can I make further progress on "${p.project_title}" in this stage?`)}
                            title="Discuss in AI Copilot"
                          >
                            💬
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveProject(p.project_id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px 4px', fontSize: '0.8rem' }}
                          title="Remove from workspace"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Project Cards Grid */
        filteredProjects.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              borderRadius: '16px',
              border: '1px dashed var(--border-highlight)'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🔍</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
              No projects match this filter
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 20px' }}>
              Switch filter tabs above or explore more projects to start.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setFilterStatus('all')}
            >
              Show All Projects
            </button>
          </div>
        ) : (
          <div className="workspace-grid" style={{ display: 'grid', gap: '20px' }}>
            {filteredProjects.map((p) => {
              const isStarted = p.status === 'started' || p.status === 'in_progress';
              const isCompleted = p.status === 'completed';
            const tasksCompleted = p.completed_tasks?.length || 0;

            return (
              <div
                key={p.project_id}
                className="glass-panel"
                style={{
                  padding: '22px',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : isStarted
                    ? '1px solid var(--border-highlight)'
                    : '1px solid var(--border-color)',
                  boxShadow: isStarted ? '0 8px 30px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                <div>
                  {/* Top tags row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                        {p.project_domain || 'Engineering'}
                      </span>
                      <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                        {p.project_difficulty || 'Intermediate'}
                      </span>
                      <span className="badge" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', fontSize: '0.74rem' }}>
                        ⏱️ {p.project_duration || 4} wks
                      </span>
                    </div>

                    {getStatusBadge(p.status)}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '1.18rem',
                      fontWeight: 700,
                      marginBottom: '8px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => onOpenDetails({ project_id: p.project_id, title: p.project_title, domain: p.project_domain, difficulty: p.project_difficulty, estimated_duration: p.project_duration })}
                  >
                    {p.project_title || p.project_id}
                  </h3>

                  {/* Milestone Progress Chip */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>🎯 Milestone Execution</span>
                      <span style={{ fontWeight: 600, color: tasksCompleted > 0 ? '#34d399' : 'var(--text-muted)' }}>
                        {tasksCompleted} task{tasksCompleted === 1 ? '' : 's'} completed
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: tasksCompleted > 0 ? `${Math.min(100, tasksCompleted * 10)}%` : '0%',
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary), #34d399)',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* GitHub Repo Row */}
                  <div style={{ marginBottom: '12px' }}>
                    {editingGithubId === p.project_id ? (
                      <div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="https://github.com/username/repository"
                            value={githubInput}
                            onChange={(e) => setGithubInput(e.target.value)}
                            style={{ fontSize: '0.76rem', padding: '4px 8px', flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSaveGithub(p.project_id)}
                            style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingGithubId(null)}
                            style={{ fontSize: '0.74rem', padding: '4px 6px' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', gap: '8px' }}>
                        {p.github_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                            <a
                              href={p.github_url.startsWith('http') ? p.github_url : `https://${p.github_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                            >
                              <span>🔗</span> {p.github_url.replace(/https?:\/\/(www\.)?github\.com\//, '')}
                            </a>
                            {onOpenGitHubAudit && (
                              <button
                                type="button"
                                onClick={() => onOpenGitHubAudit(p.github_url, p)}
                                style={{
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  border: '1px solid rgba(56, 189, 248, 0.35)',
                                  color: '#38bdf8',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700
                                }}
                                title="Audit code quality, test coverage, and DevOps readiness"
                              >
                                ⚡ Audit
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>🔗 No repository linked</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEditingGithub(p)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.74rem', padding: '2px 4px', flexShrink: 0 }}
                        >
                          {p.github_url ? '✏️ Edit' : '+ Link GitHub'}
                        </button>
                      </div>
                    )}
                  </div>

                  {p.progress_notes && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '12px', fontStyle: 'italic' }}>
                      "{p.progress_notes}"
                    </p>
                  )}

                  {p.started_at && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      📅 Started: {new Date(p.started_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Card Action Dock */}
                <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
                  {/* Row 1: Roadmap & Specs */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem' }}
                      onClick={() => onOpenRoadmap({ project_id: p.project_id, title: p.project_title, domain: p.project_domain, difficulty: p.project_difficulty, estimated_duration: p.project_duration, completed_tasks: p.completed_tasks })}
                    >
                      🗺️ Roadmap
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                      onClick={() => onOpenDetails({ project_id: p.project_id, title: p.project_title, domain: p.project_domain, difficulty: p.project_difficulty, estimated_duration: p.project_duration })}
                    >
                      📋 Specs
                    </button>
                  </div>

                  {/* Row 2: Starter zip & Prep Kit & Mock Interview */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    {onDownloadScaffold && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, padding: '6px 6px', fontSize: '0.76rem' }}
                        onClick={() => onDownloadScaffold(p.project_id)}
                        title="Download runnable project starter codebase"
                      >
                        📦 Starter
                      </button>
                    )}
                    {onOpenPrepKit && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, padding: '6px 6px', fontSize: '0.76rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                        onClick={() => onOpenPrepKit({ project_id: p.project_id, title: p.project_title, domain: p.project_domain, difficulty: p.project_difficulty, estimated_duration: p.project_duration })}
                        title="Open STAR resume bullets and technical interview questions"
                      >
                        💼 Prep Kit
                      </button>
                    )}
                    {onOpenMockInterview && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, padding: '6px 6px', fontSize: '0.76rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                        onClick={() => onOpenMockInterview({ project_id: p.project_id, title: p.project_title, domain: p.project_domain, difficulty: p.project_difficulty, estimated_duration: p.project_duration })}
                        title="Practice live technical mock interview with AI Bar Raiser"
                      >
                        🎙️ Mock
                      </button>
                    )}
                    {onOpenCopilot && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 8px', fontSize: '0.76rem', borderColor: 'rgba(56, 128, 105, 0.4)', color: 'var(--primary)', fontWeight: 600 }}
                        onClick={() => onOpenCopilot({ project_id: p.project_id, title: p.project_title, domain: p.project_domain }, `I'm building my workspace project "${p.project_title}". What is the best strategy to complete the remaining tasks and verify production readiness?`)}
                        title="Launch dedicated AI Copilot for this workspace project"
                      >
                        💬 Copilot
                      </button>
                    )}
                  </div>

                  {/* Row 3: Status update & Remove */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={p.status}
                      onChange={(e) => onUpdateProjectStatus(p.project_id, e.target.value)}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="started">⚡ In Progress</option>
                      <option value="saved">★ Saved</option>
                      <option value="completed">✓ Completed</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => onRemoveProject(p.project_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        padding: '4px 8px'
                      }}
                      title="Remove from workspace"
                    >
                      🗑️ Drop
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
