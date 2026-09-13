import React from 'react';

export default function ProjectComparatorModal({
  projectA,
  projectB,
  studentProfile,
  onClose,
  onOpenDetails
}) {
  if (!projectA || !projectB) return null;

  const getSkillsDiff = (p) => {
    const studentSkills = studentProfile?.skills || [];
    const required = p.required_skills || [];
    const matched = required.filter(s => studentSkills.some(sk => sk.toLowerCase() === s.toLowerCase()));
    const missing = required.filter(s => !studentSkills.some(sk => sk.toLowerCase() === s.toLowerCase()));
    const readiness = required.length ? Math.round((matched.length / required.length) * 100) : 100;
    return { matched, missing, readiness };
  };

  const gapA = getSkillsDiff(projectA);
  const gapB = getSkillsDiff(projectB);

  // Determine winner for specific dimensions
  const higherReadiness = gapA.readiness >= gapB.readiness ? projectA : projectB;
  const shorterDuration = projectA.estimated_duration <= projectB.estimated_duration ? projectA : projectB;
  const higherResume = (projectA.resume_value || 8.5) >= (projectB.resume_value || 8.5) ? projectA : projectB;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1000px', width: '95%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚖️</span>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
                Head-to-Head Project Comparison
              </h2>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                Algorithmic Evaluation
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
              Contrast technical feasibility, skill gap, and portfolio leverage before committing to build.
            </p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Body / Comparison Grid */}
        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Top Titles Row */}
          <div className="comparator-grid" style={{ marginBottom: '24px' }}>
            {/* Project A Card */}
            <div className="glass-panel" style={{ padding: '18px', borderTop: '3px solid #3b82f6', background: 'rgba(59, 130, 246, 0.04)' }}>
              <span className="badge badge-primary" style={{ marginBottom: '8px' }}>Option A</span>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', lineHeight: 1.3 }}>{projectA.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {projectA.description}
              </p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '12px', width: '100%' }}
                onClick={() => onOpenDetails(projectA)}
              >
                Inspect Details & Roadmap &rarr;
              </button>
            </div>

            {/* Project B Card */}
            <div className="glass-panel" style={{ padding: '18px', borderTop: '3px solid #a855f7', background: 'rgba(168, 85, 247, 0.04)' }}>
              <span className="studio-tag-badge" style={{ marginBottom: '8px' }}>Option B</span>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', lineHeight: 1.3 }}>{projectB.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {projectB.description}
              </p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '12px', width: '100%' }}
                onClick={() => onOpenDetails(projectB)}
              >
                Inspect Details & Roadmap &rarr;
              </button>
            </div>
          </div>

          {/* Comparison Dimensions Table */}
          <div className="glass-panel" style={{ overflowX: 'auto', padding: 0, marginBottom: '24px' }}>
            <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', width: '25%' }}>Metric / Dimension</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', width: '37.5%', color: '#60a5fa' }}>Option A</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', width: '37.5%', color: '#c084fc' }}>Option B</th>
                </tr>
              </thead>
              <tbody>
                {/* Domain & Subdomain */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Domain / Field</td>
                  <td style={{ padding: '12px 16px' }}>{projectA.domain} ({projectA.subdomain})</td>
                  <td style={{ padding: '12px 16px' }}>{projectB.domain} ({projectB.subdomain})</td>
                </tr>

                {/* Difficulty & Fit */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Difficulty Level</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge badge-difficulty-${projectA.difficulty?.toLowerCase()}`}>{projectA.difficulty}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge badge-difficulty-${projectB.difficulty?.toLowerCase()}`}>{projectB.difficulty}</span>
                  </td>
                </tr>

                {/* Skill Readiness Score */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Skill Readiness</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: gapA.readiness >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                        {gapA.readiness}%
                      </span>
                      {higherReadiness === projectA && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Higher Readiness</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: gapB.readiness >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                        {gapB.readiness}%
                      </span>
                      {higherReadiness === projectB && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Higher Readiness</span>}
                    </div>
                  </td>
                </tr>

                {/* Timeline & Feasibility */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Estimated Duration</td>
                  <td style={{ padding: '12px 16px' }}>
                    ⏱️ {projectA.estimated_duration} Weeks
                    {shorterDuration === projectA && <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>Faster Finish</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    ⏱️ {projectB.estimated_duration} Weeks
                    {shorterDuration === projectB && <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>Faster Finish</span>}
                  </td>
                </tr>

                {/* Resume Impact & Originality */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Recruiter Resume Value</td>
                  <td style={{ padding: '12px 16px' }}>
                    ⭐ {projectA.resume_value || 8.5}/10 (Originality: {projectA.originality_score || 8.5}/10)
                    {higherResume === projectA && <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>Highest Impact</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    ⭐ {projectB.resume_value || 8.5}/10 (Originality: {projectB.originality_score || 8.5}/10)
                    {higherResume === projectB && <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>Highest Impact</span>}
                  </td>
                </tr>

                {/* Missing Skill Gaps */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Missing Gaps to Learn</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {gapA.missing.length === 0 ? (
                        <span style={{ color: 'var(--success)' }}>None (100% prepared)</span>
                      ) : (
                        gapA.missing.map(s => <span key={s} className="skill-chip missing" style={{ fontSize: '0.72rem' }}>✗ {s}</span>)
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {gapB.missing.length === 0 ? (
                        <span style={{ color: 'var(--success)' }}>None (100% prepared)</span>
                      ) : (
                        gapB.missing.map(s => <span key={s} className="skill-chip missing" style={{ fontSize: '0.72rem' }}>✗ {s}</span>)
                      )}
                    </div>
                  </td>
                </tr>

                {/* Tech Stack */}
                <tr>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Core Technologies</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(projectA.frameworks || []).concat(projectA.tools || []).slice(0, 4).map(t => (
                        <span key={t} className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.72rem' }}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(projectB.frameworks || []).concat(projectB.tools || []).slice(0, 4).map(t => (
                        <span key={t} className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.72rem' }}>{t}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI Decision Verdict */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>💡</span>
            <div>
              <div className="studio-synthesized-label" style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
                Algorithmic Decision Guidance
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                {gapA.readiness > gapB.readiness + 15
                  ? `Choose '${projectA.title}' if you want a reliable build with lower risk, as your skill readiness is substantially higher (${gapA.readiness}% vs ${gapB.readiness}%). Pick '${projectB.title}' if your goal is an ambitious stretch learning curve.`
                  : gapB.readiness > gapA.readiness + 15
                  ? `Choose '${projectB.title}' for immediate momentum (${gapB.readiness}% readiness). Choose '${projectA.title}' if you specifically want to master ${gapA.missing.slice(0, 2).join(' and ')}.`
                  : `'${projectA.title}' and '${projectB.title}' have comparable technical readiness. Base your decision on whether ${projectA.domain} or ${projectB.domain} aligns closer with your target employer.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
