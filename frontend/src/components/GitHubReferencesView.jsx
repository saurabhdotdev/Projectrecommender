import React, { useState, useEffect } from 'react';
import { fetchGitHubReferences } from '../api/client';

export default function GitHubReferencesView({
  project,
  onOpenGitHubAudit,
  onOpenCopilot
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const projectTitle = project?.title || 'Open Source Software';
  const projectDomain = project?.domain || '';
  const projectTech = project?.required_skills || project?.programming_languages || [];

  const loadReferences = async (customQuery = null) => {
    setLoading(true);
    setError(null);
    try {
      const q = customQuery !== null ? customQuery : projectTitle;
      const res = await fetchGitHubReferences(q, projectDomain, projectTech);
      setData(res);
      if (customQuery === null && res.search_keywords) {
        setSearchQuery(res.search_keywords);
      }
    } catch (err) {
      console.error('Error fetching GitHub references:', err);
      setError(err.message || 'Failed to load GitHub repositories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      loadReferences();
    }
  }, [project?.project_id, project?.title]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadReferences(searchQuery.trim());
    }
  };

  const getLanguageColor = (lang) => {
    const map = {
      Python: '#3572A5',
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      Rust: '#dea584',
      Go: '#00ADD8',
      'C++': '#f34b7d',
      Java: '#b07219',
      C: '#555555'
    };
    return map[lang] || '#38bdf8';
  };

  return (
    <div className="github-references-container" style={{ padding: '4px 0' }}>
      {/* Header Info & Live Search Bar */}
      <div style={{
        marginBottom: '18px',
        padding: '16px',
        background: 'var(--surface-color)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.25rem' }}>🐙</span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Real Open-Source GitHub Reference Projects
              </h3>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                GitHub REST API
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Explore how production engineers and open-source communities implement systems related to{' '}
              <strong style={{ color: 'var(--text-primary)' }}>&ldquo;{projectTitle}&rdquo;</strong>.
            </p>
          </div>

          {data?.direct_search_url && (
            <a
              href={data.direct_search_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
              title="Open full search on GitHub in new tab"
            >
              <span>🔍 Search GitHub</span>
              <span>↗</span>
            </a>
          )}
        </div>

        {/* Search / Tweak Filter Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.85rem' }}>
              🔍
            </span>
            <input
              type="text"
              className="studio-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tweak search keywords (e.g. multi agent langchain rag)..."
              style={{ paddingLeft: '34px', fontSize: '0.84rem', width: '100%' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={loading}
            style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const defaultK = cleanProjectKeywords(projectTitle);
              setSearchQuery(defaultK);
              loadReferences(defaultK);
            }}
            title="Reset to default project keywords"
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
          >
            Reset
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'var(--surface-color)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px', animation: 'studioMicPulse 1.4s infinite ease-in-out' }}>
            🐙
          </div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            Searching Public GitHub Repositories...
          </h4>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Finding top-starred codebases matching &ldquo;{searchQuery || projectTitle}&rdquo;
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="studio-status-banner error" style={{ marginBottom: '16px' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Repositories Grid */}
      {!loading && data?.repositories && data.repositories.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px',
          marginBottom: '20px'
        }}>
          {data.repositories.map((repo, idx) => (
            <div
              key={idx}
              className="github-repo-card"
              style={{
                background: 'var(--surface-color)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                {/* Repo Top Header: Owner & Stars */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {repo.owner_avatar ? (
                      <img
                        src={repo.owner_avatar}
                        alt="Owner"
                        style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0 }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.1rem' }}>📁</span>
                    )}
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontWeight: 700,
                        fontSize: '0.94rem',
                        color: '#38bdf8',
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={repo.full_name}
                    >
                      {repo.full_name || repo.name}
                    </a>
                  </div>

                  {/* Stars & Forks Badges */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: 'rgba(234, 179, 8, 0.12)',
                      color: '#eab308',
                      padding: '2px 7px',
                      borderRadius: '12px',
                      border: '1px solid rgba(234, 179, 8, 0.3)'
                    }}>
                      ⭐ {repo.stars ? repo.stars.toLocaleString() : '1+'}
                    </span>
                    {repo.forks > 0 && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.04)'
                      }}>
                        🍴 {repo.forks.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                  margin: '0 0 12px 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {repo.description}
                </p>

                {/* Topic tags */}
                {repo.topics && repo.topics.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {repo.topics.slice(0, 4).map((topic, tidx) => (
                      <span
                        key={tidx}
                        style={{
                          fontSize: '0.68rem',
                          background: 'rgba(56, 189, 248, 0.08)',
                          color: '#38bdf8',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(56, 189, 248, 0.2)'
                        }}
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Meta & Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-color)',
                marginTop: '6px'
              }}>
                {/* Language indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: getLanguageColor(repo.language)
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {repo.language || 'Code'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {onOpenGitHubAudit && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => onOpenGitHubAudit(repo.html_url, project)}
                      style={{ fontSize: '0.72rem', padding: '3px 7px' }}
                      title="Run automated code quality audit on this repository"
                    >
                      ⚡ Audit
                    </button>
                  )}
                  {onOpenCopilot && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => onOpenCopilot(project, `Analyze this GitHub repository: "${repo.html_url}". What architecture patterns can I borrow for my "${projectTitle}" project?`)}
                      style={{ fontSize: '0.72rem', padding: '3px 7px', color: 'var(--primary)' }}
                      title="Ask Copilot how to learn from this repository"
                    >
                      💬 Copilot
                    </button>
                  )}
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-xs"
                    style={{ fontSize: '0.72rem', padding: '3px 8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}
                  >
                    <span>Open</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && (!data?.repositories || data.repositories.length === 0) && (
        <div style={{
          textAlign: 'center',
          padding: '36px 20px',
          background: 'var(--surface-color)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
            No Repositories Returned for Specific Keywords
          </h4>
          <p style={{ margin: '0 0 14px 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Try broadening your search query above, or explore GitHub directly.
          </p>
          {data?.direct_search_url && (
            <a
              href={data.direct_search_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Explore Public Repositories on GitHub &rarr;</span>
            </a>
          )}
        </div>
      )}

      {/* Footer Exploration Strip */}
      <div style={{
        padding: '14px 18px',
        background: 'rgba(56, 189, 248, 0.06)',
        borderRadius: '10px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
            Want to see how hundreds of other open-source contributors solved this?
          </span>
        </div>
        {data?.direct_search_url && (
          <a
            href={data.direct_search_url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#38bdf8',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Browse 500+ More GitHub Repositories for &ldquo;{searchQuery || projectTitle}&rdquo;</span>
            <span>&rarr;</span>
          </a>
        )}
      </div>
    </div>
  );
}

function cleanProjectKeywords(raw) {
  if (!raw) return 'software engineering project';
  return raw
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['engine', 'platform', 'system', 'hierarchical', 'framework'].includes(w.toLowerCase()))
    .slice(0, 3)
    .join(' ');
}
