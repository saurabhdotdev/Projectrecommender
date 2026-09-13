import React, { useState, useRef, useEffect } from "react";
import { sendProjectCopilotMessage } from "../api/client";

// ── Lightweight Markdown Renderer (no external deps) ──────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  const lines = text.split("\n");
  const html = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block fences
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        html.push(
          `<div class="copilot-code-block"><div class="copilot-code-header"><span>${codeLang || "code"}</span><button onclick="navigator.clipboard.writeText(this.closest('.copilot-code-block').querySelector('code').innerText)" class="copilot-copy-btn">📋 Copy</button></div><pre><code>${codeBuffer.join("\n").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>`
        );
        codeBuffer = [];
        codeLang = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headers
    if (line.startsWith("#### ")) {
      html.push(`<h4 class="copilot-h4">${inlineFormat(line.slice(5))}</h4>`);
    } else if (line.startsWith("### ")) {
      html.push(`<h3 class="copilot-h3">${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      html.push(`<h2 class="copilot-h2">${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      html.push(`<h1 class="copilot-h1">${inlineFormat(line.slice(2))}</h1>`);
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      html.push(`<blockquote class="copilot-blockquote">${inlineFormat(line.slice(2))}</blockquote>`);
    }
    // Unordered list
    else if (/^[-*] /.test(line.trim())) {
      html.push(`<div class="copilot-li">• ${inlineFormat(line.trim().slice(2))}</div>`);
    }
    // Ordered list
    else if (/^\d+\.\s/.test(line.trim())) {
      const match = line.trim().match(/^(\d+)\.\s(.*)/);
      if (match) {
        html.push(`<div class="copilot-li"><strong>${match[1]}.</strong> ${inlineFormat(match[2])}</div>`);
      }
    }
    // Horizontal rule
    else if (/^---+$/.test(line.trim())) {
      html.push(`<hr class="copilot-hr" />`);
    }
    // Empty line = paragraph break
    else if (line.trim() === "") {
      html.push(`<div class="copilot-spacer"></div>`);
    }
    // Normal paragraph
    else {
      html.push(`<p class="copilot-p">${inlineFormat(line)}</p>`);
    }
  }

  // Close unclosed code block
  if (inCodeBlock && codeBuffer.length > 0) {
    html.push(
      `<div class="copilot-code-block"><div class="copilot-code-header"><span>${codeLang || "code"}</span></div><pre><code>${codeBuffer.join("\n").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>`
    );
  }

  return html.join("\n");
}

function inlineFormat(text) {
  if (!text) return "";
  return text
    .replace(/`([^`]+)`/g, '<code class="copilot-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

// ── Default Welcome ───────────────────────────────────────────────────────

const WELCOME_MESSAGE = {
  role: "assistant",
  content: `### ⚡ Welcome to ProjectForge AI Copilot

I'm your **Staff-level Engineering Mentor** — ready to help you build, debug, and ship production-grade projects.

Here's what I can help with:
- **🏗️ System Architecture** — Component design, data flow, and microservice boundaries
- **⚡ Implementation Code** — Clean, copy-pasteable starter boilerplate with type annotations
- **🧪 Testing & Benchmarks** — Pytest suites, coverage strategies, and load testing
- **📄 Resume & Interview Prep** — STAR bullets, technical Q&A, and talking points

