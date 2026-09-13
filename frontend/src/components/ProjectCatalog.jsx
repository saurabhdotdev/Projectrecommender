import React, { useState, useEffect } from 'react';
import { fetchProjects, generateUnlimitedIdeas } from '../api/client';

export default function ProjectCatalog({ onSelectProject, totalCatalogSize, onIdeasGenerated, studentProfile, onOpenCustomStudio }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Synthesizer state in Catalog
  const [showSynthesizer, setShowSynthesizer] = useState(false);
  const [synthPrompt, setSynthPrompt] = useState("");
  const synthCount = 3;
  const [generating, setGenerating] = useState(false);
  const [synthMessage, setSynthMessage] = useState(null);

  const PAGE_SIZE = 24;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadProjects = (newOffset = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOffset(0);
    }

    fetchProjects({
      search: search || undefined,
      domain: domainFilter || undefined,
      difficulty: diffFilter || undefined,
      limit: PAGE_SIZE,
      offset: newOffset
    })
      .then(res => {
        if (append) {
          setProjects(prev => [...prev, ...res]);
        } else {
          setProjects(res);
        }
        setOffset(newOffset);
        setHasMore(res.length === PAGE_SIZE);
      })
      .catch(err => console.error(err))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    loadProjects(0, false);
  }, [search, domainFilter, diffFilter]);

  const handleLoadMore = () => {
    loadProjects(offset + PAGE_SIZE, true);
  };

  const handleCatalogSynthesize = async (promptOverride) => {
    const promptToUse = typeof promptOverride === 'string' ? promptOverride : (synthPrompt || search || domainFilter || "cutting-edge applied engineering project");
    setGenerating(true);
    setSynthMessage("Synthesizing novel blueprints & appending to catalog...");
    try {
      const res = await generateUnlimitedIdeas({
        studentProfile: studentProfile || {},
        prompt: promptToUse,
        domain: domainFilter || undefined,
        difficulty: diffFilter || undefined,
        count: synthCount,
        saveToCatalog: true
      });

      setSynthMessage(`🎉 Synthesized ${res.generated_projects?.length || synthCount} new project blueprint(s)!`);
      loadProjects();
      if (onIdeasGenerated) onIdeasGenerated(res);
    } catch (err) {
      console.error(err);
      setSynthMessage(`⚠️ Synthesis error: ${err.message || "Failed to generate."}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div id="project-catalog-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.45rem', margin: 0 }}>
              📚 Project & Blueprint Library
            </h2>
            <span className="studio-tag-badge">
              ✨ Unlimited Ideas On Demand
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Browse blueprints or synthesize unlimited novel projects for any niche, domain, or technology.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {onOpenCustomStudio && (
            <button
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={onOpenCustomStudio}
            >
              <span>🛠️ Build Custom Project</span>
            </button>
          )}
          <button
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowSynthesizer(!showSynthesizer)}
          >
            <span>{showSynthesizer ? '▲ Close Synthesizer' : '✨ Quick Synthesize'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Catalog Synthesizer Box */}
      {showSynthesizer && (
        <div className="unlimited-studio-card" style={{ marginBottom: '20px', padding: '18px 22px' }}>
          <div className="studio-title-group" style={{ marginBottom: '6px' }}>
            <span className="studio-icon">✨</span>
            <div className="studio-title" style={{ fontSize: '1.1rem' }}>
              On-Demand Blueprint Synthesizer
            </div>
            <span className="studio-tag-badge">AI Generator</span>
          </div>
          <p className="studio-desc" style={{ marginBottom: '14px' }}>
            Need a project in a specific domain (e.g. &quot;Quantum key distribution&quot;, &quot;Autonomous racing vehicle&quot;, &quot;AI agent for code refactoring&quot;)? Synthesize it instantly into the catalog.
          </p>
          <div className="studio-controls-row" style={{ marginTop: 0 }}>
            <input
              className="studio-input"
              placeholder="Enter topic or prompt (e.g. 'Federated Learning for Edge Devices')..."
              value={synthPrompt}
              onChange={(e) => setSynthPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCatalogSynthesize(); }}
            />
            <button
              className="studio-btn-synthesize"
              disabled={generating}
              onClick={() => handleCatalogSynthesize()}
            >
              {generating ? "Synthesizing..." : "🚀 Synthesize"}
            </button>
          </div>
          {synthMessage && (
            <div className={`studio-status-banner ${generating ? 'generating' : 'success'}`} style={{ marginTop: '12px', padding: '9px 14px' }}>
              <span>{generating ? "⚡" : "✨"}</span>
              <span>{synthMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ flex: 2, minWidth: '220px' }}
          placeholder="🔍 Search titles, topics, algorithms (e.g. readmission, SLAM, fraud, RAG)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ flex: 1, minWidth: '180px' }}
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
        >
          <option value="">All 16 Domains</option>
          <option value="HealthTech">HealthTech & BioInformatics</option>
          <option value="Machine Learning">Machine Learning</option>
          <option value="Artificial Intelligence">Artificial Intelligence</option>
          <option value="Computer Vision">Computer Vision</option>
          <option value="Natural Language Processing">Natural Language Processing</option>
          <option value="Web Development">Web Development</option>
          <option value="Cybersecurity">Cybersecurity</option>
          <option value="FinTech">FinTech & Quant</option>
          <option value="Cloud & DevOps">Cloud & DevOps</option>
          <option value="Blockchain">Blockchain & Web3</option>
          <option value="Robotics">Robotics & Autonomous Systems</option>
          <option value="Internet of Things">Internet of Things (IoT)</option>
          <option value="Climate">Climate & Sustainability</option>
          <option value="Data Science">Data Science & Analytics</option>
          <option value="Mobile Development">Mobile Development</option>
          <option value="EdTech">EdTech</option>
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '140px' }}
          value={diffFilter}
          onChange={(e) => setDiffFilter(e.target.value)}
        >
          <option value="">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Grid of Catalog Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading catalog projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '16px', fontSize: '1rem', color: '#f8fafc' }}>
            No pre-existing catalog projects found matching "{search || domainFilter || 'your criteria'}".
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {onOpenCustomStudio && (
              <button
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', padding: '10px 22px' }}
                onClick={onOpenCustomStudio}
              >
                🛠️ Architect Your Own Custom Project With AI
              </button>
            )}
            <button
              className="btn btn-secondary"
              style={{ padding: '10px 22px' }}
              onClick={() => handleCatalogSynthesize(search || domainFilter)}
              disabled={generating}
            >
              {generating ? "⏳ Synthesizing..." : `✨ Auto-Synthesize for "${search || domainFilter || 'this topic'}"`}
            </button>
          </div>
        </div>
      ) : (
        <div className="recommendation-grid">
          {projects.map((p) => {
            const domainThemes = {
              'HealthTech': { accent: '#10b981', code: 'MED-AI', icon: '🧬' },
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
            };
            const theme = domainThemes[p.domain] || { accent: '#388069', code: 'ENG-SPEC', icon: '⚡' };
            const isGenerated = p.project_id?.startsWith('proj-gen-') || p.project_id?.startsWith('proj-ai-');

            return (
              <div
                key={p.project_id}
                className="blueprint-card"
                style={{ '--domain-accent': theme.accent }}
              >
                {/* Top Architectural Hairline */}
                <div className="blueprint-accent-hairline" />

                <div className="blueprint-body">
                  {/* HUD Header */}
                  <div className="blueprint-hud-header" style={{ marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
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
                          {p.difficulty}
                        </span>
                        {isGenerated && (
                          <span
                            className="badge"
                            style={{
                              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.25))',
                              border: '1px solid rgba(168, 85, 247, 0.5)',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              fontSize: '0.7rem'
                            }}
                          >
                            ✨ AI SYNTHESIS
                          </span>
                        )}
                      </div>

                      <h3 className="blueprint-title" style={{ fontSize: '1.08rem' }}>
                        {p.title}
                      </h3>

                      <div className="blueprint-subdomain">
                        <span>◈</span>
                        <span>{p.subdomain || p.domain}</span>
                      </div>
                    </div>
                  </div>

                  {/* Briefing Box */}
                  <div className="blueprint-briefing" style={{ marginBottom: '12px' }}>
                    <p className="blueprint-briefing-text" style={{ WebkitLineClamp: 3 }}>
                      {p.description}
                    </p>
                  </div>

                  {/* 4-Quadrant Specs Matrix */}
                  <div className="specs-matrix" style={{ marginBottom: '12px' }}>
                    <div className="specs-cell">
                      <span className="specs-cell-label">⏱️ Duration</span>
                      <span className="specs-cell-val">
                        {p.estimated_duration} Wks
                        <span className="specs-cell-sub">Paced</span>
                      </span>
                    </div>

                    <div className="specs-cell">
                      <span className="specs-cell-label">⭐ Recruiter Value</span>
                      <span className="specs-cell-val">
                        {p.resume_value}/10
                        <span className="specs-cell-sub">Impact</span>
                      </span>
                    </div>

                    <div className="specs-cell">
                      <span className="specs-cell-label">📊 Dataset</span>
                      <span className="specs-cell-val" style={{ fontSize: '0.76rem' }}>
                        {p.dataset_available ? '✓ Verified' : '⚡ Custom/API'}
                      </span>
                    </div>

                    <div className="specs-cell">
                      <span className="specs-cell-label">🛠️ Tech Skills</span>
                      <span className="specs-cell-val" style={{ fontSize: '0.76rem' }}>
                        {p.required_skills?.length || 0} Technologies
                      </span>
                    </div>
                  </div>

                  {/* Tech Stack Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                    {p.required_skills?.slice(0, 5).map(sk => (
                      <span
                        key={sk}
                        className="chip-possessed"
                        style={{
                          background: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.7rem'
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                    {p.required_skills?.length > 5 && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', alignSelf: 'center', paddingLeft: '4px' }}>
                        +{p.required_skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Deck Action Dock */}
                <div className="deck-action-dock" style={{ padding: '10px 18px' }}>
                  <button
                    className="btn-deck-primary"
                    style={{ width: '100%' }}
                    onClick={() => onSelectProject(p)}
                  >
                    <span>🚀 Launch Blueprint & Roadmap</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>→</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Trailing Blueprint Synthesizer Tile to complete the row */}
          <div className="blueprint-card blueprint-synthesize-tile">
            <div className="synth-tile-icon">✨</div>
            <h3 className="synth-tile-title">Need a Custom Blueprint?</h3>
            <p className="synth-tile-desc">
              Synthesize novel architectures tailored specifically to {domainFilter || "your focus area"} on demand.
            </p>
            <button
              className="btn-deck-primary"
              style={{ width: '100%', maxWidth: '230px' }}
              onClick={() => handleCatalogSynthesize(search || domainFilter)}
              disabled={generating}
            >
              {generating ? "⏳ Synthesizing..." : "✨ Synthesize Blueprint"}
            </button>
          </div>
        </div>
      )}

      {/* Catalog Continuity & Discovery Dock */}
      {projects.length > 0 && (
        <div className="catalog-bottom-deck">
          <div className="catalog-status-info">
            <span>◈ Showing {projects.length} Engineering Blueprints</span>
            <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
            <span>Continuous On-Demand Synthesis Active</span>
          </div>

          <div className="catalog-actions-group">
            {hasMore && (
              <button
                id="btn-catalog-load-more"
                className="btn btn-secondary btn-sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "⏳ Loading..." : "📥 Load More Blueprints"}
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none' }}
              onClick={() => handleCatalogSynthesize(search || domainFilter)}
              disabled={generating}
            >
              {generating ? "⏳ Synthesizing..." : "✨ Synthesize More Ideas"}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Scroll to top"
            >
              ↑ Top
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
