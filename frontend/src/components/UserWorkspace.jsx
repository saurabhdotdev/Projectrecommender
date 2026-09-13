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

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
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

        {onOpenGitHubAudit && (
          <div style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenGitHubAudit('https://github.com/saurabhdotdev/DocMindAi')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
              title="Audit code quality and production readiness for @saurabhdotdev repos"
            >
              <span>⚡</span>
              <span>Audit Code (@saurabhdotdev)</span>
            </button>
          </div>
        )}
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
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
            {userProjects.length === 0
              ? 'No projects in your workspace yet'
              : 'No projects match this filter'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 20px' }}>
            {userProjects.length === 0
              ? 'Browse the AI recommendations or project catalog and click "🚀 Start Project" or "★ Save" to begin building.'
              : 'Switch filter tabs above or explore more projects to start.'}
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
                            placeholder="https://github.com/saurabhdotdev/DocMindAi"
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>@saurabhdotdev:</span>
                          {['DocMindAi', 'ai-software-architect', 'TextAbstractor', 'MentalDisorderFix'].map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setGithubInput(`https://github.com/saurabhdotdev/${name}`)}
                              style={{
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.68rem',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              {name}
                            </button>
                          ))}
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
      )}
    </div>
  );
}
