import React, { useState } from 'react';

const DEFAULT_WEIGHTS = {
  skill_compatibility: 0.30,
  interest_match: 0.20,
  career_goal_match: 0.15,
  difficulty_fit: 0.10,
  time_feasibility: 0.10,
  technology_preference: 0.05,
  learning_value: 0.05,
  resume_relevance: 0.05,
  past_project_penalty: 0.15
};

const LABELS = {
  skill_compatibility: "Skill Compatibility (Readiness)",
  interest_match: "Domain & Interest Alignment",
  career_goal_match: "Career Goal & Industry Role Match",
  difficulty_fit: "Difficulty & Level Compatibility",
  time_feasibility: "Schedule & Duration Feasibility",
  technology_preference: "Language & Tech Stack Preference",
  learning_value: "Learning Opportunity (New Skills)",
  resume_relevance: "Resume Value & Originality",
  past_project_penalty: "Repetition Penalty (Completed Projects)"
};

export default function WeightCustomizerModal({
  currentWeights,
  onSave,
  onClose
}) {
  const [weights, setWeights] = useState(currentWeights || { ...DEFAULT_WEIGHTS });

  const handleChange = (key, val) => {
    setWeights(prev => ({
      ...prev,
      [key]: parseFloat(val)
    }));
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_WEIGHTS });
  };

  // Normalizes all positive weights so their sum is exactly 100% (1.00)
  const handleNormalize = () => {
    const positiveKeys = Object.keys(weights).filter(k => k !== "past_project_penalty");
    const total = positiveKeys.reduce((acc, k) => acc + (weights[k] || 0), 0);
    if (total <= 0) {
      setWeights({ ...DEFAULT_WEIGHTS });
      return;
    }

    const normalized = { ...weights };
    let runningSum = 0;
    positiveKeys.forEach((k, idx) => {
      if (idx === positiveKeys.length - 1) {
        // Last key absorbs any rounding diff so sum is exactly 100%
        normalized[k] = Math.max(0, Math.round((1.0 - runningSum) * 100) / 100);
      } else {
        const proportion = Math.round((weights[k] / total) * 100) / 100;
        normalized[k] = proportion;
        runningSum += proportion;
      }
    });

    setWeights(normalized);
  };

  const sumWeights = Object.keys(weights)
    .filter(k => k !== "past_project_penalty")
    .reduce((acc, k) => acc + weights[k], 0);

  const isExact100 = Math.abs(sumWeights - 1.0) < 0.01;

  const handleApply = () => {
    // If not exactly 100%, normalize automatically so ranking mathematics is balanced
    let finalWeights = { ...weights };
    if (!isExact100) {
      const positiveKeys = Object.keys(weights).filter(k => k !== "past_project_penalty");
      const total = positiveKeys.reduce((acc, k) => acc + (weights[k] || 0), 0);
      if (total > 0) {
        let runningSum = 0;
        positiveKeys.forEach((k, idx) => {
          if (idx === positiveKeys.length - 1) {
            finalWeights[k] = Math.max(0, Math.round((1.0 - runningSum) * 100) / 100);
          } else {
            const proportion = Math.round((weights[k] / total) * 100) / 100;
            finalWeights[k] = proportion;
            runningSum += proportion;
          }
        });
      }
    }
    onSave(finalWeights);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>⚙️ Ranking Function Weights</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Transparently tune the multi-factor recommender scoring formula.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Total Weight Sum Status Banner */}
          <div
            style={{
              background: isExact100 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: isExact100 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                Total Positive Weight Sum:{" "}
                <span style={{ fontWeight: 800, color: isExact100 ? '#34d399' : '#fbbf24', marginLeft: '4px' }}>
                  {(sumWeights * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {isExact100
                  ? "✓ Perfectly balanced! Weights distribute 100% of ranking priorities."
                  : "Sliders adjust independently. When one increases, total exceeds 100%."}
              </div>
            </div>

            {!isExact100 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleNormalize}
                style={{
                  fontSize: '0.78rem',
                  padding: '5px 12px',
                  borderColor: '#fbbf24',
                  color: '#fbbf24',
                  background: 'rgba(245, 158, 11, 0.15)',
                  fontWeight: 600
                }}
                title="Proportionally scale all weights so they sum to exactly 100%"
              >
                ⚖️ Auto-Balance to 100%
              </button>
            )}
          </div>

          {/* Sliders List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '52vh', overflowY: 'auto', paddingRight: '6px' }}>
            {Object.entries(weights).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg-glass)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span>{LABELS[k] || k}</span>
                  <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {(v * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.60"
                  step="0.05"
                  value={v}
                  onChange={(e) => handleChange(k, e.target.value)}
                  className="range-slider"
                />
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleReset}>
              🔄 Reset to Defaults
            </button>
            <button
              className="btn btn-primary"
              onClick={handleApply}
            >
              Apply & Re-Rank {!isExact100 ? "(Auto-Balanced)" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
