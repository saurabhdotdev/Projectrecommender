import json
import uuid
import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Project, User, UserProject
from ..schemas import (
    ProjectSchema,
    SkillGapResponse,
    RoadmapResponse,
    GenerateIdeasRequest,
    GenerateIdeasResponse,
    CustomProjectArchitectRequest,
    CustomProjectSaveRequest,
    GitHubAuditRequest,
    GitHubAuditResponse
)
from ..engine.skill_gap import SkillGapEngine
from ..engine.roadmap_generator import RoadmapGenerator
from ..services.groq_service import generate_unlimited_project_ideas
from ..services.scaffold_generator import generate_project_scaffold_zip
from ..services.project_architect import architect_custom_project
from ..services.github_audit_service import fetch_user_repositories, audit_github_repository
from .routes_recommend import invalidate_recommender_cache
from .routes_auth import get_optional_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectSchema])
def list_projects(
    domain: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    if domain and isinstance(domain, str):
        query = query.filter(Project.domain.ilike(f"%{domain}%"))
    if difficulty and isinstance(difficulty, str):
        query = query.filter(Project.difficulty.ilike(f"%{difficulty}%"))
    if search and isinstance(search, str):
        query = query.filter(
            (Project.title.ilike(f"%{search}%")) |
            (Project.description.ilike(f"%{search}%")) |
            (Project.domain.ilike(f"%{search}%")) |
            (Project.subdomain.ilike(f"%{search}%"))
        )
    
    projects = query.offset(offset).limit(limit).all()
    return [p.to_dict() for p in projects]

@router.get("/meta/stats")
def get_project_stats(db: Session = Depends(get_db)):
    """Returns real-time project catalog statistics."""
    total = db.query(Project).count()
    return {
        "total_projects": total,
        "is_unlimited": True,
        "status": "online"
    }

@router.post("/generate-ideas", response_model=GenerateIdeasResponse)
def post_generate_ideas(
    request: GenerateIdeasRequest,
    db: Session = Depends(get_db)
):
    """
    On-demand AI Project Generator: Synthesizes unlimited custom, production-grade project blueprints.
    Optionally persists them directly to the database to continuously expand the catalog.
    """
    profile_dict = request.student_profile.model_dump() if request.student_profile else {}
    
    raw_blueprints = generate_unlimited_project_ideas(
        student_profile=profile_dict,
        topic_or_prompt=request.prompt,
        domain=request.domain,
        difficulty=request.difficulty,
        count=request.count
    )
    
    created_schemas: List[Dict[str, Any]] = []
    
    for bp in raw_blueprints:
        unique_suffix = f"{int(time.time())}-{uuid.uuid4().hex[:5]}"
        pid = f"proj-gen-{unique_suffix}"
        
        # Prepare sanitized blueprint dictionary
        clean_bp = {
            "project_id": pid,
            "title": bp.get("title", f"AI Innovation Blueprint {unique_suffix}"),
            "description": bp.get("description", "Comprehensive engineering project blueprint synthesized on-demand."),
            "domain": bp.get("domain", "Engineering"),
            "subdomain": bp.get("subdomain", "Advanced Technology"),
            "difficulty": bp.get("difficulty", "Intermediate"),
            "required_skills": bp.get("required_skills", ["Python"]),
            "skill_importance": bp.get("skill_importance", {"Python": 1.0}),
            "programming_languages": bp.get("programming_languages", ["Python"]),
            "frameworks": bp.get("frameworks", []),
            "tools": bp.get("tools", ["Docker", "Git"]),
            "prerequisites": bp.get("prerequisites", ["Core Programming"]),
            "estimated_duration": float(bp.get("estimated_duration", 4.0)),
            "dataset_available": bool(bp.get("dataset_available", True)),
            "dataset_source": bp.get("dataset_source", "Public Repository / Synthetic Simulator"),
            "project_type": bp.get("project_type", "Applied Engineering Blueprint"),
            "career_paths": bp.get("career_paths", ["Software Engineer"]),
            "resume_value": float(bp.get("resume_value", 9.2)),
            "originality_score": float(bp.get("originality_score", 9.2)),
            "learning_outcomes": bp.get("learning_outcomes", [
                "Constructed modular, scalable system architecture",
                "Built and evaluated core engineering algorithms"
            ]),
        }
        
        if request.save_to_catalog:
            db_project = Project(
                project_id=clean_bp["project_id"],
                title=clean_bp["title"],
                description=clean_bp["description"],
                domain=clean_bp["domain"],
                subdomain=clean_bp["subdomain"],
                difficulty=clean_bp["difficulty"],
                required_skills_json=json.dumps(clean_bp["required_skills"]),
                skill_importance_json=json.dumps(clean_bp["skill_importance"]),
                programming_languages_json=json.dumps(clean_bp["programming_languages"]),
                frameworks_json=json.dumps(clean_bp["frameworks"]),
                tools_json=json.dumps(clean_bp["tools"]),
                prerequisites_json=json.dumps(clean_bp["prerequisites"]),
                career_paths_json=json.dumps(clean_bp["career_paths"]),
                learning_outcomes_json=json.dumps(clean_bp["learning_outcomes"]),
                estimated_duration=clean_bp["estimated_duration"],
                dataset_available=clean_bp["dataset_available"],
                dataset_source=clean_bp["dataset_source"],
                project_type=clean_bp["project_type"],
                resume_value=clean_bp["resume_value"],
                originality_score=clean_bp["originality_score"],
            )
            db.add(db_project)
            
        created_schemas.append(clean_bp)
        
    if request.save_to_catalog and created_schemas:
        try:
            db.commit()
            invalidate_recommender_cache(db)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error while saving projects: {e}")
            
    total_catalog = db.query(Project).count()
    
    return {
        "generated_projects": created_schemas,
        "total_catalog_size": total_catalog,
        "message": f"Successfully generated {len(created_schemas)} novel project blueprint(s) on-demand!"
    }

@router.post("/custom/architect")
def post_architect_custom_project(
    request: CustomProjectArchitectRequest,
    db: Session = Depends(get_db)
):
    """
    Synthesizes a tailored project blueprint from a student's custom idea/prompt,
    produces 3 strategic AI customization recommendations, computes skill gap,
    and constructs a weekly roadmap.
    """
    try:
        blueprint = architect_custom_project(
            idea_prompt=request.idea_prompt,
            domain=request.domain,
            preferred_tech=request.preferred_tech,
            timeline_weeks=request.timeline_weeks,
            student_profile=request.student_profile
        )
        return blueprint
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Custom project architecting failed: {str(e)}")

@router.post("/custom/save")
def post_save_custom_project(
    request: CustomProjectSaveRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Saves a custom architected project into the database catalog,
    and optionally links it directly to the authenticated user's workspace.
    """
    proj_data = request.project
    if not proj_data or not proj_data.get("title"):
        raise HTTPException(status_code=400, detail="Invalid project data provided.")

    # Assign or preserve project_id
    project_id = proj_data.get("project_id")
    if not project_id or not project_id.startswith("custom_"):
        safe_slug = "".join(c for c in proj_data.get("title", "custom").lower() if c.isalnum() or c == " ").strip().replace(" ", "-")[:35]
        project_id = f"custom_{safe_slug}_{uuid.uuid4().hex[:6]}"
        proj_data["project_id"] = project_id

    # Format fields safely
    title = proj_data.get("title", "Custom Project")
    description = proj_data.get("description", "Tailored engineering project blueprint.")
    domain = proj_data.get("domain", "Engineering")
    subdomain = proj_data.get("subdomain", "Advanced Engineering")
    difficulty = proj_data.get("difficulty", "Intermediate")
    required_skills = proj_data.get("required_skills", ["Python"])
    skill_importance = proj_data.get("skill_importance", {s: round(1.0 / len(required_skills), 2) for s in required_skills})
    programming_languages = proj_data.get("programming_languages", ["Python"])
    frameworks = proj_data.get("frameworks", [])
    tools = proj_data.get("tools", ["Git", "Docker"])
    prerequisites = proj_data.get("prerequisites", ["Foundational Programming"])
    career_paths = proj_data.get("career_paths", ["Software Engineer"])
    learning_outcomes = proj_data.get("learning_outcomes", ["Designed and implemented custom system."])
    estimated_duration = float(proj_data.get("estimated_duration", 4.0))
    dataset_available = bool(proj_data.get("dataset_available", True))
    dataset_source = proj_data.get("dataset_source", "Curated Repository")
    project_type = proj_data.get("project_type", "Custom Engineered System")
    resume_value = float(proj_data.get("resume_value", 9.2))
    originality_score = float(proj_data.get("originality_score", 9.4))

    # Upsert project into catalog
    existing = db.query(Project).filter(Project.project_id == project_id).first()
    if existing:
        existing.title = title
        existing.description = description
        existing.domain = domain
        existing.subdomain = subdomain
        existing.difficulty = difficulty
        existing.required_skills_json = json.dumps(required_skills)
        existing.skill_importance_json = json.dumps(skill_importance)
        existing.programming_languages_json = json.dumps(programming_languages)
        existing.frameworks_json = json.dumps(frameworks)
        existing.tools_json = json.dumps(tools)
        existing.prerequisites_json = json.dumps(prerequisites)
        existing.career_paths_json = json.dumps(career_paths)
        existing.learning_outcomes_json = json.dumps(learning_outcomes)
        existing.estimated_duration = estimated_duration
        existing.dataset_available = dataset_available
        existing.dataset_source = dataset_source
        existing.project_type = project_type
        existing.resume_value = resume_value
        existing.originality_score = originality_score
    else:
        new_project = Project(
            project_id=project_id,
            title=title,
            description=description,
            domain=domain,
            subdomain=subdomain,
            difficulty=difficulty,
            required_skills_json=json.dumps(required_skills),
            skill_importance_json=json.dumps(skill_importance),
            programming_languages_json=json.dumps(programming_languages),
            frameworks_json=json.dumps(frameworks),
            tools_json=json.dumps(tools),
            prerequisites_json=json.dumps(prerequisites),
            career_paths_json=json.dumps(career_paths),
            learning_outcomes_json=json.dumps(learning_outcomes),
            estimated_duration=estimated_duration,
            dataset_available=dataset_available,
            dataset_source=dataset_source,
            project_type=project_type,
            resume_value=resume_value,
            originality_score=originality_score
        )
        db.add(new_project)

    # Link to authenticated user if requested and user exists
    workspace_saved = False
    if current_user and request.save_to_workspace:
        existing_user_proj = db.query(UserProject).filter(
            UserProject.user_id == current_user.id,
            UserProject.project_id == project_id
        ).first()
        if not existing_user_proj:
            user_proj = UserProject(
                user_id=current_user.id,
                project_id=project_id,
                project_title=title,
                project_domain=domain,
                project_difficulty=difficulty,
                project_duration=estimated_duration,
                status="started",
                progress_notes="Custom project architected and added to workspace."
            )
            db.add(user_proj)
        workspace_saved = True

    try:
        db.commit()
        invalidate_recommender_cache(db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit error: {e}")

    return {
        "project": proj_data,
        "saved": True,
        "saved_to_workspace": workspace_saved,
        "message": f"Project '{title}' successfully saved to catalog{' and added to workspace' if workspace_saved else ''}!"
    }

@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    return proj.to_dict()

@router.get("/{project_id}/skill-gap", response_model=SkillGapResponse)
def get_project_skill_gap(
    project_id: str,
    skills: Optional[str] = None,
    proficiency: Optional[str] = None,
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    
    student_skills = [s.strip() for s in skills.split(",")] if skills and isinstance(skills, str) else ["Python"]
    prof_dict = None
    if proficiency:
        try:
            prof_dict = json.loads(proficiency)
        except Exception:
            prof_dict = None
    gap = SkillGapEngine.analyze_gap(student_skills, proj.to_dict(), prof_dict)
    return gap

@router.get("/{project_id}/roadmap", response_model=RoadmapResponse)
def get_project_roadmap(
    project_id: str,
    skills: Optional[str] = None,
    weeks: float = 4.0,
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    
    student_skills = [s.strip() for s in skills.split(",")] if skills and isinstance(skills, str) else ["Python"]
    actual_weeks = float(weeks) if isinstance(weeks, (int, float)) else 4.0
    roadmap = RoadmapGenerator.generate_roadmap(student_skills, proj.to_dict(), actual_weeks)
    return roadmap

@router.get("/{project_id}/scaffold")
def get_project_scaffold(
    project_id: str,
    skills: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Generates and streams a downloadable zip file containing starter code, README, tests, and requirements."""
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    
    student_skills = [s.strip() for s in skills.split(",")] if skills and isinstance(skills, str) else ["Python"]
    zip_buffer = generate_project_scaffold_zip(proj.to_dict(), student_skills)
    
    safe_title = "".join(c for c in proj.title.lower() if c.isalnum() or c == " ").strip().replace(" ", "-")[:35]
    filename = f"ProjectForge-{safe_title}-starter.zip"
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/github/user/{username}/repos")
def get_user_github_repos(username: str):
    """
    Fetches the public repositories for a specified GitHub user.
    """
    return fetch_user_repositories(username)

@router.post("/github-audit", response_model=GitHubAuditResponse)
def post_github_audit(req: GitHubAuditRequest, db: Session = Depends(get_db)):
    """
    Performs an automated Staff Engineer Code Review and Production Readiness Audit on a GitHub repository.
    """
    proj_context = None
    if req.project_id:
        proj = db.query(Project).filter(Project.project_id == req.project_id).first()
        if proj:
            proj_context = proj.to_dict()
    elif req.project_title:
        proj_context = {"title": req.project_title}
        
    audit_result = audit_github_repository(req.github_url, proj_context)
    return audit_result
