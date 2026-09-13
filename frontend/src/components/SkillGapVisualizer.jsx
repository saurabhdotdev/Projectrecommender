import React, { useState } from 'react';

export default function SkillGapVisualizer({ skillGapData, studentSkills = [] }) {
  const [simulatedSkills, setSimulatedSkills] = useState([]);

  if (!skillGapData) return null;

  const {
    readiness_percentage = 50,
    matched_skills = [],
    missing_skills = [],
    total_prep_hours = 0,
    estimated_prep_roadmap = []
  } = skillGapData;

  // Calculate simulated readiness
  const totalSkillsCount = matched_skills.length + missing_skills.length || 1;
  const currentMatchedCount = matched_skills.length;
  const simulatedBoostCount = simulatedSkills.length;
  const basePercent = readiness_percentage;
  
  // Calculate dynamic simulated percentage boost
  const simulatedPercent = Math.min(
    100,
    Math.round(basePercent + (simulatedBoostCount / totalSkillsCount) * (100 - basePercent))
  );

  const toggleSimulate = (skillName) => {
    if (simulatedSkills.includes(skillName)) {
      setSimulatedSkills(simulatedSkills.filter(s => s !== skillName));
    } else {
      setSimulatedSkills([...simulatedSkills, skillName]);
    }
  };

  const isSimulating = simulatedSkills.length > 0;
  const effectiveReadiness = isSimulating ? simulatedPercent : readiness_percentage;

  // Calculate hours saved
  let hoursSaved = 0;
  simulatedSkills.forEach(s => {
    const item = missing_skills.find(m => (typeof m === 'string' ? m : m.skill) === s);
    if (item && item.estimated_prep_hours) hoursSaved += item.estimated_prep_hours;
    else hoursSaved += 20;
  });

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ fontSize: '1.1rem', margin: 0 }}>⚡ Skill-Gap Intelligence & Sandbox</h4>
            <span className="studio-tag-badge" style={{ fontSize: '0.72rem' }}>
              Interactive What-If
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Click any missing skill below to simulate learning it and see your readiness boost in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="match-score-pill"
            style={{
              fontSize: '1rem',
              padding: '4px 12px',
              background: isSimulating ? 'linear-gradient(135deg, #a855f7, #6366f1)' : undefined,
              boxShadow: isSimulating ? '0 0 15px rgba(168, 85, 247, 0.4)' : undefined
            }}
          >
            {effectiveReadiness}% Readiness
            {isSimulating && (
              <span style={{ fontSize: '0.75rem', opacity: 0.9, marginLeft: '4px' }}>
                (+{simulatedPercent - basePercent}%)
              </span>
            )}
          </div>
          {total_prep_hours > 0 && (
            <span className="badge badge-warning">
              ⏱️ ~{Math.max(0, total_prep_hours - hoursSaved)}h Prep
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
        <div
          style={{
            width: `${effectiveReadiness}%`,
            height: '100%',
            background: effectiveReadiness >= 75 ? 'var(--success)' : 'linear-gradient(90deg, #F59E0B, #10B981)',
            borderRadius: '4px',
            transition: 'width 0.5s ease'
          }}
        />
      </div>

      {/* Simulation Feedback Alert */}
      {isSimulating && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(99, 102, 241, 0.12))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.84rem',
            color: '#e9d5ff'
          }}
        >
          <div>
            ✨ <strong>Simulation:</strong> Learning <strong>{simulatedSkills.join(', ')}</strong> boosts readiness from {basePercent}% to <strong>{simulatedPercent}%</strong> and saves ~{hoursSaved} hours!
          </div>
          <button
            onClick={() => setSimulatedSkills([])}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#c084fc',
              cursor: 'pointer',
              fontSize: '0.78rem',
              textDecoration: 'underline'
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Two Column Layout: Possessed vs Gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Possessed Skills */}
        <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--success)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>✓ Skills You Possess</span>
            <span>({matched_skills.length + simulatedSkills.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {matched_skills.length === 0 && simulatedSkills.length === 0 ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None currently possessed.</span>
            ) : (
              <>
                {matched_skills.map(sk => (
                  <span key={sk} className="skill-chip possessed">
                    ✓ {sk}
                  </span>
                ))}
                {simulatedSkills.map(sk => (
                  <span
                    key={`sim-${sk}`}
                    className="skill-chip"
                    onClick={() => toggleSimulate(sk)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.25))',
                      border: '1px solid #a855f7',
                      color: '#e9d5ff',
                      cursor: 'pointer'
                    }}
                    title="Simulated as learned. Click to remove."
                  >
                    ⚡ {sk} (Simulated) ✕
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Missing Skills / Gaps */}
        <div style={{ background: 'rgba(245, 158, 11, 0.04)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>✗ Skill Gaps (Click to Simulate)</span>
            <span>({missing_skills.length - simulatedSkills.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {missing_skills.length === simulatedSkills.length ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--success)' }}>Zero gaps in current simulation!</span>
            ) : (
              missing_skills
                .filter(item => !simulatedSkills.includes(typeof item === 'string' ? item : item.skill))
                .map(item => {
                  const sName = typeof item === 'string' ? item : item.skill;
                  return (
                    <button
                      key={sName}
                      className="skill-chip missing"
                      onClick={() => toggleSimulate(sName)}
                      style={{ cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease' }}
                      title={`Click to simulate learning ${sName} and preview readiness jump!`}
                    >
                      <span>+ {sName}</span>
                      {item.estimated_prep_hours ? (
                        <span style={{ opacity: 0.75, fontSize: '0.7rem', marginLeft: '4px' }}>
                          (~{item.estimated_prep_hours}h)
                        </span>
                      ) : null}
                    </button>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Suggested Prep Steps */}
      {estimated_prep_roadmap.length > 0 && (
        <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            📚 Recommended Preparation Steps Before Starting:
          </div>
          <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {estimated_prep_roadmap.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
