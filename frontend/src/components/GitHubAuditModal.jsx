import React, { useState, useEffect } from 'react';
import { auditGitHubRepository, fetchUserGitHubRepos } from '../api/client';

export default function GitHubAuditModal({
  isOpen,
  onClose,
  initialRepoUrl = '',
  projectTitle = '',
  projectId = ''
}) {
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl || 'https://github.com/saurabhdotdev/DocMindAi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auditData, setAuditData] = useState(null);

  // User repositories for quick-selection
  const [userRepos, setUserRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserRepos();
      if (initialRepoUrl) {
        setRepoUrl(initialRepoUrl);
        handleRunAudit(initialRepoUrl);
      } else {
        setRepoUrl('https://github.com/saurabhdotdev/DocMindAi');
        handleRunAudit('https://github.com/saurabhdotdev/DocMindAi');
      }
    } else {
      setError(null);
    }
  }, [isOpen, initialRepoUrl]);

  const loadUserRepos = async () => {
    setLoadingRepos(true);
    try {
      const repos = await fetchUserGitHubRepos('saurabhdotdev');
      setUserRepos(repos);
    } catch (e) {
      console.warn('Could not load user repos:', e);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleRunAudit = async (targetUrl = repoUrl) => {
    if (!targetUrl || !targetUrl.trim()) {
      setError('Please enter a valid GitHub repository URL.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await auditGitHubRepository({
        githubUrl: targetUrl.trim(),
        projectId: projectId || '',
        projectTitle: projectTitle || ''
      });
      setAuditData(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze repository.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = (htmlUrl) => {
    setRepoUrl(htmlUrl);
    handleRunAudit(htmlUrl);
  };

  const handleExportMarkdown = () => {
    if (!auditData) return;
    const dateStr = new Date().toLocaleDateString();
    let md = `# GitHub Production Readiness & Code Audit\n\n`;
    md += `**Repository:** [${auditData.owner}/${auditData.repo}](${auditData.html_url})\n`;
    md += `**Audit Date:** ${dateStr}\n`;
    md += `**Overall Score:** ${auditData.overall_score} / 100 (${auditData.letter_grade})\n\n`;
    md += `### Metric Breakdown\n`;
    md += `- **Automated Tests & Coverage:** ${auditData.test_score} / 100\n`;
    md += `- **Architecture & Modularity:** ${auditData.architecture_score} / 100\n`;
    md += `- **Documentation & Setup:** ${auditData.documentation_score} / 100\n`;
    md += `- **DevOps & Containerization:** ${auditData.devops_score} / 100\n\n`;
    md += `### Staff Engineer Recruiter Impression\n> ${auditData.recruiter_impression}\n\n`;
    md += `### Detected Engineering Assets\n`;
    md += `- Automated Tests: ${auditData.assets.has_tests ? '✅ Present' : '❌ Missing'}\n`;
    md += `- Containerization (Docker): ${auditData.assets.has_docker ? '✅ Present' : '❌ Missing'}\n`;
    md += `- CI/CD Automation: ${auditData.assets.has_ci_cd ? '✅ Present' : '❌ Missing'}\n`;
    md += `- Architecture Docs: ${auditData.assets.has_architecture_doc ? '✅ Present' : '❌ Missing'}\n`;
    md += `- Pinned Dependencies: ${auditData.assets.has_pinned_deps ? '✅ Present' : '❌ Missing'}\n\n`;
    if (auditData.identified_strengths?.length) {
      md += `### Production Strengths\n`;
      auditData.identified_strengths.forEach((s) => (md += `- ${s}\n`));
      md += `\n`;
    }
    if (auditData.critical_gaps?.length) {
      md += `### High-Priority Gaps\n`;
      auditData.critical_gaps.forEach((g) => (md += `- ${g}\n`));
      md += `\n`;
    }
    if (auditData.recommended_pull_requests?.length) {
      md += `### Recommended Pull Requests to Elevate Portfolio\n\n`;
      auditData.recommended_pull_requests.forEach((pr, i) => {
        md += `#### ${pr.title} [Priority: ${pr.priority}]\n`;
        md += `**Rationale:** ${pr.rationale}\n\n`;
        md += `**Implementation Blueprint:**\n\`\`\`text\n${pr.blueprint_hint}\n\`\`\`\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${auditData.repo}_Code_Quality_Audit.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return '#10b981';
    if (grade === 'B') return '#38bdf8';
    if (grade === 'C') return '#f59e0b';
    return '#ef4444';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '880px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
                  GitHub Code Quality & Production Readiness Auditor
                </h2>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                  AI Staff Review
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Inspects repository architecture, automated test suites, CI/CD automation & DevOps readiness.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* Target Repo Input Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="https://github.com/saurabhdotdev/DocMindAi"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                style={{ flex: 1, fontSize: '0.88rem' }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleRunAudit()}
                disabled={loading || !repoUrl.trim()}
                style={{ minWidth: '130px', fontWeight: 700 }}
              >
                {loading ? 'Auditing...' : '⚡ Audit Repo'}
              </button>
            </div>

            {/* Quick-Pick @saurabhdotdev repos */}
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📁 Select from <strong>@saurabhdotdev</strong> repositories:</span>
                {loadingRepos && <span style={{ fontSize: '0.72rem' }}>(fetching...)</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(userRepos.length > 0 ? userRepos : [
                  { name: 'DocMindAi', html_url: 'https://github.com/saurabhdotdev/DocMindAi', language: 'TypeScript' },
                  { name: 'ai-software-architect', html_url: 'https://github.com/saurabhdotdev/ai-software-architect', language: 'Python' },
                  { name: 'TextAbstractor', html_url: 'https://github.com/saurabhdotdev/TextAbstractor', language: 'Python' },
                  { name: 'MentalDisorderFix', html_url: 'https://github.com/saurabhdotdev/MentalDisorderFix', language: 'Python' },
                  { name: 'Customer-Seg', html_url: 'https://github.com/saurabhdotdev/Customer-Seg', language: 'Python' }
                ]).slice(0, 7).map((r) => {
                  const isCurrent = repoUrl.toLowerCase().includes(r.name.toLowerCase());
                  return (
                    <button
                      key={r.name}
                      type="button"
                      onClick={() => handleSelectRepo(r.html_url)}
                      style={{
                        background: isCurrent ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-input)',
                        border: isCurrent ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                        color: isCurrent ? '#38bdf8' : 'var(--text-secondary)',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>📦 {r.name}</span>
                      {r.language && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>({r.language})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', borderRadius: '10px', color: 'var(--danger)', fontSize: '0.86rem', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div style={{ padding: '50px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '14px', animation: 'spin 2s linear infinite' }}>⚙️</div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Auditing Codebase & Artifacts...</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                Cloning file tree, searching test runners, verifying Docker manifests, and compiling Staff Review.
              </p>
            </div>
          )}

          {auditData && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Hero Scorecard */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.3rem' }}>📁</span>
                    <a
                      href={auditData.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', textDecoration: 'none' }}
                    >
                      {auditData.owner}/{auditData.repo} ↗
                    </a>
                    <span className="badge badge-secondary" style={{ fontSize: '0.74rem' }}>
                      {auditData.language}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Analyzed {auditData.total_files} repository files • Default branch: main
                  </p>
                </div>

                {/* Overall Score Dial */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      background: `${getGradeColor(auditData.letter_grade)}18`,
                      border: `2px solid ${getGradeColor(auditData.letter_grade)}`,
                      borderRadius: '12px',
                      padding: '8px 18px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: getGradeColor(auditData.letter_grade), lineHeight: 1 }}>
                      {auditData.letter_grade}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {auditData.overall_score}/100 Score
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Metric Breakdown Bars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🧪 Testing & QA</span>
                    <strong>{auditData.test_score}/100</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${auditData.test_score}%`, background: getGradeColor(auditData.test_score >= 70 ? 'A' : 'C'), height: '100%' }} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🏛️ Architecture</span>
                    <strong>{auditData.architecture_score}/100</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${auditData.architecture_score}%`, background: getGradeColor(auditData.architecture_score >= 70 ? 'A' : 'C'), height: '100%' }} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>📖 Documentation</span>
                    <strong>{auditData.documentation_score}/100</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${auditData.documentation_score}%`, background: getGradeColor(auditData.documentation_score >= 70 ? 'A' : 'C'), height: '100%' }} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🐳 DevOps & Deploy</span>
                    <strong>{auditData.devops_score}/100</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${auditData.devops_score}%`, background: getGradeColor(auditData.devops_score >= 70 ? 'A' : 'C'), height: '100%' }} />
                  </div>
                </div>
              </div>

              {/* Detected Engineering Assets Checklist */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                  🔍 Detected Production Assets:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  <div style={{ background: auditData.assets.has_tests ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${auditData.assets.has_tests ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{auditData.assets.has_tests ? '✅' : '⚠️'}</span>
                    <div style={{ fontSize: '0.82rem' }}>
                      <strong>Automated Tests</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {auditData.assets.has_tests ? `${auditData.detected_files.tests?.length || 1} test files found` : 'No test suite found'}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: auditData.assets.has_docker ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${auditData.assets.has_docker ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{auditData.assets.has_docker ? '✅' : '⚠️'}</span>
                    <div style={{ fontSize: '0.82rem' }}>
                      <strong>Containerization</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {auditData.assets.has_docker ? 'Dockerfile / Compose present' : 'No Dockerfile found'}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: auditData.assets.has_ci_cd ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${auditData.assets.has_ci_cd ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{auditData.assets.has_ci_cd ? '✅' : '⚠️'}</span>
                    <div style={{ fontSize: '0.82rem' }}>
                      <strong>CI/CD Pipelines</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {auditData.assets.has_ci_cd ? 'GitHub Workflows present' : 'No CI automation found'}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: auditData.assets.has_readme ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${auditData.assets.has_readme ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{auditData.assets.has_readme ? '✅' : '⚠️'}</span>
                    <div style={{ fontSize: '0.82rem' }}>
                      <strong>Documentation</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {auditData.assets.has_readme ? 'Root README detected' : 'Missing README.md'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recruiter Impression Bubble */}
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                  👔 Hiring Committee & Recruiter Impression:
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {auditData.recruiter_impression}
                </p>
              </div>

              {/* Strengths & Gaps Side-by-Side */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.07)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                    ✅ Production Strengths:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {(auditData.identified_strengths || []).map((s, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.07)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                    ⚠️ High-Priority Gaps:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {(auditData.critical_gaps || []).map((g, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommended PRs */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                  🚀 Top 3 Recommended Pull Requests (Instant Portfolio Upgrade):
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(auditData.recommended_pull_requests || []).map((pr, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '14px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {pr.title}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: pr.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: pr.priority === 'High' ? '#ef4444' : '#38bdf8',
                            border: `1px solid ${pr.priority === 'High' ? '#ef4444' : '#38bdf8'}`
                          }}
                        >
                          {pr.priority} Priority
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
                        {pr.rationale}
                      </p>
                      {pr.blueprint_hint && (
                        <div
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '0.78rem',
                            fontFamily: 'monospace',
                            color: 'var(--primary)'
                          }}
                        >
                          💡 Blueprint: {pr.blueprint_hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '16px',
                  marginTop: '8px'
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportMarkdown}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📥 Export Audit (.md)
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onClose}
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
