import React, { useState, useEffect } from 'react';

export default function LearningRoadmap({
  roadmapData,
  projectId,
  savedCompletedTasks = [],
  onToggleTask,
  onDownloadScaffold,
  onOpenPrepKit
}) {
  if (!roadmapData) return null;

  const {
    project_title,
    total_weeks,
    milestones = [],
    readiness_adjustment_note
  } = roadmapData;

  // Set up task state initialized from saved completed tasks array
  const [completedMap, setCompletedMap] = useState({});

  useEffect(() => {
    if (Array.isArray(savedCompletedTasks)) {
      const initialMap = {};
      savedCompletedTasks.forEach(k => {
        initialMap[k] = true;
      });
      setCompletedMap(initialMap);
    }
  }, [savedCompletedTasks, projectId]);

  // Collect all task keys across milestones
  const allTaskKeys = [];
  milestones.forEach(m => {
    m.tasks?.forEach((_, idx) => {
      allTaskKeys.push(`w${m.week_number}-t${idx}`);
    });
  });

  const totalTaskCount = allTaskKeys.length;
  const completedCount = Object.keys(completedMap).filter(k => completedMap[k]).length;
  const progressPercent = totalTaskCount > 0 ? Math.round((completedCount / totalTaskCount) * 100) : 0;

  const handleToggle = (weekNum, taskIdx) => {
    const key = `w${weekNum}-t${taskIdx}`;
    const nextState = !completedMap[key];
    const newMap = {
      ...completedMap,
      [key]: nextState
    };
    setCompletedMap(newMap);

    // Get list of completed keys
    const newCompletedList = Object.keys(newMap).filter(k => newMap[k]);

    if (onToggleTask && projectId) {
      onToggleTask(projectId, newCompletedList, totalTaskCount);
    }
  };

  return (
    <div id="learning-roadmap-view">
      {/* Header with Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>
              🗺️ Personalized Milestone Roadmap ({total_weeks} Weeks)
            </h3>
            {readiness_adjustment_note && (
              <div className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                💡 {readiness_adjustment_note}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {onDownloadScaffold && projectId && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onDownloadScaffold(projectId)}
                title="Download ready-to-run starter codebase"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                📦 Starter (.zip)
              </button>
            )}
            {onOpenPrepKit && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onOpenPrepKit}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                💼 Prep Kit
              </button>
            )}
          </div>
        </div>

        {/* Interactive Progress Tracking Widget */}
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginTop: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>🎯</span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                Execution Progress: {completedCount} / {totalTaskCount} tasks completed
              </strong>
            </div>
            <span
              style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: progressPercent === 100 ? '#34d399' : 'var(--primary)'
              }}
            >
              {progressPercent}%
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'var(--border-color)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: progressPercent === 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, var(--primary), #818cf8)',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          {progressPercent === 100 && (
            <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
              🎉 Incredible job! You've accomplished all milestone execution tasks for this project.
            </div>
          )}
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="timeline">
        {milestones.map((m) => {
          // Count tasks completed in this milestone
          const mTasks = m.tasks || [];
          const mCompleted = mTasks.filter((_, idx) => completedMap[`w${m.week_number}-t${idx}`]).length;
          const isMilestoneDone = mTasks.length > 0 && mCompleted === mTasks.length;

          return (
            <div key={m.week_number} className="timeline-step">
              <div
                className="timeline-dot"
                style={{
                  background: isMilestoneDone ? '#10b981' : undefined,
                  boxShadow: isMilestoneDone ? '0 0 10px #10b981' : undefined
                }}
              />
              <div
                className="timeline-card"
                style={{
                  border: isMilestoneDone ? '1px solid rgba(16, 185, 129, 0.4)' : undefined
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                      WEEK {m.week_number}
                    </span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {m.title}
                    </strong>
                    {isMilestoneDone && (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        ✓ Milestone Complete
                      </span>
                    )}
                  </div>
                  {m.skills_addressed && m.skills_addressed.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {m.skills_addressed.map(sk => (
                        <span key={sk} className="skill-chip possessed" style={{ fontSize: '0.7rem' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '12px', fontStyle: 'italic' }}>
                  Focus: {m.focus}
                </p>

                {/* Tasks List with interactive checkoffs */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Weekly Execution Checklist:
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {mCompleted}/{mTasks.length} done
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {mTasks.map((task, idx) => {
                      const key = `w${m.week_number}-t${idx}`;
                      const isDone = !!completedMap[key];
                      return (
                        <label
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            fontSize: '0.84rem',
                            color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: isDone ? 'line-through' : 'none',
                            cursor: 'pointer',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: isDone ? 'var(--bg-glass)' : 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggle(m.week_number, idx)}
                            style={{ accentColor: 'var(--primary)', marginTop: '3px', cursor: 'pointer' }}
                          />
                          <span>{task}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Deliverables Box */}
                <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem' }}>📦</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--accent)' }}>Key Deliverable:</strong> {m.deliverables}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
