import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import StudentProfile
from ..schemas import StudentProfileSchema
from ..engine.taxonomy import normalize_skill_list
from ..services.resume_parser import extract_text_from_pdf, parse_resume_content

router = APIRouter(prefix="/students", tags=["Students"])

class ResumeTextRequest(BaseModel):
    raw_text: str

@router.post("/parse-resume")
async def parse_resume_file_or_form(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None)
):
    """Parses an uploaded PDF resume or form-submitted text to auto-fill student profile."""
    text_content = ""
    if file:
        content_bytes = await file.read()
        if file.filename and file.filename.lower().endswith(".pdf"):
            try:
                text_content = extract_text_from_pdf(content_bytes)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {str(e)}")
        else:
            try:
                text_content = content_bytes.decode("utf-8", errors="ignore")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    elif raw_text:
        text_content = raw_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please upload a PDF file or provide text.")

    if not text_content.strip():
        raise HTTPException(status_code=400, detail="No readable text found in input.")

    return parse_resume_content(text_content)


@router.post("/parse-resume-text")
def parse_resume_text(req: ResumeTextRequest):
    """Parses pasted resume or LinkedIn text (JSON payload) to auto-fill student profile."""
    if not req.raw_text or not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    return parse_resume_content(req.raw_text.strip())

@router.post("/profile", response_model=StudentProfileSchema)
def save_student_profile(profile_data: StudentProfileSchema, db: Session = Depends(get_db)):
    student_id = profile_data.student_id or "student_default"
    existing = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()

    norm_skills = normalize_skill_list(profile_data.skills)

    if existing:
        existing.degree = profile_data.degree
        existing.year = profile_data.year
        existing.experience_level = profile_data.experience_level
        existing.skills_json = json.dumps(norm_skills)
        existing.skill_proficiency_json = json.dumps(profile_data.skill_proficiency)
        existing.interests_json = json.dumps(profile_data.interests)
        existing.preferred_technologies_json = json.dumps(profile_data.preferred_technologies)
        existing.career_goal = profile_data.career_goal
        existing.preferred_language = profile_data.preferred_language or "Python"
        existing.preferred_difficulty = profile_data.preferred_difficulty or "Intermediate"
        existing.available_time_weeks = profile_data.available_time_weeks
        existing.past_projects_json = json.dumps(profile_data.past_projects)
        db.commit()
        db.refresh(existing)
        return existing.to_dict()
    else:
        new_prof = StudentProfile(
            student_id=student_id,
            degree=profile_data.degree,
            year=profile_data.year,
            experience_level=profile_data.experience_level,
            skills_json=json.dumps(norm_skills),
            skill_proficiency_json=json.dumps(profile_data.skill_proficiency),
            interests_json=json.dumps(profile_data.interests),
            preferred_technologies_json=json.dumps(profile_data.preferred_technologies),
            career_goal=profile_data.career_goal,
            preferred_language=profile_data.preferred_language or "Python",
            preferred_difficulty=profile_data.preferred_difficulty or "Intermediate",
            available_time_weeks=profile_data.available_time_weeks,
            past_projects_json=json.dumps(profile_data.past_projects)
        )
        db.add(new_prof)
        db.commit()
        db.refresh(new_prof)
        return new_prof.to_dict()

@router.get("/profile/{student_id}", response_model=StudentProfileSchema)
def get_student_profile(student_id: str, db: Session = Depends(get_db)):
    prof = db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail=f"Student profile '{student_id}' not found.")
    return prof.to_dict()
