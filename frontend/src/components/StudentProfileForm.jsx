import React, { useState, useRef } from 'react';
import { generateUnlimitedIdeas, parseResume } from '../api/client';

const COMMON_SKILLS = [
  // CS / Software
  "Python", "JavaScript", "TypeScript", "SQL", "C++", "C", "Java", "Go", "Rust", "MATLAB", "Solidity",
  "Machine Learning", "Deep Learning", "Pandas", "NumPy", "Scikit-Learn", "PyTorch", "TensorFlow",
  "Natural Language Processing", "Computer Vision", "OpenCV", "FastAPI", "React", "Node.js",
  "Docker", "Kubernetes", "Linux", "Git", "PostgreSQL", "Time Series Analysis",
  // Electronics / Hardware / VLSI
  "Verilog", "VHDL", "SystemVerilog", "FPGA Design", "VLSI Design", "Cadence Virtuoso",
  "Embedded C", "Arduino", "Raspberry Pi", "RTOS", "PCB Design", "KiCad", "Altium Designer",
  "Signal Processing", "MATLAB Simulink", "LabVIEW", "ROS (Robot Operating System)",
  // Mechanical / Civil / Chemical
  "AutoCAD", "SolidWorks", "CATIA", "ANSYS", "FEA (Finite Element Analysis)",
  "3D Printing", "CFD (Computational Fluid Dynamics)", "Thermodynamics", "Structural Analysis",
  // Life Sciences / Biomedical
  "R", "Bioinformatics", "SPSS", "ImageJ", "COMSOL", "Medical Imaging",
  // Finance / Business
  "Excel", "Power BI", "Tableau", "Quantitative Finance", "Blockchain"
];

const INTEREST_DOMAINS = [
  // CS & AI
  "Artificial Intelligence", "Machine Learning", "Deep Learning & Neural Networks",
  "Natural Language Processing", "Computer Vision", "Data Science & Analytics",
  "Web Development", "Mobile App Development", "Cybersecurity & Ethical Hacking",
  "Cloud & DevOps", "Blockchain & Web3", "Game Development",
  // Electronics / Hardware
  "VLSI & Chip Design", "Embedded Systems & Firmware", "FPGA & Reconfigurable Computing",
  "Signal & Image Processing", "Internet of Things (IoT)", "Robotics & Autonomous Systems",
  "Power Electronics & Energy Systems", "RF & Wireless Communications",
  // Mechanical / Civil / Chemical
  "Mechanical Design & CAD", "Computational Fluid Dynamics", "Structural Engineering",
  "Renewable Energy & Sustainability", "Manufacturing & Industry 4.0",
  "Chemical Process Simulation", "Materials Science",
  // Life Sciences / Biomedical
  "Biomedical Engineering", "Healthcare & Medical Devices", "Bioinformatics & Genomics",
  "Drug Discovery & Pharma",
  // Cross-domain
  "FinTech & Quantitative Finance", "Climate & Environmental Tech",
  "Space & Aerospace Technology", "Human-Computer Interaction & UX",
  "Entrepreneurship & Product Development"
];

