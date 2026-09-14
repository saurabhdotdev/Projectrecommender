const API_BASE = "/api";

export async function fetchTaxonomy() {
  const res = await fetch(`${API_BASE}/taxonomy`);
  if (!res.ok) throw new Error("Failed to load taxonomy metadata");
  return res.json();
}

export async function getRecommendations(studentProfile, topK = 10, enableDiversity = true, diversityLambda = 0.70, weights = null) {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_profile: studentProfile,
      top_k: topK,
      enable_diversity: enableDiversity,
      diversity_lambda: diversityLambda,
      weights: weights
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch project recommendations");
  }
  return res.json();
}

export async function fetchProjects(params = {}) {
  const query = new URLSearchParams();
  if (params.domain) query.append("domain", params.domain);
  if (params.difficulty) query.append("difficulty", params.difficulty);
  if (params.search) query.append("search", params.search);
  if (params.limit) query.append("limit", params.limit);
  if (params.offset) query.append("offset", params.offset);

  const res = await fetch(`${API_BASE}/projects?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to list projects");
  return res.json();
}

export async function fetchProjectDetail(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`);
  if (!res.ok) throw new Error("Failed to fetch project details");
  return res.json();
}

export async function fetchSkillGap(projectId, skills = []) {
  const skillsParam = skills.join(",");
  const res = await fetch(`${API_BASE}/projects/${projectId}/skill-gap?skills=${encodeURIComponent(skillsParam)}`);
  if (!res.ok) throw new Error("Failed to fetch skill gap analysis");
  return res.json();
}

export async function fetchRoadmap(projectId, skills = [], weeks = 4) {
  const skillsParam = skills.join(",");
  const res = await fetch(`${API_BASE}/projects/${projectId}/roadmap?skills=${encodeURIComponent(skillsParam)}&weeks=${weeks}`);
  if (!res.ok) throw new Error("Failed to fetch roadmap");
  return res.json();
}

export async function logFeedback(feedbackData) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedbackData)
  });
  if (!res.ok) throw new Error("Failed to record feedback");
  return res.json();
}

export async function fetchBenchmarkEvaluation(k = 5, forceRecompute = false) {
  const res = await fetch(`${API_BASE}/evaluate?k=${k}&force_recompute=${forceRecompute}`);
  if (!res.ok) throw new Error("Failed to load benchmark evaluation");
  return res.json();
}

export async function sendChatAdvisorMessage(messages, currentProfile = {}) {
  const res = await fetch(`${API_BASE}/chat/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages,
      current_profile: currentProfile
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to communicate with AI Advisor");
  }
  return res.json();
}

export async function fetchProjectPitch(projectId, studentProfile) {
  const res = await fetch(`${API_BASE}/ai/project-pitch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: projectId,
      student_profile: studentProfile
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate AI Project Pitch");
  }
  return res.json();
}

export async function generateUnlimitedIdeas({
  studentProfile = null,
  prompt = "",
  domain = "",
  difficulty = "",
  count = 3,
  saveToCatalog = true
} = {}) {
  const res = await fetch(`${API_BASE}/projects/generate-ideas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_profile: studentProfile,
      prompt: prompt || undefined,
      domain: domain || undefined,
      difficulty: difficulty || undefined,
      count: count,
      save_to_catalog: saveToCatalog
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate AI project ideas");
  }
  return res.json();
}

export async function fetchProjectStats() {
  const res = await fetch(`${API_BASE}/projects/meta/stats`);
  if (!res.ok) throw new Error("Failed to fetch project stats");
  return res.json();
}

// ── Auth & Personal Workspace Client API ─────────────────────────────────────

export async function registerUser({ email, password, full_name = "" }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create account.");
  }
  return res.json();
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid email or password.");
  }
  return res.json();
}

export async function fetchCurrentUser(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Session expired or invalid token.");
  return res.json();
}

export async function fetchUserProjects(token, status = null) {
  const url = status ? `${API_BASE}/auth/projects?status=${encodeURIComponent(status)}` : `${API_BASE}/auth/projects`;
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch user projects.");
  return res.json();
}

export async function addUserProject(token, { project_id, status = "started", progress_notes = null, completed_tasks = [], github_url = "" }) {
  const res = await fetch(`${API_BASE}/auth/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ project_id, status, progress_notes, completed_tasks, github_url })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save project to workspace.");
  }
  return res.json();
}

