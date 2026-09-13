import React, { useState } from 'react';

const DOMAIN_THEMES = {
  'HealthTech': { accent: '#10b981', code: 'MED-AI', icon: '🧬' },
  'HealthTech & BioInformatics': { accent: '#10b981', code: 'MED-AI', icon: '🧬' },
  'Machine Learning': { accent: '#06b6d4', code: 'ML-CORE', icon: '🧠' },
  'Artificial Intelligence': { accent: '#a855f7', code: 'NEURAL', icon: '⚡' },
  'Computer Vision': { accent: '#3b82f6', code: 'CV-PERCEPT', icon: '👁️' },
  'Natural Language Processing': { accent: '#ec4899', code: 'NLP-LLM', icon: '💬' },
  'Web Development': { accent: '#38bdf8', code: 'FULL-STACK', icon: '🌐' },
  'Cybersecurity': { accent: '#f43f5e', code: 'SEC-OPS', icon: '🛡️' },
  'FinTech': { accent: '#f59e0b', code: 'QUANT-FIN', icon: '📈' },
  'Cloud & DevOps': { accent: '#0ea5e9', code: 'CLOUD-INFRA', icon: '☁️' },
  'Blockchain': { accent: '#eab308', code: 'WEB3-CHAIN', icon: '⛓️' },
  'Robotics': { accent: '#14b8a6', code: 'ROBO-MECH', icon: '🤖' },
  'Data Science': { accent: '#6366f1', code: 'DATA-ENG', icon: '📊' },
  'Internet of Things': { accent: '#10b981', code: 'IOT-EDGE', icon: '📡' },
  'Climate': { accent: '#22c55e', code: 'ECO-TECH', icon: '🌱' },
  'Mobile Development': { accent: '#8b5cf6', code: 'MOBILE-SYS', icon: '📱' },
  'EdTech': { accent: '#f97316', code: 'ED-TECH', icon: '🎓' },
};

