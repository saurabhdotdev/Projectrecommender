import React, { useState } from 'react';
import RecommendationCard from './RecommendationCard';
import ProjectComparatorModal from './ProjectComparatorModal';
import { generateUnlimitedIdeas } from '../api/client';

export default function RecommendationDashboard({
  recommendations,
  perspectives,
  totalCatalogSize,
  executionTimeMs,
  enableDiversity,
  setEnableDiversity,
  onOpenDetails,
  onOpenRoadmap,
  onBookmark,
  onStartProject,
  userProjects = [],
  studentProfile,
  onIdeasGenerated,
  onOpenCustomStudio
}) {
  const [activePerspective, setActivePerspective] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  // Comparison State
  const [comparisonItems, setComparisonItems] = useState([]);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);

  const handleToggleCompare = (item) => {
    if (comparisonItems.some(c => c.project_id === item.project_id)) {
      setComparisonItems(comparisonItems.filter(c => c.project_id !== item.project_id));
    } else {
      if (comparisonItems.length >= 2) {
        setComparisonItems([comparisonItems[1], item]);
      } else {
        const next = [...comparisonItems, item];
        setComparisonItems(next);
        if (next.length === 2) {
          setIsComparatorOpen(true);
        }
      }
    }
  };

  // Unlimited Ideas Studio State
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState(null);
  const [justGenerated, setJustGenerated] = useState([]);

  const handleSynthesize = async (promptOverride, countOverride) => {
    const promptToUse = typeof promptOverride === 'string' ? promptOverride : customPrompt;
    const countToUse = typeof countOverride === 'number' ? countOverride : 3;
    setGenerating(true);
    setGenMessage("🧠 Analyzing skill graph & prerequisite boundaries...");

    const t1 = setTimeout(() => {
      setGenMessage("⚡ Synthesizing novel production blueprints...");
    }, 1200);
    const t2 = setTimeout(() => {
      setGenMessage("📐 Calculating multi-factor readiness & MMR vector diversification...");
    }, 2400);

    try {
      const res = await generateUnlimitedIdeas({
        studentProfile: studentProfile || {},
        prompt: promptToUse || "high-impact engineering projects with modern stack",
        count: countToUse,
        saveToCatalog: true
      });

      clearTimeout(t1);
      clearTimeout(t2);
      setJustGenerated(res.generated_projects || []);
      setGenMessage(`🎉 Successfully synthesized ${res.generated_projects?.length || countToUse} novel project blueprint(s)! Added to your recommendations below.`);
      
      if (onIdeasGenerated) {
        onIdeasGenerated(res);
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      console.error("Synthesis error:", err);
      setGenMessage(`⚠️ Synthesis error: ${err.message || "Failed to generate ideas."}`);
    } finally {
      setGenerating(false);
    }
  };

  const quickChips = [
    "🤖 Drone SLAM & Edge Vision",
    "⚡ RISC-V Custom Coprocessor",
    "🛡️ AI-Powered Threat Sentinel",
    "🧬 Genomic Transformer Model",
    "🌐 Zero-Knowledge Identity Protocol",
    "⚡ High-Speed Trading Market Simulator"
  ];

  // Determine displayed items based on perspective
  let displayedItems = [];
  if (activePerspective === "all") {
    displayedItems = [...recommendations];
  } else if (perspectives && perspectives[activePerspective]) {
    displayedItems = [perspectives[activePerspective]];
  }

  // Sorting
  if (sortBy === "readiness") {
    displayedItems.sort((a, b) => b.readiness_percentage - a.readiness_percentage);
  } else if (sortBy === "duration_asc") {
    displayedItems.sort((a, b) => a.estimated_duration - b.estimated_duration);
  } else if (sortBy === "duration_desc") {
    displayedItems.sort((a, b) => b.estimated_duration - a.estimated_duration);
  } else {
    // Default score
    displayedItems.sort((a, b) => b.score - a.score);
  }

  return (
    <div id="recommendation-dashboard">
      {/* ── UNLIMITED IDEAS STUDIO ── */}
      <div className="unlimited-studio-card">
        <div className="studio-header-wrap">
          <div>
            <div className="studio-title-group">
              <span className="studio-icon">✨</span>
              <h3 className="studio-title">
                Unlimited Ideas Studio
              </h3>
              <span className="studio-tag-badge">
                ♾️ Endless On-Demand
              </span>
            </div>
            <p className="studio-desc">
              Never be limited by a fixed catalog! Synthesize unlimited novel, production-grade project blueprints matching your exact skills or any custom topic.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onOpenCustomStudio && (
              <button
                className="studio-btn-architect"
                onClick={onOpenCustomStudio}
              >
                <span>🛠️ Architect Custom Project</span>
              </button>
            )}
            <button
              id="quick-synthesize-btn"
              className="studio-btn-quick"
              disabled={generating}
              onClick={() => handleSynthesize(null, 3)}
            >
              {generating ? "⏳ Synthesizing..." : "⚡ Quick Synthesize (3)"}
            </button>
          </div>
        </div>

        {/* Custom Prompt & Action */}
        <div className="studio-controls-row">
          <input
            className="studio-input"
            placeholder="🔍 Or type any custom prompt (e.g. 'Autonomous drone obstacle avoidance using Edge TPU')..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSynthesize(); }}
          />

          <button
            id="custom-synthesize-btn"
            className="studio-btn-synthesize"
            disabled={generating}
            onClick={() => handleSynthesize()}
          >
            {generating ? "Synthesizing..." : "🚀 Synthesize Ideas"}
          </button>
        </div>

        {/* Quick Inspiration Chips */}
        <div className="studio-topics-row">
          <span className="studio-topics-label">Quick Topics:</span>
          {quickChips.map((chip) => (
            <button
              key={chip}
              className="studio-topic-chip"
              onClick={() => {
                setCustomPrompt(chip.substring(3));
                handleSynthesize(chip.substring(3));
              }}
              title={`Synthesize projects for ${chip}`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Status Message / Progress Feedback */}
        {genMessage && (
          <div className={`studio-status-banner ${generating ? 'generating' : 'success'}`}>
            <span>{generating ? "⚡" : "✨"}</span>
            <span>{genMessage}</span>
          </div>
        )}

        {/* Just Generated Fast Actions */}
        {justGenerated.length > 0 && !generating && (
          <div className="studio-synthesized-strip">
            <span className="studio-synthesized-label">Just Synthesized:</span>
            {justGenerated.map((p) => (
              <button
                key={p.project_id}
                className="studio-synthesized-chip"
                onClick={() => onOpenDetails(p)}
              >
                🔍 {p.title.length > 35 ? p.title.substring(0, 35) + '...' : p.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '4px' }}>
            🎯 Personalized Project Recommendations
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            Personalized multi-factor matching & skill-gap intelligence ({executionTimeMs} ms inference)
          </p>
        </div>

        {/* Controls: Diversity Toggle & Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Diversity Toggle */}
          <button
            id="toggle-diversity-btn"
            className={`btn btn-sm ${enableDiversity ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setEnableDiversity(!enableDiversity)}
            title="Maximal Marginal Relevance (MMR) Anti-Repetition Diversity Filter"
          >
            {enableDiversity ? "✨ MMR Diversity: ON" : "⚪ MMR Diversity: OFF"}
          </button>

          {/* Sort Dropdown */}
          <select
            id="select-sort-by"
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="score">Sort: Match Score (Highest)</option>
            <option value="readiness">Sort: Skill Readiness (Highest)</option>
            <option value="duration_asc">Sort: Duration (Shortest)</option>
            <option value="duration_desc">Sort: Duration (Longest)</option>
          </select>
        </div>
      </div>

      {/* Perspective Tabs Bar */}
      <div className="perspective-bar">
        <button
          id="perspective-tab-all"
          className={`perspective-btn ${activePerspective === 'all' ? 'active' : ''}`}
          onClick={() => setActivePerspective('all')}
        >
          📋 All Top Recommendations ({recommendations.length})
        </button>

        <button
          id="perspective-tab-best-match"
          className={`perspective-btn ${activePerspective === 'best_match' ? 'active' : ''}`}
          onClick={() => setActivePerspective('best_match')}
        >
          🎯 Best Match
        </button>

        <button
          id="perspective-tab-learning"
          className={`perspective-btn ${activePerspective === 'best_learning_opportunity' ? 'active' : ''}`}
          onClick={() => setActivePerspective('best_learning_opportunity')}
        >
          🌱 Best Learning Opportunity
        </button>

        <button
          id="perspective-tab-resume"
          className={`perspective-btn ${activePerspective === 'best_resume_project' ? 'active' : ''}`}
          onClick={() => setActivePerspective('best_resume_project')}
        >
          💼 Best Resume Project
        </button>

        <button
          id="perspective-tab-quick-win"
          className={`perspective-btn ${activePerspective === 'quick_win' ? 'active' : ''}`}
          onClick={() => setActivePerspective('quick_win')}
        >
          ⚡ Quick Win
        </button>

        <button
          id="perspective-tab-stretch"
          className={`perspective-btn ${activePerspective === 'stretch_project' ? 'active' : ''}`}
          onClick={() => setActivePerspective('stretch_project')}
        >
          🚀 Stretch Project
        </button>
      </div>

      {/* Recommendations Grid */}
      {displayedItems.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No recommendations match the selected perspective filter.</p>
        </div>
      ) : (
        <div className="recommendation-grid">
          {displayedItems.map((item) => {
            const isStarted = userProjects.some(
              (up) => up.project_id === item.project_id && (up.status === 'started' || up.status === 'in_progress')
            );
            const isSaved = userProjects.some(
              (up) => up.project_id === item.project_id && (up.status === 'saved' || up.status === 'bookmarked')
            );
            return (
              <RecommendationCard
                key={item.project_id}
                item={item}
                onOpenDetails={onOpenDetails}
                onOpenRoadmap={onOpenRoadmap}
                onBookmark={onBookmark}
                onStartProject={onStartProject}
                isStarted={isStarted}
                isSaved={isSaved}
                onCompare={handleToggleCompare}
                isCompared={comparisonItems.some(c => c.project_id === item.project_id)}
              />
            );
          })}
        </div>
      )}

      {/* ── Infinite Synthesize More Action Bar ── */}
      <div style={{ textAlign: 'center', marginTop: '36px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <button
          id="btn-synthesize-more-bottom"
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            border: 'none',
            padding: '14px 36px',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(168, 85, 247, 0.35)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          disabled={generating}
          onClick={() => handleSynthesize("novel cutting-edge project tailored to my skills and interests")}
        >
          {generating ? "⏳ Synthesizing Fresh Ideas..." : "✨ Synthesize More Tailored AI Ideas"}
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
          Generate as many ideas as you need on-demand — zero artificial limits.
        </span>
      </div>

      {/* ── Floating Comparison Dock ── */}
      {comparisonItems.length > 0 && (
        <div className="floating-comparison-dock">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
            <span>⚖️</span>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>
              Comparison Tray ({comparisonItems.length}/2):
            </span>
            {comparisonItems.map((p) => (
              <span key={p.project_id} className="badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' }}>
                {p.title.length > 22 ? p.title.substring(0, 22) + '...' : p.title}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {comparisonItems.length === 2 ? (
              <button
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', borderRadius: '20px', padding: '6px 16px' }}
                onClick={() => setIsComparatorOpen(true)}
              >
                ✨ Compare Head-to-Head
              </button>
            ) : (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                (Select 1 more project to compare)
              </span>
            )}
            <button
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
              onClick={() => setComparisonItems([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Head-to-Head Comparator Modal ── */}
      {isComparatorOpen && comparisonItems.length === 2 && (
        <ProjectComparatorModal
          projectA={comparisonItems[0]}
          projectB={comparisonItems[1]}
          studentProfile={studentProfile}
          onClose={() => setIsComparatorOpen(false)}
          onOpenDetails={(p) => {
            setIsComparatorOpen(false);
            onOpenDetails(p);
          }}
        />
      )}
    </div>
  );
}
