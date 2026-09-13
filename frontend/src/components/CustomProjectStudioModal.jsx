import React, { useState } from 'react';
import { architectCustomProject, saveCustomProject, downloadProjectScaffold } from '../api/client';

const DOMAIN_OPTIONS = [
  'All Domains / Auto-detect',
  'Computer Vision',
  'Natural Language Processing',
  'Machine Learning & Data Science',
  'Robotics & Autonomous Systems',
  'Web & Cloud Engineering',
  'Cybersecurity & Network Defense',
  'Internet of Things (IoT) & Embedded',
  'Distributed Systems & DevOps'
];

const POPULAR_TECH_SUGGESTIONS = [
  'Python', 'FastAPI', 'PyTorch', 'Docker', 'React', 'OpenCV', 'ROS2', 'Redis', 'PostgreSQL', 'Kafka', 'Scikit-Learn', 'Transformers'
];

const INSPIRATION_IDEAS = [
  {
    label: '🤖 Autonomous Drone Obstacle Avoidance',
    text: 'Autonomous quadcopter obstacle avoidance and real-time 3D path planning using ROS2, depth camera perception, and OpenCV simulator.',
    domain: 'Robotics & Autonomous Systems',
    tech: ['Python', 'C++', 'ROS2', 'OpenCV', 'Docker']
  },
  {
    label: '💳 Real-Time Streaming Fraud Detection',
    text: 'High-throughput credit card fraud detection system processing simulated Kafka transaction streams with XGBoost classification and FastAPI.',
    domain: 'Machine Learning & Data Science',
    tech: ['Python', 'Kafka', 'FastAPI', 'Scikit-Learn', 'Docker']
  },
  {
    label: '🏥 Clinical Medical Record Summarizer',
    text: 'Privacy-first medical chart summarizer and clinical entity extractor using local LLM embeddings, LangChain, and FastAPI with structured outputs.',
    domain: 'Natural Language Processing',
    tech: ['Python', 'Transformers', 'FastAPI', 'PostgreSQL']
  },
  {
    label: '📹 Edge AI Smart Traffic Analytics',
    text: 'Multi-stream traffic flow analysis and vehicle tracking pipeline running YOLOv8 with sub-50ms inference, OpenCV, and WebRTC streaming dashboard.',
    domain: 'Computer Vision',
    tech: ['Python', 'OpenCV', 'PyTorch', 'FastAPI', 'Docker']
  }
];

