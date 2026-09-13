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
                "title": f"Foundation & Tooling Setup ({top_missing})",
                "focus": f"Master prerequisite technologies and initialize repository structure.",
                "tasks": [
                    f"Complete hands-on crash tutorials for missing technologies: {top_missing}.",
                    f"Set up development environment with virtual environment and Git repository.",
                    f"Acquire and explore project dataset: {project.get('dataset_source', 'Benchmark data')}.",
                    "Perform exploratory data analysis (EDA) and inspect schema invariants."
                ],
                "deliverables": f"Working dev environment + baseline exploration notebook + initial Git commit.",
                "skills_addressed": missing_names[:2]
            })
            note = f"Week 1 is customized to rapidly onboard you onto {top_missing}."
        else:
            milestones.append({
                "week_number": 1,
                "title": "Architecture Design & Data Pipeline",
                "focus": "Leverage existing skill mastery to rapidly architect data pipelines and core schemas.",
                "tasks": [
                    "Design system modular architecture and database/feature schema.",
                    f"Ingest and validate dataset from {project.get('dataset_source', 'Benchmark data')}.",
                    "Implement automated preprocessing, cleaning, and transformation pipelines.",
                    "Establish unit testing framework and continuous integration workflow."
                ],
                "deliverables": "End-to-end data ingestion pipeline with automated unit tests.",
                "skills_addressed": project.get("required_skills", [])[:2]
            })
            note = "Zero prerequisite blockers! Week 1 immediately starts with core architecture."

        # Intermediate weeks (Model / Core Feature Engineering / Backend)
        if weeks_count >= 3:
            milestones.append({
                "week_number": 2,
                "title": "Core Algorithm & Prototype Implementation",
                "focus": f"Build functional baseline for {project.get('subdomain', 'the system')}.",
                "tasks": [
                    "Develop baseline model or core business logic components.",
                    "Implement feature engineering or state management workflows.",
                    "Establish validation metrics (e.g. F1, ROC-AUC, latency, throughput).",
                    "Iterate and benchmark against naive baseline."
                ],
                "deliverables": "Working prototype demonstrating verified baseline performance.",
                "skills_addressed": project.get("required_skills", [])[1:3]
            })

        if weeks_count >= 4:
            # Week 3: Advanced Optimization & Interpretability / API
            milestones.append({
                "week_number": 3,
                "title": "Advanced Optimization & System Integration",
                "focus": "Refine performance, mitigate edge cases, and integrate services.",
                "tasks": [
                    "Perform hyperparameter optimization or structural refactoring.",
                    "Implement model interpretability (SHAP/LIME) or security middleware.",
                    "Expose modular REST/FastAPI endpoints for inference or client querying.",
                    "Conduct slice-based error analysis on failure modes."
                ],
                "deliverables": "Robust, high-performing service layer with verified error handling.",
                "skills_addressed": project.get("required_skills", [])[2:4]
            })

        if weeks_count >= 5:
            milestones.append({
                "week_number": 4,
                "title": "Full Stack / Client Integration & Load Testing",
                "focus": "Connect client interface and validate throughput under load.",
                "tasks": [
                    "Build user interface or dashboard visualization layer.",
                    "Simulate concurrent user requests and identify performance bottlenecks.",
                    "Implement caching (e.g. Redis) and query optimization."
                ],
                "deliverables": "Interactive client interface connected to backend service.",
                "skills_addressed": project.get("tools", [])
            })

        # Final Week: Packaging, Deployment, Portfolio & Documentation
        final_week_num = weeks_count
        milestones.append({
            "week_number": final_week_num,
            "title": "Containerization, Deployment & Portfolio Polish",
            "focus": "Package the project into a resume-ready artifact with live demo.",
            "tasks": [
                "Dockerize application with multi-stage build and minimal attack surface.",
                "Deploy service or documentation to cloud/portfolio hosting.",
                "Write comprehensive GitHub README with architecture diagram, benchmarks, and quickstart.",
                "Record a 2-minute video walkthrough highlighting business impact and technical challenges."
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
