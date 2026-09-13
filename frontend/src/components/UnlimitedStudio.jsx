import React, { useState } from 'react';
import { architectCustomProject, saveCustomProject, downloadProjectScaffold, generateUnlimitedIdeas } from '../api/client';

const DOMAIN_OPTIONS = [
  'All Domains / Auto-detect',
  'Generative AI & LLM Systems',
  'Computer Vision & Edge AI',
  'Natural Language Processing',
  'Robotics & Autonomous Systems',
  'Distributed Systems & Cloud',
  'Cybersecurity & Zero-Trust',
  'FinTech & Quantitative Engineering',
  'HealthTech & Medical AI',
  'Internet of Things (IoT) & Embedded',
  'Web3 & Decentralized Systems'
];

const POPULAR_TECH = [
  'Python', 'FastAPI', 'PyTorch', 'Docker', 'React', 'TypeScript', 'Go', 'Rust', 'PostgreSQL', 'Redis', 'Kafka', 'Kubernetes', 'Next.js', 'LangChain', 'OpenCV', 'ROS2'
];

const ARCHITECTURE_STYLES = [
  { id: 'microservices', label: 'Decoupled Microservices', icon: '🧩' },
  { id: 'event_driven', label: 'Event-Driven Streaming', icon: '⚡' },
  { id: 'hexagonal', label: 'Hexagonal Clean Monolith', icon: '🏛️' },
  { id: 'serverless', label: 'Serverless Cloud Functions', icon: '☁️' }
];

const ENTERPRISE_ADDONS = [
  { id: 'auth', label: 'JWT Auth & RBAC', icon: '🔐' },
  { id: 'payments', label: 'Stripe Payments', icon: '💳' },
  { id: 'websockets', label: 'Real-Time WebSockets', icon: '⚡' },
  { id: 'rag', label: 'RAG & Vector Search', icon: '🧠' },
  { id: 'docker', label: 'Docker & K8s Deploy', icon: '🐳' },
  { id: 'testing', label: 'Pytest CI/CD Suite', icon: '🧪' }
];

const INSPIRATION_TEMPLATES = [
  {
    title: '🤖 Autonomous Multi-Agent Research Assistant',
    prompt: 'Hierarchical multi-agent research assistant that autonomously crawls technical papers, synthesizes citations, vectors embeddings into Pinecone, and generates LaTeX literature reviews.',
    domain: 'Generative AI & LLM Systems',
    tech: ['Python', 'LangChain', 'FastAPI', 'Docker']
  },
  {
    title: '⚡ Ultra-Low Latency Order Book Engine',
    prompt: 'High-throughput crypto matching engine processing 50,000 orders/sec with lock-free ring buffers, WebSocket order broadcast, and real-time PnL risk calculation.',
    domain: 'FinTech & Quantitative Engineering',
    tech: ['Rust', 'Go', 'Redis', 'Docker']
  },
  {
    title: '🚗 Quadcopter Obstacle Avoidance & 3D SLAM',
    prompt: 'Autonomous drone navigation pipeline using ROS2, depth-camera perception, octree 3D voxel mapping, and real-time trajectory optimization under wind turbulence.',
    domain: 'Robotics & Autonomous Systems',
    tech: ['C++', 'Python', 'ROS2', 'OpenCV']
  },
  {
    title: '🔒 eBPF Real-Time Container Threat Detector',
    prompt: 'Kernel-level zero-day privilege escalation detector using Linux eBPF probes, syscall anomaly tracking, and automated container isolation with Grafana alerts.',
    domain: 'Cybersecurity & Zero-Trust',
    tech: ['Go', 'Rust', 'Linux', 'Docker']
  }
];

