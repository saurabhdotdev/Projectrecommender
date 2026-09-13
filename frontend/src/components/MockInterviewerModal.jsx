import React, { useState, useEffect, useRef } from 'react';
import {
  evaluateMockInterviewAnswer,
  generateMockInterviewSummary,
  fetchResumeInterviewKit
} from '../api/client';

export default function MockInterviewerModal({
  isOpen,
  onClose,
  project,
  studentProfile,
  initialQuestions = null
}) {
  // Setup state
  const [phase, setPhase] = useState('setup'); // 'setup' | 'question' | 'evaluating' | 'evaluated' | 'summary'
  const [interviewerStyle, setInterviewerStyle] = useState('bar_raiser');
  const [interviewMode, setInterviewMode] = useState('sprint'); // 'sprint' (3 rounds) | 'full' (5 rounds)

  // Questions & rounds state
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  // Round evaluation & history
  const [evaluating, setEvaluating] = useState(false);
  const [currentEval, setCurrentEval] = useState(null);
  const [roundHistory, setRoundHistory] = useState([]);
  const [finalSummary, setFinalSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  const personas = [
    {
      id: 'bar_raiser',
      title: 'FAANG Bar Raiser',
      icon: '👔',
      tagline: 'High technical rigor, STAR frameworks, boundary metrics & deep trade-offs.',
      color: '#38bdf8'
    },
    {
      id: 'startup_cto',
      title: 'High-Growth Startup CTO',
      icon: '🚀',
      tagline: 'Pragmatic execution, velocity, resilience, simplicity & total code ownership.',
      color: '#f59e0b'
    },
    {
      id: 'supportive_mentor',
      title: 'Supportive Tech Lead',
      icon: '🤝',
      tagline: 'Mentorship-oriented, encouraging intuition while identifying blind spots gently.',
      color: '#10b981'
    }
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setStudentAnswer((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
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
  }, []);

  // When modal opens or project changes, prepare questions
  useEffect(() => {
    if (isOpen && project) {
      setPhase('setup');
      setCurrentRound(0);
      setStudentAnswer('');
      setCurrentEval(null);
      setRoundHistory([]);
      setFinalSummary(null);
      setError(null);
      setShowHint(false);

      if (initialQuestions && initialQuestions.length > 0) {
        setQuestions(initialQuestions);
      } else {
        loadProjectQuestions();
      }
    }
  }, [isOpen, project, initialQuestions]);

  const loadProjectQuestions = async () => {
    if (!project) return;
    setLoadingQuestions(true);
    try {
      if (project.project_id) {
        const kit = await fetchResumeInterviewKit(project.project_id, studentProfile || {});
        if (kit && kit.interview_questions && kit.interview_questions.length > 0) {
          setQuestions(kit.interview_questions);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load kit questions, using fallback synthesis:', e);
    } finally {
      setLoadingQuestions(false);
    }

    // Fallback baseline questions synthesized from project metadata
    const synthesized = [
      {
        question: `Can you walk me through the high-level architecture of "${project.title || 'your project'}" and why you selected this technology stack?`,
        category: 'System Architecture & Tech Stack',
        model_answer: `The system is structured as decoupled microservices using ${(project.required_skills || ['modern frameworks']).slice(0, 3).join(', ')}. We isolated ingestion from persistence to prevent bottlenecking, choosing this stack for its robust concurrency guarantees and lightweight footprint.`,
        key_tradeoffs: 'Decoupled architecture vs Monolith simplicity; Latency vs Maintainability.',
        gotchas_to_avoid: "Don't just list technologies; justify WHY each was chosen over competitors."
      },
      {
        question: `What was the most challenging technical roadblock you encountered while implementing this, and how did you resolve it?`,
        category: 'Problem Solving & Deep Debugging',
        model_answer: `We encountered a critical throughput bottleneck when query latency increased under burst load. After profiling memory allocations and flamegraphs, we pinpointed redundant deserialization. Refactoring to zero-copy streaming slashed p99 latency by 45%.`,
        key_tradeoffs: 'Development speed vs Memory efficiency; Immediate patch vs Structural refactor.',
        gotchas_to_avoid: "Don't blame external libraries without showing your methodical profiling approach."
      },
      {
        question: `How does your implementation handle system failure, corrupted input, or network partitions?`,
        category: 'Reliability & Fault Tolerance',
        model_answer: `We instituted transactional boundaries with idempotency keys and exponential backoff retry policies. When downstream sinks fail, messages are diverted to a dead-letter queue while circuit breakers prevent cascading outages.`,
        key_tradeoffs: 'At-least-once vs Exactly-once processing overhead; Fast-fail vs Graceful retry.',
        gotchas_to_avoid: "Don't assume everything always works; demonstrate defense-in-depth thinking."
      },
      {
        question: `If this project needed to scale from 1,000 to 1,000,000 active daily users, what is the first component that would break and how would you redesign it?`,
        category: 'Scalability & Growth Horizons',
        model_answer: `The database write lock contention would fail first. To scale 1000x, we would introduce distributed caching with Redis, shard the database by tenant ID, and transition synchronous writes into an asynchronous queue with event-driven workers.`,
        key_tradeoffs: 'Strong consistency vs Eventual consistency; Infrastructure cost vs Peak throughput.',
        gotchas_to_avoid: "Don't just say 'add more RAM/servers'; discuss architectural bottlenecks and data tiering."
      },
      {
        question: `Looking back with the experience you have now, what architectural decision would you reverse or redesign from scratch?`,
        category: 'Engineering Retrospective & Evolution',
        model_answer: `I would invest earlier in comprehensive contract testing and schema registry validation. Late schema drifts caused subtle integration errors that could have been eliminated with strict protobuf/JSON Schema contracts at the gateway level.`,
        key_tradeoffs: 'Upfront schema rigidity vs Rapid agile prototyping.',
        gotchas_to_avoid: "Avoid stating 'nothing, it was perfect'. Top engineers always identify design debt."
      }
    ];
    setQuestions(synthesized);
  };

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Speech start error:', e);
        setIsListening(false);
      }
    }
  };

  const handleStartInterview = () => {
    setPhase('question');
    setCurrentRound(0);
    setStudentAnswer('');
    setShowHint(false);
    setCurrentEval(null);
    setRoundHistory([]);
  };

  const activeQuestionList = interviewMode === 'sprint' ? questions.slice(0, 3) : questions.slice(0, 5);
  const activeQuestion = activeQuestionList[currentRound] || questions[0];

  const handleSubmitAnswer = async () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setEvaluating(true);
    setError(null);
    try {
      const evalRes = await evaluateMockInterviewAnswer({
        projectId: project.project_id || '',
        projectTitle: project.title || 'Project',
        projectDomain: project.domain || 'Engineering',
        requiredSkills: project.required_skills || [],
        question: activeQuestion.question,
        category: activeQuestion.category || 'System Architecture',
        modelAnswer: activeQuestion.model_answer || '',
        keyTradeoffs: activeQuestion.key_tradeoffs || '',
        studentAnswer: studentAnswer,
        interviewerStyle: interviewerStyle,
        history: roundHistory.map((r) => ({
          question: r.question,
          student_answer: r.student_answer,
          overall_score: r.eval.overall_score
        }))
      });

      setCurrentEval(evalRes);
      setPhase('evaluated');
    } catch (err) {
      setError(err.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextRound = async () => {
    const updatedHistory = [
      ...roundHistory,
      {
        roundNumber: currentRound + 1,
        category: activeQuestion.category || 'General',
        question: activeQuestion.question,
        student_answer: studentAnswer,
        eval: currentEval
      }
    ];
    setRoundHistory(updatedHistory);

    if (currentRound + 1 < activeQuestionList.length) {
      setCurrentRound(currentRound + 1);
      setStudentAnswer('');
      setShowHint(false);
      setCurrentEval(null);
      setPhase('question');
    } else {
      // All rounds completed -> generate summary debrief
      setPhase('summary');
      setLoadingSummary(true);
      try {
        const payloadEvals = updatedHistory.map((h) => ({
          category: h.category,
          question: h.question,
          student_answer: h.student_answer,
          overall_score: h.eval?.overall_score || 7,
          feedback: h.eval?.feedback || 'Satisfactory response.'
        }));
        const summary = await generateMockInterviewSummary({
          projectTitle: project.title || 'Project',
          evaluations: payloadEvals
        });
        setFinalSummary(summary);
      } catch (err) {
        console.warn('Summary generation error:', err);
        // Compute deterministic fallback
        const avg = (
          updatedHistory.reduce((acc, h) => acc + (h.eval?.overall_score || 7), 0) /
          updatedHistory.length
        ).toFixed(1);
        setFinalSummary({
          final_decision: avg >= 8.5 ? 'Strong Hire 🌟' : avg >= 7.0 ? 'Hire ✅' : avg >= 5.5 ? 'Lean Hire ⚖️' : 'Needs Practice 📚',
          average_score: parseFloat(avg),
          overall_feedback: `The candidate completed all ${updatedHistory.length} technical interview rounds for "${project.title}", showing good familiarity with core domain principles and architecture.`,
          key_takeaways: [
            'Articulate system trade-offs early in your answers.',
            'Include quantifiable metrics whenever describing project impact.',
            'Practice concise pacing using the STAR framework.'
          ]
        });
      } finally {
        setLoadingSummary(false);
      }
    }
  };

  const handleExportMarkdown = () => {
    if (!project || roundHistory.length === 0) return;
    const dateStr = new Date().toLocaleDateString();
    let md = `# Mock Technical Interview Debrief\n\n`;
    md += `**Project:** ${project.title}\n`;
    md += `**Domain:** ${project.domain || 'Engineering'}\n`;
    md += `**Interviewer Persona:** ${personas.find((p) => p.id === interviewerStyle)?.title || interviewerStyle}\n`;
    md += `**Date:** ${dateStr}\n`;
    if (finalSummary) {
      md += `**Hiring Decision:** ${finalSummary.final_decision}\n`;
      md += `**Average Score:** ${finalSummary.average_score} / 10\n\n`;
      md += `### Executive Debrief\n${finalSummary.overall_feedback}\n\n`;
      if (finalSummary.key_takeaways) {
        md += `### Key Takeaways\n`;
        finalSummary.key_takeaways.forEach((t) => {
          md += `- ${t}\n`;
        });
        md += `\n`;
      }
    }
    md += `---\n\n## Round Breakdown\n\n`;
    roundHistory.forEach((r) => {
      md += `### Round ${r.roundNumber}: ${r.category}\n`;
      md += `**Question:** ${r.question}\n\n`;
      md += `**Your Answer:**\n> ${r.student_answer || '*(No answer provided)*'}\n\n`;
      if (r.eval) {
        md += `**Scores:** Overall: ${r.eval.overall_score}/10 | STAR: ${r.eval.star_score}/10 | Depth: ${r.eval.technical_depth_score}/10 | Clarity: ${r.eval.clarity_score}/10\n\n`;
        md += `**Feedback:** ${r.eval.feedback}\n\n`;
        if (r.eval.strengths?.length) {
          md += `**Strengths:**\n`;
          r.eval.strengths.forEach((s) => (md += `- ${s}\n`));
          md += `\n`;
        }
        if (r.eval.improvements?.length) {
          md += `**Areas for Improvement:**\n`;
          r.eval.improvements.forEach((imp) => (md += `- ${imp}\n`));
          md += `\n`;
        }
        if (r.eval.exemplar_revision) {
          md += `**Senior Exemplar Answer:**\n> ${r.eval.exemplar_revision}\n\n`;
        }
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mock_Interview_${project.title.replace(/\s+/g, '_')}_Debrief.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const wordCount = studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0;

  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#38bdf8';
    if (score >= 4) return '#f59e0b';
    return '#ef4444';
  };

  if (!isOpen || !project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎙️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
                  Live Technical Mock Interviewer
                </h2>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                  Interactive AI
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Target Project: <strong>{project.title}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* PHASE 1: SETUP SCREEN */}
          {phase === 'setup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.07)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '16px 20px',
                  borderRadius: '12px'
                }}
              >
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  🎯 Practice Under Real Interview Pressure
                </h3>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Answer realistic system design and architecture questions either by <strong>speaking</strong> into your microphone or <strong>typing</strong> your response.
                  Our AI evaluates your delivery on the official <strong>STAR rubric</strong>, technical depth, and clarity, providing senior-level exemplar rewrites.
                </p>
              </div>

              {/* Persona Picker */}
              <div>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px', display: 'block' }}>
                  1. Select Interviewer Persona:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {personas.map((p) => {
                    const isSelected = interviewerStyle === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setInterviewerStyle(p.id)}
                        style={{
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary)',
                          border: isSelected ? `2px solid ${p.color}` : '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.3rem' }}>{p.icon}</span>
                          <strong style={{ fontSize: '0.92rem', color: isSelected ? p.color : 'var(--text-primary)' }}>
                            {p.title}
                          </strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {p.tagline}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mode Picker */}
              <div>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px', display: 'block' }}>
                  2. Choose Practice Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div
                    onClick={() => setInterviewMode('sprint')}
                    style={{
                      background: interviewMode === 'sprint' ? 'rgba(168, 85, 247, 0.12)' : 'var(--bg-secondary)',
                      border: interviewMode === 'sprint' ? '2px solid #a855f7' : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem' }}>⚡</span>
                      <strong style={{ fontSize: '0.92rem', color: interviewMode === 'sprint' ? '#c084fc' : 'var(--text-primary)' }}>
                        3-Round Quick Sprint
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Focuses on core architecture, debugging roadblocks, and failure scenarios (~8 mins).
                    </p>
                  </div>

                  <div
                    onClick={() => setInterviewMode('full')}
                    style={{
                      background: interviewMode === 'full' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
                      border: interviewMode === 'full' ? '2px solid #10b981' : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🎯</span>
                      <strong style={{ fontSize: '0.92rem', color: interviewMode === 'full' ? '#34d399' : 'var(--text-primary)' }}>
                        5-Round Full Loop
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Covers architecture, roadblocks, failure modes, scale horizons, and design retrospectives (~15 mins).
                    </p>
                  </div>
                </div>
              </div>

              {/* Start Button Banner */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-secondary)',
                  padding: '16px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  marginTop: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Ready to begin?</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {loadingQuestions ? 'Synthesizing technical scenarios...' : `${activeQuestionList.length} interview questions queued.`}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartInterview}
                  disabled={loadingQuestions}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontWeight: 700 }}
                >
                  {loadingQuestions ? 'Loading Scenarios...' : '🎙️ Begin Mock Interview'}
                </button>
              </div>
            </div>
          )}

          {/* PHASE 2: QUESTION / RECORDING STAGE */}
          {phase === 'question' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Progress Track */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                    Round {currentRound + 1} of {activeQuestionList.length}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {activeQuestion.category || 'System Architecture'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Interviewer: {personas.find((p) => p.id === interviewerStyle)?.icon}{' '}
                  {personas.find((p) => p.id === interviewerStyle)?.title}
                </div>
              </div>

              {/* Question Box */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
                  Interviewer asks:
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  "{activeQuestion.question}"
                </h3>

                {/* Hint Drawer */}
                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f59e0b',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    💡 {showHint ? 'Hide Key Trade-offs to Address' : 'View Key Trade-offs (Architect Hint)'}
                  </button>
                  {showHint && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '10px 14px',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45
                      }}
                    >
                      {activeQuestion.key_tradeoffs || 'Focus on system throughput, recovery time objective (RTO), and memory footprint.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Student Answer Input with Voice Dictation */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Your Response:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {speechSupported && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        style={{
                          background: isListening ? '#ef4444' : 'rgba(56, 189, 248, 0.15)',
                          border: isListening ? '1px solid #dc2626' : '1px solid rgba(56, 189, 248, 0.4)',
                          color: isListening ? '#ffffff' : '#38bdf8',
                          borderRadius: '6px',
                          padding: '4px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isListening ? '🔴 Recording... Click to Stop' : '🎙️ Speak Answer'}
                      </button>
                    )}
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: wordCount < 30 ? 'var(--text-muted)' : wordCount <= 180 ? '#10b981' : '#f59e0b'
                      }}
                    >
                      {wordCount} words {wordCount >= 40 && wordCount <= 180 ? '(Optimal depth)' : ''}
                    </span>
                  </div>
                </div>

                <textarea
                  className="form-input"
                  rows={6}
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Explain your approach clearly. Tip: state the Situation/Task, your specific Technical Actions, and quantifiable Results or architectural Trade-offs..."
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    fontFamily: 'inherit'
                  }}
                />

                {isListening && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '0.8rem',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span style={{ animation: 'pulse 1s infinite' }}>●</span> Listening to your speech... Speak clearly into your mic.
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setStudentAnswer(activeQuestion.model_answer.slice(0, 140) + '...')}
                >
                  📝 Insert Quick Outline
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setStudentAnswer('I am unsure how to design this component yet.');
                    }}
                  >
                    Pass / Pass Round
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={evaluating || !studentAnswer.trim()}
                    onClick={handleSubmitAnswer}
                    style={{ minWidth: '180px', fontWeight: 700 }}
                  >
                    {evaluating ? 'Analyzing Delivery...' : '🚀 Submit for Evaluation'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 3: EVALUATION FEEDBACK STAGE */}
          {phase === 'evaluated' && currentEval && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Scorecard Header Banner */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{personas.find((p) => p.id === interviewerStyle)?.icon}</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      Round {currentRound + 1} Assessment: {activeQuestion.category}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Evaluated by <strong>{personas.find((p) => p.id === interviewerStyle)?.title}</strong>
                  </p>
                </div>

                {/* Overall Score Pill */}
                <div
                  style={{
                    background: `${getScoreColor(currentEval.overall_score)}18`,
                    border: `2px solid ${getScoreColor(currentEval.overall_score)}`,
                    borderRadius: '12px',
                    padding: '8px 18px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: getScoreColor(currentEval.overall_score), lineHeight: 1 }}>
                    {currentEval.overall_score} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>/ 10</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px', color: getScoreColor(currentEval.overall_score) }}>
                    Overall Score
                  </div>
                </div>
              </div>

              {/* Metric Breakdown Bars */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px'
                }}
              >
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>STAR Method Alignment</span>
                    <strong style={{ color: getScoreColor(currentEval.star_score) }}>{currentEval.star_score}/10</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${currentEval.star_score * 10}%`, background: getScoreColor(currentEval.star_score), height: '100%', borderRadius: '3px' }} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Technical Depth</span>
                    <strong style={{ color: getScoreColor(currentEval.technical_depth_score) }}>{currentEval.technical_depth_score}/10</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${currentEval.technical_depth_score * 10}%`, background: getScoreColor(currentEval.technical_depth_score), height: '100%', borderRadius: '3px' }} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Clarity & Structure</span>
                    <strong style={{ color: getScoreColor(currentEval.clarity_score) }}>{currentEval.clarity_score}/10</strong>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${currentEval.clarity_score * 10}%`, background: getScoreColor(currentEval.clarity_score), height: '100%', borderRadius: '3px' }} />
                  </div>
                </div>
              </div>

              {/* Coaching Feedback Speech Bubble */}
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '16px 20px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                  💬 Interviewer Coaching Feedback:
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {currentEval.feedback}
                </p>
              </div>

              {/* Strengths & Improvements Side-by-Side */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '10px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                    ✅ Strengths Identified:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {(currentEval.strengths || []).map((s, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '10px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                    ⚠️ Points to Strengthen:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {(currentEval.improvements || []).map((imp, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Senior Exemplar Revision */}
              {currentEval.exemplar_revision && (
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '16px'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a855f7', marginBottom: '6px' }}>
                    ✨ Exemplar: How a Senior Staff Engineer Would Phrase This:
                  </div>
                  <div
                    style={{
                      fontStyle: 'italic',
                      fontSize: '0.88rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                      background: 'var(--bg-input)',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      borderLeft: '3px solid #a855f7'
                    }}
                  >
                    "{currentEval.exemplar_revision}"
                  </div>
                </div>
              )}

              {/* Follow-up Question Preview */}
              {currentEval.follow_up_question && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.06)',
                    border: '1px dashed rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '0.84rem'
                  }}
                >
                  <strong style={{ color: '#f59e0b' }}>🔍 Potential Follow-Up Probe: </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>"{currentEval.follow_up_question}"</span>
                </div>
              )}

              {/* Next Round Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNextRound}
                  style={{ padding: '10px 24px', fontWeight: 700 }}
                >
                  {currentRound + 1 < activeQuestionList.length ? 'Next Question →' : '🏆 View Final Scorecard & Debrief'}
                </button>
              </div>
            </div>
          )}

          {/* PHASE 4: FINAL EXECUTIVE SCORECARD & DEBRIEF */}
          {phase === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {loadingSummary && (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⚙️</div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Bar Raiser Committee Deliberating...</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Compiling multi-round ratings, scoring STAR rigor, and generating your hiring committee scorecard.
                  </p>
                </div>
              )}

              {finalSummary && !loadingSummary && (
                <>
                  {/* Executive Banner */}
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '24px',
                      textAlign: 'center',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                      {finalSummary.final_decision.includes('Strong') ? '🌟' : finalSummary.final_decision.includes('Hire') ? '✅' : '📚'}
                    </div>
                    <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Bar Raiser Hiring Committee Verdict
                    </div>
                    <h2 style={{ margin: '6px 0', fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {finalSummary.final_decision}
                    </h2>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: getScoreColor(finalSummary.average_score) }}>
                      Loop Average: {finalSummary.average_score} / 10
                    </div>

                    <p style={{ maxWidth: '680px', margin: '14px auto 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {finalSummary.overall_feedback}
                    </p>
                  </div>

                  {/* Round-by-Round Breakdown Accordion/Cards */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                      📊 Round-by-Round Breakdown:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {roundHistory.map((h, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                                R{h.roundNumber}: {h.category}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {h.question}
                            </div>
                          </div>
                          <div
                            style={{
                              background: `${getScoreColor(h.eval?.overall_score || 7)}15`,
                              border: `1px solid ${getScoreColor(h.eval?.overall_score || 7)}`,
                              color: getScoreColor(h.eval?.overall_score || 7),
                              padding: '4px 12px',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '0.9rem'
                            }}
                          >
                            {h.eval?.overall_score || 7} / 10
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Takeaways */}
                  {finalSummary.key_takeaways && (
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '12px',
                        padding: '16px 20px'
                      }}
                    >
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: '#38bdf8', fontWeight: 700 }}>
                        💡 Key High-Impact Takeaways for Real Interviews:
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {finalSummary.key_takeaways.map((t, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Export & Actions Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '16px',
                      marginTop: '8px',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleExportMarkdown}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      📥 Export Debrief (.md)
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleStartInterview}
                      >
                        🔄 Retake Interview
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onClose}
                      >
                        Done & Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
