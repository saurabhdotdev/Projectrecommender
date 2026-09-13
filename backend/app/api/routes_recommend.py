from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Project
from ..schemas import RecommendationRequest, RecommendationResponse
from ..engine.recommender import ProjectForgeRecommender

router = APIRouter(tags=["Recommendations"])

# Recommender instance cache
_recommender_instance: ProjectForgeRecommender = None

def invalidate_recommender_cache(db: Session = None):
    global _recommender_instance
    if db is not None:
        projects = [p.to_dict() for p in db.query(Project).all()]
        if projects:
            _recommender_instance = ProjectForgeRecommender(projects)
            return _recommender_instance
    _recommender_instance = None
    return None

def get_recommender(db: Session = Depends(get_db)) -> ProjectForgeRecommender:
    global _recommender_instance
    if _recommender_instance is None:
        projects = [p.to_dict() for p in db.query(Project).all()]
        if not projects:
            raise HTTPException(status_code=500, detail="Project database is empty. Please run database seeder.")
        _recommender_instance = ProjectForgeRecommender(projects)
    return _recommender_instance

@router.post("/recommend", response_model=RecommendationResponse)
def get_recommendations(
    request: RecommendationRequest,
    recommender: ProjectForgeRecommender = Depends(get_recommender)
):
    profile_dict = request.student_profile.model_dump()
    weights_dict = request.weights.model_dump() if request.weights else None
    
    result = recommender.recommend(
        student_profile=profile_dict,
        top_k=request.top_k,
        enable_diversity=request.enable_diversity,
        diversity_lambda=request.diversity_lambda,
        custom_weights=weights_dict
    )
    
    return result