export async function updateUserProject(token, projectId, { status, progress_notes, completed_tasks, github_url }) {
  const res = await fetch(`${API_BASE}/auth/projects/${projectId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ status, progress_notes, completed_tasks, github_url })
  });
  if (!res.ok) throw new Error("Failed to update project status.");
  return res.json();
}

export async function removeUserProject(token, projectId) {
  const res = await fetch(`${API_BASE}/auth/projects/${projectId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to remove project from workspace.");
  return res.json();
}

export async function syncLocalProjects(token, localProjects) {
  const res = await fetch(`${API_BASE}/auth/projects/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(localProjects)
  });
  if (!res.ok) throw new Error("Failed to sync local projects.");
  return res.json();
}

export async function downloadProjectScaffold(projectId, skills = []) {
  const skillsParam = skills.join(",");
  const url = `${API_BASE}/projects/${projectId}/scaffold?skills=${encodeURIComponent(skillsParam)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to generate project starter archive.");
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = `ProjectForge-${projectId}-starter.zip`;
  if (contentDisposition && contentDisposition.includes("filename=")) {
    filename = contentDisposition.split("filename=")[1].replace(/["']/g, "");
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function parseResume({ file = null, rawText = "" }) {
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/students/parse-resume`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to parse resume file.");
    }
    return res.json();
  } else if (rawText && rawText.trim()) {
    const res = await fetch(`${API_BASE}/students/parse-resume-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_text: rawText.trim() })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to parse resume text.");
    }
    return res.json();
  } else {
    throw new Error("Please select a PDF file or paste resume text.");
  }
}

export async function fetchResumeInterviewKit(projectId, studentProfile) {
  const res = await fetch(`${API_BASE}/ai/resume-interview-kit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: projectId,
      student_profile: studentProfile
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate Resume & Interview Prep Kit.");
  }
  return res.json();
}

export async function architectCustomProject({ ideaPrompt, domain = null, preferredTech = [], timelineWeeks = 4, studentProfile = null }) {
  const res = await fetch(`${API_BASE}/projects/custom/architect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idea_prompt: ideaPrompt,
      domain: domain || null,
      preferred_tech: preferredTech,
      timeline_weeks: timelineWeeks,
      student_profile: studentProfile
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to architect custom project.");
  }
  return res.json();
}

export async function saveCustomProject(project, saveToWorkspace = true, appliedCustomizations = []) {
  const token = localStorage.getItem("pf_auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/projects/custom/save`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      project,
      save_to_workspace: saveToWorkspace,
      applied_customizations: appliedCustomizations
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save custom project.");
  }
  return res.json();
}

export async function evaluateMockInterviewAnswer({
  projectId = "",
  projectTitle,
  projectDomain = "Engineering",
  requiredSkills = [],
  question,
  category = "System Architecture",
  modelAnswer = "",
  keyTradeoffs = "",
  studentAnswer,
  interviewerStyle = "bar_raiser",
  history = []
}) {
  const res = await fetch(`${API_BASE}/ai/mock-interview/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: projectId,
      project_title: projectTitle,
      project_domain: projectDomain,
      required_skills: requiredSkills,
      question,
      category,
      model_answer: modelAnswer,
      key_tradeoffs: keyTradeoffs,
      student_answer: studentAnswer,
      interviewer_style: interviewerStyle,
      history
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to evaluate interview answer.");
  }
  return res.json();
}

export async function generateMockInterviewSummary({
  projectTitle,
  evaluations = []
}) {
  const res = await fetch(`${API_BASE}/ai/mock-interview/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_title: projectTitle,
      evaluations
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate interview debrief summary.");
  }
  return res.json();
}

export async function fetchUserGitHubRepos(username) {
  if (!username) return [];
  const res = await fetch(`${API_BASE}/projects/github/user/${encodeURIComponent(username)}/repos`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch repositories for @${username}`);
  }
  return res.json();
}

export async function auditGitHubRepository({ githubUrl, projectId = "", projectTitle = "" }) {
  const res = await fetch(`${API_BASE}/projects/github-audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      github_url: githubUrl,
      project_id: projectId,
      project_title: projectTitle
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to audit GitHub repository.");
  }
  return res.json();
}

// ── Project Copilot Chat API ────────────────────────────────────────────────

export async function sendProjectCopilotMessage(messages, projectContext = null, studentProfile = null) {
  const res = await fetch(`${API_BASE}/ai/project-copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      project_context: projectContext,
      student_profile: studentProfile
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to communicate with AI Copilot.");
  }
  return res.json();
}


