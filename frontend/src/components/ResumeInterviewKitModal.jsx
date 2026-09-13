import React, { useState, useEffect } from 'react';
import { fetchResumeInterviewKit } from '../api/client';

export default function ResumeInterviewKitModal({
  project,
  studentProfile,
  isOpen,
  onClose,
  onOpenMockInterview
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kitData, setKitData] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [speakingText, setSpeakingText] = useState(null);

  const handleSpeak = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    if (speakingText === text) {
      window.speechSynthesis.cancel();
      setSpeakingText(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = () => setSpeakingText(null);
    setSpeakingText(text);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []); // expand first question by default

  useEffect(() => {
    if (isOpen && project) {
      loadKit();
    } else {
      setKitData(null);
      setError(null);
    }
  }, [isOpen, project]);

  const loadKit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResumeInterviewKit(project.project_id, studentProfile || {});
      setKitData(data);
    } catch (err) {
      setError(err.message || 'Failed to generate prep kit.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  const handleCopyBullet = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyPitch = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleCopyAllBullets = () => {
    if (!kitData?.star_bullets) return;
    const allText = kitData.star_bullets.map(b => `• ${b.bullet}`).join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '840px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.4rem' }}>💼</span>
              <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 800 }}>
                Resume & Technical Interview Prep Kit
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              Tailored STAR bullets and 5 technical interview questions for <strong>{project.title || project.project_id}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '6px' }}>
          {loading && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⚙️</div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Crafting Your High-Impact Prep Kit...</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Analyzing architectural choices, formulating quantifiable STAR metrics, and synthesizing technical interview scenarios.
              </p>
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: '6px' }}>⚠️ Error generating kit</div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{error}</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadKit}>
                🔄 Retry Generation
              </button>
            </div>
          )}

          {kitData && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 1. Elevator Pitch Box */}
              {kitData.elevator_pitch && (
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🎙️</span>
                      <strong style={{ fontSize: '0.95rem', color: '#38bdf8' }}>
                        30-Second Recruiter Elevator Pitch
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSpeak(kitData.elevator_pitch)}
                        style={{ fontSize: '0.76rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Read aloud using speech synthesis"
                      >
                        {speakingText === kitData.elevator_pitch ? '⏹ Stop' : '🔊 Listen'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopyPitch(kitData.elevator_pitch)}
                        style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                      >
                        {copiedPitch ? '✓ Copied!' : '📋 Copy Pitch'}
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
                    "{kitData.elevator_pitch}"
                  </p>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    💡 Use this directly when interviewers say: <em>"Walk me through a key project on your resume."</em>
                  </div>
                </div>
              )}

              {/* 2. STAR Resume Bullets */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📝</span> "Resume Ready" STAR Bullets
                  </h3>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleCopyAllBullets}
                    style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                  >
                    {copiedAll ? '✓ All Copied!' : '📋 Copy All Bullets'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {kitData.star_bullets?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '16px'
                      }}
                    >
                      {/* Main bullet */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                          • {item.bullet}
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCopyBullet(item.bullet, idx)}
                          style={{ fontSize: '0.74rem', padding: '3px 8px', whiteSpace: 'nowrap' }}
                        >
                          {copiedIndex === idx ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>

                      {/* STAR Breakdown */}
                      {(item.situation_task || item.action || item.result) && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {item.situation_task && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              <strong style={{ color: '#fbbf24' }}>Situation/Task:</strong> {item.situation_task}
                            </div>
                          )}
                          {item.action && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              <strong style={{ color: '#38bdf8' }}>Action/Stack:</strong> {item.action}
                            </div>
                          )}
                          {item.result && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              <strong style={{ color: '#34d399' }}>Quantifiable Result:</strong> {item.result}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Technical Interview Prep Kit */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎯</span>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                      5 Core Technical Interview Questions & Model Answers
                    </h3>
                  </div>
                  {onOpenMockInterview && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        onClose();
                        onOpenMockInterview(project, kitData.interview_questions);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                    >
                      🎙️ Practice Live in Mock Interviewer
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {kitData.interview_questions?.map((q, idx) => {
                    const isExpanded = expandedQuestion === idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: isExpanded ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                          border: isExpanded ? '1px solid var(--border-highlight)' : '1px solid var(--border-color)',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Question Header */}
                        <div
                          onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                          style={{
                            padding: '14px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                              Q{idx + 1}: {q.category || 'Technical'}
                            </span>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                              {q.question}
                            </strong>
                          </div>
                          <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>

                        {/* Question Body */}
                        {isExpanded && (
                          <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            {/* Model Answer */}
                            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399' }}>
                                  ✨ Model 10/10 Answer:
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleSpeak(q.model_answer)}
                                  style={{ fontSize: '0.72rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Read model answer aloud"
                                >
                                  {speakingText === q.model_answer ? '⏹ Stop Audio' : '🔊 Listen'}
                                </button>
                              </div>
                              <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>
                                {q.model_answer}
                              </p>
                            </div>

                            {/* Trade-offs & Gotchas */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginTop: '10px' }}>
                              {q.key_tradeoffs && (
                                <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#38bdf8', marginBottom: '3px' }}>
                                    ⚖️ Key Trade-offs to Articulate:
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {q.key_tradeoffs}
                                  </div>
                                </div>
                              )}

                              {q.gotchas_to_avoid && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f87171', marginBottom: '3px' }}>
                                    ⚠️ Gotcha / Trap to Avoid:
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {q.gotchas_to_avoid}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            {onOpenMockInterview && kitData?.interview_questions && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onOpenMockInterview(project, kitData.interview_questions);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                🎙️ Practice in Live Mock Interviewer →
              </button>
            )}
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
