from typing import List, Dict, Any, Optional, Union
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from ..database import get_db
from ..models import Project
from ..schemas import StudentProfileSchema
from ..services.groq_service import (
    chat_advisor,
    generate_project_ai_insights,
    generate_resume_interview_kit,
    evaluate_mock_interview_answer,
    generate_mock_interview_summary
)

router = APIRouter(prefix="", tags=["AI & Advisor"])

class ChatMessageItem(BaseModel):
    role: str = "user"  # "user" or "assistant"
    content: str

class ChatAdvisorRequest(BaseModel):
    messages: List[ChatMessageItem]
    current_profile: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ChatAdvisorResponse(BaseModel):
    reply: str
    profile_updates: Dict[str, Any] = Field(default_factory=dict)
    suggested_chips: List[str] = Field(default_factory=list)
    vetted_summary: Optional[str] = ""
    ready_to_recommend: bool = False
    model_used: Optional[str] = ""

class ProjectPitchRequest(BaseModel):
    project_id: str
    student_profile: StudentProfileSchema

class InterviewQuestionItem(BaseModel):
    question: str
    what_interviewers_look_for: str

class ProjectAIInsightsResponse(BaseModel):
    project_id: str
    tailored_pitch: str
    why_it_matters_for_student: str
    learning_curve_tips: List[str]
    resume_bullet_draft: str
    interview_talking_points: List[InterviewQuestionItem]

class ResumeInterviewKitRequest(BaseModel):
    project_id: str
    student_profile: StudentProfileSchema

class StarBulletItem(BaseModel):
    bullet: str
    situation: Optional[str] = ""
    task: Optional[str] = ""
    action: Optional[str] = ""
    result: Optional[str] = ""

class InDepthInterviewQuestion(BaseModel):
    question: str
    category: str
    model_answer: str
    key_tradeoffs: Union[str, List[str]] = ""
    gotchas_to_avoid: Union[str, List[str]] = ""

class ResumeInterviewKitResponse(BaseModel):
    project_id: str
    project_title: str
    domain: str
    elevator_pitch: str
    star_bullets: List[StarBulletItem]
    interview_questions: List[InDepthInterviewQuestion]

class MockInterviewEvalRequest(BaseModel):
    project_id: Optional[str] = ""
    project_title: str
    project_domain: Optional[str] = "Engineering"
    required_skills: Optional[List[str]] = Field(default_factory=list)
    question: str
    category: str = "System Architecture"
    model_answer: str = ""
    key_tradeoffs: Union[str, List[str]] = ""
    student_answer: str
    interviewer_style: str = "bar_raiser"
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class MockInterviewEvalResponse(BaseModel):
    overall_score: int
    star_score: int
    technical_depth_score: int
    clarity_score: int
    feedback: str
    strengths: List[str]
    improvements: List[str]
    exemplar_revision: str
    follow_up_question: Optional[str] = ""

class MockInterviewRoundResult(BaseModel):
    category: str
    question: str
    student_answer: str
    overall_score: int
    feedback: str

class MockInterviewSummaryRequest(BaseModel):
    project_title: str
    evaluations: List[MockInterviewRoundResult]

class MockInterviewSummaryResponse(BaseModel):
    final_decision: str
    average_score: float
    overall_feedback: str
    key_takeaways: List[str]

@router.post("/ai/chat-advisor", response_model=ChatAdvisorResponse)
def post_chat_advisor(req: ChatAdvisorRequest):
    """
    Conversational AI advisor to vet student interest, refine preferences,
    and dynamically build their profile.
    """
    history = [m.model_dump() for m in req.messages]
    res = chat_advisor(messages=history, current_profile=req.current_profile)
    return res

@router.post("/ai/project-insights", response_model=ProjectAIInsightsResponse)
def post_project_insights(req: ProjectPitchRequest, db: Session = Depends(get_db)):
    """
    Generates personalized pitch, resume bullet draft, and technical interview talking points
    for a specific project and student combination.
    """
    proj = db.query(Project).filter(Project.project_id == req.project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{req.project_id}' not found.")
    
    insights = generate_project_ai_insights(proj.to_dict(), req.student_profile.model_dump())
    
    return {
        "project_id": proj.project_id,
        "tailored_pitch": insights.get("tailored_pitch", ""),
        "why_it_matters_for_student": insights.get("why_it_matters_for_student", ""),
        "learning_curve_tips": insights.get("learning_curve_tips", []),
        "resume_bullet_draft": insights.get("resume_bullet_draft", ""),
        "interview_talking_points": insights.get("interview_talking_points", [])
    }

@router.post("/ai/resume-interview-kit", response_model=ResumeInterviewKitResponse)
def post_resume_interview_kit(req: ResumeInterviewKitRequest, db: Session = Depends(get_db)):
    """
    Generates a full STAR bullet kit and 5 in-depth technical interview questions with model answers.
    """
    proj = db.query(Project).filter(Project.project_id == req.project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{req.project_id}' not found.")
    
    kit = generate_resume_interview_kit(proj.to_dict(), req.student_profile.model_dump())
    
    return {
        "project_id": proj.project_id,
        "project_title": kit.get("project_title", proj.title),
        "domain": kit.get("domain", proj.domain),
        "elevator_pitch": kit.get("elevator_pitch", ""),
        "star_bullets": kit.get("star_bullets", []),
        "interview_questions": kit.get("interview_questions", [])
    }

@router.post("/ai/mock-interview/evaluate", response_model=MockInterviewEvalResponse)
def post_mock_interview_evaluate(req: MockInterviewEvalRequest, db: Session = Depends(get_db)):
    """
    Evaluates a candidate's answer during a mock technical interview round.
    Provides STAR score, technical depth score, clarity score, actionable coaching, and exemplar revision.
    """
    project_dict = {
        "title": req.project_title,
        "domain": req.project_domain,
        "required_skills": req.required_skills
    }
    if req.project_id:
        proj = db.query(Project).filter(Project.project_id == req.project_id).first()
        if proj:
            project_dict = proj.to_dict()

    tradeoffs = req.key_tradeoffs
    if isinstance(tradeoffs, list):
        tradeoffs = "; ".join(str(x) for x in tradeoffs)

    eval_result = evaluate_mock_interview_answer(
        project=project_dict,
        question=req.question,
        category=req.category,
        model_answer=req.model_answer,
        key_tradeoffs=tradeoffs,
        student_answer=req.student_answer,
        interviewer_style=req.interviewer_style,
        history=req.history
    )
    return eval_result

@router.post("/ai/mock-interview/summary", response_model=MockInterviewSummaryResponse)
def post_mock_interview_summary(req: MockInterviewSummaryRequest):
    """
    Synthesizes multi-round interview results into an executive Bar Raiser hiring decision and scorecard.
    """
    evals = [e.model_dump() for e in req.evaluations]
    return generate_mock_interview_summary(req.project_title, evals)
