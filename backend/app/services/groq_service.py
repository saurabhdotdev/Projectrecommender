import json
import logging
from typing import List, Dict, Any, Optional
from groq import Groq
from ..config import settings

logger = logging.getLogger("projectforge.groq")

def get_groq_client() -> Optional[Groq]:
    if not settings.GROQ_API_KEY:
        return None
    try:
        return Groq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        return None

def chat_advisor(messages: List[Dict[str, str]], current_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Conducts an intelligent, empathetic conversation with the student across any engineering or tech discipline.
    Extracts profile attributes (branch, year, skills, timeline, goals, interests) and suggests smart quick-chips.
    """
    client = get_groq_client()
    if not client:
        return fallback_chat_advisor(messages, current_profile)

    system_prompt = f"""You are ProjectForge AI Advisor — a friendly, expert project mentor for engineering & tech students (CS, ECE, VLSI, Robotics, Mechanical, Biomedical, etc.).

Current student profile:
{json.dumps(current_profile, indent=2)}

Your job: Chat naturally (2-3 sentences max). Extract profile info from conversation. Reference their actual skills/domain with genuine technical context.

Reply ONLY with this JSON:
{{"reply":"...", "profile_updates":{{"degree":"...","year":"...","skills":["..."],"interests":["..."],"experience_level":"Beginner|Intermediate|Advanced","available_time_weeks":4.0,"career_goal":"Internship|Full-time Job|Research|Portfolio|Skill Growth"}}, "suggested_chips":["...","...","..."], "vetted_summary":"...", "ready_to_recommend":false}}

Rules:
- Only include profile_updates fields the student actually mentioned.
- Set ready_to_recommend=true once you know their domain + 1 other factor.
- suggested_chips = 2-4 natural next choices for the student."""

    # Build conversation payload
    api_messages = [{"role": "system", "content": system_prompt}]
    for m in messages[-10:]:  # Keep recent history
        api_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

    # Fastest models first — llama-3.1-8b-instant is Groq's lowest-latency option
    models_to_try = ["llama-3.1-8b-instant", "llama3-8b-8192", settings.GROQ_MODEL]

    for model in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=api_messages,
                temperature=0.4,
                max_tokens=300,  # Chat replies are 2-3 sentences — 800 was wasteful
                response_format={"type": "json_object"}
            )
            raw_content = completion.choices[0].message.content.strip()
            if raw_content.startswith("```"):
                raw_content = raw_content.split("```")[1]
                if raw_content.startswith("json"):
                    raw_content = raw_content[4:]
            parsed = json.loads(raw_content)
            return {
                "reply": parsed.get("reply", "Tell me more about what you'd like to build!"),
                "profile_updates": parsed.get("profile_updates", {}),
                "suggested_chips": parsed.get("suggested_chips", []),
                "vetted_summary": parsed.get("vetted_summary", ""),
                "ready_to_recommend": bool(parsed.get("ready_to_recommend", False)),
                "model_used": model
            }
        except Exception as e:
            logger.warning(f"Groq model {model} failed: {e}")
            continue

    return fallback_chat_advisor(messages, current_profile)


def fallback_chat_advisor(messages: List[Dict[str, str]], current_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Graceful local rule-based fallback if Groq API is unreachable."""
    last_msg = (messages[-1].get("content", "") if messages else "").lower()
    profile_updates = {}
    
    if any(w in last_msg for w in ["vlsi", "chip", "verilog", "fpga", "semiconductor"]):
        profile_updates["degree"] = "VLSI / Electronics"
        profile_updates["interests"] = ["VLSI & Chip Design", "Embedded Systems & Firmware"]
        reply = "VLSI and hardware design is a phenomenal domain. Are you targeting FPGA implementation, RTL verification, or processor design (e.g. RISC-V)?"
        chips = ["FPGA & RTL Design", "RISC-V Core", "Digital Verification", "4-6 Weeks Timeline"]
    elif any(w in last_msg for w in ["mech", "cad", "solidworks", "ansys", "cfd"]):
        profile_updates["degree"] = "Mechanical Engineering"
        profile_updates["interests"] = ["Mechanical Design & CAD", "Robotics & Autonomous Systems"]
        reply = "Mechanical and robotics systems give great portfolio weight. Are you focusing on CAD simulation, robotics kinematics, or additive manufacturing?"
        chips = ["Robotics & Kinematics", "ANSYS / CFD Simulation", "SolidWorks Design"]
    elif any(w in last_msg for w in ["cs", "computer science", "software", "web", "ai", "machine learning"]):
        profile_updates["degree"] = "Computer Science"
        reply = "Awesome! What area in software excites you most right now — full-stack systems, machine learning, or distributed systems?"
        chips = ["Machine Learning / AI", "Full-Stack Web", "DevOps & Cloud", "Internship Prep"]
    else:
        reply = "Got it! Could you tell me your degree or branch, what kind of project excites you, and how many weeks you have to build it?"
        chips = ["Computer Science", "VLSI / Electronics", "Mechanical / Robotics", "4-8 Weeks"]

    return {
        "reply": reply,
        "profile_updates": profile_updates,
        "suggested_chips": chips,
        "vetted_summary": "Conversing with student to calibrate profile.",
        "ready_to_recommend": len(profile_updates) > 0,
        "model_used": "local-fallback"
    }


def generate_project_ai_insights(project: Dict[str, Any], student_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates personalized resume bullets, interview prep questions, and career rationale using Groq LLM.
    """
    client = get_groq_client()
    if not client:
        return fallback_project_insights(project, student_profile)

    system_prompt = f"""You are a Principal Tech Lead and Senior Technical Recruiter.
Given this student profile and project blueprint, generate high-impact career assets.

Student Profile:
- Degree: {student_profile.get('degree', 'Engineering')} ({student_profile.get('year', 'Student')})
- Current Skills: {', '.join(student_profile.get('skills', []))}
- Goal: {student_profile.get('career_goal', 'Internship')}
- Timeline: {student_profile.get('available_time_weeks', 4)} weeks

Project Blueprint:
- Title: {project.get('title')}
- Domain: {project.get('domain')} / {project.get('subdomain')}
- Difficulty: {project.get('difficulty')}
- Description: {project.get('description')}
- Required Skills: {', '.join(project.get('required_skills', []))}
- Tech Stack: {', '.join(project.get('frameworks', []) + project.get('tools', []))}

Generate JSON matching this exact structure:
{{
  "personalized_hook": "2 impactful sentences connecting this exact project to their specific career goal and background.",
  "resume_bullets": [
    "Action-oriented bullet 1 with technical detail and simulated metrics",
    "Action-oriented bullet 2 highlighting architecture and tools used",
    "Action-oriented bullet 3 showing evaluation or business/research impact"
  ],
  "interview_prep": [
    {{
      "question": "Realistic technical interview question",
      "what_interviewers_look_for": "Key technical insight or trade-off to address",
      "recommended_talking_points": "Crisp answer strategy"
    }},
    {{
      "question": "Realistic architectural/system question",
      "what_interviewers_look_for": "Key technical insight or trade-off to address",
      "recommended_talking_points": "Crisp answer strategy"
    }},
    {{
      "question": "Realistic challenge/edge-case question",
      "what_interviewers_look_for": "Key technical insight or trade-off to address",
      "recommended_talking_points": "Crisp answer strategy"
    }}
  ],
  "pro_tips": [
    "Tip 1 for faster implementation without getting stuck",
    "Tip 2 to make this project stand out from generic GitHub repos"
  ]
}}"""

    models_to_try = [settings.GROQ_MODEL, "qwen/qwen3.8-27b", "openai/gpt-oss-120b"]
    for model in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You output valid JSON only."},
                    {"role": "user", "content": system_prompt}
                ],
                temperature=0.3,
                max_tokens=950,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except Exception as e:
            logger.warning(f"Groq insights failed on {model}: {e}")
            continue

    return fallback_project_insights(project, student_profile)


def fallback_project_insights(project: Dict[str, Any], student_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Rule-based fallback if Groq API is unavailable."""
    title = project.get('title', 'Project')
    domain = project.get('domain', 'Engineering')
    skills = project.get('required_skills', ['Python'])[:3]
    skills_str = ", ".join(skills)
    goal = student_profile.get('career_goal', 'Engineering')

    return {
        "personalized_hook": f"Building '{title}' directly demonstrates your ability to deliver end-to-end {domain} systems, making you an immediate standout candidate for {goal} roles.",
        "resume_bullets": [
            f"Architected and deployed {title} utilizing {skills_str}, establishing modular data pipelines and comprehensive error-handling.",
            f"Optimized performance and latency by benchmarking pipeline throughput, achieving reproducible validation accuracy across target datasets.",
            f"Containerized system architecture with modular interfaces and comprehensive test suites, showcasing industry-standard development practices."
        ],
        "interview_prep": [
            {
                "question": f"How did you design the architecture for {title}, and why did you select {skills_str}?",
                "what_interviewers_look_for": "Understanding of architectural trade-offs, modularity, and tool selection rationale.",
                "recommended_talking_points": f"Highlight why {skills[0] if skills else 'the stack'} was optimal for this problem, including performance and developer velocity."
            },
            {
                "question": "What was the biggest technical bottleneck or edge-case you encountered during development?",
                "what_interviewers_look_for": "Debugging methodology, resilience, and systematic problem solving.",
                "recommended_talking_points": "Describe a real synchronization, data quality, or boundary issue, how you profiled it, and the fix implemented."
            },
            {
                "question": "How would you scale this system to handle 100x user traffic or data volume?",
                "what_interviewers_look_for": "Distributed systems knowledge, caching, asynchronous queues, and database indexing.",
                "recommended_talking_points": "Propose message queues (Kafka/Celery), horizontal worker scaling, and efficient query optimization."
            }
        ],
        "pro_tips": [
            "Start with a minimal end-to-end prototype on synthetic data before implementing complex components.",
            "Write a clear, professional README with an architecture diagram and live demo GIFs to impress recruiters."
        ]
    }


def generate_executive_summary(student_profile: Dict[str, Any], top_projects: List[Dict[str, Any]]) -> str:
    """
    Generates a crisp 2-sentence mentor verdict summarizing why these projects match and how to tackle them.
    """
    client = get_groq_client()
    if not client:
        return fallback_executive_summary(student_profile, top_projects)

    deg = student_profile.get("degree", "Student")
    yr = student_profile.get("year", "")
    goal = student_profile.get("career_goal", "Career Growth")
    weeks = student_profile.get("available_time_weeks", 4)
    skills = ", ".join(student_profile.get("skills", [])[:4])

    proj_list = "\n".join([f"- {p.get('title')} ({p.get('domain')}, {p.get('match_percentage')}% match)" for p in top_projects[:3]])

    prompt = f"""You are a Principal Engineering Director and Student Mentor.
Review this student profile and top recommended projects:

Student: {deg} ({yr}), Goal: {goal}, Timeline: {weeks} weeks, Skills: {skills}
Top Recommended Projects:
{proj_list}

Write a concise 2-sentence executive mentor verdict.
Sentence 1: Explain the single highest-leverage project pathway for their background and timeline.
Sentence 2: Give practical strategic advice on how to execute it effectively to maximize portfolio/interview impact.
Keep it direct, professional, and inspiring. Do not use generic filler words."""

    for model in [settings.GROQ_MODEL, "qwen/qwen3.8-27b", "openai/gpt-oss-120b"]:
        try:
            res = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=220
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Groq executive summary failed on {model}: {e}")
            continue

    return fallback_executive_summary(student_profile, top_projects)


def fallback_executive_summary(student_profile: Dict[str, Any], top_projects: List[Dict[str, Any]]) -> str:
    if not top_projects:
        return "Calibrate your profile to receive personalized project recommendations."
    top = top_projects[0]
    title = top.get("title", "this project")
    match = top.get("match_percentage", 90)
    weeks = student_profile.get("available_time_weeks", 4)
    goal = student_profile.get("career_goal", "your career goals")
    return f"Based on your timeline of {weeks} weeks and target of {goal}, '{title}' ({match}% match) represents your highest return on investment. Focus on delivering a working core prototype in the first half before expanding into advanced features to maximize interview leverage."


def generate_unlimited_project_ideas(
    student_profile: Optional[Dict[str, Any]] = None,
    topic_or_prompt: Optional[str] = None,
    domain: Optional[str] = None,
    difficulty: Optional[str] = None,
    count: int = 3
) -> List[Dict[str, Any]]:
    """
    Synthesizes unlimited, novel, production-grade project blueprints on demand using Groq LLM.
    Ensures complete field population adhering to ProjectForge schema.
    """
    client = get_groq_client()
    profile = student_profile or {}
    
    if not client:
        return fallback_generate_project_ideas(profile, topic_or_prompt, domain, difficulty, count)

    skills_str = ", ".join(profile.get("skills", [])) or "Python, SQL, Machine Learning"
    degree = profile.get("degree", "Computer Science")
    year = profile.get("year", "Undergraduate")
    goal = profile.get("career_goal", "Internship")
    weeks = profile.get("available_time_weeks", 4.0)
    user_prompt = topic_or_prompt or "high-impact engineering projects bridging current industry challenges"

    system_prompt = f"""You are a Principal Engineering Architect & Senior University Project Evaluator.
Your goal is to synthesize {count} completely novel, innovative, production-grade engineering & tech project blueprints.
These must NOT be generic textbook ideas (no basic to-do lists, standard titanic survival, or simple calculators).

Target Student Background:
- Degree: {degree} ({year})
- Current Skills: {skills_str}
- Target Goal: {goal}
- Available Timeline: {weeks} weeks
- Target Domain/Topic Request: {user_prompt}
- Desired Domain (if specified): {domain or 'Any relevant high-impact domain'}
- Desired Difficulty (if specified): {difficulty or 'Auto-match (Intermediate/Advanced)'}

Generate a JSON object with a key "projects" containing an array of {count} unique project blueprints.
Each project MUST follow this exact schema:
{{
  "title": "Creative, modern, compelling project title",
  "domain": "Domain (e.g. Machine Learning, HealthTech, Robotics, VLSI, Cybersecurity, FinTech, Cloud & DevOps, IoT)",
  "subdomain": "Specific subfield",
  "difficulty": "Beginner|Intermediate|Advanced",
  "description": "3-4 concise sentences outlining the real-world problem, the proposed engineering architecture, and technical novelty.",
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
  "tools": ["Tool 1", "Docker", "..."],
  "prerequisites": ["Prerequisite concept 1", "Prerequisite concept 2"],
  "estimated_duration": {weeks},
  "dataset_available": true,
  "dataset_source": "Realistic public dataset or simulator name (e.g. Kaggle, HuggingFace, PhysioNet, Gazebo, OpenStreetMap)",
  "project_type": "Applied Engineering Blueprint",
  "career_paths": ["Target Role 1", "Target Role 2"],
  "resume_value": 9.2,
  "originality_score": 9.0,
  "learning_outcomes": [
    "Outcome 1: Practical architecture skill gained",
    "Outcome 2: Evaluation or scaling milestone mastered",
    "Outcome 3: Production deployment competency built"
  ]
}}

Ensure skill_importance keys match required_skills and sum approximately to 1.0.
Respond with valid JSON ONLY."""

    models_to_try = [settings.GROQ_MODEL, "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"]

    for model in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You output valid JSON only with a 'projects' array."},
                    {"role": "user", "content": system_prompt}
                ],
                temperature=0.7,  # Higher temperature for diverse novel ideas
                max_tokens=2200,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = json.loads(raw)
            projects = parsed.get("projects", [])
            if isinstance(projects, list) and len(projects) > 0:
                return projects[:count]
        except Exception as e:
            logger.warning(f"Groq unlimited idea generation failed on {model}: {e}")
            continue

    return fallback_generate_project_ideas(profile, topic_or_prompt, domain, difficulty, count)


def fallback_generate_project_ideas(
    student_profile: Dict[str, Any],
    topic_or_prompt: Optional[str] = None,
    domain: Optional[str] = None,
    difficulty: Optional[str] = None,
    count: int = 3
) -> List[Dict[str, Any]]:
    """Algorithmic procedural generator for unlimited project blueprints across domains."""
    import random
    import time

    base_domain = domain or ("Robotics" if "robot" in (topic_or_prompt or "").lower() 
                              else "VLSI & Chip Design" if "vlsi" in (topic_or_prompt or "").lower()
                              else "Cybersecurity" if "security" in (topic_or_prompt or "").lower()
                              else "HealthTech" if "health" in (topic_or_prompt or "").lower()
                              else "Machine Learning")
    
    diff = difficulty or student_profile.get("experience_level", "Intermediate")
    weeks = float(student_profile.get("available_time_weeks", 4.0))

    templates = [
        {
            "title": f"Autonomous Edge-AI {base_domain} Telemetry & Anomaly Sentinel",
            "domain": base_domain,
            "subdomain": "Edge AI & Real-time Systems",
            "description": f"Designs and implements an embedded edge inference pipeline for {base_domain.lower()} environments. Collects real-time streaming sensor streams, runs quantized neural network anomaly detection locally, and flags zero-day anomalies with low-latency alerts.",
            "required_skills": ["Python", "Machine Learning", "Edge AI", "FastAPI", "Docker"],
            "frameworks": ["PyTorch Mobile", "ONNX Runtime", "FastAPI"],
            "tools": ["Docker", "Prometheus", "Git"],
            "languages": ["Python", "C++"],
            "duration": weeks
        },
        {
            "title": f"Distributed Multi-Agent Architecture for {base_domain} Optimization",
            "domain": base_domain,
            "subdomain": "Distributed Systems & Multi-Agent AI",
            "description": f"Engineers a collaborative multi-agent simulation for high-dimensional decision-making in {base_domain.lower()}. Agents negotiate resource allocations asynchronously using reinforcement learning policies and consensus protocols.",
            "required_skills": ["Python", "Distributed Systems", "Reinforcement Learning", "FastAPI", "PostgreSQL"],
            "frameworks": ["Ray", "FastAPI", "SQLAlchemy"],
            "tools": ["Docker", "PostgreSQL", "Redis"],
            "languages": ["Python"],
            "duration": min(weeks + 1.0, 10.0)
        },
        {
            "title": f"Explainable Neuro-Symbolic Diagnostic Suite for {base_domain}",
            "domain": base_domain,
            "subdomain": "Neuro-Symbolic & Explainable AI",
            "description": f"Combines deep representation learning with formal knowledge graph constraint checking to deliver fully verifiable, auditable predictions in {base_domain.lower()}, eliminating hallucination risks in mission-critical applications.",
            "required_skills": ["Python", "Knowledge Graphs", "Machine Learning", "Explainable AI", "Neo4j"],
            "frameworks": ["PyTorch", "NetworkX", "FastAPI"],
            "tools": ["Neo4j", "Docker", "Git"],
            "languages": ["Python", "Cypher"],
            "duration": weeks
        },
        {
            "title": f"Privacy-Preserving Federated Intelligence Pipeline for {base_domain}",
            "domain": base_domain,
            "subdomain": "Privacy & Federated Learning",
            "description": f"Implements a federated learning framework allowing distributed edge participants in {base_domain.lower()} to collaboratively train global foundation models without sharing proprietary or sensitive raw telemetry data.",
            "required_skills": ["Python", "Federated Learning", "Cryptography", "Docker", "Machine Learning"],
            "frameworks": ["Flower (flwr)", "PyTorch", "FastAPI"],
            "tools": ["Docker", "Git", "Linux"],
            "languages": ["Python"],
            "duration": weeks
        }
    ]

    selected = templates[:count] if len(templates) >= count else templates
    results = []

    for i, t in enumerate(selected):
        skills = t["required_skills"]
        weights = [round(1.0 / len(skills), 2) for _ in skills]
        skill_imp = {s: w for s, w in zip(skills, weights)}
        
        results.append({
            "title": t["title"],
            "domain": t["domain"],
            "subdomain": t["subdomain"],
            "difficulty": diff,
            "description": t["description"],
            "required_skills": skills,
            "skill_importance": skill_imp,
            "programming_languages": t["languages"],
            "frameworks": t["frameworks"],
            "tools": t["tools"],
            "prerequisites": [f"Foundations of {skills[0]}", "Modular Object-Oriented Software Design"],
            "estimated_duration": t["duration"],
            "dataset_available": True,
            "dataset_source": "Curated Open Dataset / Synthetic Simulator",
            "project_type": "Applied Engineering Blueprint",
            "career_paths": [f"{base_domain} Engineer", "Full-Stack AI Developer"],
            "resume_value": round(random.uniform(8.8, 9.6), 1),
            "originality_score": round(random.uniform(8.9, 9.8), 1),
            "learning_outcomes": [
                f"Mastered end-to-end architecture design for {base_domain.lower()} workflows",
                f"Implemented production containerization and API layers with {t['tools'][0]}",
                "Constructed rigorous empirical validation benchmarks and explainability reporting"
            ]
        })

    return results


def generate_resume_interview_kit(project: Dict[str, Any], student_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a production-ready STAR Resume Bullet & Technical Interview Prep Kit.
    Includes:
    - 3-4 STAR structured bullets (Situation, Task, Action, Result) with metrics
    - 5 in-depth technical interview questions across architecture, scaling, trade-offs, debugging, and vision
    - 30-second elevator pitch for recruiter screens
    """
    client = get_groq_client()
    if not client:
        return fallback_resume_interview_kit(project, student_profile)

    title = project.get("title", "Applied Engineering Project")
    domain = project.get("domain", "Engineering")
    skills = project.get("required_skills", [])
    skills_str = ", ".join(skills[:5])
    frameworks_str = ", ".join(project.get("frameworks", []) + project.get("tools", []))
    degree = student_profile.get("degree", "Engineering")
    goal = student_profile.get("career_goal", "Software / ML Internship")

    prompt = f"""You are a Principal Software Engineering Bar Raiser & Hiring Manager at a top tech company.
Generate an elite, high-impact "Resume & Technical Interview Prep Kit" for this project and student.

Project:
- Title: {title}
- Domain: {domain}
- Required Skills: {skills_str}
- Frameworks & Tools: {frameworks_str}
- Description: {project.get('description', '')}

Student:
- Degree: {degree}
- Target Goal: {goal}

Return ONLY a JSON object with this exact schema:
{{
  "project_title": "{title}",
  "domain": "{domain}",
  "elevator_pitch": "A crisp, compelling 30-second spoken answer to 'Tell me about this project on your resume' (3-4 spoken sentences highlighting the problem, your architecture, and key metric).",
  "star_bullets": [
    {{
      "bullet": "Architected and built... using [Stack], achieving [Metric/Outcome].",
      "situation_task": "What real-world bottleneck or requirement necessitated this system",
      "action": "Specific engineering design, tools, and algorithms implemented",
      "result": "Quantifiable performance outcome, throughput, or validation metric"
    }},
    {{
      "bullet": "Implemented... leveraging [Stack], improving [Metric] by [Percentage/Speed].",
      "situation_task": "Pipeline, data handling, or service layer challenge",
      "action": "Specific architectural patterns and optimization techniques applied",
      "result": "Efficiency, reliability, or latency impact"
    }},
    {{
      "bullet": "Engineered automated test suites and containerized deployment with [Tools], ensuring [Outcome].",
      "situation_task": "Reliability, reproducibility, and production readiness requirement",
      "action": "Docker, CI/CD, modular interfaces, and unit/integration test coverage",
      "result": "Zero regression deployability and production validation"
    }}
  ],
  "interview_questions": [
    {{
      "question": "Can you walk me through the high-level architecture of {title} and explain why you chose {skills[0] if skills else 'this stack'} over alternatives?",
      "category": "System Architecture",
      "model_answer": "Crisp 3-4 sentence exemplar response explaining modularity, data flow, and technology selection.",
      "key_tradeoffs": "Trade-offs to mention (e.g. latency vs simplicity, synchronous vs asynchronous).",
      "gotchas_to_avoid": "Common mistake candidates make when answering this question."
    }},
    {{
      "question": "What was the most difficult algorithmic, performance, or data bottleneck you hit, and how did you profile and resolve it?",
      "category": "Debugging & Performance",
      "model_answer": "Concrete answer detailing profiling method (cProfile, flamegraphs, DB explain), root cause, and optimization fix.",
      "key_tradeoffs": "Trade-offs considered during resolution.",
      "gotchas_to_avoid": "Avoid vague claims like 'I just made it faster' without metrics."
    }},
    {{
      "question": "How would you evolve this architecture if the user load or data volume scaled 100x tomorrow?",
      "category": "Scalability & Distributed Systems",
      "model_answer": "Clear scaling plan: message queues (Celery/Kafka), distributed caching (Redis), horizontal replicas, database read-replicas.",
      "key_tradeoffs": "Consistency vs availability considerations.",
      "gotchas_to_avoid": "Don't jump immediately to complex Kubernetes if simple caching suffices."
    }},
    {{
      "question": "How did you validate correctness and ensure data integrity or model reliability against edge cases?",
      "category": "Quality & Evaluation",
      "model_answer": "Concrete validation strategy: stratified cross-validation, automated integration tests, anomaly guards, and schema validation.",
      "key_tradeoffs": "Test execution speed vs full end-to-end coverage.",
      "gotchas_to_avoid": "Don't say you only tested manually in the browser."
    }},
    {{
      "question": "If you had two more weeks to work on this, what is the single most critical architectural upgrade you would prioritize?",
      "category": "Product & Engineering Vision",
      "model_answer": "Visionary answer prioritizing telemetry/monitoring (OpenTelemetry, Prometheus), security hardening, or real-time event streaming.",
      "key_tradeoffs": "Feature velocity vs infrastructure robustness.",
      "gotchas_to_avoid": "Avoid saying 'nothing, it is complete'."
    }}
  ]
}}"""

    models_to_try = [settings.GROQ_MODEL, "llama-3.3-70b-versatile", "llama3-8b-8192"]
    for model in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = json.loads(raw)
            if parsed.get("star_bullets") and parsed.get("interview_questions"):
                return parsed
        except Exception as e:
            logger.warning(f"Groq resume interview kit failed on {model}: {e}")
            continue

    return fallback_resume_interview_kit(project, student_profile)


def fallback_resume_interview_kit(project: Dict[str, Any], student_profile: Dict[str, Any]) -> Dict[str, Any]:
    """High quality deterministic fallback for STAR bullets and technical interview questions."""
    title = project.get("title", "Production Engineering System")
    domain = project.get("domain", "Engineering")
    skills = project.get("required_skills", ["Python", "FastAPI", "Docker"])
    skills_str = ", ".join(skills[:3])
    tools = project.get("tools", ["Docker", "Git"])
    tool_name = tools[0] if tools else "Docker"

    return {
        "project_title": title,
        "domain": domain,
        "elevator_pitch": f"I engineered '{title}', an end-to-end {domain.lower()} platform built using {skills_str}. I tackled the core challenge of reliable data processing by designing a modular pipeline with comprehensive automated testing and containerized deployment, achieving sub-second query latency and reproducible execution across environments.",
        "star_bullets": [
            {
                "bullet": f"Architected and deployed {title} using {skills_str}, establishing modular pipelines that reduced end-to-end processing latency by 35%.",
                "situation_task": f"Needed a robust, production-grade {domain.lower()} system capable of handling complex inputs reliably without manual intervention.",
                "action": f"Designed decoupled services with strictly typed data contracts, error-handling middleware, and optimized data structures.",
                "result": "Achieved sub-150ms response times and processed high-volume requests with zero unhandled runtime exceptions."
            },
            {
                "bullet": f"Engineered rigorous validation and benchmark suites utilizing {skills[0] if skills else 'Python'}, achieving 98%+ pipeline test coverage and predictable throughput.",
                "situation_task": "Ensuring edge-case resilience and preventing regressions across evolving data schemas.",
                "action": "Implemented automated unit, integration, and mock tests with synthetic stress-testing datasets.",
                "result": "Identified and eliminated 4 critical concurrency bottlenecks prior to deployment."
            },
            {
                "bullet": f"Containerized entire system architecture with {tool_name} and documented clean API specifications, enabling one-click local reproduction and cloud readiness.",
                "situation_task": "Standardizing developer onboarding and eliminating environment divergence across development and production.",
                "action": f"Authored multi-stage {tool_name} builds, pinned dependency environments, and drafted architecture specifications.",
                "result": "Reduced environment setup time from hours to under 2 minutes."
            }
        ],
        "interview_questions": [
            {
                "question": f"Can you walk me through the high-level architecture of {title} and why you chose {skills_str}?",
                "category": "System Architecture",
                "model_answer": f"I designed {title} as a layered modular architecture consisting of ingestion, business logic / inference, and presentation layers. I chose {skills[0] if skills else 'Python'} for its rich ecosystem and high developer velocity, paired with strong typing and schema validation to maintain maintainability.",
                "key_tradeoffs": "Separation of concerns vs monolithic simplicity; chose modular decoupling to facilitate independent testing.",
                "gotchas_to_avoid": "Don't just list technologies—explain the flow of data from request ingestion to persistence."
            },
            {
                "question": "What was the single most difficult technical hurdle or edge case you encountered while building this?",
                "category": "Debugging & Performance",
                "model_answer": "The biggest challenge was handling malformed or out-of-order input states during data processing. I profiled the bottleneck using logging and targeted breakpoints, then instituted schema validation boundaries and idempotent retry policies.",
                "key_tradeoffs": "Fail-fast validation vs graceful partial degradation.",
                "gotchas_to_avoid": "Never say 'I didn't encounter any challenges'—interviewers want to see your troubleshooting methodology."
            },
            {
                "question": "How would you scale this system if traffic increased by 100x tomorrow?",
                "category": "Scalability & Distributed Systems",
                "model_answer": "I would introduce an asynchronous message broker (e.g. RabbitMQ or Redis Streams) to decouple incoming traffic spikes from processing workers, implement read replicas for database queries, and leverage distributed caching for frequently accessed reads.",
                "key_tradeoffs": "Eventual consistency vs strong immediate consistency in cached states.",
                "gotchas_to_avoid": "Avoid over-engineering with microservices before solving database read/write bottlenecks."
            },
            {
                "question": "How did you verify correctness and test that your solution actually works as expected?",
                "category": "Quality & Evaluation",
                "model_answer": "I instituted a pyramid of unit tests for core utilities, integration tests for API contracts, and systematic regression tests on synthetic edge cases including missing fields and boundary conditions.",
                "key_tradeoffs": "Mocking external services for speed vs testing against live staging dependencies.",
                "gotchas_to_avoid": "Don't say you only did manual verification in the browser or terminal."
            },
            {
                "question": "If you were to rebuild this project from scratch today, what is the first thing you would do differently?",
                "category": "Product & Engineering Vision",
                "model_answer": "I would incorporate structured telemetry and distributed tracing (like OpenTelemetry) from day one to gain instantaneous visibility into latency bottlenecks, and invest in a declarative migration setup.",
                "key_tradeoffs": "Investing early in observability vs maximizing initial prototype velocity.",
                "gotchas_to_avoid": "Don't trash your past implementation; frame it as an architectural maturation."
            }
        ]
    }


def evaluate_mock_interview_answer(
    project: Dict[str, Any],
    question: str,
    category: str,
    model_answer: str,
    key_tradeoffs: str,
    student_answer: str,
    interviewer_style: str = "bar_raiser",
    history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Evaluates a student's answer to a technical interview question for a project.
    Provides multi-dimensional scores (STAR, depth, clarity), specific strengths/gaps,
    an exemplar senior revision, and an optional follow-up question.
    """
    if not student_answer or not student_answer.strip():
        return {
            "overall_score": 1,
            "star_score": 1,
            "technical_depth_score": 1,
            "clarity_score": 1,
            "feedback": "No answer was provided. In a technical interview, even if you are unsure, communicate your high-level intuition and ask clarifying questions rather than staying silent.",
            "strengths": ["Recognizing that you need more preparation on this topic."],
            "improvements": ["State your core approach first.", "Discuss trade-offs you considered."],
            "exemplar_revision": model_answer,
            "follow_up_question": "What part of this system do you feel most comfortable discussing first?"
        }

    client = get_groq_client()
    if not client:
        return fallback_evaluate_mock_interview(project, question, category, model_answer, key_tradeoffs, student_answer, interviewer_style)

    persona_prompts = {
        "bar_raiser": "You are a FAANG Principal Bar Raiser. You hold high technical standards, look for STAR structure, concrete metrics, and deep trade-off justification.",
        "startup_cto": "You are a Series-B High-Growth Startup CTO. You prize pragmatic velocity, production reliability, simplicity, and clear engineering ownership.",
        "supportive_mentor": "You are a Supportive Staff Engineer & Mentor. You are encouraging, pedagogical, and highlight strong engineering intuition while gently pointing out blind spots."
    }
    persona_role = persona_prompts.get(interviewer_style, persona_prompts["bar_raiser"])

    prompt = f"""{persona_role}
Evaluate this student's response to an interview question about their project.

Project Context:
- Title: {project.get('title', 'Engineering Project')}
- Domain: {project.get('domain', 'Software Engineering')}
- Required Skills: {', '.join(project.get('required_skills', [])[:5])}

Interview Question ({category}):
"{question}"

Reference Model Answer (Bar Raiser Benchmark):
"{model_answer}"

Key Trade-offs to Consider:
"{key_tradeoffs}"

Candidate's Answer:
\"\"\"{student_answer.strip()}\"\"\"

Provide your evaluation as a JSON object with this exact schema:
{{
  "overall_score": 8, // Integer 1-10
  "star_score": 7, // Integer 1-10 (adherence to Situation, Task, Action, Result)
  "technical_depth_score": 8, // Integer 1-10 (specificity of tools, algorithms, internal mechanisms)
  "clarity_score": 8, // Integer 1-10 (conciseness, structure, professional delivery)
  "feedback": "Direct, constructive 2-3 sentence coaching feedback speaking directly to the candidate.",
  "strengths": [
    "Specific technical point or pattern they articulated well",
    "Another positive aspect of their answer"
  ],
  "improvements": [
    "Specific omission, missing metric, or unaddressed trade-off",
    "Actionable tip to make the answer stronger"
  ],
  "exemplar_revision": "A 3-4 sentence exemplar of how a Senior Staff Engineer would phrase this exact answer, incorporating the candidate's ideas with senior polish.",
  "follow_up_question": "A realistic technical follow-up question probing an edge case or scalability limitation of their chosen approach."
}}"""

    models_to_try = [settings.GROQ_MODEL, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
    for model in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a Senior Engineering Bar Raiser evaluating technical interview answers. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=650,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = json.loads(raw)
            return {
                "overall_score": int(parsed.get("overall_score", 7)),
                "star_score": int(parsed.get("star_score", 7)),
                "technical_depth_score": int(parsed.get("technical_depth_score", 7)),
                "clarity_score": int(parsed.get("clarity_score", 7)),
                "feedback": parsed.get("feedback", "Good effort. Focus on quantifying your outcomes and discussing alternative designs."),
                "strengths": parsed.get("strengths", ["Clear explanation of your initial approach."]),
                "improvements": parsed.get("improvements", ["Highlight specific metrics and trade-offs."]),
                "exemplar_revision": parsed.get("exemplar_revision", model_answer),
                "follow_up_question": parsed.get("follow_up_question", "How would this solution hold up if throughput increased significantly?")
            }
        except Exception as e:
            logger.warning(f"Groq mock interview eval with model {model} failed: {e}")
            continue

    return fallback_evaluate_mock_interview(project, question, category, model_answer, key_tradeoffs, student_answer, interviewer_style)


def fallback_evaluate_mock_interview(
    project: Dict[str, Any],
    question: str,
    category: str,
    model_answer: str,
    key_tradeoffs: str,
    student_answer: str,
    interviewer_style: str = "bar_raiser"
) -> Dict[str, Any]:
    """Deterministic, reliable rule-based interview grader for offline/fallback mode."""
    words = student_answer.strip().split()
    word_count = len(words)
    lower = student_answer.lower()

    # Signals
    has_metrics = any(c.isdigit() or "%" in c or "ms" in c or "x" in c for c in words)
    has_tradeoff = any(w in lower for w in ["trade-off", "tradeoff", "versus", "instead of", "alternative", "chose", "because", "latency", "bottleneck"])
    has_action = any(w in lower for w in ["implemented", "built", "architected", "designed", "profiled", "optimized", "tested", "configured"])
    has_result = any(w in lower for w in ["result", "achieved", "reduced", "improved", "ensured", "prevented", "outcome"])

    # Score calculation
    depth_score = min(10, max(3, 4 + (2 if word_count >= 40 else 0) + (2 if has_tradeoff else 0) + (1 if has_action else 0)))
    star_score = min(10, max(3, 3 + (2 if has_action else 0) + (2 if has_result else 0) + (2 if has_metrics else 0)))
    clarity_score = min(10, max(4, 5 + (2 if 30 <= word_count <= 120 else 0) + (1 if "." in student_answer else 0)))
    overall_score = round((depth_score * 0.4) + (star_score * 0.35) + (clarity_score * 0.25))

    strengths = []
    if has_action:
        strengths.append("Clearly highlighted proactive engineering actions and concrete tools.")
    else:
        strengths.append("Provided a straightforward perspective on the core problem.")

    if has_tradeoff:
        strengths.append("Demonstrated senior-level maturity by mentioning architectural trade-offs.")
    elif word_count >= 30:
        strengths.append("Gave a substantive response with good situational context.")
    else:
        strengths.append("Concise, direct response without unnecessary rambling.")

    improvements = []
    if not has_metrics:
        improvements.append("Quantify your results (e.g. 'reduced latency by 35%', 'processed 5,000 req/s').")
    if not has_tradeoff:
        improvements.append(f"Explicitly mention why you selected this design over alternatives ({key_tradeoffs}).")
    if word_count < 25:
        improvements.append("Elaborate on the internal mechanism or pipeline steps rather than just giving a high-level summary.")

    if not improvements:
        improvements.append("Consider detailing how you verified correctness with automated tests.")

    return {
        "overall_score": overall_score,
        "star_score": star_score,
        "technical_depth_score": depth_score,
        "clarity_score": clarity_score,
        "feedback": f"Solid answer that covers key fundamentals. To elevate this from a Good to a Strong Hire rating, {improvements[0].lower()}",
        "strengths": strengths[:2],
        "improvements": improvements[:2],
        "exemplar_revision": model_answer,
        "follow_up_question": f"If you had to optimize this for high concurrent load, how would your design adapt?"
    }


def generate_mock_interview_summary(
    project_title: str,
    evaluations: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generates an executive bar-raiser interview report card summarizing multi-round performance."""
    if not evaluations:
        return fallback_interview_summary(project_title, evaluations)

    avg_score = round(sum(e.get("overall_score", 6) for e in evaluations) / len(evaluations), 1)
    
    if avg_score >= 8.5:
        decision = "Strong Hire 🌟"
    elif avg_score >= 7.0:
        decision = "Hire ✅"
    elif avg_score >= 5.5:
        decision = "Lean Hire ⚖️"
    else:
        decision = "Needs Practice 📚"

    client = get_groq_client()
    if not client:
        return fallback_interview_summary(project_title, evaluations, avg_score, decision)

    eval_brief = "\n".join([
        f"- Round {i+1} ({e.get('category', 'General')}): Score {e.get('overall_score')}/10. Feedback: {e.get('feedback')}"
        for i, e in enumerate(evaluations)
    ])

    prompt = f"""You are a Principal Engineering Bar Raiser debriefing a candidate after a technical project interview for "{project_title}".
Evaluation rounds:
{eval_brief}

Average Score: {avg_score}/10
Decision: {decision}

Provide an executive debrief in JSON:
{{
  "final_decision": "{decision}",
  "average_score": {avg_score},
  "overall_feedback": "A crisp 3-sentence summary of the candidate's engineering communication, technical caliber, and readiness for top tech roles.",
  "key_takeaways": [
    "Top technical strength demonstrated across rounds",
    "Key area where candidate can polish their delivery before live interview",
    "High-impact talking point to emphasize during actual recruiter screens"
  ]
}}"""

    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=350,
            response_format={"type": "json_object"}
        )
        parsed = json.loads(completion.choices[0].message.content.strip())
        return {
            "final_decision": parsed.get("final_decision", decision),
            "average_score": float(parsed.get("average_score", avg_score)),
            "overall_feedback": parsed.get("overall_feedback", f"Candidate demonstrated good technical foundation on {project_title} with consistent domain awareness."),
            "key_takeaways": parsed.get("key_takeaways", [
                "Good grasp of system architecture and component modularity.",
                "Incorporate more quantifiable metrics when discussing outcomes.",
                "Confidently articulate trade-offs when explaining technology choices."
            ])
        }
    except Exception as e:
        logger.warning(f"Failed to generate Groq interview summary: {e}")
        return fallback_interview_summary(project_title, evaluations, avg_score, decision)


def fallback_interview_summary(
    project_title: str,
    evaluations: List[Dict[str, Any]],
    avg_score: Optional[float] = None,
    decision: Optional[str] = None
) -> Dict[str, Any]:
    """Fallback executive summary for mock interview debrief."""
    if avg_score is None:
        avg_score = round(sum(e.get("overall_score", 6) for e in evaluations) / len(evaluations), 1) if evaluations else 7.0
    
    if decision is None:
        if avg_score >= 8.5:
            decision = "Strong Hire 🌟"
        elif avg_score >= 7.0:
            decision = "Hire ✅"
        elif avg_score >= 5.5:
            decision = "Lean Hire ⚖️"
        else:
            decision = "Needs Practice 📚"

    return {
        "final_decision": decision,
        "average_score": avg_score,
        "overall_feedback": f"You demonstrated solid technical command of {project_title}, consistently structuring your technical explanations with clear architectural intuition. Focusing on concrete validation metrics and architectural trade-offs will push your interview readiness to the top 5% of candidates.",
        "key_takeaways": [
            f"Strong command of core technology stack and architecture flow on {project_title}.",
            "Make sure to lead with measurable outcomes (latency, throughput, test coverage) when asked about results.",
            "Always state the negative trade-off of your chosen pattern before explaining why you chose it anyway."
        ]
    }


def chat_project_copilot(
    messages: List[Dict[str, str]],
    project_context: Optional[Dict[str, Any]] = None,
    student_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Interactive Project Engineering Copilot.
    Provides practical system architecture, implementation code, debugging,
    testing strategies, and interview talking points tailored to the project.
    """
    client = get_groq_client()
    if not client:
        return fallback_project_copilot(messages, project_context, student_profile)

    context_str = ""
    if project_context:
        langs = ", ".join(project_context.get("programming_languages", []) or ["Python"])
        frameworks = ", ".join(project_context.get("frameworks", []) or ["FastAPI"])
        tools = ", ".join(project_context.get("tools", []) or ["Docker", "Git"])
        skills = ", ".join(project_context.get("required_skills", []) or [])
        context_str = f"""
TARGET PROJECT CONTEXT:
- Title: {project_context.get('title', 'Applied Engineering System')}
- Domain / Subdomain: {project_context.get('domain', 'Engineering')} / {project_context.get('subdomain', 'General')}
- Description: {project_context.get('description', '')}
- Difficulty: {project_context.get('difficulty', 'Intermediate')} | Duration: {project_context.get('estimated_duration', 4)} weeks
- Tech Stack: Languages: [{langs}] | Frameworks: [{frameworks}] | Tools: [{tools}]
- Required Skills: [{skills}]
- Dataset / Benchmark: {project_context.get('dataset_source', 'Verified open-access benchmark')}
"""
    else:
        context_str = "GENERAL CONTEXT: Student is seeking technical guidance on novel project ideas, architecture selection, tech stacks, or engineering implementation."

    student_str = ""
    if student_profile:
        st_skills = ", ".join(student_profile.get("skills", []) or [])
        student_str = f"""
STUDENT PROFILE:
- Current Skills: [{st_skills}]
- Degree & Year: {student_profile.get('degree', 'Engineering')} ({student_profile.get('year', 'Student')})
- Career Goal: {student_profile.get('career_goal', 'Software / AI Engineer')}
"""

    system_prompt = f"""You are ProjectForge AI Copilot — a Staff Software Engineer and Senior Technical Mentor pair-programming with an ambitious student.
{context_str}
{student_str}

YOUR RESPONSIBILITIES:
1. Provide actionable, high-quality, practical technical guidance.
2. When asked for code, write clean, production-ready, copy-pasteable code with type annotations, docstrings, and error handling.
3. When asked about architecture, outline the decoupled component boundaries, data ingestion, processing, and storage/API layers.
4. Help debug common traps, explain complex algorithmic concepts simply, and advise on unit tests and benchmarks.
5. Provide quantifiable metrics for resume articulation and technical interview preparation when asked.
6. Keep tone encouraging, authoritative, crisp, and pedagogical (like a Staff Engineer pair-programming with a talented junior).

Respond ONLY with a valid JSON object matching this structure:
{{
  "reply": "Rich markdown response with headers, bold text, bullet points, and code blocks (```python ... ```)",
  "suggested_chips": ["Follow-up chip 1", "Follow-up chip 2", "Follow-up chip 3"]
}}
"""

    api_messages = [{"role": "system", "content": system_prompt}]
    for m in messages[-10:]:
        api_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

    models_to_try = [settings.GROQ_MODEL, "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]
    seen_models = set()
    deduped_models = []
    for m in models_to_try:
        if m and m not in seen_models:
            seen_models.add(m)
            deduped_models.append(m)

    for model in deduped_models:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=api_messages,
                temperature=0.3,
                max_tokens=850,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = json.loads(raw)
            return {
                "reply": parsed.get("reply", "Here is the technical architectural breakdown for your project."),
                "suggested_chips": parsed.get("suggested_chips", ["Show Starter Implementation", "Suggest Unit Tests", "Resume STAR Bullets"]),
                "code_snippets": [],
                "model_used": model
            }
        except Exception as e:
            logger.warning(f"Groq copilot model {model} failed: {e}")
            # Try to recover text if model generated JSON that got cut off
            err_body = getattr(e, "body", None)
            if isinstance(err_body, dict):
                fg = err_body.get("error", {}).get("failed_generation", "")
                if fg and '"reply":' in fg:
                    try:
                        recovered = fg.split('"reply":', 1)[1].strip()
                        if recovered.startswith('"'):
                            recovered = recovered[1:]
                        # Unescape
                        clean_reply = recovered.replace('\\n', '\n').replace('\\"', '"').replace('\\t', '\t').rstrip('",}\n ')
                        return {
                            "reply": clean_reply,
                            "suggested_chips": ["⚡ Starter Implementation", "🧪 Suggest Unit Tests", "📄 Draft STAR Resume Bullets"],
                            "code_snippets": [],
                            "model_used": f"{model}-recovered"
                        }
                    except Exception:
                        pass
            continue

    return fallback_project_copilot(messages, project_context, student_profile)


def fallback_project_copilot(
    messages: List[Dict[str, str]],
    project_context: Optional[Dict[str, Any]] = None,
    student_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Intelligent local engineering advisor fallback when external LLM is offline.
    Provides structured technical architecture, implementation boilerplate, and guidance.
    """
    last_msg = (messages[-1].get("content", "") if messages else "").lower()
    
    title = project_context.get("title", "Engineering Project") if project_context else "Your Engineering Project"
    domain = project_context.get("domain", "Applied Software Engineering") if project_context else "Software Engineering"
    langs = project_context.get("programming_languages", ["Python"]) if project_context else ["Python"]
    frameworks = project_context.get("frameworks", ["FastAPI"]) if project_context else ["FastAPI"]
    tools = project_context.get("tools", ["Docker", "Git"]) if project_context else ["Docker", "Git"]
    primary_lang = langs[0] if langs else "Python"
    primary_framework = frameworks[0] if frameworks else "FastAPI"

    if any(w in last_msg for w in ["architect", "system design", "component", "diagram", "data flow", "structure"]):
        reply = f"""### 🏗️ System Architecture & Component Design: {title}

Here is the decoupled, production-grade architectural blueprint for **{title}**:

#### 1. Ingestion & Preprocessing Tier
- **Input Pipeline**: Accepts raw streams or batch data payload via asynchronous REST/gRPC endpoints.
- **Validation Guard**: Strict runtime schema validation using Pydantic / Zod to reject malformed payloads before inference.
- **Normalization Engine**: Deduplication, missing-value imputation, and vectorization pipelines.

#### 2. Core Processing & Engine Tier
- **Worker Pipeline**: Modular execution service powered by `{primary_lang}` and `{primary_framework}`.
- **State & Cache**: Redis in-memory cache layer to reduce redundant computations and maintain sub-50ms query latency.
- **Persistence Layer**: Relational/Vector storage with partitioned indices for fast analytical lookups.

#### 3. Verification & Observability
- **Health & Metrics**: Prometheus instrumentation tracking inference latency (p95/p99) and error rates.
- **Containerization**: Standardized multi-stage `Dockerfile` with minimal attack surface.

```
[Client / API Gateway] ──► [Input Schema Guard] ──► [Async Task Queue]
                                                           │
                                                           ▼
[Persistence Store] ◄── [Metrics & Cache] ◄── [Core Processing Engine]
```
"""
        chips = ["⚡ Show Starter Boilerplate", "🧪 Suggest Unit Tests", "📄 Draft STAR Resume Bullets", "🐛 Debug Common Edge Cases"]

    elif any(w in last_msg for w in ["code", "starter", "boilerplate", "implementation", "build", "script", "snippet"]):
        reply = f"""### ⚡ Starter Implementation Boilerplate: {title}

Here is the clean, modular starter implementation using **{primary_lang}** and **{primary_framework}**:

```python
# src/main.py — Core Service Implementation
import time
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("{title.lower().replace(' ', '_')[:25]}")

app = FastAPI(
    title="{title}",
    description="Production-grade API for {title}",
    version="1.0.0"
)

class PipelineInput(BaseModel):
    payload_id: str = Field(..., description="Unique transaction or sample identifier")
    features: List[float] = Field(..., description="Normalized feature vector")
    metadata: Dict[str, Any] = Field(default_factory=dict)

class PipelineOutput(BaseModel):
    payload_id: str
    status: str
    confidence_score: float
    latency_ms: float

@app.post("/api/v1/execute", response_model=PipelineOutput, status_code=status.HTTP_200_OK)
async def execute_pipeline(data: PipelineInput):
    start_time = time.perf_counter()
    logger.info(f"Processing payload {{data.payload_id}} with {{len(data.features)}} features")
    
    try:
        # Core Algorithm / Model Execution
        if not data.features:
            raise HTTPException(status_code=400, detail="Feature vector cannot be empty.")
            
        score = sum(data.features) / max(len(data.features), 1)
        latency = (time.perf_counter() - start_time) * 1000
        
        return PipelineOutput(
            payload_id=data.payload_id,
            status="SUCCESS",
            confidence_score=round(min(1.0, max(0.0, score)), 4),
            latency_ms=round(latency, 2)
        )
    except Exception as e:
        logger.error(f"Pipeline error: {{e}}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/healthz")
def healthcheck():
    return {{"status": "healthy", "service": "{title}", "timestamp": time.time()}}
```

#### Run Instructions:
```bash
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```
"""
        chips = ["🧪 How to write unit tests for this", "🐛 Common bugs & performance traps", "📦 Dockerfile configuration", "📈 Resume Impact Bullets"]

    elif any(w in last_msg for w in ["test", "verify", "benchmark", "locust", "pytest", "unit test"]):
        reply = f"""### 🧪 Automated Verification & Benchmarking Suite: {title}

Ensuring your project has a comprehensive test suite is what differentiates junior hobby projects from senior engineering candidates.

#### 1. Unit Test Suite (`tests/test_pipeline.py`):
```python
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_healthcheck():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_execute_pipeline_valid():
    payload = {{
        "payload_id": "sample-001",
        "features": [0.45, 0.82, 0.19, 0.91]
    }}
    response = client.post("/api/v1/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "latency_ms" in data
    assert 0.0 <= data["confidence_score"] <= 1.0

def test_execute_pipeline_empty_features():
    response = client.post("/api/v1/execute", json={{"payload_id": "bad", "features": []}})
    assert response.status_code == 400
```

#### 2. Run Commands:
```bash
# Run pytest with code coverage
pytest --cov=src tests/ -v
```
"""
        chips = ["⚡ Show Starter Implementation", "🎙️ Technical Interview Questions", "📄 Draft STAR Resume Bullets", "🏗️ System Architecture"]

    elif any(w in last_msg for w in ["resume", "star", "bullet", "cv", "linkedin"]):
        reply = f"""### 📄 STAR Resume Bullet Points: {title}

Use these high-impact, quantifiable bullet points crafted in the **Google/Amazon STAR framework** (*Situation, Task, Action, Result*):

- **Architected & Deployed {title}**: Engineered a modular `{domain}` processing pipeline using `{primary_lang}`, `{primary_framework}`, and `{tools[0] if tools else 'Docker'}`, delivering sub-65ms end-to-end latency under simulated concurrency.
- **Engineered Automated Quality Contracts**: Built strict schema validation boundaries and a comprehensive pytest suite achieving >90% test coverage with automated CI/CD integration.
- **Empirical Performance Benchmarking**: Validated algorithm reliability across heterogeneous benchmarks, resulting in a **15% boost in throughput** and eliminating memory leaks during streaming workloads.

> **Pro Tip**: In interviews, emphasize the *trade-offs* you made (e.g. why you chose `{primary_framework}` over alternatives).
"""
        chips = ["🎙️ Practice Interview Questions", "⚡ Show Starter Boilerplate", "🏗️ System Architecture", "🐛 Common Edge Cases"]

    elif any(w in last_msg for w in ["interview", "questions", "mock", "talking point", "q&a"]):
        reply = f"""### 🎙️ Senior Engineering Interview Talking Points: {title}

When interviewers grill you on **{title}**, they will test system boundaries:

#### 1. System Scalability & Bottlenecks
- **Question**: *"If input traffic spikes by 100x overnight, where does your service break first?"*
- **Model Answer**: *"The bottleneck would occur at the synchronous compute pipeline. To resolve this, I would decouple the ingestion endpoint using an event broker like Kafka or RabbitMQ, allowing worker pools to autoscale horizontally while returning immediate 202 Accepted receipts."*

#### 2. Trade-Off Articulation
- **Question**: *"Why did you choose {primary_framework} instead of a lightweight microframework?"*
- **Model Answer**: *"I traded slight framework footprint for native async support, automatic OpenAPI contract generation, and built-in type safety via Pydantic, which significantly reduced payload validation bugs."*

#### 3. Error Recovery & Resilience
- **Question**: *"How does the system handle corrupted or partially missing data payloads?"*
- **Model Answer**: *"We implement strict boundary validation. Invalid payloads are routed to a Dead-Letter Queue (DLQ) with structured error telemetry rather than throwing unhandled exceptions."*
"""
        chips = ["📄 Draft STAR Resume Bullets", "⚡ Show Starter Boilerplate", "🧪 Automated Tests Guide", "🏗️ System Architecture"]

    else:
        reply = f"""### ⚡ ProjectForge AI Copilot: {title}

I am your technical engineering mentor for **{title}** ({domain}).

Here are 4 high-leverage areas I can help you engineer right now:
1. **🏗️ System Architecture**: Define component boundaries, data flow, and microservice modularity.
2. **⚡ Implementation Boilerplate**: Scaffold starter code with `{primary_lang}` and `{primary_framework}`.
3. **🧪 Testing & Benchmarks**: Write pytest test suites and latency benchmarks.
4. **📄 Resume & Interview Prep**: Generate STAR resume bullets and model interview answers.

What aspect would you like to build or refine first?
"""
        chips = ["🏗️ System Architecture & Data Flow", "⚡ Show Starter Boilerplate", "🧪 Suggest Unit Tests", "📄 Draft STAR Resume Bullets"]

    return {
        "reply": reply,
        "suggested_chips": chips,
        "code_snippets": [],
        "model_used": "projectforge-rule-copilot"
    }



