from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class RankingWeights(BaseModel):
    skill_compatibility: float = Field(0.30, ge=0.0, le=1.0)
    interest_match: float = Field(0.20, ge=0.0, le=1.0)
    career_goal_match: float = Field(0.15, ge=0.0, le=1.0)
    difficulty_fit: float = Field(0.10, ge=0.0, le=1.0)
    time_feasibility: float = Field(0.10, ge=0.0, le=1.0)
    technology_preference: float = Field(0.05, ge=0.0, le=1.0)
    learning_value: float = Field(0.05, ge=0.0, le=1.0)
    resume_relevance: float = Field(0.05, ge=0.0, le=1.0)
    past_project_penalty: float = Field(0.15, ge=0.0, le=1.0)

class StudentProfileSchema(BaseModel):
    student_id: Optional[str] = "student_default"
    degree: str = "Computer Science"
    year: str = "2nd year"
    skills: List[str] = Field(default_factory=list)
    skill_proficiency: Dict[str, str] = Field(default_factory=dict)  # e.g. {"Python": "Intermediate"}
    interests: List[str] = Field(default_factory=list)
    experience_level: str = "Intermediate"  # Beginner, Intermediate, Advanced
    available_time_weeks: float = 4.0
    career_goal: str = "Internship"  # Internship, Full-time Job, Research, Portfolio, Skill Growth
    preferred_language: Optional[str] = "Python"
    preferred_technologies: List[str] = Field(default_factory=list)
    preferred_difficulty: Optional[str] = "Intermediate"
    past_projects: List[str] = Field(default_factory=list)

class ProjectSchema(BaseModel):
    project_id: str
    title: str
    description: str
    domain: str
    subdomain: str
    difficulty: str
    required_skills: List[str]
    skill_importance: Dict[str, float]
    programming_languages: List[str]
    frameworks: List[str]
    tools: List[str]
    prerequisites: List[str]
    estimated_duration: float
    dataset_available: bool
    dataset_source: str
    project_type: str
    career_paths: List[str]
    resume_value: float
    originality_score: float
    learning_outcomes: List[str]

class ExplanationBreakdown(BaseModel):
    summary: str
    reasons: List[str]
    cautions: List[str]
    score_components: Dict[str, float]

class RecommendedProjectItem(BaseModel):
    project_id: str
    title: str
    description: str
    domain: str
    subdomain: str
    difficulty: str
    score: float  # Final personalized score (0 to 1)
    match_percentage: int  # 0 to 100%
    readiness: float  # 0 to 1
    readiness_percentage: int  # 0 to 100%
    estimated_duration: float
    required_skills: List[str]
    matched_skills: List[str]
    missing_skills: List[str]
    reasons: List[str]
    cautions: List[str]
    score_components: Dict[str, float]
    perspective: Optional[str] = None  # best_match, learning, resume, quick_win, stretch

    # Full engineering specification fields for architectural details inspection
    programming_languages: List[str] = []
    frameworks: List[str] = []
    tools: List[str] = []
    prerequisites: List[str] = []
    career_paths: List[str] = []
    learning_outcomes: List[str] = []
    dataset_available: bool = False
    dataset_source: str = ""
    project_type: str = "Applied Engineering Project"
    resume_value: float = 8.5
    originality_score: float = 8.5

class RecommendationPerspectives(BaseModel):
    best_match: Optional[RecommendedProjectItem] = None
    best_learning_opportunity: Optional[RecommendedProjectItem] = None
    best_resume_project: Optional[RecommendedProjectItem] = None
    quick_win: Optional[RecommendedProjectItem] = None
    stretch_project: Optional[RecommendedProjectItem] = None

class RecommendationRequest(BaseModel):
    student_profile: StudentProfileSchema
    top_k: int = 12
    enable_diversity: bool = True
    diversity_lambda: float = 0.70
    weights: Optional[RankingWeights] = None

class RecommendationResponse(BaseModel):
    student_id: str
    recommendations: List[RecommendedProjectItem]
    perspectives: RecommendationPerspectives
    total_catalog_size: int
    execution_time_ms: float

class SkillGapDetail(BaseModel):
    skill: str
    category: str
    importance: float
    estimated_prep_hours: int
    prerequisites: List[str]

