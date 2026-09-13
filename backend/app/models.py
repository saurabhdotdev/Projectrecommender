import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=False)
    domain = Column(String(100), index=True, nullable=False)
    subdomain = Column(String(100), nullable=False)
    difficulty = Column(String(50), index=True, nullable=False)  # Beginner, Intermediate, Advanced
    
    # Serialized JSON fields
    required_skills_json = Column(Text, nullable=False, default="[]")
    skill_importance_json = Column(Text, nullable=False, default="{}")
    programming_languages_json = Column(Text, nullable=False, default="[]")
    frameworks_json = Column(Text, nullable=False, default="[]")
    tools_json = Column(Text, nullable=False, default="[]")
    prerequisites_json = Column(Text, nullable=False, default="[]")
    career_paths_json = Column(Text, nullable=False, default="[]")
    learning_outcomes_json = Column(Text, nullable=False, default="[]")

    estimated_duration = Column(Float, nullable=False, default=4.0)  # in weeks
    dataset_available = Column(Boolean, default=False)
    dataset_source = Column(String(255), default="")
    project_type = Column(String(100), default="Applied Project")
    resume_value = Column(Float, default=8.0)  # 1 to 10
    originality_score = Column(Float, default=8.0)  # 1 to 10

    # Helper properties for JSON de-serialization
    @property
    def required_skills(self):
        return json.loads(self.required_skills_json) if self.required_skills_json else []

    @property
    def skill_importance(self):
        return json.loads(self.skill_importance_json) if self.skill_importance_json else {}

    @property
    def programming_languages(self):
        return json.loads(self.programming_languages_json) if self.programming_languages_json else []

    @property
    def frameworks(self):
        return json.loads(self.frameworks_json) if self.frameworks_json else []

    @property
    def tools(self):
        return json.loads(self.tools_json) if self.tools_json else []

    @property
    def prerequisites(self):
        return json.loads(self.prerequisites_json) if self.prerequisites_json else []

    @property
    def career_paths(self):
        return json.loads(self.career_paths_json) if self.career_paths_json else []

    @property
    def learning_outcomes(self):
        return json.loads(self.learning_outcomes_json) if self.learning_outcomes_json else []

    def to_dict(self):
        return {
            "project_id": self.project_id,
            "title": self.title,
            "description": self.description,
            "domain": self.domain,
            "subdomain": self.subdomain,
            "difficulty": self.difficulty,
            "required_skills": self.required_skills,
            "skill_importance": self.skill_importance,
            "programming_languages": self.programming_languages,
            "frameworks": self.frameworks,
            "tools": self.tools,
            "prerequisites": self.prerequisites,
            "estimated_duration": self.estimated_duration,
            "dataset_available": self.dataset_available,
            "dataset_source": self.dataset_source,
            "project_type": self.project_type,
            "career_paths": self.career_paths,
            "resume_value": self.resume_value,
            "originality_score": self.originality_score,
            "learning_outcomes": self.learning_outcomes,
        }


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(64), unique=True, index=True, nullable=False)
    degree = Column(String(100), default="Computer Science")
    year = Column(String(50), default="2nd year")
    experience_level = Column(String(50), default="Intermediate")
    
    # Serialized JSON fields
    skills_json = Column(Text, nullable=False, default="[]")
    skill_proficiency_json = Column(Text, nullable=False, default="{}")
    interests_json = Column(Text, nullable=False, default="[]")
    preferred_technologies_json = Column(Text, nullable=False, default="[]")
    past_projects_json = Column(Text, nullable=False, default="[]")

    career_goal = Column(String(100), default="Internship")
    preferred_language = Column(String(50), default="Python")
    preferred_difficulty = Column(String(50), default="Intermediate")
    available_time_weeks = Column(Float, default=4.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def skills(self):
        return json.loads(self.skills_json) if self.skills_json else []

    @property
    def skill_proficiency(self):
        return json.loads(self.skill_proficiency_json) if self.skill_proficiency_json else {}

    @property
    def interests(self):
        return json.loads(self.interests_json) if self.interests_json else []

    @property
    def preferred_technologies(self):
        return json.loads(self.preferred_technologies_json) if self.preferred_technologies_json else []

    @property
    def past_projects(self):
        return json.loads(self.past_projects_json) if self.past_projects_json else []

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "degree": self.degree,
            "year": self.year,
            "experience_level": self.experience_level,
            "skills": self.skills,
            "skill_proficiency": self.skill_proficiency,
            "interests": self.interests,
            "preferred_technologies": self.preferred_technologies,
            "career_goal": self.career_goal,
            "preferred_language": self.preferred_language,
            "preferred_difficulty": self.preferred_difficulty,
            "available_time_weeks": self.available_time_weeks,
            "past_projects": self.past_projects,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(64), index=True, nullable=False)
    project_id = Column(String(64), index=True, nullable=False)
    event_type = Column(String(50), nullable=False)  # viewed, bookmarked, started, completed, abandoned, rated, accepted, rejected
    rating = Column(Float, nullable=True)  # 1 to 5 stars if rated
    feedback_notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class User(Base):
    """Registered user account for persistent session & project tracking."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False, default="")
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    user_projects = relationship("UserProject", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserProject(Base):
    """Tracks which projects a user has started/is working on/completed."""
    __tablename__ = "user_projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(64), nullable=False, index=True)
    project_title = Column(String(255), nullable=False, default="")
    project_domain = Column(String(100), nullable=False, default="")
    project_difficulty = Column(String(50), nullable=False, default="")
    project_duration = Column(Float, nullable=False, default=4.0)
    status = Column(String(30), nullable=False, default="started")  # started, in_progress, completed, paused
    progress_notes = Column(Text, nullable=True)
    completed_tasks_json = Column(Text, nullable=False, default="[]")
    github_url = Column(String(500), nullable=False, default="")
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Helper property for completed tasks
    @property
    def completed_tasks(self):
        return json.loads(self.completed_tasks_json) if self.completed_tasks_json else []

    # Relationship
    user = relationship("User", back_populates="user_projects")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "project_title": self.project_title,
            "project_domain": self.project_domain,
            "project_difficulty": self.project_difficulty,
            "project_duration": self.project_duration,
            "status": self.status,
            "progress_notes": self.progress_notes,
            "completed_tasks": self.completed_tasks,
            "github_url": self.github_url or "",
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

