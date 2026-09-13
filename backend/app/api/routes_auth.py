import json
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from ..database import get_db
from ..models import User, UserProject, Project, UserInteraction
from ..schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    AuthResponse,
    UserProjectCreate,
    UserProjectUpdate,
    UserProjectResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication & Workspace"])

SECRET_KEY = "projectforge-secure-jwt-key-for-local-and-cloud"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, hashed = hashed_password.split("$", 1)
        return hashlib.sha256(f"{salt}{plain_password}".encode("utf-8")).hexdigest() == hashed
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header."
        )
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user

def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None
    return None


# ── Auth Endpoints ────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if not req.password or len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in.")

    full_name_val = (req.full_name or "").strip() or email_clean.split("@")[0].capitalize()
    hashed = hash_password(req.password)

    user = User(
        email=email_clean,
        full_name=full_name_val,
        hashed_password=hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})

    return {
        "user": user.to_dict(),
        "token": token,
        "message": f"Account successfully created! Welcome, {user.full_name}."
    }


@router.post("/login", response_model=AuthResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    token = create_access_token({"sub": str(user.id), "email": user.email})

    return {
        "user": user.to_dict(),
        "token": token,
        "message": f"Welcome back, {user.full_name}!"
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()


# ── Workspace / User Projects Endpoints ───────────────────────────────────────

@router.get("/projects", response_model=List[UserProjectResponse])
def get_user_projects(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all projects saved or started by the authenticated user."""
    query = db.query(UserProject).filter(UserProject.user_id == current_user.id)
    if status:
        query = query.filter(UserProject.status == status)
    projects = query.order_by(UserProject.updated_at.desc()).all()
    return [p.to_dict() for p in projects]


@router.post("/projects", response_model=UserProjectResponse)
def add_or_update_user_project(
    req: UserProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save or start a project for the authenticated user."""
    # Look up project info from catalog if available
    proj = db.query(Project).filter(Project.project_id == req.project_id).first()
    title = proj.title if proj else req.project_id
    domain = proj.domain if proj else "General"
    difficulty = proj.difficulty if proj else "Intermediate"
    duration = float(proj.estimated_duration) if proj else 4.0

    existing = db.query(UserProject).filter(
        UserProject.user_id == current_user.id,
        UserProject.project_id == req.project_id
    ).first()

    status_val = req.status or "started"

    if existing:
        existing.status = status_val
        if req.progress_notes is not None:
            existing.progress_notes = req.progress_notes
        if req.completed_tasks is not None:
            existing.completed_tasks_json = json.dumps(req.completed_tasks)
        if req.github_url is not None:
            existing.github_url = req.github_url
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        target_obj = existing
    else:
        new_up = UserProject(
            user_id=current_user.id,
            project_id=req.project_id,
            project_title=title,
            project_domain=domain,
            project_difficulty=difficulty,
            project_duration=duration,
            status=status_val,
            progress_notes=req.progress_notes,
            completed_tasks_json=json.dumps(req.completed_tasks) if req.completed_tasks else "[]",
            github_url=req.github_url or ""
        )
        db.add(new_up)
        db.commit()
        db.refresh(new_up)
        target_obj = new_up

    # Log interaction event
    try:
        interaction = UserInteraction(
            student_id=str(current_user.id),
            project_id=req.project_id,
            event_type=status_val,
            feedback_notes=req.progress_notes
        )
        db.add(interaction)
        db.commit()
    except Exception:
        pass

    return target_obj.to_dict()


@router.patch("/projects/{project_id}", response_model=UserProjectResponse)
def update_user_project_status(
    project_id: str,
    req: UserProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update status (started, in_progress, completed, saved), completed_tasks, github_url, or notes."""
    up = db.query(UserProject).filter(
        UserProject.user_id == current_user.id,
        UserProject.project_id == project_id
    ).first()
    if not up:
        raise HTTPException(status_code=404, detail="Project not found in user workspace.")

    if req.status is not None:
        up.status = req.status
    if req.progress_notes is not None:
        up.progress_notes = req.progress_notes
    if req.completed_tasks is not None:
        up.completed_tasks_json = json.dumps(req.completed_tasks)
    if req.github_url is not None:
        up.github_url = req.github_url
    up.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(up)
    return up.to_dict()


@router.delete("/projects/{project_id}")
def remove_user_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a project from the user's workspace."""
    up = db.query(UserProject).filter(
        UserProject.user_id == current_user.id,
        UserProject.project_id == project_id
    ).first()
    if not up:
        raise HTTPException(status_code=404, detail="Project not found in workspace.")

    db.delete(up)
    db.commit()
    return {"status": "removed", "project_id": project_id}


@router.post("/projects/sync", response_model=List[UserProjectResponse])
def sync_local_projects(
    local_projects: List[UserProjectCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync projects stored locally while guest into user account upon sign in."""
    for lp in local_projects:
        existing = db.query(UserProject).filter(
            UserProject.user_id == current_user.id,
            UserProject.project_id == lp.project_id
        ).first()
        if not existing:
            proj = db.query(Project).filter(Project.project_id == lp.project_id).first()
            new_up = UserProject(
                user_id=current_user.id,
                project_id=lp.project_id,
                project_title=proj.title if proj else lp.project_id,
                project_domain=proj.domain if proj else "General",
                project_difficulty=proj.difficulty if proj else "Intermediate",
                project_duration=float(proj.estimated_duration) if proj else 4.0,
                status=lp.status or "started",
                progress_notes=lp.progress_notes,
                completed_tasks_json=json.dumps(lp.completed_tasks) if lp.completed_tasks else "[]",
                github_url=lp.github_url or ""
            )
            db.add(new_up)
            db.commit()
        else:
            if lp.completed_tasks:
                current_completed = existing.completed_tasks
                merged = list(set(current_completed + lp.completed_tasks))
                existing.completed_tasks_json = json.dumps(merged)
            if lp.github_url and not existing.github_url:
                existing.github_url = lp.github_url
            db.commit()

    all_projects = db.query(UserProject).filter(UserProject.user_id == current_user.id).order_by(UserProject.updated_at.desc()).all()
    return [p.to_dict() for p in all_projects]