export default function UnlimitedStudio({
  studentProfile,
  onProjectSaved,
  onOpenPrepKit,
  onOpenMockInterview,
  onIdeasGenerated
}) {
  // Input form state
  const [promptText, setPromptText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains / Auto-detect');
  const [selectedTech, setSelectedTech] = useState(['Python', 'FastAPI', 'Docker']);
  const [customTechInput, setCustomTechInput] = useState('');
  const [timelineWeeks, setTimelineWeeks] = useState(4);
  const [selectedArch, setSelectedArch] = useState('microservices');
  const [selectedAddons, setSelectedAddons] = useState(['auth', 'docker', 'testing']);

  // UI state
  const [architecting, setArchitecting] = useState(false);
  const [batchSynthesizing, setBatchSynthesizing] = useState(false);
  const [blueprint, setBlueprint] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('architecture');
  const [statusMessage, setStatusMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Strategic toggle
  const [appliedCustomizations, setAppliedCustomizations] = useState({
    architecture: true,
    security_production: true,
    resume_multiplier: true
  });

  const handleToggleTech = (t) => {
    setSelectedTech(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleAddCustomTech = (e) => {
    e.preventDefault();
    const clean = customTechInput.trim();
    if (clean && !selectedTech.includes(clean)) {
      setSelectedTech(prev => [...prev, clean]);
      setCustomTechInput('');
    }
  };

  const handleToggleAddon = (id) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleApplyTemplate = (tmpl) => {
    setPromptText(tmpl.prompt);
    setSelectedDomain(tmpl.domain);
    setSelectedTech(tmpl.tech);
  };

  // 1-Click Instant Batch Synthesis
  const handleBatchSynthesize = async (domainName, count = 3) => {
    setBatchSynthesizing(true);
    setStatusMessage(`Synthesizing ${count} cutting-edge ${domainName} projects into the catalog...`);
    try {
      const res = await generateUnlimitedIdeas({
        studentProfile: studentProfile || {},
        prompt: `Novel, industry-grade ${domainName} production systems`,
        domain: domainName.includes('All') ? undefined : domainName,
        count: count,
        saveToCatalog: true
      });
      setStatusMessage(`🎉 Successfully added ${res.generated_projects?.length || count} new blueprints to catalog!`);
      if (onIdeasGenerated) onIdeasGenerated(res);
    } catch (err) {
      console.error(err);
      setStatusMessage(`⚠️ Batch error: ${err.message || 'Failed to synthesize.'}`);
    } finally {
      setBatchSynthesizing(false);
    }
  };

  // Architect single custom project
  const handleArchitect = async () => {
    if (!promptText.trim()) {
      setStatusMessage('⚠️ Please enter a project description or select an inspiration idea above.');
      return;
    }
    setArchitecting(true);
    setStatusMessage('🧠 AI Principal Architect formulating system blueprint, specs & contracts...');
    setSaveSuccess(false);

    try {
      const domainParam = selectedDomain.includes('Auto-detect') ? null : selectedDomain;
      const res = await architectCustomProject({
        ideaPrompt: promptText.trim(),
        domain: domainParam,
        preferredTech: selectedTech,
        timelineWeeks: timelineWeeks,
        studentProfile: studentProfile || null
      });

      setBlueprint(res);
      setStatusMessage('✨ Architecture blueprint generated successfully! Explore tabs below.');
      setActiveResultTab('architecture');
    } catch (err) {
      console.error('Architecting error:', err);
      setStatusMessage(`⚠️ Failed to architect: ${err.message || 'Unknown error'}`);
    } finally {
      setArchitecting(false);
    }
  };

  const handleSaveToWorkspace = async () => {
    if (!blueprint) return;
    setSaving(true);
    try {
      const appliedList = Object.keys(appliedCustomizations).filter(k => appliedCustomizations[k]);
      await saveCustomProject(blueprint, true, appliedList);
      setSaveSuccess(true);
      setStatusMessage('🚀 Saved to My Workspace & Project Library!');
      if (onProjectSaved) onProjectSaved(blueprint);
    } catch (err) {
      console.error('Save error:', err);
      setStatusMessage(`⚠️ Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadScaffold = async () => {
    if (!blueprint?.project_id) return;
    setDownloadingZip(true);
    try {
      await downloadProjectScaffold(blueprint.project_id, blueprint.required_skills || selectedTech);
    } catch (err) {
      console.error(err);
      alert('Failed to generate starter archive: ' + err.message);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="studio-page-container">
      {/* ── Studio Hero Header ── */}
      <div className="studio-hero-banner">
        <div className="studio-hero-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '2rem' }}>⚡</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Unlimited Ideas & Architecture Studio
            </h1>
            <span className="studio-tag-badge">AI Architect & Customizer</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '780px' }}>
            Architect, customize, and synthesize unlimited production-grade engineering blueprints on demand.
            Choose your custom stack, architecture topology, and enterprise add-ons.
          </p>
        </div>

        {/* 1-Click Instant Batch Strip */}
        <div className="studio-batch-pills">
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            ⚡ 1-Click Batch Synthesizers:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('Generative AI & LLMs', 3)}
            >
              🤖 +3 GenAI
            </button>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('Distributed Systems & Cloud', 3)}
            >
              ⚡ +3 Cloud Native
            </button>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('Cybersecurity & Zero-Trust', 3)}
            >
              🔒 +3 CyberSec
            </button>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('Robotics & Autonomous Systems', 3)}
            >
              🚗 +3 Robotics
            </button>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('FinTech & Quantitative', 3)}
            >
              📈 +3 FinTech
            </button>
          </div>
        </div>
      </div>

      {/* Status Notification */}
      {statusMessage && (
        <div className="studio-status-banner" style={{ marginBottom: '20px' }}>
          <span>{statusMessage}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}

      {/* ── Studio Layout: Left Customizer Form / Right Blueprint View ── */}
      <div className="studio-layout-grid">
        {/* LEFT COLUMN: Customizer Workbench */}
        <div className="unlimited-studio-card" style={{ padding: '22px' }}>
          <div className="studio-title-group" style={{ marginBottom: '14px' }}>
            <span className="studio-icon">🛠️</span>
            <div className="studio-title" style={{ fontSize: '1.15rem' }}>
              Project Blueprint Customizer
            </div>
            <span className="studio-tag-badge">Live Config</span>
          </div>

          {/* Inspiration Quick-Picks */}
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label">✨ Instant Inspiration Templates</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {INSPIRATION_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="studio-template-btn"
                  onClick={() => handleApplyTemplate(tmpl)}
                >
                  <span className="studio-template-title">{tmpl.title}</span>
                  <span className="studio-template-meta">{tmpl.domain.split('&')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt / Idea Description */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Project Concept / Problem Statement</label>
            <textarea
              className="studio-input"
              rows={3}
              placeholder="e.g. Real-time distributed telemetry pipeline detecting network anomalies using Kafka and XGBoost..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
          </div>

          {/* Domain & Timeline Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">Engineering Domain</label>
              <select
                className="studio-select"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                {DOMAIN_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Timeline: {timelineWeeks} Weeks</label>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                className="range-slider"
                value={timelineWeeks}
                onChange={(e) => setTimelineWeeks(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Architecture Topology Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Architecture Topology</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ARCHITECTURE_STYLES.map((arch) => (
                <button
                  key={arch.id}
                  type="button"
                  className={`studio-arch-btn ${selectedArch === arch.id ? 'active' : ''}`}
                  onClick={() => setSelectedArch(arch.id)}
                >
                  <span>{arch.icon}</span>
                  <span>{arch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack Customizer Chips */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Tech Stack Components</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {POPULAR_TECH.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`studio-tech-chip ${selectedTech.includes(t) ? 'active' : ''}`}
                  onClick={() => handleToggleTech(t)}
                >
                  {selectedTech.includes(t) ? `✓ ${t}` : `+ ${t}`}
                </button>
              ))}
            </div>
            <form onSubmit={handleAddCustomTech} style={{ display: 'flex', gap: '6px' }}>
              <input
                className="studio-input"
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                placeholder="Add other tech (e.g. PyTorch, Celery)..."
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                + Add
              </button>
            </form>
          </div>

          {/* Enterprise Add-on Toggles */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Enterprise & Production Add-ons</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {ENTERPRISE_ADDONS.map((addon) => (
                <button
                  key={addon.id}
                  type="button"
                  className={`studio-addon-btn ${selectedAddons.includes(addon.id) ? 'active' : ''}`}
                  onClick={() => handleToggleAddon(addon.id)}
                >
                  <span>{addon.icon}</span>
                  <span>{addon.label}</span>
                  <span style={{ marginLeft: 'auto', opacity: selectedAddons.includes(addon.id) ? 1 : 0.3 }}>
                    {selectedAddons.includes(addon.id) ? '✓' : '+'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Architect Submit CTA */}
          <button
            className="studio-btn-synthesize"
            style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            disabled={architecting}
            onClick={handleArchitect}
          >
            {architecting ? '🧠 Synthesizing Architecture...' : '🚀 Architect Custom Project'}
          </button>
        </div>

        {/* RIGHT COLUMN: Architected Blueprint & Deep Engineering Sections */}
        <div className="studio-results-container">
          {!blueprint ? (
            <div className="unlimited-studio-card studio-empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏛️</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Your Custom Engineering Architecture
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                Configure your tech stack and problem statement on the left, or select an inspiration template.
                The AI Principal Architect will formulate your system topology, database schemas, and API contracts.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => handleApplyTemplate(INSPIRATION_TEMPLATES[0])}
              >
                Try &quot;Autonomous Multi-Agent Assistant&quot;
              </button>
            </div>
          ) : (
            <div className="unlimited-studio-card" style={{ padding: '24px' }}>
              {/* Header Title & Scores */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="badge badge-primary">{blueprint.domain}</span>
                    <span className="badge badge-difficulty-intermediate">{blueprint.difficulty || 'Intermediate'}</span>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>⏱️ {blueprint.estimated_duration || 4} Weeks</span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {blueprint.title}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                    {blueprint.description}
                  </p>
                </div>

                {/* Score Pills */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="studio-score-pill">
                    <span className="studio-score-val">{Number(blueprint.resume_value || 9.2).toFixed(1)}</span>
                    <span className="studio-score-lbl">Resume / 10</span>
                  </div>
                  <div className="studio-score-pill">
                    <span className="studio-score-val">{Number(blueprint.originality_score || 9.4).toFixed(1)}</span>
                    <span className="studio-score-lbl">Originality / 10</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={saving || saveSuccess}
                  onClick={handleSaveToWorkspace}
                >
                  {saveSuccess ? '✓ Saved to Workspace' : saving ? 'Saving...' : '🚀 Save to Workspace'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={downloadingZip}
                  onClick={handleDownloadScaffold}
                >
                  <span>📦</span> {downloadingZip ? 'Zipping...' : 'Download Starter (.zip)'}
                </button>
                {onOpenPrepKit && (
                  <button className="btn btn-secondary btn-sm" onClick={() => onOpenPrepKit(blueprint)}>
                    <span>💼</span> Prep Kit
                  </button>
                )}
                {onOpenMockInterview && (
                  <button className="btn btn-secondary btn-sm" onClick={() => onOpenMockInterview(blueprint)}>
                    <span>🎙️</span> Mock Interview
                  </button>
                )}
              </div>

              {/* Section Tabs */}
              <div className="studio-tab-strip">
                <button
                  className={`studio-tab-btn ${activeResultTab === 'architecture' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('architecture')}
                >
                  🏛️ System Architecture
                </button>
                <button
                  className={`studio-tab-btn ${activeResultTab === 'contracts' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('contracts')}
                >
                  🗄️ Database & API Specs
                </button>
                <button
                  className={`studio-tab-btn ${activeResultTab === 'customizations' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('customizations')}
                >
                  ✨ Strategic Multipliers
                </button>
                <button
                  className={`studio-tab-btn ${activeResultTab === 'roadmap' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('roadmap')}
                >
                  🗺️ Sprint Roadmap
                </button>
              </div>

              {/* TAB 1: SYSTEM ARCHITECTURE */}
              {activeResultTab === 'architecture' && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Decoupled Component Topology
                    </span>
                  </div>
                  {blueprint.architecture_spec?.diagram ? (
                    <div className="copilot-code-block" style={{ margin: 0 }}>
                      <div className="copilot-code-header">
                        <span>{blueprint.architecture_spec.pattern}</span>
                        <button
                          className="copilot-copy-btn"
                          onClick={() => navigator.clipboard.writeText(blueprint.architecture_spec.diagram)}
                        >
                          📋 Copy
                        </button>
                      </div>
                      <pre><code>{blueprint.architecture_spec.diagram}</code></pre>
                    </div>
                  ) : (
                    <div className="copilot-code-block" style={{ margin: 0 }}>
                      <pre><code>{`[Client Ingress] ──► [FastAPI Schema Guard] ──► [Redis Task Queue]
                                                  │
                                                  ▼
[PostgreSQL 16] ◄── [In-Memory Cache] ◄── [Worker Engine Tier]`}</code></pre>
                    </div>
                  )}

                  {blueprint.architecture_spec?.components && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                      {blueprint.architecture_spec.components.map((c, i) => (
                        <div key={i} className="studio-component-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{c.name}</strong>
                            <span className="badge badge-sm badge-primary">{c.tech}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DATABASE & API SPECS */}
              {activeResultTab === 'contracts' && (
                <div style={{ marginTop: '16px' }}>
                  {/* Database Schema */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Relational Database Schema (SQL DDL)
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        onClick={() => navigator.clipboard.writeText(blueprint.database_schema || '')}
                      >
                        📋 Copy SQL
                      </button>
                    </div>
                    <div className="copilot-code-block" style={{ margin: 0, maxHeight: '220px', overflowY: 'auto' }}>
                      <pre><code>{blueprint.database_schema || '-- Auto-generated PostgreSQL 16 schema\nCREATE TABLE entities (\n    id UUID PRIMARY KEY,\n    status VARCHAR(32)\n);'}</code></pre>
                    </div>
                  </div>

                  {/* REST API Contract */}
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                      REST / gRPC API Contract Specifications
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(blueprint.api_contract || [
                        { method: 'POST', endpoint: '/api/v1/execute', summary: 'Core pipeline execution', status_code: 200 }
                      ]).map((api, idx) => (
                        <div key={idx} className="studio-api-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className={`badge ${api.method === 'POST' ? 'badge-primary' : 'badge-secondary'}`} style={{ fontWeight: 700 }}>
                              {api.method}
                            </span>
                            <code style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {api.endpoint}
                            </code>
                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Status: {api.status_code}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{api.summary}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STRATEGIC MULTIPLIERS */}
              {activeResultTab === 'customizations' && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(blueprint.customization_suggestions || []).map((sug, i) => (
                    <div key={i} className="studio-multiplier-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {sug.type === 'architecture' ? '🏗️ ' : sug.type === 'security_production' ? '🔒 ' : '📈 '}
                          {sug.title}
                        </span>
                        <span className="badge badge-sm badge-secondary">{sug.type}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                        {sug.summary}
                      </p>
                      {sug.recommended_tools && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {sug.recommended_tools.map((t, idx) => (
                            <span key={idx} className="badge badge-sm" style={{ background: 'var(--bg-input)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: SPRINT ROADMAP */}
              {activeResultTab === 'roadmap' && (
                <div style={{ marginTop: '16px' }}>
                  {(blueprint.roadmap?.weeks || []).map((w, i) => (
                    <div key={i} style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Week {w.week_number}: {w.title}</strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{w.goal}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(w.tasks || []).map((task, tidx) => (
                          <div key={tidx} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            • {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
