import React, { useState, useEffect, useRef } from 'react';
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

  // Unlimited Ideas Studio & Natural Language State
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState(null);
  const [justGenerated, setJustGenerated] = useState([]);

  // Speech Recognition (Voice / Speak what you want)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setCustomPrompt(transcript);
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

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
      setGenMessage(`🎉 Successfully synthesized ${res.generated_projects?.length || countToUse} novel project blueprint(s)! Displayed below.`);
      
      if (onIdeasGenerated) {
        onIdeasGenerated(res);
      }

      setTimeout(() => {
        const el = document.getElementById('just-synthesized-showcase');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 200);
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

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [shuffleSeed, setShuffleSeed] = useState(1);

  const IDEA_CATEGORIES = [
    { label: "✨ All Ideas", key: "All" },
    { label: "🤖 AI & ML", key: "AI" },
    { label: "⚡ Distributed Systems & Cloud", key: "Cloud" },
    { label: "🔒 Cybersecurity", key: "Security" },
    { label: "📈 FinTech & Quant", key: "FinTech" },
    { label: "🌐 Full-Stack & Web", key: "Web" },
    { label: "🚗 Robotics & Vision", key: "Robotics" },
    { label: "🧬 HealthTech & Bio", key: "Health" }
  ];

  // Determine displayed items based on perspective
  let pool = [];
  let spotlightItem = null;
  if (activePerspective === "all") {
    pool = [...recommendations];
  } else if (perspectives && perspectives[activePerspective]) {
    spotlightItem = perspectives[activePerspective];
    let matchingTheme = [];
    if (activePerspective === 'best_match') {
      matchingTheme = recommendations.filter(r => r.project_id !== spotlightItem.project_id && (r.match_percentage >= 65 || r.score >= 0.7));
    } else if (activePerspective === 'best_learning_opportunity') {
      matchingTheme = recommendations.filter(r => r.project_id !== spotlightItem.project_id && ((r.missing_skills && r.missing_skills.length >= 1) || (r.readiness_percentage >= 30 && r.readiness_percentage <= 80)));
    } else if (activePerspective === 'best_resume_project') {
      matchingTheme = recommendations.filter(r => r.project_id !== spotlightItem.project_id && (r.resume_value >= 8.5 || r.difficulty === 'Advanced' || r.domain?.includes('Cloud') || r.domain?.includes('AI')));
    } else if (activePerspective === 'quick_win') {
      matchingTheme = recommendations.filter(r => r.project_id !== spotlightItem.project_id && (r.estimated_duration <= 4 || r.readiness_percentage >= 65));
    } else if (activePerspective === 'stretch_project') {
      matchingTheme = recommendations.filter(r => r.project_id !== spotlightItem.project_id && (r.difficulty === 'Advanced' || r.estimated_duration >= 5));
    }
    // If fewer than 4 matched, pad with top recommendations so the user always has a rich set of ideas!
    if (matchingTheme.length < 4) {
      const remaining = recommendations.filter(r => r.project_id !== spotlightItem.project_id && !matchingTheme.some(m => m.project_id === r.project_id));
      matchingTheme = [...matchingTheme, ...remaining.slice(0, 6)];
    }
    pool = [spotlightItem, ...matchingTheme];
  } else {
    pool = [...recommendations];
  }

  // Filter by category if selected
  if (selectedCategory !== "All") {
    pool = pool.filter(item => {
      const text = `${item.domain || ''} ${item.subdomain || ''} ${item.title || ''} ${(item.required_skills || []).join(' ')}`.toLowerCase();
      if (selectedCategory === "AI") return text.includes('ai') || text.includes('learning') || text.includes('neural') || text.includes('vision') || text.includes('llm');
      if (selectedCategory === "Cloud") return text.includes('cloud') || text.includes('distributed') || text.includes('devops') || text.includes('system') || text.includes('docker');
      if (selectedCategory === "Security") return text.includes('cyber') || text.includes('security') || text.includes('threat') || text.includes('crypto');
      if (selectedCategory === "FinTech") return text.includes('fintech') || text.includes('trading') || text.includes('market') || text.includes('quant') || text.includes('finance');
      if (selectedCategory === "Web") return text.includes('web') || text.includes('full-stack') || text.includes('api') || text.includes('backend');
      if (selectedCategory === "Robotics") return text.includes('robot') || text.includes('drone') || text.includes('autonomous') || text.includes('ros');
      if (selectedCategory === "Health") return text.includes('health') || text.includes('bio') || text.includes('med') || text.includes('genom');
      return true;
    });
  }

  let displayedItems = [...pool];

  // Sorting
  if (sortBy === "readiness") {
    displayedItems.sort((a, b) => b.readiness_percentage - a.readiness_percentage);
  } else if (sortBy === "duration_asc") {
    displayedItems.sort((a, b) => a.estimated_duration - b.estimated_duration);
  } else if (sortBy === "duration_desc") {
    displayedItems.sort((a, b) => b.estimated_duration - a.estimated_duration);
  } else if (sortBy === "shuffle") {
    // Pseudo-random shuffle based on seed
    displayedItems.sort((a, b) => {
      const hashA = (a.project_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + shuffleSeed) % 17;
      const hashB = (b.project_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + shuffleSeed) % 17;
      return hashA - hashB;
    });
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
                Talk &amp; Synthesize What You Want
              </h3>
              <span className="studio-tag-badge">
                🎙️ Voice &amp; Natural Language
              </span>
            </div>
            <p className="studio-desc">
              Describe in plain English (or speak out loud 🎙️) exactly what you want to build. Our AI Architect will immediately formulate matching production-grade blueprints and show them right here!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onOpenCustomStudio && (
              <button
                className="studio-btn-architect"
                onClick={() => onOpenCustomStudio(customPrompt)}
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

        {/* Custom Prompt & Voice Action */}
        <div className="studio-controls-row">
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              id="talk-what-you-want-input"
              className="studio-input"
              placeholder="🎙️ Talk or type what you want (e.g. 'Autonomous drone obstacle avoidance with Edge TPU')..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSynthesize(); }}
              style={{ paddingRight: speechSupported ? '108px' : '14px' }}
            />
            {speechSupported && (
              <button
                type="button"
                className={`studio-mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Listening... click to stop' : 'Click to speak what you want (microphone)'}
              >
                <span>{isListening ? '🔴' : '🎙️'}</span>
                <span>{isListening ? 'Listening...' : 'Speak'}</span>
              </button>
            )}
          </div>

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

        {/* Just Generated Fast Actions & Showcase */}
        {justGenerated.length > 0 && !generating && (
          <div id="just-synthesized-showcase" className="studio-showcase-container">
            <div className="studio-showcase-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🎉</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    Matching Blueprints Synthesized Just For You ({justGenerated.length})
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Generated live matching your prompt: &ldquo;{customPrompt || 'Custom specification'}&rdquo;
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {onOpenCustomStudio && (
                  <button
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => onOpenCustomStudio(customPrompt)}
                    title="Open in Custom Studio to view full architecture DDL schemas, endpoints & download starter code"
                  >
                    <span>🛠️</span> Architect Full Topology in Studio &rarr;
                  </button>
                )}
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                  onClick={() => setJustGenerated([])}
                >
                  ✕ Close Showcase
                </button>
              </div>
            </div>

            <div className="recommendations-grid" style={{ marginTop: '16px', marginBottom: '8px' }}>
              {justGenerated.map((item) => {
                const enrichedItem = {
                  ...item,
                  match_percentage: item.match_percentage || 96,
                  readiness_percentage: item.readiness_percentage || 88,
                  score: item.score || 0.96
                };
                return (
                  <RecommendationCard
                    key={enrichedItem.project_id}
                    item={enrichedItem}
                    onOpenDetails={onOpenDetails}
                    onOpenRoadmap={onOpenRoadmap}
                    onBookmark={onBookmark}
                    onStartProject={onStartProject}
                    isStarted={userProjects.some((p) => p.project_id === enrichedItem.project_id && p.status === 'started')}
                    isSaved={userProjects.some((p) => p.project_id === enrichedItem.project_id && p.status === 'saved')}
                    onCompare={handleToggleCompare}
                    isCompared={comparisonItems.some((c) => c.project_id === enrichedItem.project_id)}
                  />
                );
              })}
            </div>
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

        {/* Controls: Diversity Toggle, Shuffle & Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick Shuffle Ideas */}
          <button
            id="btn-shuffle-ideas"
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setSortBy('shuffle');
              setShuffleSeed((prev) => prev + 1);
            }}
            title="Shuffle idea pool to see fresh perspectives"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <span>🎲</span>
            <span>Shuffle Ideas</span>
          </button>

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
            <option value="shuffle">Sort: Shuffled Randomly</option>
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

      {/* Perspective Spotlight Info Banner if active */}
      {spotlightItem && activePerspective !== 'all' && (
        <div className="perspective-spotlight-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {activePerspective.replace(/_/g, ' ').toUpperCase()} Spotlight: {spotlightItem.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Showing top spotlight project plus {displayedItems.length - 1} matching ideas fitting this goal
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActivePerspective('all')}
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
          >
            Show All {recommendations.length} Ideas
          </button>
        </div>
      )}

      {/* Quick Domain Category Filter Chips */}
      <div className="idea-category-pills">
        {IDEA_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`idea-category-chip ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
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
      <div style={{ textAlign: 'center', marginTop: '36px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            id="btn-synthesize-more-bottom"
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
              border: 'none',
              padding: '12px 32px',
              fontSize: '0.96rem',
              fontWeight: 700,
              borderRadius: '12px',
              boxShadow: '0 4px 18px rgba(2, 132, 199, 0.35)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            disabled={generating}
            onClick={() => handleSynthesize("novel cutting-edge engineering project tailored to my skills and interests", 6)}
          >
            {generating ? "⏳ Synthesizing Fresh Ideas..." : "✨ Synthesize +6 More AI Ideas"}
          </button>

          {onOpenCustomStudio && (
            <button
              className="btn btn-secondary"
              style={{
                padding: '12px 24px',
                fontSize: '0.96rem',
                fontWeight: 600,
                borderRadius: '12px'
              }}
              onClick={onOpenCustomStudio}
            >
              🛠️ Architect in Unlimited Studio
            </button>
          )}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
          Showing {displayedItems.length} curated engineering blueprints · Generate unlimited novel ideas on-demand
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
