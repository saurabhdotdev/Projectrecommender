import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentProfileForm from './components/StudentProfileForm';
import RecommendationDashboard from './components/RecommendationDashboard';
import ProjectCatalog from './components/ProjectCatalog';
import BenchmarkEvaluation from './components/BenchmarkEvaluation';
import ProjectDetailModal from './components/ProjectDetailModal';
import WeightCustomizerModal from './components/WeightCustomizerModal';
import AuthModal from './components/AuthModal';
import UserWorkspace from './components/UserWorkspace';
import ResumeInterviewKitModal from './components/ResumeInterviewKitModal';
import CustomProjectStudioModal from './components/CustomProjectStudioModal';
import MockInterviewerModal from './components/MockInterviewerModal';
import GitHubAuditModal from './components/GitHubAuditModal';
import {
  getRecommendations,
  fetchCurrentUser,
  fetchUserProjects,
  addUserProject,
  updateUserProject,
  removeUserProject,
  syncLocalProjects,
  downloadProjectScaffold
} from './api/client';
import { PROFILE_PRESETS } from './data/profilePresets';
import ChatAdvisor from './components/ChatAdvisor';

const DEFAULT_PROFILE = {
  student_id: '',
  degree: '',
  year: '',
  skills: [],
  skill_proficiency: {},
  interests: [],
  experience_level: 'Beginner',
  available_time_weeks: 4.0,
  career_goal: '',
  preferred_language: '',
  preferred_technologies: [],
  preferred_difficulty: 'Intermediate',
  past_projects: []
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('projectforge_active_tab') || 'advisor';
    } catch {
      return 'advisor';
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('projectforge_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Restore profile from localStorage if present, otherwise start with blank default
  const [studentProfile, setStudentProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('projectforge_student_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load profile from localStorage:', e);
    }
    return DEFAULT_PROFILE;
  });

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [perspectives, setPerspectives] = useState({});
  const [totalCatalogSize, setTotalCatalogSize] = useState(312);
  const [executionTimeMs, setExecutionTimeMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Recommender settings
  const [enableDiversity, setEnableDiversity] = useState(() => {
    try {
      const saved = localStorage.getItem('projectforge_diversity');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [diversityLambda, setDiversityLambda] = useState(() => {
    try {
      const saved = localStorage.getItem('projectforge_diversity_lambda');
      return saved !== null ? Number(saved) : 0.70;
    } catch {
      return 0.70;
    }
  });

  const [customWeights, setCustomWeights] = useState(() => {
    try {
      const saved = localStorage.getItem('projectforge_weights');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modals state
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedModalTab, setSelectedModalTab] = useState("overview");
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCustomStudioOpen, setIsCustomStudioOpen] = useState(false);
  const [prepKitProject, setPrepKitProject] = useState(null);
  const [mockInterviewProject, setMockInterviewProject] = useState(null);
  const [mockInterviewQuestions, setMockInterviewQuestions] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditRepoUrl, setAuditRepoUrl] = useState('https://github.com/saurabhdotdev/DocMindAi');
  const [auditProjectTitle, setAuditProjectTitle] = useState('');
  const [auditProjectId, setAuditProjectId] = useState('');

  // User Authentication & Personal Workspace State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('projectforge_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('projectforge_token') || "";
    } catch {
      return "";
    }
  });

  // Projects saved / started by student
  const [userProjects, setUserProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('projectforge_user_projects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist userProjects in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('projectforge_user_projects', JSON.stringify(userProjects));
    } catch {}
  }, [userProjects]);

  // Verify and refresh user session & workspace from backend if token exists
  useEffect(() => {
    if (!token) return;
    fetchCurrentUser(token)
      .then((userData) => {
        setUser(userData);
        localStorage.setItem('projectforge_user', JSON.stringify(userData));
        return fetchUserProjects(token);
      })
      .then((serverProjects) => {
        if (serverProjects && Array.isArray(serverProjects)) {
          setUserProjects(serverProjects);
        }
      })
      .catch((err) => {
        console.warn("Auth token invalid or expired:", err);
        setUser(null);
        setToken("");
        localStorage.removeItem('projectforge_user');
        localStorage.removeItem('projectforge_token');
      });
  }, [token]);

  const handleAuthSuccess = async (newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    try {
      localStorage.setItem('projectforge_user', JSON.stringify(newUser));
      localStorage.setItem('projectforge_token', newToken);
    } catch {}

    // If student started projects while guest, sync them into the new account!
    if (userProjects.length > 0) {
      try {
        const payload = userProjects.map((p) => ({
          project_id: p.project_id,
          status: p.status || 'started',
          progress_notes: p.progress_notes || null
        }));
        const synced = await syncLocalProjects(newToken, payload);
        if (synced && Array.isArray(synced)) {
          setUserProjects(synced);
        }
      } catch (err) {
        console.error("Failed to sync guest projects:", err);
      }
    } else {
      try {
        const serverProjects = await fetchUserProjects(newToken);
        if (serverProjects && Array.isArray(serverProjects)) {
          setUserProjects(serverProjects);
        }
      } catch {}
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    try {
      localStorage.removeItem('projectforge_user');
      localStorage.removeItem('projectforge_token');
    } catch {}
  };

  const handleStartProject = async (project) => {
    const existingIndex = userProjects.findIndex((p) => p.project_id === project.project_id);
    const title = project.title || project.project_id;
    const domain = project.domain || 'Engineering';
    const difficulty = project.difficulty || 'Intermediate';
    const duration = project.estimated_duration || 4.0;

    const newItem = {
      project_id: project.project_id,
      project_title: title,
      project_domain: domain,
      project_difficulty: difficulty,
      project_duration: duration,
      status: 'started',
      started_at: new Date().toISOString()
    };

    let nextProjects;
    if (existingIndex >= 0) {
      nextProjects = [...userProjects];
      nextProjects[existingIndex] = { ...nextProjects[existingIndex], status: 'started' };
    } else {
      nextProjects = [newItem, ...userProjects];
    }
    setUserProjects(nextProjects);

    if (token) {
      try {
        await addUserProject(token, { project_id: project.project_id, status: 'started' });
      } catch (err) {
        console.error("Error saving project to cloud:", err);
      }
    }
  };

  const handleBookmarkProject = async (project, action = 'saved') => {
    if (action === 'remove') {
      handleRemoveProject(project.project_id);
      return;
    }
    const existingIndex = userProjects.findIndex((p) => p.project_id === project.project_id);
    const title = project.title || project.project_id;
    const domain = project.domain || 'Engineering';
    const difficulty = project.difficulty || 'Intermediate';
    const duration = project.estimated_duration || 4.0;

    const newItem = {
      project_id: project.project_id,
      project_title: title,
      project_domain: domain,
      project_difficulty: difficulty,
      project_duration: duration,
      status: 'saved',
      started_at: new Date().toISOString()
    };

    let nextProjects;
    if (existingIndex >= 0) {
      nextProjects = [...userProjects];
      nextProjects[existingIndex] = { ...nextProjects[existingIndex], status: 'saved' };
    } else {
      nextProjects = [newItem, ...userProjects];
    }
    setUserProjects(nextProjects);

    if (token) {
      try {
        await addUserProject(token, { project_id: project.project_id, status: 'saved' });
      } catch (err) {
        console.error("Error bookmarking project to cloud:", err);
      }
    }
  };

  const handleWorkspaceAction = async (project, status, notes) => {
    if (status === 'rejected') {
      handleRemoveProject(project.project_id);
      return;
    }
    const existingIndex = userProjects.findIndex((p) => p.project_id === project.project_id);
    const title = project.title || project.project_id;
    const domain = project.domain || 'Engineering';
    const difficulty = project.difficulty || 'Intermediate';
    const duration = project.estimated_duration || 4.0;

    const newItem = {
      project_id: project.project_id,
      project_title: title,
      project_domain: domain,
      project_difficulty: difficulty,
      project_duration: duration,
      status: status || 'started',
      progress_notes: notes || null,
      started_at: new Date().toISOString()
    };

    let nextProjects;
    if (existingIndex >= 0) {
      nextProjects = [...userProjects];
      nextProjects[existingIndex] = {
        ...nextProjects[existingIndex],
        status: status || 'started',
        progress_notes: notes || nextProjects[existingIndex].progress_notes
      };
    } else {
      nextProjects = [newItem, ...userProjects];
    }
    setUserProjects(nextProjects);

    if (token) {
      try {
        await addUserProject(token, {
          project_id: project.project_id,
          status: status || 'started',
          progress_notes: notes
        });
      } catch (err) {
        console.error("Error updating project in cloud:", err);
      }
    }
  };

  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    setUserProjects((prev) =>
      prev.map((p) => (p.project_id === projectId ? { ...p, status: newStatus } : p))
    );
    if (token) {
      try {
        await updateUserProject(token, projectId, { status: newStatus });
      } catch (err) {
        console.error("Error updating project status in cloud:", err);
      }
    }
  };

  const handleRemoveProject = async (projectId) => {
    setUserProjects((prev) => prev.filter((p) => p.project_id !== projectId));
    if (token) {
      try {
        await removeUserProject(token, projectId);
      } catch (err) {
        console.error("Error removing project from cloud:", err);
      }
    }
  };

  const handleToggleRoadmapTask = async (projectId, completedTasksList, totalTasks) => {
    let nextStatus = null;
    setUserProjects((prev) => {
      const idx = prev.findIndex((p) => p.project_id === projectId);
      const isComplete = totalTasks > 0 && completedTasksList.length >= totalTasks;
      if (idx >= 0) {
        const updated = [...prev];
        nextStatus = isComplete ? 'completed' : updated[idx].status === 'saved' ? 'started' : updated[idx].status;
        updated[idx] = {
          ...updated[idx],
          completed_tasks: completedTasksList,
          status: nextStatus
        };
        return updated;
      } else {
        const newItem = {
          project_id: projectId,
          project_title: projectId,
          status: isComplete ? 'completed' : 'started',
          completed_tasks: completedTasksList,
          started_at: new Date().toISOString()
        };
        nextStatus = newItem.status;
        return [newItem, ...prev];
      }
    });

    if (token) {
      try {
        await updateUserProject(token, projectId, {
          completed_tasks: completedTasksList,
          status: nextStatus || undefined
        });
      } catch (err) {
        console.error("Error saving task progress to cloud:", err);
      }
    }
  };

  const handleUpdateGithubUrl = async (projectId, githubUrl) => {
    setUserProjects((prev) =>
      prev.map((p) => (p.project_id === projectId ? { ...p, github_url: githubUrl } : p))
    );
    if (token) {
      try {
        await updateUserProject(token, projectId, { github_url: githubUrl });
      } catch (err) {
        console.error("Error saving GitHub url to cloud:", err);
      }
    }
  };

  const handleDownloadScaffold = async (projectId) => {
    try {
      await downloadProjectScaffold(projectId, studentProfile?.skills || []);
    } catch (err) {
      console.error("Failed to download project starter scaffold:", err);
      alert("Failed to generate starter code: " + err.message);
    }
  };

  const handleOpenPrepKit = (project) => {
    setPrepKitProject(project);
  };

  // Theme effect & toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('projectforge_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Persist active tab
  useEffect(() => {
    try {
      localStorage.setItem('projectforge_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Persist student profile automatically on any change
  useEffect(() => {
    try {
      localStorage.setItem('projectforge_student_profile', JSON.stringify(studentProfile));
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }
  }, [studentProfile]);

  // Persist diversity settings
  useEffect(() => {
    try {
      localStorage.setItem('projectforge_diversity', JSON.stringify(enableDiversity));
      localStorage.setItem('projectforge_diversity_lambda', String(diversityLambda));
    } catch {}
  }, [enableDiversity, diversityLambda]);

  // Persist custom weights
  useEffect(() => {
    try {
      if (customWeights) {
        localStorage.setItem('projectforge_weights', JSON.stringify(customWeights));
      } else {
        localStorage.removeItem('projectforge_weights');
      }
    } catch {}
  }, [customWeights]);

  const handleResetProfile = () => {
    setStudentProfile(DEFAULT_PROFILE);
    try {
      localStorage.removeItem('projectforge_student_profile');
    } catch {}
  };

  // Live debounced auto-sync recommendations when profile, diversity, or weights change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetchRecommendations(studentProfile, enableDiversity, customWeights);
    }, 350);
    return () => clearTimeout(timer);
  }, [studentProfile, enableDiversity, customWeights, diversityLambda]);

  const handleFetchRecommendations = async (profile, diversity, weights) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRecommendations(
        profile,
        10,
        diversity,
        diversityLambda,
        weights
      );
      setRecommendations(res.recommendations || []);
      setPerspectives(res.perspectives || {});
      setTotalCatalogSize(res.total_catalog_size || 312);
      setExecutionTimeMs(res.execution_time_ms || 0);
    } catch (err) {
      console.error("Recommendation error:", err);
      setError(err.message || "Failed to fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = () => {
    handleFetchRecommendations(studentProfile, enableDiversity, customWeights);
  };

  const handleSelectPreset = (preset) => {
    setStudentProfile(preset.profile);
    handleFetchRecommendations(preset.profile, enableDiversity, customWeights);
  };

  const handleDiversityToggle = (newDiversityVal) => {
    setEnableDiversity(newDiversityVal);
    handleFetchRecommendations(studentProfile, newDiversityVal, customWeights);
  };

  const handleSaveWeights = (newWeights) => {
    setCustomWeights(newWeights);
    handleFetchRecommendations(studentProfile, enableDiversity, newWeights);
  };

  const handleOpenDetails = (project) => {
    setSelectedProject(project);
    setSelectedModalTab("overview");
  };

  const handleOpenRoadmap = (project) => {
    setSelectedProject(project);
    setSelectedModalTab("roadmap");
  };

  const handleIdeasGenerated = (res) => {
    if (res && res.total_catalog_size) {
      setTotalCatalogSize(res.total_catalog_size);
    }
    handleFetchRecommendations(studentProfile, enableDiversity, customWeights);
  };

  const handleCustomProjectSaved = (savedProject) => {
    if (token) {
      fetchUserProjects(token)
        .then(projs => setUserProjects(projs))
        .catch(() => {});
    } else {
      const newEntry = {
        id: Date.now(),
        project_id: savedProject.project_id,
        project_title: savedProject.title,
        project_domain: savedProject.domain,
        project_difficulty: savedProject.difficulty,
        project_duration: savedProject.estimated_duration || 4,
        status: 'started',
        progress_notes: 'Custom project architected and saved to workspace.',
        completed_tasks: [],
        github_url: '',
        started_at: new Date().toISOString()
      };
      setUserProjects(prev => {
        if (prev.some(p => p.project_id === savedProject.project_id)) return prev;
        return [newEntry, ...prev];
      });
    }
    setTotalCatalogSize(prev => prev + 1);
  };

  const handleOpenMockInterview = (project, questions = null) => {
    setMockInterviewProject(project);
    setMockInterviewQuestions(questions);
  };

  const handleOpenGitHubAudit = (repoUrl = 'https://github.com/saurabhdotdev/DocMindAi', project = null) => {
    setAuditRepoUrl(repoUrl || 'https://github.com/saurabhdotdev/DocMindAi');
    setAuditProjectTitle(project?.title || '');
    setAuditProjectId(project?.project_id || '');
    setIsAuditModalOpen(true);
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectPreset={handleSelectPreset}
        onOpenWeights={() => setIsWeightModalOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        totalCatalogSize={totalCatalogSize}
        currentProfile={studentProfile}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        workspaceCount={userProjects.length}
        onOpenCustomStudio={() => setIsCustomStudioOpen(true)}
        onOpenGitHubAudit={handleOpenGitHubAudit}
      />

      <main className="main-content">
        {/* TAB 1: ADVISOR & RECOMMENDATIONS */}
        {activeTab === 'advisor' && (
          <div>
            <StudentProfileForm
              profile={studentProfile}
              setProfile={setStudentProfile}
              onSubmit={handleProfileSubmit}
              loading={loading}
              onIdeasGenerated={handleIdeasGenerated}
              onResetProfile={handleResetProfile}
            />

            {error && (
              <div className="glass-panel" style={{ padding: '16px 20px', color: 'var(--danger)', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                ⚠️ {error}
              </div>
            )}

            {recommendations.length > 0 && (
              <RecommendationDashboard
                recommendations={recommendations}
                perspectives={perspectives}
                totalCatalogSize={totalCatalogSize}
                executionTimeMs={executionTimeMs}
                enableDiversity={enableDiversity}
                setEnableDiversity={handleDiversityToggle}
                onOpenDetails={handleOpenDetails}
                onOpenRoadmap={handleOpenRoadmap}
                onBookmark={handleBookmarkProject}
                onStartProject={handleStartProject}
                userProjects={userProjects}
                studentProfile={studentProfile}
                onIdeasGenerated={handleIdeasGenerated}
                onOpenCustomStudio={() => setIsCustomStudioOpen(true)}
              />
            )}
          </div>
        )}

        {/* TAB 2: MY PROJECT WORKSPACE */}
        {activeTab === 'workspace' && (
          <UserWorkspace
            userProjects={userProjects}
            user={user}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenDetails={handleOpenDetails}
            onOpenRoadmap={handleOpenRoadmap}
            onUpdateProjectStatus={handleUpdateProjectStatus}
            onRemoveProject={handleRemoveProject}
            onGoToAdvisor={() => setActiveTab('advisor')}
            onDownloadScaffold={handleDownloadScaffold}
            onOpenPrepKit={handleOpenPrepKit}
            onOpenMockInterview={handleOpenMockInterview}
            onOpenGitHubAudit={handleOpenGitHubAudit}
            onUpdateGithubUrl={handleUpdateGithubUrl}
          />
        )}

        {/* TAB 3: COMPLETE CATALOG */}
        {activeTab === 'catalog' && (
          <ProjectCatalog
            onSelectProject={handleOpenDetails}
            totalCatalogSize={totalCatalogSize}
            onIdeasGenerated={handleIdeasGenerated}
            studentProfile={studentProfile}
            onOpenCustomStudio={() => setIsCustomStudioOpen(true)}
          />
        )}

        {/* TAB 4: STRATEGY BENCHMARKS */}
        {activeTab === 'evaluation' && (
          <BenchmarkEvaluation />
        )}
      </main>

      {/* Project Detail & Roadmap Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          studentProfile={studentProfile}
          initialTab={selectedModalTab}
          onClose={() => setSelectedProject(null)}
          onSaveToWorkspace={handleWorkspaceAction}
          workspaceItem={userProjects.find(up => up.project_id === selectedProject?.project_id)}
          onOpenPrepKit={handleOpenPrepKit}
          onOpenMockInterview={handleOpenMockInterview}
          onOpenGitHubAudit={handleOpenGitHubAudit}
          onToggleTask={handleToggleRoadmapTask}
        />
      )}

      {/* ── Resume & Technical Interview Prep Kit Modal ── */}
      <ResumeInterviewKitModal
        isOpen={!!prepKitProject}
        project={prepKitProject}
        studentProfile={studentProfile}
        onClose={() => setPrepKitProject(null)}
        onOpenMockInterview={handleOpenMockInterview}
      />

      {/* ── Custom Project Studio & AI Architect Modal ── */}
      <CustomProjectStudioModal
        isOpen={isCustomStudioOpen}
        onClose={() => setIsCustomStudioOpen(false)}
        studentProfile={studentProfile}
        onProjectSaved={handleCustomProjectSaved}
        onOpenPrepKit={handleOpenPrepKit}
        onOpenMockInterview={handleOpenMockInterview}
      />

      {/* ── Live Technical Mock Interviewer Modal ── */}
      <MockInterviewerModal
        isOpen={!!mockInterviewProject}
        project={mockInterviewProject}
        studentProfile={studentProfile}
        initialQuestions={mockInterviewQuestions}
        onClose={() => {
          setMockInterviewProject(null);
          setMockInterviewQuestions(null);
        }}
      />

      {/* ── GitHub Code Quality & Production Readiness Auditor ── */}
      <GitHubAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        initialRepoUrl={auditRepoUrl}
        projectTitle={auditProjectTitle}
        projectId={auditProjectId}
      />

      {/* Weight Customizer Modal */}
      {isWeightModalOpen && (
        <WeightCustomizerModal
          currentWeights={customWeights}
          onSave={handleSaveWeights}
          onClose={() => setIsWeightModalOpen(false)}
        />
      )}

      {/* ── User Authentication Modal ── */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* ── Floating Chat Advisor ── */}
      <ChatAdvisor
        profile={studentProfile}
        setProfile={setStudentProfile}
        onSubmit={handleProfileSubmit}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
