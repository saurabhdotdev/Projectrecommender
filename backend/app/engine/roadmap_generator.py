"""
Personalized Roadmap Generator for ProjectForge.
Generates adaptive, week-by-week learning and execution milestones
tailored to the student's specific missing skills and available schedule.
"""

from typing import Dict, List
from .skill_gap import SkillGapEngine

class RoadmapGenerator:
    @staticmethod
    def generate_roadmap(student_skills: List[str], project: Dict, available_weeks: float = 4.0) -> Dict:
        gap = SkillGapEngine.analyze_gap(student_skills, project)
        missing_skills = gap["missing_skills"]
        missing_names = [m["skill"] for m in missing_skills]
        
        weeks_count = max(2, int(round(min(available_weeks, project.get("estimated_duration", 4.0)))))
        milestones = []

        # Week 1: Adaptation based on whether prerequisites are missing
        if missing_skills:
            top_missing = ", ".join(missing_names[:2])
            milestones.append({
                "week_number": 1,
                "phase": "Phase 1: Environment & Prerequisite Foundation",
                "title": f"Foundation & Tooling Setup ({top_missing})",
                "focus": f"Master prerequisite technologies and initialize repository structure.",
                "target_files": ["README.md", ".gitignore", "requirements.txt", "notebooks/01_eda.ipynb"],
                "command_snippet": "git init && python -m venv venv && pip install -r requirements.txt",
                "tasks": [
                    f"Complete hands-on crash tutorials for missing technologies: {top_missing}.",
                    f"Set up development environment with virtual environment and Git repository.",
                    f"Acquire and explore project dataset: {project.get('dataset_source', 'Benchmark data')}.",
                    "Perform exploratory data analysis (EDA) and inspect schema invariants."
                ],
                "starter_code": """# setup_check.py
import sys, logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("setup_check")

def verify_environment():
    logger.info("Python version: %s", sys.version)
    assert sys.version_info >= (3, 10), "Python 3.10+ required"
    logger.info("Environment initialized successfully with 0 conflicts!")

if __name__ == "__main__":
    verify_environment()""",
                "acceptance_criteria": [
                    "Development environment and virtualenv functional with 0 dependency conflicts.",
                    "Exploratory data analysis notebook documents dataset distributions and null ratios.",
                    "Git repository initialized with clean .gitignore and baseline commit."
                ],
                "deliverables": f"Working dev environment + baseline exploration notebook + initial Git commit.",
                "skills_addressed": missing_names[:2]
            })
            note = f"Week 1 is customized to rapidly onboard you onto {top_missing}."
        else:
            milestones.append({
                "week_number": 1,
                "phase": "Phase 1: Architecture Inception & Data Pipeline",
                "title": "Architecture Design & Ingestion Pipeline",
                "focus": "Leverage existing skill mastery to rapidly architect data pipelines and core schemas.",
                "target_files": ["src/schemas.py", "src/ingest.py", "tests/test_ingest.py", "Makefile"],
                "command_snippet": "pytest tests/test_ingest.py -v",
                "tasks": [
                    "Design system modular architecture and database/feature schema.",
                    f"Ingest and validate dataset from {project.get('dataset_source', 'Benchmark data')}.",
                    "Implement automated preprocessing, cleaning, and transformation pipelines.",
                    "Establish unit testing framework and continuous integration workflow."
                ],
                "starter_code": """# src/schemas.py & src/ingest.py
from pydantic import BaseModel, Field
from typing import List
import datetime

class IngestRecord(BaseModel):
    record_id: str = Field(..., description="Unique record identifier")
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    payload: dict
    version: str = "1.0.0"

def ingest_batch(raw_records: List[dict]) -> List[IngestRecord]:
    \"\"\"Strictly validates and transforms incoming raw records.\"\"\"
    return [IngestRecord(**r) for r in raw_records]""",
                "acceptance_criteria": [
                    "Ingestion pipeline handles malformed data gracefully without runtime exceptions.",
                    "Strict Pydantic/dataclass schema validates all incoming record types.",
                    "Automated pytest test suite passes with 100% test success."
                ],
                "deliverables": "End-to-end data ingestion pipeline with automated unit tests.",
                "skills_addressed": project.get("required_skills", [])[:2]
            })
            note = "Zero prerequisite blockers! Week 1 immediately starts with core architecture."

        # Intermediate weeks (Model / Core Feature Engineering / Backend)
        if weeks_count >= 3:
            milestones.append({
                "week_number": 2,
                "phase": "Phase 2: Core Algorithm & Engine Logic",
                "title": "Core Algorithm & Prototype Implementation",
                "focus": f"Build functional baseline for {project.get('subdomain', 'the system')}.",
                "target_files": ["src/engine/core.py", "src/engine/pipeline.py", "tests/test_engine.py"],
                "command_snippet": "python -m pytest tests/test_engine.py --durations=3",
                "tasks": [
                    "Develop baseline model or core business logic components.",
                    "Implement feature engineering or state management workflows.",
                    "Establish validation metrics (e.g. F1, ROC-AUC, latency, throughput).",
                    "Iterate and benchmark against naive baseline."
                ],
                "starter_code": """# src/engine/core.py
from dataclasses import dataclass
from typing import Any, Dict

@dataclass
class EngineConfig:
    batch_size: int = 64
    timeout_ms: int = 45

class CoreEngine:
    def __init__(self, config: EngineConfig = None):
        self.config = config or EngineConfig()

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        \"\"\"Executes core algorithmic computation with deterministic invariants.\"\"\"
        return {"status": "success", "result": inputs, "latency_ms": 14.2}""",
                "acceptance_criteria": [
                    "Core algorithm executes deterministically and satisfies mathematical correctness invariants.",
                    "Baseline performance metrics recorded and logged for ablation studies.",
                    "Execution latency per inference/computation strictly meets target SLA (<50ms)."
                ],
                "deliverables": "Working prototype demonstrating verified baseline performance.",
                "skills_addressed": project.get("required_skills", [])[1:3]
            })

        if weeks_count >= 4:
            # Week 3: Advanced Optimization & Interpretability / API
            milestones.append({
                "week_number": 3,
                "phase": "Phase 3: API Layer & System Hardening",
                "title": "Advanced Optimization & System Integration",
                "focus": "Refine performance, mitigate edge cases, and integrate services.",
                "target_files": ["src/api/routes.py", "src/api/middleware.py", "tests/test_api.py"],
                "command_snippet": "uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload",
                "tasks": [
                    "Perform hyperparameter optimization or structural refactoring.",
                    "Implement model interpretability (SHAP/LIME) or security middleware.",
                    "Expose modular REST/FastAPI endpoints for inference or client querying.",
                    "Conduct slice-based error analysis on failure modes."
                ],
                "starter_code": """# src/api/routes.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Production Service API", version="1.0.0")

class InferenceRequest(BaseModel):
    query: str
    max_results: int = 10

@app.post("/api/v1/predict")
async def predict_endpoint(req: InferenceRequest):
    if not req.query.strip():
        raise HTTPException(status_code=422, detail="Query cannot be empty")
    return {"status": "ok", "prediction": "processed", "query": req.query}""",
                "acceptance_criteria": [
                    "REST API endpoints return OpenAPI-compliant JSON with HTTP 200/400/422 status codes.",
                    "Rate limiting middleware actively prevents token/request denial-of-service.",
                    "Integration test covers end-to-end round trip from HTTP request to engine output."
                ],
                "deliverables": "Robust, high-performing service layer with verified error handling.",
                "skills_addressed": project.get("required_skills", [])[2:4]
            })

        if weeks_count >= 5:
            milestones.append({
                "week_number": 4,
                "phase": "Phase 4: Client Interface & Load Benchmarking",
                "title": "Full Stack / Client Integration & Load Testing",
                "focus": "Connect client interface and validate throughput under load.",
                "target_files": ["client/src/App.jsx", "tests/locustfile.py", "docker-compose.yml"],
                "command_snippet": "locust -f tests/locustfile.py --headless -u 100 -r 10 -t 30s",
                "tasks": [
                    "Build user interface or dashboard visualization layer.",
                    "Simulate concurrent user requests and identify performance bottlenecks.",
                    "Implement caching (e.g. Redis) and query optimization."
                ],
                "starter_code": """# tests/locustfile.py
from locust import HttpUser, task, between

class StressTestUser(HttpUser):
    wait_time = between(0.1, 0.4)

    @task(3)
    def test_health(self):
        self.client.get("/healthz")

    @task(1)
    def test_predict(self):
        self.client.post("/api/v1/predict", json={"query": "benchmark", "max_results": 5})""",
                "acceptance_criteria": [
                    "Client interface provides real-time latency and progress feedback for users.",
                    "Load testing confirms throughput of at least 150 requests/sec with p95 < 80ms.",
                    "In-memory Redis cache hits reduce primary database load by >60%."
                ],
                "deliverables": "Interactive client interface connected to backend service.",
                "skills_addressed": project.get("tools", [])
            })

        # Final Week: Packaging, Deployment, Portfolio & Documentation
        final_week_num = weeks_count
        milestones.append({
            "week_number": final_week_num,
            "phase": f"Phase {final_week_num}: Packaging, CI/CD & Portfolio Showcase",
            "title": "Containerization, Deployment & Portfolio Polish",
            "focus": "Package the project into a resume-ready artifact with live demo.",
            "target_files": ["Dockerfile", ".github/workflows/ci.yml", "docs/ARCHITECTURE.md"],
            "command_snippet": "docker build -t app:latest . && docker run -p 8000:8000 app:latest",
            "tasks": [
                "Dockerize application with multi-stage build and minimal attack surface.",
                "Deploy service or documentation to cloud/portfolio hosting.",
                "Write comprehensive GitHub README with architecture diagram, benchmarks, and quickstart.",
                "Record a 2-minute video walkthrough highlighting business impact and technical challenges."
            ],
            "starter_code": """# Dockerfile - Multi-stage lightweight distroless build
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim as runner
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY src/ ./src/
ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]""",
            "acceptance_criteria": [
                "Multi-stage Docker image builds cleanly and runs locally via single command.",
                "GitHub Actions CI pipeline automatically tests every commit and PR.",
                "README contains live demo link, architecture diagram, and reproducible quickstart instructions."
            ],
            "deliverables": "Public GitHub repository with Docker setup, live demo link, and demo video.",
            "skills_addressed": ["Docker", "Git"] + project.get("tools", [])[:1]
        })

        return {
            "project_id": project.get("project_id", ""),
            "project_title": project.get("title", ""),
            "student_id": "student",
            "total_weeks": weeks_count,
            "milestones": milestones,
            "readiness_adjustment_note": note
        }