Select a project from your workspace for context-aware guidance, or just ask me anything!`,
  id: "welcome-msg"
};

// ── Main Component ────────────────────────────────────────────────────────

export default function ProjectCopilotChat({ studentProfile, userProjects = [], initialProject = null, initialPrompt = "" }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("projectforge_copilot_messages");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [WELCOME_MESSAGE];
  });

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedChips, setSuggestedChips] = useState([
    "🏗️ System Architecture & Data Flow",
    "⚡ Show Starter Boilerplate",
    "🧪 Suggest Unit Tests",
    "📄 Draft STAR Resume Bullets"
  ]);

  // Selected project context
  const [selectedProjectCtx, setSelectedProjectCtx] = useState(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync initialProject when provided
  useEffect(() => {
    if (initialProject) {
      setSelectedProjectCtx({
        project_id: initialProject.project_id || `proj_${Date.now()}`,
        title: initialProject.title || initialProject.project_title || 'Custom Project',
        domain: initialProject.domain || initialProject.project_domain || 'Engineering',
        description: initialProject.description || '',
        tech_stack: initialProject.required_skills || initialProject.programming_languages || []
      });
      if (initialPrompt) {
        setInputText(initialPrompt);
      }
    }
  }, [initialProject, initialPrompt]);

  // Dynamically update quick chips based on context
  useEffect(() => {
    if (selectedProjectCtx) {
      const shortTitle = selectedProjectCtx.title.length > 25
        ? selectedProjectCtx.title.slice(0, 22) + "..."
        : selectedProjectCtx.title;
      setSuggestedChips([
        `🏗️ Architecture of ${shortTitle}`,
        "⚡ Generate Phase 1 Starter Code",
        "🗄️ Write Database DDL Schema",
        "🧪 Generate Automated Pytest Suite",
        "📄 Draft STAR Resume Bullets"
      ]);
    } else {
      setSuggestedChips([
        "🏗️ System Architecture & Data Flow",
        "⚡ Show Starter Boilerplate",
        "🧪 Suggest Unit Tests",
        "📄 Draft STAR Resume Bullets"
      ]);
    }
  }, [selectedProjectCtx]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem("projectforge_copilot_messages", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (textOverride) => {
    const text = (textOverride || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      role: "user",
      content: text,
      id: `u-${Date.now()}`
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText("");
    setLoading(true);

    try {
      const apiPayload = nextMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const profilePayload = studentProfile || null;
      const res = await sendProjectCopilotMessage(apiPayload, selectedProjectCtx, profilePayload);

      const assistantMsg = {
        role: "assistant",
        content: res.reply || "I'm here to help — could you provide more details about what you'd like to build?",
        id: `a-${Date.now()}`
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (res.suggested_chips?.length > 0) {
        setSuggestedChips(res.suggested_chips);
      }
    } catch (err) {
      console.error("Copilot error:", err);
      const errorMsg = {
        role: "assistant",
        content: `⚠️ **Connection issue** — ${err.message || "Could not reach the AI Copilot."}. Please try again.`,
        id: `err-${Date.now()}`
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setSuggestedChips([
      "🏗️ System Architecture & Data Flow",
      "⚡ Show Starter Boilerplate",
      "🧪 Suggest Unit Tests",
      "📄 Draft STAR Resume Bullets"
    ]);
    try {
      localStorage.removeItem("projectforge_copilot_messages");
    } catch {}
  };

  const handleExportTranscript = () => {
    const lines = [
      `# 🤖 ProjectForge AI Copilot — Technical Session Transcript`,
      ``,
      `> **Date**: ${new Date().toLocaleString()}`,
      selectedProjectCtx ? `> **Project Context**: ${selectedProjectCtx.title} (${selectedProjectCtx.domain})` : `> **Project Context**: General Engineering Mode`,
      ``,
      `---`,
      ``
    ];

    messages.forEach((m) => {
      if (m.role === "assistant") {
        lines.push(`### 🤖 Copilot:`);
        lines.push(m.content);
        lines.push(``);
      } else if (m.role === "user") {
        lines.push(`### 👤 Student:`);
        lines.push(m.content);
        lines.push(``);
      }
    });

    lines.push(`---`, `*Exported from ProjectForge AI Engineering Copilot*`);

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = selectedProjectCtx
      ? selectedProjectCtx.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)
      : "session";
    link.setAttribute("href", url);
    link.setAttribute("download", `ProjectForge-Copilot-${safeTitle}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectProject = (proj) => {
    setSelectedProjectCtx({
      project_id: proj.project_id,
      title: proj.project_title || proj.title || proj.project_id,
      domain: proj.project_domain || proj.domain || "Engineering",
      difficulty: proj.project_difficulty || proj.difficulty || "Intermediate",
      programming_languages: proj.programming_languages || [],
      frameworks: proj.frameworks || [],
      tools: proj.tools || [],
      required_skills: proj.required_skills || [],
      description: proj.description || "",
      estimated_duration: proj.project_duration || proj.estimated_duration || 4
    });
    setShowProjectPicker(false);
  };

  return (
    <div className="copilot-chat-container">
      {/* ── Header Bar ── */}
      <div className="copilot-header">
        <div className="copilot-header-left">
          <span className="copilot-header-icon">🤖</span>
          <div>
            <h2 className="copilot-header-title">AI Engineering Copilot</h2>
            <span className="copilot-header-sub">Staff-Level Technical Mentor • Architecture • Code • Tests • Resume</span>
          </div>
        </div>
        <div className="copilot-header-actions">
          {/* Project Context Selector */}
          <div style={{ position: "relative" }}>
            <button
              className="copilot-ctx-btn"
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              title="Select a project for context-aware guidance"
            >
              📂 {selectedProjectCtx ? selectedProjectCtx.title.slice(0, 22) + (selectedProjectCtx.title.length > 22 ? "…" : "") : "Select Project"}
            </button>
            {showProjectPicker && (
              <div className="copilot-project-picker">
                <div className="copilot-picker-header">Select Project Context</div>
                <button
                  className="copilot-picker-item copilot-picker-none"
                  onClick={() => { setSelectedProjectCtx(null); setShowProjectPicker(false); }}
                >
                  ✕ No project (general mode)
                </button>
                {userProjects.length === 0 && (
                  <div className="copilot-picker-empty">No workspace projects yet. Start a project first!</div>
                )}
                {userProjects.map((p, i) => (
                  <button
                    key={p.project_id || i}
                    className={`copilot-picker-item ${selectedProjectCtx?.project_id === p.project_id ? "active" : ""}`}
                    onClick={() => handleSelectProject(p)}
                  >
                    <span className="copilot-picker-title">{p.project_title || p.project_id}</span>
                    <span className="copilot-picker-meta">{p.project_domain || "Engineering"} • {p.status || "started"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="copilot-clear-btn"
            onClick={handleExportTranscript}
            title="Download full chat transcript as Markdown"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            📥 Export .md
          </button>
          <button className="copilot-clear-btn" onClick={handleClearChat} title="Clear conversation">
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* ── Context Banner ── */}
      {selectedProjectCtx && (
        <div className="copilot-context-banner">
          <span>🎯 Context:</span>
          <strong>{selectedProjectCtx.title}</strong>
          <span className="copilot-ctx-domain">{selectedProjectCtx.domain}</span>
          <button className="copilot-ctx-remove" onClick={() => setSelectedProjectCtx(null)}>✕</button>
        </div>
      )}

      {/* ── Messages Area ── */}
      <div className="copilot-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`copilot-msg ${msg.role === "user" ? "copilot-msg-user" : "copilot-msg-assistant"}`}
          >
            <div className="copilot-msg-avatar">
              {msg.role === "user" ? "👤" : "🤖"}
            </div>
            <div className="copilot-msg-body">
              {msg.role === "assistant" ? (
                <div
                  className="copilot-md-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              ) : (
                <div className="copilot-user-text">{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="copilot-msg copilot-msg-assistant">
            <div className="copilot-msg-avatar">🤖</div>
            <div className="copilot-msg-body">
              <div className="copilot-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Action Chips ── */}
      {suggestedChips.length > 0 && !loading && (
        <div className="copilot-chips">
          {suggestedChips.map((chip, i) => (
            <button
              key={i}
              className="copilot-chip"
              onClick={() => handleSendMessage(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Area ── */}
      <div className="copilot-input-area">
        <textarea
          ref={inputRef}
          className="copilot-input"
          placeholder={selectedProjectCtx ? `Ask about ${selectedProjectCtx.title}…` : "Ask about architecture, code, tests, resume prep…"}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          className="copilot-send-btn"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || loading}
          title="Send message"
        >
          {loading ? "⏳" : "🚀"}
        </button>
      </div>
    </div>
  );
}
