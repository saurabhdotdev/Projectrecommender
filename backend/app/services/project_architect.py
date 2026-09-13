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

    models_to_try = [settings.GROQ_MODEL, "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]
    seen = set()
    deduped = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

    for model in deduped:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=850,
                timeout=8.0,
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


def _generate_engineering_specs(blueprint: Dict[str, Any]) -> Dict[str, Any]:
    """Generates structured architecture diagrams, database schemas (SQL DDL), and API contracts."""
    title = blueprint.get("title", "Applied Engineering System")
    domain = blueprint.get("domain", "Engineering")
    langs = blueprint.get("programming_languages", ["Python"]) or ["Python"]
    primary_lang = langs[0] if langs else "Python"
    frameworks = blueprint.get("frameworks", ["FastAPI"]) or ["FastAPI"]
    primary_framework = frameworks[0] if frameworks else "FastAPI"
    tools = blueprint.get("tools", ["Docker", "Git"]) or ["Docker", "Git"]
    primary_tool = tools[0] if tools else "Docker"

    arch = {
        "pattern": f"Decoupled Microservice & Event-Driven {domain} Topology",
        "diagram": f"""+-------------------------------------------------------------+
|                     Client / Gateway Layer                  |
|          (Web Client / Mobile App / External Consumers)     |
+------------------------------+------------------------------+
                               | HTTPS / WSS / gRPC
                               v
+-------------------------------------------------------------+
|               API Gateway & Contract Guard                  |
|       - Schema Validation Guard ({primary_lang} / Pydantic) |
|       - JWT Authorization & Token Rate Limiter              |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            | Async Ingestion                     | High-Speed Read
            v                                     v
+-----------------------+             +-----------------------+
|  Worker Queue Tier    |             |  In-Memory Cache      |
| (Redis Streams/Celery)|             |     (Redis 7.x)       |
+-----------+-----------+             +-----------+-----------+
            |                                     |
            v                                     v
+-------------------------------------------------------------+
|                Core Processing & Engine Tier                |
|       - Algorithm & Numerical Pipeline Execution            |
|       - {primary_framework} Microservice Workers           |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 Persistence & Storage Tier                  |
|       - Relational Data Store: PostgreSQL 16+               |
|       - Blob & Artifact Store: {primary_tool} Registry      |
+-------------------------------------------------------------+""",
        "components": [
            {
                "name": "Ingestion & Contract Guard",
                "role": f"Validates incoming payloads with strict type constraints using {primary_lang}.",
                "tech": primary_framework
            },
            {
                "name": "Async Task Dispatcher",
                "role": "Offloads heavy algorithmic computation to non-blocking background workers.",
                "tech": "Redis & Celery"
            },
            {
                "name": "Core Engine & Intelligence",
                "role": f"Processes domain-specific logic, transformations, and scoring algorithms for {title}.",
                "tech": f"{primary_lang} + {primary_framework}"
            },
            {
                "name": "Storage & State Layer",
                "role": "Ensures transactional consistency, temporal indexing, and query speed < 25ms.",
                "tech": "PostgreSQL 16"
            }
        ]
    }

    slug = "".join(c for c in title.lower() if c.isalnum())[:12] or "project"
    db_schema = f"""-- Database Schema for {title}
-- Primary Relational Store: PostgreSQL 16+

CREATE TABLE IF NOT EXISTS {slug}_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{{}}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS {slug}_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES {slug}_entities(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    confidence_score NUMERIC(5, 4) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    latency_ms NUMERIC(8, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS {slug}_metrics (
    metric_id BIGSERIAL PRIMARY KEY,
    time_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
    throughput_rps INT NOT NULL DEFAULT 0,
    p95_latency_ms NUMERIC(6, 2) NOT NULL,
    error_rate NUMERIC(4, 3) DEFAULT 0.000
);

-- Optimized indices for sub-15ms lookups
CREATE INDEX IF NOT EXISTS idx_{slug}_entities_status ON {slug}_entities(status);
CREATE INDEX IF NOT EXISTS idx_{slug}_events_entity_recorded ON {slug}_events(entity_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_{slug}_metrics_bucket ON {slug}_metrics(time_bucket DESC);
"""

    api_contract = [
        {
            "method": "POST",
            "endpoint": f"/api/v1/{slug}/execute",
            "summary": f"Executes core {title} algorithm on batch or stream payload",
            "request_payload": '{"payload_id": "string", "features": [0.1, 0.9], "metadata": {}}',
            "response_payload": '{"status": "SUCCESS", "confidence_score": 0.9421, "latency_ms": 14.8}',
            "status_code": 200
        },
        {
            "method": "GET",
            "endpoint": f"/api/v1/{slug}/entities/{{id}}",
            "summary": "Retrieves entity state, historical timeline, and calculated metrics",
            "request_payload": "None (Path parameter)",
            "response_payload": '{"id": "uuid", "identifier": "string", "events_count": 42}',
            "status_code": 200
        },
        {
            "method": "GET",
            "endpoint": f"/api/v1/{slug}/metrics/telemetry",
            "summary": "Returns p95 latency, RPS, and system throughput for observability",
            "request_payload": "Query: ?window=1h",
            "response_payload": '{"throughput_rps": 240, "p95_latency_ms": 22.4, "error_rate": 0.001}',
            "status_code": 200
        },
        {
            "method": "POST",
            "endpoint": f"/api/v1/{slug}/batch-process",
            "summary": "Submits an asynchronous batch processing job to the task queue",
            "request_payload": '{"batch_id": "string", "items": [...], "priority": "high"}',
            "response_payload": '{"job_id": "uuid", "status": "QUEUED", "estimated_completion_sec": 4.5}',
            "status_code": 202
        }
    ]

    return {
        "architecture_spec": arch,
        "database_schema": db_schema,
        "api_contract": api_contract
    }


def _enrich_blueprint_with_analysis(blueprint: Dict[str, Any], student_skills: List[str], timeline_weeks: float) -> Dict[str, Any]:
    """Attaches skill gap analysis, weekly roadmap, and engineering specs to the architected blueprint."""
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

    # Attach engineering architecture, DB schema, and API contracts
    specs = _generate_engineering_specs(blueprint)
    blueprint.update(specs)

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