export default function RecommendationCard({
  item,
  onOpenDetails,
  onOpenRoadmap,
  onBookmark,
  onStartProject,
  isStarted = false,
  isSaved = false,
  onCompare,
  isCompared = false
}) {
  const [showExplain, setShowExplain] = useState(false);
  const [bookmarked, setBookmarked] = useState(isSaved);

  const handleBookmark = (e) => {
    e.stopPropagation();
    const nextVal = !bookmarked;
    setBookmarked(nextVal);
    if (onBookmark) onBookmark(item, nextVal ? 'saved' : 'remove');
  };

  const handleStart = (e) => {
    e.stopPropagation();
    if (onStartProject) onStartProject(item);
  };

  const theme = DOMAIN_THEMES[item.domain] || { accent: '#388069', code: 'ENG-SPEC', icon: '⚡' };
  const isGenerated = item.project_id?.startsWith('proj-gen-') || item.project_id?.startsWith('proj-ai-');
  const matchPct = Math.round(item.match_percentage || 0);
  const readinessPct = Math.round(item.readiness_percentage || 0);
  const isHighReadiness = readinessPct >= 65;

  // SVG Dial Math (r=21, C=131.95)
  const RADIUS = 21;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeOffset = CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(100, Math.max(0, matchPct))) / 100;
  const dialColor = matchPct >= 75 ? '#10b981' : matchPct >= 60 ? '#06b6d4' : '#f59e0b';

  // Ramp-up hours estimation for skill gaps
  const getGapHours = (skill) => 6 + (skill.length % 5) * 2;

  const totalRequired = (item.required_skills?.length) || ((item.matched_skills?.length || 0) + (item.missing_skills?.length || 0)) || 1;
  const possessedCount = item.matched_skills?.length || 0;
  const missingCount = item.missing_skills?.length || 0;
  const possessedRatio = Math.round((possessedCount / totalRequired) * 100);
  const missingRatio = 100 - possessedRatio;

  return (
    <div
      className="blueprint-card"
      id={`card-${item.project_id}`}
      style={{ '--domain-accent': theme.accent }}
    >
      {/* ── Top Architectural Hairline Accent ── */}
      <div className="blueprint-accent-hairline" />

      <div className="blueprint-body">
        {/* ── Architectural HUD Header ── */}
        <div className="blueprint-hud-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Top Specs Tags */}
            <div className="hud-tag-strip">
              <span className="hud-code-tag">
                {theme.icon} {theme.code}
              </span>
              <span
                className="badge"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.72rem'
                }}
              >
                {item.difficulty}
              </span>
              {isGenerated && (
                <span
                  className="badge"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.25))',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    fontSize: '0.7rem'
                  }}
                >
                  ✨ AI SYNTHESIS
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="blueprint-title" title={item.title}>
              {item.title}
            </h3>

            {/* Subdomain Architecture Line */}
            <div className="blueprint-subdomain">
              <span>◈</span>
              <span>{item.subdomain || item.domain}</span>
            </div>
          </div>

          {/* ── HUD Affinity Dial ── */}
          <div className="hud-dial-container">
            <div className="hud-svg-dial" title={`Match Affinity: ${matchPct}%`}>
              <svg viewBox="0 0 52 52">
                <circle
                  className="hud-dial-track"
                  cx="26"
                  cy="26"
                  r={RADIUS}
                />
                <circle
                  className="hud-dial-fill"
                  cx="26"
                  cy="26"
                  r={RADIUS}
                  stroke={dialColor}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeOffset}
                />
              </svg>
              <div className="hud-dial-value">
                {matchPct}%
              </div>
            </div>
            <span className="hud-dial-label">Affinity</span>
            <div className="readiness-beacon" title={`Skill Readiness: ${readinessPct}%`}>
              <span className={`beacon-dot ${isHighReadiness ? 'ready' : 'bridge'}`} />
              <span style={{ color: isHighReadiness ? '#34d399' : '#fbbf24', fontSize: '0.7rem' }}>
                {readinessPct}% Ready
              </span>
            </div>
          </div>
        </div>

        {/* Perspective Ribbon if present */}
        {item.perspective && (
          <div className="blueprint-perspective-ribbon">
            <span>★</span>
            <span>{item.perspective.replace(/_/g, ' ').toUpperCase()} BLUEPRINT</span>
          </div>
        )}

        {/* ── Executive Abstract Console (Inset Briefing Box) ── */}
        <div className="blueprint-briefing">
          <p className="blueprint-briefing-text">
            {item.description}
          </p>
        </div>

        {/* ── 4-Quadrant Engineering Specs Matrix ── */}
        <div className="specs-matrix">
          <div className="specs-cell">
            <span className="specs-cell-label">⏱️ Duration</span>
            <span className="specs-cell-val">
              {item.estimated_duration} Wks
              <span className="specs-cell-sub">~12h/wk</span>
            </span>
          </div>

          <div className="specs-cell">
            <span className="specs-cell-label">⚡ Readiness</span>
            <span className="specs-cell-val">
              {readinessPct}%
              <span className="specs-cell-sub">
                {isHighReadiness ? 'High Match' : 'Ramp Path'}
              </span>
            </span>
          </div>

          <div className="specs-cell">
            <span className="specs-cell-label">⭐ Recruiter Value</span>
            <span className="specs-cell-val">
              {item.resume_value || 8.5}/10
              <span className="specs-cell-sub">Portfolio Signal</span>
            </span>
          </div>

          <div className="specs-cell">
            <span className="specs-cell-label">📊 Dataset Status</span>
            <span className="specs-cell-val" style={{ fontSize: '0.76rem' }}>
              {item.dataset_available ? '✓ Verified Ingestion' : '⚡ End-to-End Pipeline'}
            </span>
          </div>
        </div>

        {/* ── Dual-Stream Skill Telemetry Matrix ── */}
        <div className="skills-telemetry-block">
          {/* Segmented Ratio Bar */}
          <div className="readiness-meter-wrapper">
            <div className="readiness-meter-header">
              <span>Stack Alignment</span>
              <span>
                <strong style={{ color: '#34d399' }}>{possessedCount} Ready</strong>
                <span style={{ margin: '0 4px', opacity: 0.5 }}>/</span>
                <strong style={{ color: missingCount > 0 ? '#fbbf24' : '#34d399' }}>
                  {missingCount} {missingCount === 1 ? 'Bridge' : 'Bridges'}
                </strong>
              </span>
            </div>
            <div className="readiness-track-bar">
              <div className="readiness-track-possessed" style={{ width: `${possessedRatio}%` }} />
              <div className="readiness-track-missing" style={{ width: `${missingRatio}%` }} />
            </div>
          </div>

          {/* Possessed Skills Stream */}
          {possessedCount > 0 && (
            <div className="skill-stream">
              <span className="stream-label">
                <span style={{ color: '#34d399' }}>✓</span> Verified Strengths
              </span>
              <div className="stream-chips">
                {item.matched_skills.map((sk) => (
                  <span key={sk} className="chip-possessed" title="Skill already possessed">
                    ✓ {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skill Gaps Stream */}
          {missingCount > 0 && (
            <div className="skill-stream" style={{ marginTop: possessedCount > 0 ? '6px' : '0' }}>
              <span className="stream-label">
                <span style={{ color: '#fbbf24' }}>⚡</span> Target Bridge Gaps
              </span>
              <div className="stream-chips">
                {item.missing_skills.map((sk) => (
                  <span key={sk} className="chip-gap" title={`Bridge this gap (~${getGapHours(sk)}h ramp-up)`}>
                    <span>⚡ {sk}</span>
                    <span className="gap-hrs">+{getGapHours(sk)}h</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── AI Recommendation Audit (Why Recommended) ── */}
        <div className="ai-audit-box">
          <div
            className="ai-audit-trigger"
            onClick={() => setShowExplain(!showExplain)}
          >
            <span>◈ AI FIT AUDIT RATIONALE</span>
            <span>{showExplain ? '▲ CLOSE' : '▼ INSPECT'}</span>
          </div>

          {showExplain && (
            <div className="ai-audit-content">
              {/* Positive vectors */}
              {item.reasons && item.reasons.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Positive Matching Vectors:
                  </div>
                  {item.reasons.map((r, i) => (
                    <div key={i} className="ai-audit-vector">
                      <span>✓</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cautions / Bridge tasks */}
              {item.cautions && item.cautions.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Architecture Prerequisite Notes:
                  </div>
                  {item.cautions.map((c, i) => (
                    <div key={i} className="ai-audit-caution">
                      <span>⚠️</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Score breakdown metrics if available */}
              {item.score_components && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    Algorithm Component Weights:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.72rem' }}>
                    {Object.entries(item.score_components).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{k}:</span>
                        <span style={{ fontWeight: 700, color: v >= 80 ? '#34d399' : 'var(--text-primary)' }}>{v}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Integrated Deck Action Dock ── */}
      <div className="deck-action-dock">
        <button
          className="btn-deck-primary"
          onClick={() => onOpenRoadmap(item)}
          title="Open interactive multi-week step-by-step roadmap"
        >
          <span>🗺️ Roadmap</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>→</span>
        </button>

        <button
          className={`btn-deck-tool ${isStarted ? 'active' : ''}`}
          style={isStarted ? { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' } : {}}
          onClick={handleStart}
          title={isStarted ? "Already added to your Workspace" : "Start this project and track it in My Workspace"}
        >
          {isStarted ? "⚡ In Progress" : "🚀 Start"}
        </button>

        <button
          className="btn-deck-tool"
          onClick={() => onOpenDetails(item)}
          title="View complete architectural specifications & blueprint details"
        >
          📋 Specs
        </button>

        <button
          className={`btn-deck-tool ${isCompared ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onCompare) onCompare(item);
          }}
          title={isCompared ? "Remove from comparison dock" : "Compare side-by-side with another project"}
        >
          {isCompared ? "✓ In Tray" : "⚖️ Compare"}
        </button>

        <button
          className={`btn-deck-tool ${bookmarked ? 'active' : ''}`}
          onClick={handleBookmark}
          title={bookmarked ? "Remove bookmark" : "Save project blueprint"}
        >
          {bookmarked ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}

