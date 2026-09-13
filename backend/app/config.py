import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "projectforge.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "ProjectForge"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

    # Groq LLM API Configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    
    # Default Ranking Weights
    WEIGHT_SKILL_COMPATIBILITY: float = 0.30
    WEIGHT_INTEREST_MATCH: float = 0.20
    WEIGHT_CAREER_GOAL_MATCH: float = 0.15
    WEIGHT_DIFFICULTY_FIT: float = 0.10
    WEIGHT_TIME_FEASIBILITY: float = 0.10
    WEIGHT_TECH_PREFERENCE: float = 0.05
    WEIGHT_LEARNING_VALUE: float = 0.05
    WEIGHT_RESUME_RELEVANCE: float = 0.05
    WEIGHT_PAST_PROJECT_PENALTY: float = 0.15

    # MMR Diversity Parameter
    DEFAULT_MMR_LAMBDA: float = 0.70

    class Config:
        case_sensitive = True

settings = Settings()