class SkillGapResponse(BaseModel):
    project_id: str
    project_title: str
    readiness_score: float
    readiness_percentage: int
    matched_skills: List[str]
    missing_skills: List[SkillGapDetail]
    total_prep_hours: int
    estimated_prep_roadmap: List[str]

class RoadmapMilestone(BaseModel):
    week_number: int
    title: str
    focus: str
    tasks: List[str]
    deliverables: str
    skills_addressed: List[str]

class RoadmapResponse(BaseModel):
    project_id: str
    project_title: str
    student_id: str
    total_weeks: int
    milestones: List[RoadmapMilestone]
    readiness_adjustment_note: str

class FeedbackCreate(BaseModel):
    student_id: str
    project_id: str
    event_type: str  # viewed, bookmarked, started, completed, abandoned, rated, accepted, rejected
    rating: Optional[float] = None
    feedback_notes: Optional[str] = None

class FeedbackResponse(BaseModel):
    status: str
    message: str
    interaction_id: int

class StrategyBenchmarkMetrics(BaseModel):
    strategy_name: str
    precision_at_5: float
    recall_at_5: float
    ndcg_at_5: float
    hit_rate_at_5: float
    catalog_coverage: float
    intra_list_diversity: float
    novelty_score: float
    skill_compatibility: float
    feasibility_score: float

class BenchmarkEvaluationResponse(BaseModel):
    metrics: List[StrategyBenchmarkMetrics]
    test_profiles_evaluated: int
    dataset_size: int
    evaluation_summary: str

class GenerateIdeasRequest(BaseModel):
    student_profile: Optional[StudentProfileSchema] = None
    prompt: Optional[str] = None
    domain: Optional[str] = None
    difficulty: Optional[str] = None
    count: int = Field(default=3, ge=1, le=10)
    save_to_catalog: bool = True

class GenerateIdeasResponse(BaseModel):
    generated_projects: List[ProjectSchema]
    total_catalog_size: int
    message: str


# ── Auth & User Workspace Schemas ─────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = ""

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str

class UserProjectCreate(BaseModel):
    project_id: str
    status: Optional[str] = "started"  # started, in_progress, completed, saved
    progress_notes: Optional[str] = None
    completed_tasks: Optional[List[str]] = None
    github_url: Optional[str] = None

class UserProjectUpdate(BaseModel):
    status: Optional[str] = None  # started, in_progress, completed, saved
    progress_notes: Optional[str] = None
    completed_tasks: Optional[List[str]] = None
    github_url: Optional[str] = None

class UserProjectResponse(BaseModel):
    id: int
    user_id: int
    project_id: str
    project_title: str
    project_domain: str
    project_difficulty: str
    project_duration: float
    status: str
    progress_notes: Optional[str] = None
    completed_tasks: List[str] = []
    github_url: str = ""
    started_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── Custom Project Studio Schemas ─────────────────────────────────────────────

class CustomProjectArchitectRequest(BaseModel):
    idea_prompt: str
    domain: Optional[str] = None
    preferred_tech: Optional[List[str]] = None
    timeline_weeks: float = 4.0
    student_profile: Optional[Dict[str, Any]] = None

class CustomProjectSaveRequest(BaseModel):
    project: Dict[str, Any]
    save_to_workspace: bool = True
    applied_customizations: Optional[List[str]] = None


# ── GitHub Repository Audit Schemas ──────────────────────────────────────────

class GitHubAuditRequest(BaseModel):
    github_url: str
    project_id: Optional[str] = ""
    project_title: Optional[str] = ""

class RecommendedPullRequest(BaseModel):
    title: str
    priority: str
    rationale: str
    blueprint_hint: str

class DetectedAssets(BaseModel):
    has_readme: bool = False
    has_architecture_doc: bool = False
    has_tests: bool = False
    has_ci_cd: bool = False
    has_docker: bool = False
    has_pinned_deps: bool = False
    has_license: bool = False

class GitHubAuditResponse(BaseModel):
    owner: str
    repo: str
    html_url: str
    language: str
    stars: int = 0
    forks: int = 0
    total_files: int = 0
    assets: DetectedAssets
    detected_files: Dict[str, List[str]] = Field(default_factory=dict)
    overall_score: int
    letter_grade: str
    test_score: int
    architecture_score: int
    documentation_score: int
    devops_score: int
    recruiter_impression: str
    identified_strengths: List[str]
    critical_gaps: List[str]
    recommended_pull_requests: List[RecommendedPullRequest]
