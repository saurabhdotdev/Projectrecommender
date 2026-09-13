import json
import logging
import uuid
from typing import Dict, Any, List, Optional

from ..config import settings
from ..services.groq_service import get_groq_client
from ..engine.skill_gap import SkillGapEngine
from ..engine.roadmap_generator import RoadmapGenerator
from ..engine.taxonomy import normalize_skill_list

logger = logging.getLogger("projectforge.architect")

def architect_custom_project(
    idea_prompt: str,
    domain: Optional[str] = None,
    preferred_tech: Optional[List[str]] = None,
    timeline_weeks: float = 4.0,
    student_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Takes a raw user project concept/prompt and synthesizes a production-grade blueprint,
    generates 3 high-impact AI customization suggestions, computes skill gaps, and generates a weekly roadmap.
    """
    profile = student_profile or {}
    student_skills = profile.get("skills", ["Python"])
    
    client = get_groq_client()
    if not client:
        return fallback_architect_custom_project(idea_prompt, domain, preferred_tech, timeline_weeks, profile)

    prompt = f"""You are a Principal Engineering Architect & Senior Tech Lead.
A student wants to build their own custom project with the following concept:

Student Idea / Prompt:
"{idea_prompt}"

Target Domain (if selected): {domain or 'Auto-detect'}
Preferred Tech / Tools: {', '.join(preferred_tech or []) or 'Auto-recommend optimal modern stack'}
Timeline: {timeline_weeks} weeks
Student Degree / Background: {profile.get('degree', 'Engineering')} ({profile.get('year', 'Student')})
Student Existing Skills: {', '.join(student_skills)}

Your tasks:
1. Synthesize a production-grade, resume-worthy project blueprint adhering to the schema.
2. Formulate 3 strategic customization suggestions to elevate this from a basic school project to a senior-level portfolio piece:
   - "architecture": Specific architectural decoupling, async processing, caching, or pipeline improvement.
   - "security_production": Production reliability, security hardening, input validation, or error boundaries.
   - "resume_multiplier": An empirical benchmark, stress-test, or quantitative evaluation to cite on resumes.

Output ONLY a JSON object matching this exact schema:
{{
  "title": "Compelling, professional project title",
  "domain": "{domain or 'Detected Domain'}",
  "subdomain": "Specific subfield",
  "difficulty": "Beginner|Intermediate|Advanced",
  "description": "3-4 sentences detailing the core problem, system architecture, and real-world utility.",
  "required_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "skill_importance": {{
    "Skill 1": 0.30,
    "Skill 2": 0.25,
    "Skill 3": 0.20,
    "Skill 4": 0.15,
    "Skill 5": 0.10
  }},
  "programming_languages": ["Python", "..."],
  "frameworks": ["Framework 1", "..."],
  "tools": ["Docker", "Git", "..."],
  "prerequisites": ["Prereq 1", "Prereq 2"],
  "estimated_duration": {timeline_weeks},
  "dataset_available": true,
  "dataset_source": "Relevant public dataset or API name",
  "project_type": "Custom Engineered System",
  "career_paths": ["Target Role 1", "Target Role 2"],
  "resume_value": 9.3,
  "originality_score": 9.2,
  "learning_outcomes": [
    "Outcome 1",
    "Outcome 2",
    "Outcome 3"
  ],
  "customization_suggestions": [
    {{
      "type": "architecture",
      "title": "Decoupled Event Architecture & Streaming Queue",
      "summary": "Specific architectural recommendation explaining how to decouple components and improve latency/throughput.",
      "recommended_tools": ["Tool/Lib 1", "Tool/Lib 2"]
    }},
    {{
      "type": "security_production",
      "title": "Production Hardening & Schema Contracts",
      "summary": "Specific security or reliability pattern to implement (e.g. rate-limiting, schema validation, containerization).",
      "recommended_tools": ["Tool/Lib 1"]
    }},
    {{
      "type": "resume_multiplier",
      "title": "Quantitative Empirical Benchmark Suite",
      "summary": "Specific benchmark or testing strategy to produce quantifiable metrics for interviews (e.g. 'processed 500 req/sec at sub-50ms latency').",
      "recommended_tools": ["Locust", "pytest"]
    }}
  ]
}}"""

    models_to_try = ["llama-3.1-8b-instant"]
    for model in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=900,
                timeout=6.0,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = json.loads(raw)
            if parsed.get("title") and parsed.get("required_skills"):
                return _enrich_blueprint_with_analysis(parsed, student_skills, timeline_weeks)
        except Exception as e:
            logger.warning(f"Groq custom architect failed on {model}: {e}")
            continue

    return fallback_architect_custom_project(idea_prompt, domain, preferred_tech, timeline_weeks, profile)


def _enrich_blueprint_with_analysis(blueprint: Dict[str, Any], student_skills: List[str], timeline_weeks: float) -> Dict[str, Any]:
    """Attaches skill gap analysis and weekly roadmap to the architected blueprint."""
    # Ensure project_id exists
    safe_slug = "".join(c for c in blueprint.get("title", "custom-project").lower() if c.isalnum() or c == " ").strip().replace(" ", "-")[:35]
    blueprint["project_id"] = f"custom_{safe_slug}_{uuid.uuid4().hex[:6]}"

    # Compute skill gap
    gap = SkillGapEngine.analyze_gap(student_skills, blueprint)
    blueprint["skill_gap"] = gap
    blueprint["readiness_score"] = gap.get("readiness_score", 0.70)
    blueprint["missing_skills"] = [m["skill"] if isinstance(m, dict) else m for m in gap.get("missing_skills", [])]

    # Ensure all 3 strategic customization types are present
    suggestions = blueprint.get("customization_suggestions", [])
    if not isinstance(suggestions, list):
        suggestions = []
    
    present_types = {s.get("type") for s in suggestions if isinstance(s, dict)}
    default_suggestions = [
        {
            "type": "architecture",
            "title": "Decoupled Asynchronous Processing & Queue",
            "summary": "Introduce a lightweight message queue (e.g. Redis Streams or Celery) to isolate ingestion from computationally intensive processing, preventing latency spikes.",
            "recommended_tools": ["Redis", "FastAPI", "Celery"]
        },
        {
            "type": "security_production",
            "title": "Input Schema Validation & Boundary Guards",
            "summary": "Enforce strict Pydantic runtime schema contracts and rate-limiting middleware to guard against malformed payloads and runaway denial-of-service states.",
            "recommended_tools": ["Pydantic", "Docker", "pytest"]
        },
        {
            "type": "resume_multiplier",
            "title": "Empirical Throughput & Latency Benchmarks",
            "summary": "Author a reproducible stress-test suite using Locust or pytest-benchmark to produce a quantifiable resume achievement (e.g., 'Achieved <120ms response time under 200 concurrent requests').",
            "recommended_tools": ["Locust", "pytest", "Prometheus"]
        }
    ]
    for def_sug in default_suggestions:
        if def_sug["type"] not in present_types:
            suggestions.append(def_sug)
    blueprint["customization_suggestions"] = suggestions[:3]

    # Generate adaptive roadmap
    roadmap = RoadmapGenerator.generate_roadmap(student_skills, blueprint, timeline_weeks)
    blueprint["roadmap"] = roadmap

    return blueprint


def fallback_architect_custom_project(
    idea_prompt: str,
    domain: Optional[str] = None,
    preferred_tech: Optional[List[str]] = None,
    timeline_weeks: float = 4.0,
    student_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """High quality rule-based architectural fallback if Groq API is unavailable."""
    profile = student_profile or {}
    student_skills = profile.get("skills", ["Python"])
    
    clean_prompt = idea_prompt.strip()
    detected_domain = domain or "Applied Engineering"
    if any(w in clean_prompt.lower() for w in ["vision", "detect", "camera", "image", "yolo", "face"]):
        detected_domain = "Computer Vision"
        default_skills = ["Python", "Computer Vision", "PyTorch", "FastAPI", "Docker"]
        default_frameworks = ["OpenCV", "PyTorch", "FastAPI"]
        default_tools = ["Docker", "Git"]
    elif any(w in clean_prompt.lower() for w in ["robot", "drone", "ros", "sensor", "hardware", "arduino", "iot"]):
        detected_domain = "Robotics & Autonomous Systems"
        default_skills = ["Python", "C++", "ROS", "Linux", "Docker"]
        default_frameworks = ["ROS2", "OpenCV"]
        default_tools = ["Docker", "Linux", "Git"]
    elif any(w in clean_prompt.lower() for w in ["nlp", "text", "llm", "chat", "summary", "sentiment"]):
        detected_domain = "Natural Language Processing"
        default_skills = ["Python", "Natural Language Processing", "Transformers", "FastAPI", "Docker"]
        default_frameworks = ["Hugging Face", "FastAPI", "PyTorch"]
        default_tools = ["Docker", "Git"]
    elif any(w in clean_prompt.lower() for w in ["web", "app", "dashboard", "fullstack", "portal"]):
        detected_domain = "Web Development"
        default_skills = ["Python", "JavaScript", "FastAPI", "React", "PostgreSQL"]
        default_frameworks = ["FastAPI", "React"]
        default_tools = ["Docker", "PostgreSQL", "Git"]
    else:
        detected_domain = domain or "Machine Learning"
        default_skills = ["Python", "Machine Learning", "FastAPI", "Docker", "PostgreSQL"]
        default_frameworks = ["Scikit-Learn", "FastAPI"]
        default_tools = ["Docker", "PostgreSQL", "Git"]

    if preferred_tech:
        merged_skills = list(dict.fromkeys(preferred_tech + default_skills))[:5]
    else:
        merged_skills = default_skills

    title_words = [w.capitalize() for w in clean_prompt.split() if len(w) > 2][:4]
    custom_title = " ".join(title_words) if title_words else f"Autonomous {detected_domain} System"
    if not any(w.lower() in custom_title.lower() for w in ["system", "platform", "pipeline", "engine", "suite"]):
        custom_title += " Architecture"

    blueprint = {
        "title": custom_title,
        "domain": detected_domain,
        "subdomain": f"{detected_domain} Engineering",
        "difficulty": profile.get("experience_level", "Intermediate"),
        "description": f"Engineers an end-to-end {detected_domain.lower()} solution for: '{clean_prompt}'. Features modular ingestion, decoupled processing logic, structured data contracts, and containerized deployment.",
        "required_skills": merged_skills,
        "skill_importance": {s: round(1.0 / len(merged_skills), 2) for s in merged_skills},
        "programming_languages": ["Python"],
        "frameworks": default_frameworks,
        "tools": default_tools,
        "prerequisites": [f"Core foundations of {merged_skills[0]}", "Modular Software Architecture"],
        "estimated_duration": timeline_weeks,
        "dataset_available": True,
        "dataset_source": "Curated Domain Dataset / Real-time Telemetry API",
        "project_type": "Custom Engineered System",
        "career_paths": [f"{detected_domain} Engineer", "Full-Stack Software Engineer"],
        "resume_value": 9.2,
        "originality_score": 9.4,
        "learning_outcomes": [
            f"Designed and deployed production {detected_domain.lower()} pipeline from scratch",
            "Instituted modular API layer and containerized development workflow",
            "Implemented rigorous empirical performance benchmarking and automated tests"
        ],
        "customization_suggestions": [
            {
                "type": "architecture",
                "title": "Decoupled Asynchronous Processing & Queue",
                "summary": "Introduce a lightweight message queue (e.g. Redis Streams or Celery) to isolate ingestion from computationally intensive processing, preventing latency spikes.",
                "recommended_tools": ["Redis", "Celery", "FastAPI"]
            },
            {
                "type": "security_production",
                "title": "Input Schema Validation & Boundary Guards",
                "summary": "Enforce strict Pydantic runtime schema contracts and rate-limiting middleware to guard against malformed payloads and runaway denial-of-service states.",
                "recommended_tools": ["Pydantic", "SlowAPI", "Docker"]
            },
            {
                "type": "resume_multiplier",
                "title": "Empirical Throughput & Latency Benchmarks",
                "summary": "Author a reproducible stress-test suite using Locust or pytest-benchmark to produce a quantifiable resume achievement (e.g., 'Achieved <120ms response time under 200 concurrent requests').",
                "recommended_tools": ["Locust", "pytest", "Prometheus"]
            }
        ]
    }

    return _enrich_blueprint_with_analysis(blueprint, student_skills, timeline_weeks)
