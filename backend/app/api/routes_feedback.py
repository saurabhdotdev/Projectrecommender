from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import UserInteraction, Project
from ..schemas import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["Feedback & Interactions"])

@router.post("", response_model=FeedbackResponse)
def log_user_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.project_id == feedback.project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{feedback.project_id}' not found.")

    interaction = UserInteraction(
        student_id=feedback.student_id,
        project_id=feedback.project_id,
        event_type=feedback.event_type.lower(),
        rating=feedback.rating,
        feedback_notes=feedback.feedback_notes
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    return {
        "status": "success",
        "message": f"Recorded '{feedback.event_type}' interaction for project '{feedback.project_id}'.",
        "interaction_id": interaction.id
    }

@router.get("/summary/{student_id}")
def get_user_interaction_summary(student_id: str, db: Session = Depends(get_db)):
    interactions = db.query(UserInteraction).filter(UserInteraction.student_id == student_id).all()
    return {
        "student_id": student_id,
        "total_interactions": len(interactions),
        "events": [
            {
                "project_id": i.project_id,
                "event_type": i.event_type,
                "rating": i.rating,
                "timestamp": i.timestamp.isoformat() if i.timestamp else None
            }
            for i in interactions
        ]
    }
