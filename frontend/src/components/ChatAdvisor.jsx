import React, { useState, useRef, useEffect } from "react";
import { sendChatAdvisorMessage } from "../api/client";

const DEFAULT_CHAT_MESSAGES = [
  {
    role: "assistant",
    content: "Hello! I'm your Project Advisor. Tell me a bit about your background — what field or degree are you studying, what skills do you have, or what kind of project are you looking to build?",
    id: "init-msg"
  }
];

export default function ChatAdvisor({ profile, setProfile, onSubmit, setActiveTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('projectforge_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CHAT_MESSAGES;
  });
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedChips, setSuggestedChips] = useState([
    "Computer Science & AI",
    "VLSI & Chip Design",
    "Robotics & Embedded",
    "Mechanical Engineering"
  ]);
  const [vettedSummary, setVettedSummary] = useState(() => {
    try {
      return localStorage.getItem('projectforge_chat_summary') || "";
    } catch {
      return "";
    }
  });
  const [readyToRecommend, setReadyToRecommend] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('projectforge_chat_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      if (vettedSummary) {
        localStorage.setItem('projectforge_chat_summary', vettedSummary);
      }
    } catch {}
  }, [vettedSummary]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMessage = {
      role: "user",
      content: text,
      id: `u-${Date.now()}`
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setLoading(true);

    try {
      // Send conversation to AI advisor backend
      const apiPayload = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendChatAdvisorMessage(apiPayload, profile);

      const assistantMsg = {
        role: "assistant",
        content: res.reply || "I've noted that. Tell me more about your specific focus or timeline!",
        id: `a-${Date.now()}`
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (res.suggested_chips && res.suggested_chips.length > 0) {
        setSuggestedChips(res.suggested_chips);
      }

      if (res.vetted_summary) {
        setVettedSummary(res.vetted_summary);
      }

      if (res.ready_to_recommend) {
        setReadyToRecommend(true);
      }

      // Apply detected profile updates to parent state
      if (res.profile_updates && Object.keys(res.profile_updates).length > 0) {
        setProfile(prev => {
          const updated = { ...prev };
          const updates = res.profile_updates;

          if (updates.degree) updated.degree = updates.degree;
          if (updates.year) updated.year = updates.year;
          if (updates.experience_level) {
            updated.experience_level = updates.experience_level;
            updated.preferred_difficulty = updates.experience_level;
          }
          if (updates.career_goal) updated.career_goal = updates.career_goal;
          if (updates.available_time_weeks) updated.available_time_weeks = Number(updates.available_time_weeks);

          if (Array.isArray(updates.skills) && updates.skills.length > 0) {
            const mergedSkills = [...new Set([...(prev.skills || []), ...updates.skills])];
            updated.skills = mergedSkills;
            const prof = { ...(prev.skill_proficiency || {}) };
            updates.skills.forEach(s => {
              if (!prof[s]) prof[s] = "Intermediate";
            });
            updated.skill_proficiency = prof;
          }

          if (Array.isArray(updates.interests) && updates.interests.length > 0) {
            const mergedInterests = [...new Set([...(prev.interests || []), ...updates.interests])];
            updated.interests = mergedInterests;
          }

          return updated;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I ran into a connection glitch, but I've noted your input. You can also customize your profile directly in the form!",
          id: `err-${Date.now()}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAndRecommend = () => {
    if (onSubmit) {
      onSubmit();
    }
    // Navigate to the advisor tab so the user can see the tailored recommendations
    if (setActiveTab) {
      setActiveTab('advisor');
    }
    setIsOpen(false);
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat reset. How can I help you find your ideal project blueprint today?",
        id: `reset-${Date.now()}`
      }
    ]);
    setSuggestedChips([
      "Computer Science & AI",
      "VLSI & Chip Design",
      "Robotics & Embedded",
      "Mechanical Engineering"
    ]);
    setVettedSummary("");
    setReadyToRecommend(false);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="chat-advisor-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Project Advisor"
        style={{
          position: "fixed",
          bottom: "26px",
          right: "26px",
          zIndex: 600,
          width: "54px",
          height: "54px",
          borderRadius: "50%",
          background: "var(--primary)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          cursor: "pointer",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          fontWeight: 700,
          fontSize: "1rem",
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>&times;</span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
        )}
      </button>

      {/* Chat Drawer / Modal Panel */}
      {isOpen && (
        <div
          id="chat-advisor-panel"
          style={{
            position: "fixed",
            bottom: "90px",
            right: "26px",
            zIndex: 600,
            width: "390px",
            maxWidth: "calc(100vw - 36px)",
            height: "580px",
            maxHeight: "calc(100vh - 120px)",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.45), 0 0 1px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
            animation: "chatSlideUp 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                }}
              >
                AI
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                  Project Advisor
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", display: "inline-block" }} />
                  AI Advisor &bull; Multi-Domain
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={handleResetChat}
                title="Restart conversation"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  padding: "2px 6px",
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>
          </div>

          {/* Vetted Summary Strip (if attributes detected) */}
          {vettedSummary && (
            <div
              style={{
                padding: "6px 14px",
                fontSize: "0.72rem",
                background: "rgba(62, 155, 130, 0.08)",
                borderBottom: "1px solid rgba(62, 155, 130, 0.15)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                🎯 {vettedSummary}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "84%",
                      padding: "10px 14px",
                      borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      background: isUser ? "var(--primary)" : "var(--bg-card)",
                      color: isUser ? "#ffffff" : "var(--text-primary)",
                      border: isUser ? "none" : "1px solid var(--border-color)",
                      fontSize: "0.85rem",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      boxShadow: isUser ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: "14px 14px 14px 2px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span className="dot-flashing" />
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Ready to recommend CTA Banner */}
          {readyToRecommend && (
            <div
              style={{
                padding: "8px 14px",
                background: "var(--bg-card)",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <button
                id="btn-apply-recommendations"
                className="btn btn-primary btn-sm"
                onClick={handleApplyAndRecommend}
                style={{ width: "100%", padding: "8px 12px", fontSize: "0.82rem" }}
              >
                ✨ View Tailored Recommendations &rarr;
              </button>
            </div>
          )}

          {/* Suggested Quick Chips */}
          {suggestedChips.length > 0 && (
            <div
              style={{
                padding: "6px 12px",
                borderTop: "1px solid var(--border-color)",
                background: "var(--bg-secondary)",
                display: "flex",
                gap: "5px",
                overflowX: "auto",
                whiteSpace: "nowrap",
                scrollbarWidth: "none",
              }}
            >
              {suggestedChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  disabled={loading}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    borderRadius: "20px",
                    padding: "4px 10px",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.color = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--border-color)",
              background: "var(--bg-card)",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              className="form-input"
              style={{
                flex: 1,
                fontSize: "0.84rem",
                padding: "8px 12px",
                borderRadius: "8px",
              }}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              placeholder="Type your background, field, or project idea..."
              disabled={loading}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}