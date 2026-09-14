from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .models import Project
from .data.seed_db import run_data_quality_and_seed
from .api.routes_recommend import router as recommend_router, get_recommender
from .api.routes_projects import router as projects_router
from .api.routes_students import router as students_router
from .api.routes_feedback import router as feedback_router
from .api.routes_evaluation import router as eval_router
from .api.routes_ai import router as ai_router
from .api.routes_auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    # Check if database has projects; if not, seed it automatically
    db = SessionLocal()
    try:
        count = db.query(Project).count()
        if count == 0:
            print("[INFO] Database empty on startup. Running data quality and seeding pipeline...")
            run_data_quality_and_seed()
        else:
            print(f"[INFO] Database ready with {count} projects.")
        
        # Warm-up recommender cache
        get_recommender(db)
        print("[INFO] Recommender engine warmed up and ready.")
    finally:
        db.close()
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Student Project Recommendation & Skill-Gap System",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite default port 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(recommend_router, prefix=settings.API_V1_STR)
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(students_router, prefix=settings.API_V1_STR)
app.include_router(feedback_router, prefix=settings.API_V1_STR)
app.include_router(eval_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": "ProjectForge API",
        "status": "online",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": "ProjectForge API",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