// ─── Degree / Branch Catalogue ───────────────────────────────────
const DEGREE_BRANCHES = [
  {
    group: "💻 CS & Software",
    branches: [
      "Computer Science", "Software Engineering", "Information Technology",
      "Data Science", "Artificial Intelligence", "Cybersecurity",
      "Human-Computer Interaction", "Information Systems"
    ]
  },
  {
    group: "⚡ Electronics & Hardware",
    branches: [
      "Electronics & Communication Engineering (ECE)", "Electrical Engineering (EE)",
      "VLSI Design", "Embedded Systems", "Microelectronics",
      "Power Electronics", "RF & Wireless Engineering", "Instrumentation Engineering"
    ]
  },
  {
    group: "⚙️ Mechanical & Civil",
    branches: [
      "Mechanical Engineering", "Civil Engineering", "Aerospace Engineering",
      "Automotive Engineering", "Manufacturing Engineering",
      "Structural Engineering", "Environmental Engineering"
    ]
  },
  {
    group: "🧪 Chemical & Materials",
    branches: [
      "Chemical Engineering", "Materials Science & Engineering",
      "Petroleum Engineering", "Polymer Science", "Metallurgical Engineering"
    ]
  },
  {
    group: "🧬 Life Sciences & Biomedical",
    branches: [
      "Biomedical Engineering", "Biotechnology", "Bioinformatics",
      "Pharmacy", "Medicine (MBBS/MD)", "Neuroscience"
    ]
  },
  {
    group: "📐 Math & Physics",
    branches: [
      "Mathematics", "Applied Mathematics", "Physics",
      "Statistics", "Operations Research"
    ]
  },
  {
    group: "💼 Business & Design",
    branches: [
      "Business Administration (MBA)", "Economics", "Finance & Accounting",
      "Industrial Design", "Architecture", "Urban Planning"
    ]
  },
  {
    group: "🌐 Interdisciplinary",
    branches: [
      "Mechatronics", "Robotics Engineering", "Energy Engineering",
      "Agricultural Engineering", "Marine Engineering", "Mining Engineering"
    ]
  }
];

const ALL_BRANCHES = DEGREE_BRANCHES.flatMap(g => g.branches);

function DegreePicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = query.trim().length > 0
    ? ALL_BRANCHES.filter(b => b.toLowerCase().includes(query.toLowerCase()))
    : null;

  const handleSelect = (branch) => {
    onChange(branch);
    setQuery("");
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Input row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          id="input-degree"
          className="form-input"
          value={query || value}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Type or pick your branch…"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)', padding: '9px 12px',
            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem',
            whiteSpace: 'nowrap', flexShrink: 0
          }}
        >▾ Browse</button>
      </div>

      {/* Current selection badge */}
      {value && (
        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>
            🎓 {value}
          </span>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          zIndex: 200, background: 'var(--bg-secondary)',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          maxHeight: '340px', overflowY: 'auto',
          padding: '8px',
        }}>
          {filtered ? (
            // Search results
            filtered.length === 0 ? (
              <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                No match — your custom entry will be used ✓
              </div>
            ) : (
              filtered.map(b => (
                <button key={b} type="button" onMouseDown={() => handleSelect(b)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'none', border: 'none', padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    color: 'var(--text-primary)', fontSize: '0.88rem',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >{b}</button>
              ))
            )
          ) : (
            // Grouped browse
            DEGREE_BRANCHES.map(group => (
              <div key={group.group} style={{ marginBottom: '6px' }}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: 'var(--text-muted)',
                  padding: '6px 12px 4px'
                }}>{group.group}</div>
                {group.branches.map(b => (
                  <button key={b} type="button" onMouseDown={() => handleSelect(b)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: value === b ? 'rgba(99,102,241,0.18)' : 'none',
                      border: 'none', padding: '7px 12px',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      color: value === b ? 'var(--primary)' : 'var(--text-primary)',
                      fontSize: '0.86rem',
                    }}
                    onMouseEnter={e => { if (value !== b) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (value !== b) e.currentTarget.style.background = 'none'; }}
                  >{b}</button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Timeline Presets ────────────────────────────────────────────
const TIMELINE_PRESETS = [
  {
    weeks: 1.5,
    label: "Mini Sprint",
    icon: "⚡",
    color: "#10B981",
    glow: "rgba(16,185,129,0.25)",
    border: "rgba(16,185,129,0.4)",
    description: "Proof-of-concept or weekend hackathon",
    commitment: "~5 hrs / week",
    phase: ["Setup & MVP"],
  },
  {
    weeks: 4,
    label: "Standard Month",
    icon: "📅",
    color: "#6366F1",
    glow: "rgba(99,102,241,0.25)",
    border: "rgba(99,102,241,0.4)",
    description: "Industry internship-style project",
    commitment: "~10 hrs / week",
    phase: ["Setup", "Core Build", "Polish", "Demo"],
  },
  {
    weeks: 8,
    label: "Half Semester",
    icon: "📚",
    color: "#06B6D4",
    glow: "rgba(6,182,212,0.25)",
    border: "rgba(6,182,212,0.4)",
    description: "Mid-size research or product feature",
    commitment: "~12 hrs / week",
    phase: ["Research", "Prototype", "Build", "Evaluate", "Iterate", "Deploy", "Review", "Present"],
  },
  {
    weeks: 12,
    label: "Capstone",
    icon: "🏆",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.25)",
    border: "rgba(245,158,11,0.4)",
    description: "Full-scale capstone or thesis project",
    commitment: "~15 hrs / week",
    phase: ["Discovery","Design","Research","Foundation","Core","Advanced","Integration","Testing","Evaluation","Iteration","Presentation","Showcase"],
  },
];

function getPresetForWeeks(weeks) {
  return TIMELINE_PRESETS.reduce((best, p) =>
    Math.abs(p.weeks - weeks) < Math.abs(best.weeks - weeks) ? p : best
  );
}

function TimelinePicker({ weeks, onChange }) {
  const activePreset = getPresetForWeeks(weeks);
  const pct = ((weeks - 1) / (12 - 1)) * 100;

  return (
    <div
      className="timeline-picker-wrap"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${activePreset.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: `0 0 20px ${activePreset.glow}`,
        transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
            ⏱️ Available Project Timeline
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, color: activePreset.color, lineHeight: 1, fontFamily: 'var(--font-heading)', transition: 'color 0.3s ease' }}>
              {weeks % 1 === 0 ? weeks : weeks.toFixed(1)}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>weeks</span>
            <span className="badge" style={{ background: `${activePreset.glow}`, color: activePreset.color, border: `1px solid ${activePreset.border}`, fontSize: '0.75rem', transition: 'all 0.3s ease' }}>
              {activePreset.icon} {activePreset.label}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Commitment</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activePreset.commitment}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '200px' }}>{activePreset.description}</div>
        </div>
      </div>

      {/* Preset Shortcut Cards */}
      <div className="timeline-presets-grid" style={{ marginBottom: '18px' }}>
        {TIMELINE_PRESETS.map((p) => {
          const isActive = activePreset.weeks === p.weeks && weeks === p.weeks;
          return (
            <button
              key={p.label}
              type="button"
              id={`timeline-preset-${p.label.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => onChange(p.weeks)}
              style={{
                background: isActive ? `linear-gradient(135deg, ${p.glow}, rgba(0,0,0,0.4))` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? p.border : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 0 12px ${p.glow}` : 'none',
              }}
            >
              <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{p.icon}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isActive ? p.color : 'var(--text-secondary)', lineHeight: 1.2 }}>{p.label}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>{p.weeks} wks</div>
            </button>
          );
        })}
      </div>

      {/* Slider Track */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        {/* Filled track background */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(255,255,255,0.06)',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: `${pct}%`,
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(90deg, ${activePreset.color}, var(--primary))`,
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          transition: 'width 0.15s ease, background 0.3s ease',
        }} />
        <input
          id="slider-available-time"
          type="range"
          min="1"
          max="12"
          step="0.5"
          value={weeks}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="timeline-slider"
        />
      </div>

      {/* Tick Marks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', marginBottom: '16px' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => {
          const isPreset = TIMELINE_PRESETS.some(p => p.weeks === w);
          const isCurrent = Math.round(weeks) === w;
          return (
            <button
              key={w}
              type="button"
              onClick={() => onChange(w)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: 0,
              }}
            >
              <div style={{
                width: isCurrent ? '8px' : isPreset ? '6px' : '3px',
                height: isCurrent ? '8px' : isPreset ? '6px' : '3px',
                borderRadius: '50%',
                background: isCurrent ? activePreset.color : isPreset ? 'var(--text-secondary)' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
                boxShadow: isCurrent ? `0 0 6px ${activePreset.glow}` : 'none',
              }} />
              {isPreset && (
                <span style={{ fontSize: '0.6rem', color: isCurrent ? activePreset.color : 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{w}w</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Phase Breakdown Bar */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Project Phase Breakdown
        </div>
        <div style={{ display: 'flex', gap: '3px', borderRadius: '6px', overflow: 'hidden', height: '28px' }}>
          {Array.from({ length: Math.max(1, Math.round(weeks)) }).map((_, i) => {
            const totalPhases = activePreset.phase.length;
            const phaseIdx = Math.min(i, totalPhases - 1);
            const phaseLabel = activePreset.phase[phaseIdx] || `Week ${i + 1}`;
            const opacity = 0.4 + (0.6 * i) / Math.max(1, Math.round(weeks) - 1);
            return (
              <div
                key={i}
                title={`Week ${i + 1}: ${phaseLabel}`}
                style={{
                  flex: 1,
                  background: activePreset.color,
                  opacity,
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'default',
                  transition: 'background 0.3s ease',
                  minWidth: 0,
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          {activePreset.phase.length > 1 && (
            <>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{activePreset.phase[0]}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{activePreset.phase[activePreset.phase.length - 1]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentProfileForm({
  profile,
  setProfile,
  onSubmit,
  loading,
  onIdeasGenerated,
  onResetProfile
}) {
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  const handleGenerateWithIdeas = async () => {
    // Trigger the normal recommendation fetch
    if (onSubmit) onSubmit();

    // Scroll down to show results immediately after click
    setTimeout(() => {
      const target = document.getElementById('recommendation-dashboard') ||
                     document.querySelector('.recommendation-grid') ||
                     document.querySelector('.glass-panel');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 400);

    // Simultaneously synthesize fresh AI ideas in background
    if (!onIdeasGenerated) return;
    setGenerating(true);
    try {
      const res = await generateUnlimitedIdeas({
        studentProfile: profile,
        prompt: `${profile.degree || ''} ${(profile.interests || []).slice(0, 2).join(' ')} innovative project`,
        count: 3,
        saveToCatalog: true
      });
      onIdeasGenerated(res);

      // Show success toast
      const count = res.generated_projects?.length || 3;
      setToast(`✨ ${count} new AI project ideas synthesized and added to your recommendations!`);
      setTimeout(() => setToast(null), 5000);

      // Scroll again once ideas are ready
      setTimeout(() => {
        const target = document.getElementById('recommendation-dashboard');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      console.error('Background idea generation error:', err);
      setToast('⚠️ Showing existing recommendations — AI synthesis will retry next time.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setGenerating(false);
    }
  };

  const [skillInput, setSkillInput] = useState("");
  const [skillCategoryFilter, setSkillCategoryFilter] = useState("all");

  // Resume / LinkedIn Auto-Parser State
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [parsingResume, setParsingResume] = useState(false);
  const [resumeSuccess, setResumeSuccess] = useState(null);
  const [resumeError, setResumeError] = useState(null);

  const handleParseResume = async () => {
    if (!resumeFile && !resumeText.trim()) {
      setResumeError("Please select a PDF resume file or paste profile/resume text.");
      return;
    }
    setParsingResume(true);
    setResumeError(null);
    setResumeSuccess(null);
    try {
      const parsed = await parseResume({ file: resumeFile, rawText: resumeText });
      setProfile(prev => {
        const mergedSkills = Array.from(new Set([...(prev.skills || []), ...(parsed.skills || [])]));
        const mergedInterests = Array.from(new Set([...(prev.interests || []), ...(parsed.interests || [])]));
        return {
          ...prev,
          degree: parsed.degree || prev.degree,
          year: parsed.year || prev.year,
          experience_level: parsed.experience_level || prev.experience_level,
          career_goal: parsed.career_goal || prev.career_goal,
          preferred_language: parsed.preferred_language || prev.preferred_language,
          skills: mergedSkills,
          interests: mergedInterests.length > 0 ? mergedInterests : prev.interests
        };
      });
      setResumeSuccess(`🎉 Extracted ${parsed.skills?.length || 0} skills, ${parsed.degree} (${parsed.year}), and target track!`);
      setResumeFile(null);
      setResumeText("");
      setTimeout(() => setResumeSuccess(null), 6000);
    } catch (err) {
      setResumeError(err.message || "Failed to parse resume.");
    } finally {
      setParsingResume(false);
    }
  };

  const addSkill = (skillName) => {
    if (!skillName || !skillName.trim()) return;
    const items = skillName.split(',').map(s => s.trim()).filter(Boolean);
    setProfile(prev => {
      let newSkills = [...(prev.skills || [])];
      let newProf = { ...(prev.skill_proficiency || {}) };
      for (const item of items) {
        if (!newSkills.some(s => s.toLowerCase() === item.toLowerCase())) {
          newSkills.push(item);
          if (!newProf[item]) {
            newProf[item] = "Intermediate";
          }
        }
      }
      return {
        ...prev,
        skills: newSkills,
        skill_proficiency: newProf
      };
    });
    setSkillInput("");
  };

  const removeSkill = (skillToRemove) => {
    setProfile(prev => {
      const nextProf = { ...(prev.skill_proficiency || {}) };
      delete nextProf[skillToRemove];
      return {
        ...prev,
        skills: (prev.skills || []).filter(s => s !== skillToRemove),
        skill_proficiency: nextProf
      };
    });
  };

  const clearAllSkills = () => {
    setProfile(prev => ({
      ...prev,
      skills: [],
      skill_proficiency: {}
    }));
  };

  const setProficiency = (skill, level) => {
    setProfile(prev => ({
      ...prev,
      skill_proficiency: {
        ...(prev.skill_proficiency || {}),
        [skill]: level
      }
    }));
  };

  const toggleInterest = (interest) => {
    setProfile(prev => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter(i => i !== interest)
          : [...prev.interests, interest]
      };
    });
  };

  return (
    <div className="glass-panel" id="student-profile-form" style={{ padding: '28px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '4px' }}>🎓 Your Profile & Constraints</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Tell your advisor what you know, what you aim to achieve, and your available time.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }} title="Your choices are automatically saved and restored on page refresh">
            <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
            Auto-saved
          </span>
          {onResetProfile && (
            <button
              type="button"
              id="btn-reset-profile"
              onClick={onResetProfile}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '5px 10px', color: 'var(--text-secondary)' }}
              title="Clear all selections and reset profile to blank"
            >
              🔄 Reset Form
            </button>
          )}
          <div className="badge badge-primary">Personal Advisor Mode</div>
        </div>
      </div>

      {/* 📄 Resume / LinkedIn PDF & Text Auto-Parser Drawer */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '24px'
        }}
      >
        <div
          onClick={() => setResumeOpen(!resumeOpen)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>📄</span>
            <div>
              <strong style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                Auto-Fill Profile from Resume / LinkedIn
              </strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Upload your PDF resume or paste text to instantly extract skills, degree, and career goal
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.76rem', padding: '4px 10px' }}
          >
            {resumeOpen ? '▲ Hide' : '⚡ Auto-Fill'}
          </button>
        </div>

        {resumeSuccess && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', color: '#34d399', fontSize: '0.84rem' }}>
            {resumeSuccess}
          </div>
        )}

        {resumeError && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', fontSize: '0.84rem' }}>
            {resumeError}
          </div>
        )}

        {resumeOpen && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Option A: PDF Upload */}
              <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '10px', border: '1px dashed var(--border-highlight)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>📎</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Upload PDF Resume
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  id="resume-file-input"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
                  }}
                />
                <label
                  htmlFor="resume-file-input"
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: 'pointer', display: 'inline-block', fontSize: '0.78rem', marginTop: '6px' }}
                >
                  {resumeFile ? `✓ ${resumeFile.name}` : 'Choose PDF File'}
                </label>
                {resumeFile && (
                  <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '6px' }}>
                    Ready to extract from {resumeFile.name}
                  </div>
                )}
              </div>

              {/* Option B: Text Paste */}
              <div>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Or paste text from your LinkedIn 'About', 'Experience', or raw resume..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  style={{ fontSize: '0.82rem', width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={parsingResume || (!resumeFile && !resumeText.trim())}
                onClick={handleParseResume}
                style={{ padding: '8px 18px', fontSize: '0.84rem' }}
              >
                {parsingResume ? '⏳ Parsing & Extracting...' : '🚀 Extract & Populate Profile'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Degree & Year */}
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label" htmlFor="input-degree">🎓 Degree / Branch</label>
          <DegreePicker
            value={profile.degree}
            onChange={(val) => setProfile({ ...profile, degree: val })}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="select-year">Academic Year</label>
          <select
            id="select-year"
            className="form-select"
            value={profile.year}
            onChange={(e) => setProfile({ ...profile, year: e.target.value })}
          >
            <option value="1st year">1st year (Freshman)</option>
            <option value="2nd year">2nd year (Sophomore)</option>
            <option value="3rd year">3rd year (Junior)</option>
            <option value="4th year">4th year (Senior)</option>
            <option value="Master's / Graduate">Master's / Graduate</option>
            <option value="Self-Taught / Bootcamp">Self-Taught / Bootcamp</option>
          </select>
        </div>

        {/* Career Objective */}
        <div className="form-group">
          <label className="form-label" htmlFor="select-career-goal">Primary Career Objective</label>
          <select
            id="select-career-goal"
            className="form-select"
            value={profile.career_goal}
            onChange={(e) => setProfile({ ...profile, career_goal: e.target.value })}
          >
            <option value="Internship">Internship (Industry Tools & Measurable Impact)</option>
            <option value="Full-time Job">Full-time Job (Robust Production Readiness)</option>
            <option value="Research">Research / Grad School (Originality & Theory)</option>
            <option value="Portfolio">Portfolio Showcase (Visual & Polish)</option>
            <option value="Skill Growth">Skill Growth (Exploring New Domains)</option>
          </select>
        </div>

        {/* Experience Level & Preferred Difficulty */}
        <div className="form-group">
          <label className="form-label" htmlFor="select-exp-level">Technical Experience Level</label>
          <select
            id="select-exp-level"
            className="form-select"
            value={profile.experience_level}
            onChange={(e) => setProfile({
              ...profile,
              experience_level: e.target.value,
              preferred_difficulty: e.target.value
            })}
          >
            <option value="Beginner">Beginner (Foundations & Guided)</option>
            <option value="Intermediate">Intermediate (Core Concepts Known)</option>
            <option value="Advanced">Advanced (Complex Systems & Research)</option>
          </select>
        </div>
      </div>

      {/* ── Premium Timeline Picker ── */}
      <TimelinePicker
        weeks={profile.available_time_weeks}
        onChange={(w) => setProfile({ ...profile, available_time_weeks: w })}
      />

      {/* Technical Skills Picker */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="form-label" style={{ margin: 0 }}>
            🛠️ Technical Skills You Possess ({profile.skills.length})
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {profile.skills.length > 0 && (
              <button
                type="button"
                id="btn-clear-skills"
                onClick={clearAllSkills}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Clear all
              </button>
            )}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click chips below or type to add</span>
          </div>
        </div>

        {/* Selected skills pills with proficiency selector */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '14px',
          minHeight: '44px',
          padding: '12px',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          alignItems: 'center'
        }}>
          {profile.skills.length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              No skills added yet. Tap any common skills below or type custom skills to calibrate your match.
            </span>
          )}
          {profile.skills.map((skill) => {
            const currentProf = profile.skill_proficiency?.[skill] || "Intermediate";
            return (
              <div
                key={skill}
                className="skill-pill-active"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '20px',
                  padding: '4px 6px 4px 12px',
                  gap: '8px',
                  fontSize: '0.84rem',
                  color: '#34d399',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <span style={{ fontWeight: 600 }}>{skill}</span>
                
                {/* Styled compact proficiency selector */}
                <select
                  value={currentProf}
                  onChange={(e) => setProficiency(skill, e.target.value)}
                  title="Select proficiency level"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    color: currentProf === 'Advanced' ? '#10b981' : currentProf === 'Intermediate' ? '#38bdf8' : '#fbbf24',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    outline: 'none',
                    marginRight: '2px'
                  }}
                >
                  <option value="Beginner" style={{ background: 'var(--bg-card)', color: '#fbbf24' }}>Beg</option>
                  <option value="Intermediate" style={{ background: 'var(--bg-card)', color: '#38bdf8' }}>Int</option>
                  <option value="Advanced" style={{ background: 'var(--bg-card)', color: '#10b981' }}>Adv</option>
                </select>

                {/* Big, clear, unmistakable remove button */}
                <button
                  type="button"
                  id={`btn-remove-skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSkill(skill);
                  }}
                  title={`Remove ${skill}`}
                  aria-label={`Remove ${skill}`}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: 0,
                    lineHeight: 1,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'scale(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Skill Input */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <input
            id="input-custom-skill"
            className="form-input"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
            placeholder="Type a skill (e.g. Scikit-Learn, Docker, Next.js, FastAPI)..."
          />
          <button
            type="button"
            id="btn-add-skill"
            className="btn btn-secondary btn-sm"
            onClick={() => addSkill(skillInput)}
          >
            + Add
          </button>
        </div>

        {/* Quick Common Skill Suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {COMMON_SKILLS.filter(s => !(profile.skills || []).some(ps => ps.toLowerCase() === s.toLowerCase())).slice(0, 18).map((skill) => (
            <button
              key={skill}
              type="button"
              className="skill-chip"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: '16px',
                padding: '5px 12px',
                fontSize: '0.78rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.18)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              onClick={() => addSkill(skill)}
            >
              + {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Areas of Interest */}
      <div className="form-group" style={{ marginBottom: '28px' }}>
        <label className="form-label">
          💡 Areas of Interest & Domains ({profile.interests.length} selected)
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {INTEREST_DOMAINS.map((domain) => {
            const isSelected = profile.interests.includes(domain);
            return (
              <button
                key={domain}
                type="button"
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}
                onClick={() => toggleInterest(domain)}
              >
                {isSelected ? '✓ ' : '+ '} {domain}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Ideas Toast */}
      {toast && (
        <div style={{
          marginBottom: '12px',
          padding: '12px 18px',
          borderRadius: '10px',
          background: toast.startsWith('✨')
            ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(56,128,105,0.12))'
            : 'rgba(245,158,11,0.12)',
          border: `1px solid ${toast.startsWith('✨') ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'}`,
          color: toast.startsWith('✨') ? '#34d399' : '#fbbf24',
          fontSize: '0.88rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeSlideIn 0.3s ease-out'
        }}>
          {toast}
          <span style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.6, fontSize: '1rem' }}
            onClick={() => setToast(null)}>✕</span>
        </div>
      )}

      {/* Action CTA */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', flex: 1, minWidth: '160px' }}>
          AI mentor analyzes your skills and synthesizes tailored project blueprints
        </span>
        <button
          id="btn-generate-recommendations"
          className="btn btn-primary"
          style={{ padding: '12px 32px', fontSize: '1.02rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          onClick={handleGenerateWithIdeas}
          disabled={loading || generating}
        >
          {loading
            ? "⚡ Analyzing Match & Skill Gaps..."
            : generating
            ? "🧠 Synthesizing AI Ideas..."
            : "🚀 Generate Personalized Recommendations"}
        </button>
      </div>
    </div>
  );
}
