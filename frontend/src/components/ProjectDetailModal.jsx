import React, { useState, useEffect } from 'react';
import SkillGapVisualizer from './SkillGapVisualizer';
import LearningRoadmap from './LearningRoadmap';
import { fetchSkillGap, fetchRoadmap, logFeedback, fetchProjectPitch, downloadProjectScaffold, fetchProjectDetail } from '../api/client';

export default function ProjectDetailModal({
  project,
  studentProfile,
  initialTab = "overview",
  onClose,
  onSaveToWorkspace,
  workspaceItem,
  onOpenPrepKit,
  onOpenMockInterview,
  onOpenGitHubAudit,
  onToggleTask
}) {
  const [detailedProject, setDetailedProject] = useState(project);
  const [activeModalTab, setActiveModalTab] = useState(initialTab);
  const [skillGapData, setSkillGapData] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [aiPitchData, setAiPitchData] = useState(null);
  const [loadingGap, setLoadingGap] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [loadingPitch, setLoadingPitch] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  // Feedback state
  const [userRating, setUserRating] = useState(0);
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [feedbackNotes, setFeedbackNotes] = useState("");

  useEffect(() => {
    setDetailedProject(project);
    if (project?.project_id && (!project.programming_languages || project.programming_languages.length === 0)) {
      fetchProjectDetail(project.project_id)
        .then(res => {
          if (res) setDetailedProject(prev => ({ ...prev, ...res }));
        })
        .catch(err => console.error("Error hydrating project details:", err));
    }
  }, [project]);

  const currentProject = detailedProject || project || {};

  // Smart Fallbacks for Tech Stack & Engineering Specs
  const KNOWN_LANGS = ['Python', 'JavaScript', 'TypeScript', 'C++', 'C', 'Java', 'Rust', 'Go', 'SQL', 'R', 'Kotlin', 'Swift', 'Solidity', 'Bash', 'HTML', 'CSS'];
  const KNOWN_FRAMEWORKS = ['PyTorch', 'TensorFlow', 'FastAPI', 'React', 'Flask', 'Django', 'Node.js', 'Next.js', 'Express', 'OpenCV', 'ROS2', 'Scikit-Learn', 'Pandas', 'NumPy', 'HuggingFace', 'LangChain', 'Spring Boot', 'TailwindCSS', 'Redux', 'Keras', 'Vue.js'];
  const KNOWN_TOOLS = ['Docker', 'Git', 'Kubernetes', 'AWS', 'GCP', 'PostgreSQL', 'Redis', 'Kafka', 'Linux', 'GitHub Actions', 'MongoDB', 'GraphQL', 'Nginx', 'Prometheus', 'Grafana', 'Jupyter', 'Weights & Biases', 'Postman'];

  const allSkills = [
    ...(currentProject.required_skills || []),
    ...(currentProject.matched_skills || []),
    ...(currentProject.missing_skills || [])
  ];

  const displayLanguages = (currentProject.programming_languages && currentProject.programming_languages.length > 0)
    ? currentProject.programming_languages
    : allSkills.filter(s => KNOWN_LANGS.includes(s)).length > 0
      ? allSkills.filter(s => KNOWN_LANGS.includes(s))
      : ['Python'];

  const displayFrameworks = (currentProject.frameworks && currentProject.frameworks.length > 0)
    ? currentProject.frameworks
    : allSkills.filter(s => KNOWN_FRAMEWORKS.includes(s)).length > 0
      ? allSkills.filter(s => KNOWN_FRAMEWORKS.includes(s))
      : allSkills.filter(s => !KNOWN_LANGS.includes(s) && !KNOWN_TOOLS.includes(s)).slice(0, 3).length > 0
        ? allSkills.filter(s => !KNOWN_LANGS.includes(s) && !KNOWN_TOOLS.includes(s)).slice(0, 3)
        : ['FastAPI', 'Scikit-Learn'];

  const displayTools = (currentProject.tools && currentProject.tools.length > 0)
    ? currentProject.tools
    : allSkills.filter(s => KNOWN_TOOLS.includes(s)).length > 0
      ? allSkills.filter(s => KNOWN_TOOLS.includes(s))
      : ['Git', 'Docker'];

  const resumeScore = currentProject.resume_value != null && !isNaN(currentProject.resume_value)
    ? Number(currentProject.resume_value).toFixed(1)
    : "9.2";
  const originalityScore = currentProject.originality_score != null && !isNaN(currentProject.originality_score)
    ? Number(currentProject.originality_score).toFixed(1)
    : "9.4";
  const datasetSource = currentProject.dataset_source || "Verified Open-Access Benchmark Dataset";
  const careerPaths = (currentProject.career_paths && currentProject.career_paths.length > 0)
    ? currentProject.career_paths.join(" • ")
    : (currentProject.domain ? `${currentProject.domain} Engineer • AI/ML Engineer` : "Software Engineer • Applied ML Engineer");

  useEffect(() => {
    if (!project) return;
    const studentSkills = studentProfile?.skills || [];
    const availableWeeks = studentProfile?.available_time_weeks || 4;

    // Fetch Skill Gap
    setLoadingGap(true);
    fetchSkillGap(project.project_id, studentSkills)
      .then(res => setSkillGapData(res))
      .catch(err => console.error("Error fetching skill gap:", err))
      .finally(() => setLoadingGap(false));

    // Fetch Roadmap
    setLoadingRoadmap(true);
    fetchRoadmap(project.project_id, studentSkills, availableWeeks)
      .then(res => setRoadmapData(res))
      .catch(err => console.error("Error fetching roadmap:", err))
      .finally(() => setLoadingRoadmap(false));

    // Reset pitch data on project change
    setAiPitchData(null);
  }, [project, studentProfile]);

  // Lazy-load AI pitch when user clicks the tab
  useEffect(() => {
    if (activeModalTab === 'aipitch' && !aiPitchData && project) {
      setLoadingPitch(true);
      fetchProjectPitch(project.project_id, studentProfile)
        .then(res => setAiPitchData(res))
        .catch(err => console.error("Error fetching AI pitch:", err))
        .finally(() => setLoadingPitch(false));
    }
  }, [activeModalTab, project, studentProfile, aiPitchData]);

  const handleCopyResumeBullets = () => {
    if (!aiPitchData?.resume_bullets) return;
    const text = aiPitchData.resume_bullets.map(b => `• ${b}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopyStatus("Copied to clipboard!");
    setTimeout(() => setCopyStatus(""), 2500);
  };

  const handleSendFeedback = async (eventType) => {
    try {
      await logFeedback({
        student_id: studentProfile?.student_id || "student_default",
        project_id: project.project_id,
        event_type: eventType,
        rating: userRating > 0 ? userRating : undefined,
        feedback_notes: feedbackNotes || undefined
      });
      if (onSaveToWorkspace) {
        onSaveToWorkspace(project, eventType === 'bookmarked' ? 'saved' : eventType, feedbackNotes);
      }
      setFeedbackStatus(`Marked as ${eventType}! Added to your Workspace.`);
      setTimeout(() => setFeedbackStatus(""), 4000);
    } catch (err) {
      console.error(err);
      setFeedbackStatus("Failed to record feedback.");
    }
  };

  const handleExportMarkdown = () => {
    const lines = [
      `# ${currentProject.title}`,
      ``,
      `> **Domain**: ${currentProject.domain} / ${currentProject.subdomain} | **Difficulty**: ${currentProject.difficulty} | **Duration**: ${currentProject.estimated_duration} Weeks`,
      ``,
      `## 📖 Problem Statement & Overview`,
      currentProject.description,
      ``,
      `## 🛠️ Technology Stack`,
      `- **Programming Languages**: ${displayLanguages.join(', ')}`,
      `- **Frameworks & Libraries**: ${displayFrameworks.join(', ')}`,
      `- **Tools & Infrastructure**: ${displayTools.join(', ')}`,
      `- **Dataset / Simulator**: ${datasetSource}`,
      ``,
      `## ⚡ Skill Gaps & Prerequisites`,
      `- **Required Skills**: ${currentProject.required_skills?.join(', ') || 'N/A'}`,
      `- **Conceptual Prerequisites**: ${currentProject.prerequisites?.join(', ') || 'N/A'}`,
    ];

    if (roadmapData?.milestones) {
      lines.push(``, `## 🗺️ Week-by-Week Learning & Execution Roadmap`);
      roadmapData.milestones.forEach((m) => {
        lines.push(`### ${m.title} (${m.duration_weeks} Wks)`);
        lines.push(`**Goal**: ${m.description}`);
        lines.push(`**Deliverable**: \`${m.deliverables}\``);
        lines.push(`**Key Tasks**:`);
        m.tasks?.forEach((t) => lines.push(`- [ ] ${t}`));
        lines.push(``);
      });
    }

    if (aiPitchData) {
      lines.push(`## 💼 Career Assets & Interview Defense`);
      lines.push(`### Elevator Pitch Hook`);
      lines.push(aiPitchData.personalized_hook || '');
      lines.push(``);
      lines.push(`### Resume Action Bullets`);
      aiPitchData.resume_bullets?.forEach((b) => lines.push(`- ${b}`));
      lines.push(``);
      lines.push(`### Technical Interview Preparation Questions`);
      aiPitchData.interview_prep?.forEach((q, i) => {
        lines.push(`#### Q${i + 1}: ${q.question}`);
        lines.push(`- **What Interviewers Look For**: ${q.what_interviewers_look_for}`);
        lines.push(`- **Recommended Strategy**: ${q.recommended_talking_points}`);
        lines.push(``);
      });
    }

    lines.push(`---`, `*Generated via ProjectForge — Intelligent Student Project Advisor*`);

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    link.setAttribute('href', url);
    link.setAttribute('download', `ProjectForge-${safeTitle}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [downloadingScaffold, setDownloadingScaffold] = useState(false);
  const handleDownloadScaffold = async () => {
    if (!project) return;
    setDownloadingScaffold(true);
    try {
      await downloadProjectScaffold(project.project_id, studentProfile?.skills || []);
    } catch (err) {
      console.error(err);
      alert("Failed to download scaffold zip: " + (err.message || "Unknown error"));
    } finally {
      setDownloadingScaffold(false);
    }
  };

  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className={`badge badge-difficulty-${project.difficulty.toLowerCase()}`}>
                {project.difficulty}
              </span>
              <span className="badge badge-primary">{project.domain}</span>
              {(project.project_id?.startsWith('proj-gen-') || project.project_id?.startsWith('proj-ai-')) && (
                <span className="badge" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff', fontWeight: 600 }}>
                  ✨ AI Synthesized
                </span>
              )}
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
                ⏱️ {project.estimated_duration} Weeks
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>
              {project.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              id="btn-modal-start-project"
              className={`btn btn-sm ${workspaceItem ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => handleSendFeedback(workspaceItem?.status === 'started' ? 'completed' : 'started')}
              title={workspaceItem ? `Currently in workspace: ${workspaceItem.status}` : "Start this project"}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.84rem' }}
            >
              <span>{workspaceItem?.status === 'completed' ? '✓ Completed' : workspaceItem ? '⚡ In Workspace' : '🚀 Start Project'}</span>
            </button>

            <button
              id="btn-download-scaffold-zip"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadScaffold}
              disabled={downloadingScaffold}
              title="Download ready-to-run Git starter repository with code, tests, requirements and README as ZIP"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.84rem' }}
            >
              <span>📦</span>
              <span>{downloadingScaffold ? "Zipping..." : "Starter (.zip)"}</span>
            </button>

            {onOpenPrepKit && (
              <button
                id="btn-open-prep-kit"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenPrepKit(project)}
                title="Open STAR resume bullets and 5 technical interview questions"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.84rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
              >
                <span>💼</span>
                <span>Prep Kit</span>
              </button>
            )}

            {onOpenMockInterview && (
              <button
                id="btn-open-mock-interview"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onOpenMockInterview(project);
                }}
                title="Practice live technical mock interview with AI Bar Raiser"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.84rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
              >
                <span>🎙️</span>
                <span>Mock Interview</span>
              </button>
            )}

            {onOpenGitHubAudit && (
              <button
                id="btn-open-github-audit"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onOpenGitHubAudit(workspaceItem?.github_url || 'https://github.com/saurabhdotdev/DocMindAi', project);
                }}
                title="Audit code quality and production readiness on GitHub"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.84rem', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
              >
                <span>⚡</span>
                <span>Audit Code</span>
              </button>
            )}

            <button
              id="btn-export-blueprint-md"
              className="btn btn-secondary btn-sm"
              onClick={handleExportMarkdown}
              title="Download comprehensive project blueprint, roadmap, and interview prep as Markdown"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.84rem' }}
            >
              <span>📥</span>
              <span>Export .md</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px', background: 'var(--bg-card)' }}>
          <button
            className={`nav-tab-btn ${activeModalTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveModalTab('overview')}
            style={{ borderRadius: 0, borderBottom: activeModalTab === 'overview' ? '2px solid var(--primary)' : 'none' }}
          >
            📋 Overview & Stack
          </button>
          <button
            className={`nav-tab-btn ${activeModalTab === 'aipitch' ? 'active' : ''}`}
            onClick={() => setActiveModalTab('aipitch')}
            style={{ borderRadius: 0, borderBottom: activeModalTab === 'aipitch' ? '2px solid var(--primary)' : 'none', color: activeModalTab === 'aipitch' ? 'var(--primary)' : 'inherit' }}
          >
            ✨ AI Career Pitch & Prep
          </button>
          <button
            className={`nav-tab-btn ${activeModalTab === 'skillgap' ? 'active' : ''}`}
            onClick={() => setActiveModalTab('skillgap')}
            style={{ borderRadius: 0, borderBottom: activeModalTab === 'skillgap' ? '2px solid var(--primary)' : 'none' }}
          >
            ⚡ Skill Gaps & Readiness
          </button>
          <button
            className={`nav-tab-btn ${activeModalTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => setActiveModalTab('roadmap')}
            style={{ borderRadius: 0, borderBottom: activeModalTab === 'roadmap' ? '2px solid var(--primary)' : 'none' }}
          >
            🗺️ Weekly Roadmap
          </button>
          <button
            className={`nav-tab-btn ${activeModalTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveModalTab('feedback')}
            style={{ borderRadius: 0, borderBottom: activeModalTab === 'feedback' ? '2px solid var(--primary)' : 'none' }}
          >
            ⭐ Log Interaction
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body">
          {/* TAB 1: OVERVIEW */}
          {activeModalTab === 'overview' && (
            <div>
              {/* Problem Description */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Problem Statement & Overview
                </h4>
                <p style={{ fontSize: '0.94rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {project.description}
                </p>
              </div>

              {/* Dataset Information */}
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📊 Dataset & Benchmark Source:</span>
                  {currentProject.dataset_available ? (
                    <span className="badge badge-success">Verified Available</span>
                  ) : (
                    <span className="badge" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Curated Benchmark</span>
                  )}
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  {datasetSource}
                </p>
              </div>

              {/* Stack & Tools Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg-glass)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                    PROGRAMMING LANGUAGES
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {displayLanguages.map(l => (
                      <span key={l} className="badge badge-primary">{l}</span>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-glass)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                    FRAMEWORKS & LIBRARIES
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {displayFrameworks.map(f => (
                      <span key={f} className="badge badge-primary">{f}</span>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-glass)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                    DEV TOOLS & INFRASTRUCTURE
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {displayTools.map(t => (
                      <span key={t} className="badge" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Learning Outcomes */}
              {((currentProject.learning_outcomes && currentProject.learning_outcomes.length > 0) || (currentProject.reasons && currentProject.reasons.length > 0)) && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Expected Technical Outcomes
                  </h4>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {(currentProject.learning_outcomes && currentProject.learning_outcomes.length > 0
                      ? currentProject.learning_outcomes
                      : currentProject.reasons || [
                          "Constructed end-to-end production pipeline with robust verification",
                          "Engineered core system algorithms with scalable architecture"
                        ]
                    ).map((o, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Career Impact Scores */}
              <div style={{ display: 'flex', gap: '20px', padding: '16px', background: 'rgba(99, 102, 241, 0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RESUME IMPACT</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {resumeScore} / 10
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORIGINALITY SCORE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {originalityScore} / 10
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CAREER PATHWAYS</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {careerPaths}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI CAREER PITCH & INTERVIEW PREP */}
          {activeModalTab === 'aipitch' && (
            <div>
              {loadingPitch ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🤖</div>
                  Synthesizing personalized career pitch, resume bullet points, and interview questions...
                </div>
              ) : aiPitchData ? (
                <div>
                  {/* Personalized Recruiter Hook */}
                  <div style={{ background: 'rgba(62, 155, 130, 0.08)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(62, 155, 130, 0.25)', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 700, marginBottom: '6px' }}>
                      🎯 Tailored Recruiter Rationale
                    </div>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                      {aiPitchData.personalized_hook}
                    </p>
                  </div>

                  {/* Resume Ready Bullets */}
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        📄 Resume Bullet Points (Ready to Copy)
                      </h4>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleCopyResumeBullets}
                        style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                      >
                        {copyStatus ? `✓ ${copyStatus}` : "📋 Copy Bullets"}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {aiPitchData.resume_bullets?.map((bullet, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 14px',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.86rem',
                            lineHeight: 1.5,
                            color: 'var(--text-primary)',
                          }}
                        >
                          &bull; {bullet}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Interview Q&A */}
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                        🎙️ Realistic Technical Interview Q&A
                      </h4>
                      {onOpenMockInterview && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            onClose();
                            onOpenMockInterview(project);
                          }}
                          style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                        >
                          🎙️ Practice Live in Mock Interviewer
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {aiPitchData.interview_prep?.map((q, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 16px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            Q{idx + 1}: {q.question}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--accent)', marginBottom: '6px' }}>
                            <strong>What they evaluate:</strong> {q.what_interviewers_look_for}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            <strong>Talking Points:</strong> {q.recommended_talking_points}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pro-Tips */}
                  {aiPitchData.pro_tips && aiPitchData.pro_tips.length > 0 && (
                    <div style={{ background: 'var(--bg-glass)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        💡 Implementation Velocity Tips
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {aiPitchData.pro_tips.map((tip, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  Failed to load AI career pitch.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SKILL GAPS */}
          {activeModalTab === 'skillgap' && (
            <div>
              {loadingGap ? (
                <p style={{ color: 'var(--text-muted)' }}>Analyzing skill gaps against catalog taxonomy...</p>
              ) : (
                <SkillGapVisualizer
                  skillGapData={skillGapData}
                  studentSkills={studentProfile?.skills || []}
                />
              )}
            </div>
          )}

          {/* TAB 3: ROADMAP */}
          {activeModalTab === 'roadmap' && (
            <div>
              {loadingRoadmap ? (
                <p style={{ color: 'var(--text-muted)' }}>Synthesizing personalized weekly roadmap...</p>
              ) : (
                <LearningRoadmap
                  roadmapData={roadmapData}
                  projectId={project.project_id}
                  savedCompletedTasks={workspaceItem?.completed_tasks || []}
                  onToggleTask={onToggleTask}
                  onDownloadScaffold={handleDownloadScaffold}
                  onOpenPrepKit={() => onOpenPrepKit && onOpenPrepKit(project)}
                />
              )}
            </div>
          )}

          {/* TAB 4: INTERACTION & FEEDBACK */}
          {activeModalTab === 'feedback' && (
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Log Student Interaction</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Your actions help calibrate collaborative filtering and personalized ranking.
              </p>

              {/* Star Rating */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Rate this recommendation (1 to 5 Stars):</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.8rem',
                        cursor: 'pointer',
                        color: star <= userRating ? '#F59E0B' : 'var(--border-color)',
                        transition: 'color 0.15s ease'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notes or feedback (optional):</label>
                <input
                  className="form-input"
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="e.g. Perfectly matches what I wanted to build this semester!"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleSendFeedback('started')}>
                  🚀 Mark as Started
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleSendFeedback('bookmarked')}>
                  ★ Bookmark
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleSendFeedback('completed')}>
                  ✓ Mark as Completed
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleSendFeedback('rejected')}>
                  ✗ Not Interested
                </button>
              </div>

              {feedbackStatus && (
                <div className="badge badge-success" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  {feedbackStatus}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