export default function CustomProjectStudioModal({
  isOpen,
  onClose,
  studentProfile,
  onProjectSaved,
  onOpenPrepKit,
  onOpenMockInterview
}) {
  const [stage, setStage] = useState('input');
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains / Auto-detect');
  const [selectedTech, setSelectedTech] = useState(['Python', 'FastAPI']);
  const [customTechInput, setCustomTechInput] = useState('');
  const [timelineWeeks, setTimelineWeeks] = useState(4);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [blueprint, setBlueprint] = useState(null);

  const [appliedCustomizations, setAppliedCustomizations] = useState({
    architecture: true,
    security_production: true,
    resume_multiplier: true
  });

  const [downloadingZip, setDownloadingZip] = useState(false);

  if (!isOpen) return null;

  const handleToggleTech = (tech) => {
    if (selectedTech.includes(tech)) {
      setSelectedTech(selectedTech.filter(t => t !== tech));
    } else {
      setSelectedTech([...selectedTech, tech]);
    }
  };

  const handleAddCustomTech = (e) => {
    e.preventDefault();
    const clean = customTechInput.trim();
    if (clean && !selectedTech.includes(clean)) {
      setSelectedTech([...selectedTech, clean]);
      setCustomTechInput('');
    }
  };

  const handleApplyInspiration = (item) => {
    setIdeaPrompt(item.text);
    setSelectedDomain(item.domain);
    setSelectedTech(item.tech);
  };

  const handleToggleCustomization = (type) => {
    setAppliedCustomizations(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleArchitect = async () => {
    if (!ideaPrompt.trim()) {
      setError('Please describe your project idea or problem statement.');
      return;
    }
    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const domainParam = selectedDomain.includes('Auto-detect') ? null : selectedDomain;
      const data = await architectCustomProject({
        ideaPrompt: ideaPrompt.trim(),
        domain: domainParam,
        preferredTech: selectedTech,
        timelineWeeks: parseFloat(timelineWeeks),
        studentProfile: studentProfile || {}
      });
      setBlueprint(data);
      setStage('blueprint');
    } catch (err) {
      setError(err.message || 'Failed to architect project.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToWorkspace = async () => {
    if (!blueprint) return;
    setSaving(true);
    setError(null);

    try {
      const finalProject = { ...blueprint };
      const enabledTypes = Object.keys(appliedCustomizations).filter(k => appliedCustomizations[k]);
      
      const res = await saveCustomProject(finalProject, true, enabledTypes);
      setSaveSuccess(true);
      if (onProjectSaved) {
        onProjectSaved(res.project || finalProject);
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save custom project to workspace.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!blueprint) return;
    setDownloadingZip(true);
    try {
      await saveCustomProject(blueprint, false);
      await downloadProjectScaffold(blueprint.project_id, studentProfile?.skills || ['Python']);
    } catch (err) {
      setError(err.message || 'Failed to download starter code.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const readinessScore = blueprint?.readiness_score != null 
    ? Math.round(blueprint.readiness_score * 100) 
    : 75;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '880px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)' }}>
              🛠️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Custom Project Studio
                </h2>
                <span className="studio-tag-badge" style={{ fontSize: '0.72rem' }}>
                  AI Architect
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Synthesize custom concepts into production-grade blueprints with senior-level optimizations
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, fontSize: '1rem', lineHeight: 1 }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.12)', borderBottom: '1px solid var(--danger)', color: '#fca5a5', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {stage === 'input' ? (
            <>
              {/* Quick Inspiration */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px' }}>
                  💡 Quick Inspiration Ideas (Click to populate)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '8px' }}>
                  {INSPIRATION_IDEAS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyInspiration(item)}
                      className="glass-panel"
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Concept Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Project Concept / Problem Statement <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Be as descriptive as you like</span>
                </div>
                <textarea
                  value={ideaPrompt}
                  onChange={(e) => setIdeaPrompt(e.target.value)}
                  rows={4}
                  placeholder="Describe what you want to build, the core problem it solves, target users, or specific approaches you want to incorporate..."
                  className="form-input"
                  style={{ width: '100%', resize: 'none', lineHeight: 1.5, fontSize: '0.88rem' }}
                />
              </div>

              {/* Domain & Timeline Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label">Domain Category</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="form-select"
                  >
                    {DOMAIN_OPTIONS.map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Estimated Timeline</label>
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                      {timelineWeeks} Weeks (~{timelineWeeks * 10} hrs)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="1"
                    value={timelineWeeks}
                    onChange={(e) => setTimelineWeeks(parseInt(e.target.value, 10))}
                    className="range-slider"
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>2 wks (Sprint)</span>
                    <span>4 wks (Standard)</span>
                    <span>8 wks (In-depth)</span>
                    <span>12 wks (Capstone)</span>
                  </div>
                </div>
              </div>

              {/* Preferred Tech Stack */}
              <div>
                <label className="form-label">Preferred Tech Stack & Tools</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {POPULAR_TECH_SUGGESTIONS.map((tech) => {
                    const active = selectedTech.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => handleToggleTech(tech)}
                        className={`badge ${active ? 'badge-primary' : ''}`}
                        style={{
                          cursor: 'pointer',
                          padding: '5px 12px',
                          fontSize: '0.78rem',
                          background: active ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'rgba(255, 255, 255, 0.04)',
                          border: active ? 'none' : '1px solid var(--border-color)',
                          color: active ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        {active ? '✓ ' : '+ '}{tech}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleAddCustomTech} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={customTechInput}
                    onChange={(e) => setCustomTechInput(e.target.value)}
                    placeholder="Add custom library or framework (e.g. Locust, WebRTC)..."
                    className="form-input"
                    style={{ flex: 1, fontSize: '0.84rem' }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0 16px' }}>
                    Add Tag
                  </button>
                </form>
              </div>

              <div style={{ paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleArchitect}
                  disabled={loading || !ideaPrompt.trim()}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px 24px',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? "⏳ Synthesizing Architecture & Customizations..." : "✨ Architect Project Blueprint"}
                </button>
              </div>
            </>
          ) : (
            blueprint && (
              <>
                {/* Top Nav Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setStage('input')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    ← Refine Prompt / Input
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Blueprint ID: <code style={{ color: 'var(--primary)' }}>{blueprint.project_id}</code>
                  </span>
                </div>

                {/* Blueprint Card */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'rgba(99, 102, 241, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {blueprint.domain} • {blueprint.subdomain}
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 6px 0', color: 'var(--text-primary)' }}>
                        {blueprint.title}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                        ★ Originality {blueprint.originality_score || 9.4}/10
                      </span>
                      <span className="studio-tag-badge" style={{ fontSize: '0.75rem' }}>
                        📈 Resume {blueprint.resume_value || 9.2}/10
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
                    {blueprint.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      ⏱️ {blueprint.estimated_duration || 4} Weeks
                    </span>
                    <span className={`badge badge-difficulty-${blueprint.difficulty?.toLowerCase()}`}>
                      {blueprint.difficulty || 'Intermediate'}
                    </span>
                    {(blueprint.programming_languages || []).map((lang, idx) => (
                      <span key={idx} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                        💻 {lang}
                      </span>
                    ))}
                    {(blueprint.frameworks || []).map((fw, idx) => (
                      <span key={idx} className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '0.72rem' }}>
                        ⚙️ {fw}
                      </span>
                    ))}
                    {(blueprint.tools || []).map((tl, idx) => (
                      <span key={idx} className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                        🔧 {tl}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3 STRATEGIC AI CUSTOMIZATIONS */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🚀</span> Strategic Customization Recommendations
                      </h4>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        Senior architect upgrades to transform this project into an industry-grade portfolio piece
                      </p>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      3 Upgrades Available
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
                    {(blueprint.customization_suggestions || []).map((sug, idx) => {
                      const isApplied = appliedCustomizations[sug.type] ?? true;
                      const icons = {
                        architecture: '⚡',
                        security_production: '🛡️',
                        resume_multiplier: '📈'
                      };
                      const icon = icons[sug.type] || '✨';

                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleCustomization(sug.type)}
                          className="glass-panel"
                          style={{
                            padding: '14px',
                            borderRadius: '12px',
                            border: isApplied ? '1px solid #6366f1' : '1px solid var(--border-color)',
                            background: isApplied ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: isApplied ? '0 0 16px rgba(99, 102, 241, 0.2)' : 'none'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                              <input
                                type="checkbox"
                                checked={isApplied}
                                onChange={() => {}}
                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                              />
                            </div>
                            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                              {sug.title}
                            </h5>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                              {sug.summary}
                            </p>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                            {(sug.recommended_tools || []).map((tool, tIdx) => (
                              <span
                                key={tIdx}
                                className="badge"
                                style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Skill Readiness & Gap Box */}
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Skill Readiness
                      </span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#34d399' }}>
                        {readinessScore}% Prepared
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div
                        style={{ width: `${readinessScore}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: '4px', transition: 'width 0.4s ease' }}
                      />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      ✓ Matched Skills: {(blueprint.skill_gap?.matched_skills || ['Python']).join(', ')}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24', display: 'block', marginBottom: '6px' }}>
                      Identified Missing Skills & Prep
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(blueprint.missing_skills || []).length > 0 ? (
                        blueprint.missing_skills.map((s, i) => (
                          <span
                            key={i}
                            className="badge badge-warning"
                            style={{ fontSize: '0.74rem' }}
                          >
                            + {s}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#34d399' }}>
                          Full skill match! You have all required prerequisites.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Adaptive Milestone Roadmap Preview */}
                {blueprint.roadmap?.milestones && (
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🗺️</span> Adaptive Roadmap Milestones ({blueprint.roadmap.milestones.length} Weeks)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {blueprint.roadmap.milestones.map((m, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '12px 14px', borderRadius: '10px', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ color: 'var(--primary)' }}>Week {m.week_number}: {m.title}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.focus}</span>
                          </div>
                          <ul style={{ margin: '4px 0 0 16px', padding: 0, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                            {(m.tasks || []).slice(0, 3).map((t, tIdx) => (
                              <li key={tIdx} style={{ marginBottom: '2px' }}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          )}

        </div>

        {/* Modal Footer / Action Bar */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {stage === 'input' ? (
            <>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Need inspiration? Click an inspiration idea above or browse the catalog.
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div>
                {saveSuccess && (
                  <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    ✓ Saved to Workspace & Catalog!
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>📦</span>
                  <span>{downloadingZip ? 'Packaging...' : 'Starter (.zip)'}</span>
                </button>

                {onOpenPrepKit && blueprint && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onClose();
                      onOpenPrepKit(blueprint);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(168, 85, 247, 0.4)' }}
                  >
                    <span>💼</span>
                    <span>STAR Prep Kit</span>
                  </button>
                )}

                {onOpenMockInterview && blueprint && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onClose();
                      onOpenMockInterview(blueprint);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                  >
                    <span>🎙️</span>
                    <span>Mock Interview</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveToWorkspace}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    border: 'none',
                    fontWeight: 700,
                    padding: '8px 18px'
                  }}
                >
                  {saving ? 'Saving...' : '🚀 Save to Workspace'}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
